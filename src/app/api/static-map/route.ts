import { NextRequest, NextResponse } from "next/server";

const STATIC_MAP_BASE = "https://maps.googleapis.com/maps/api/staticmap";
const LABELS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/**
 * Proxies Google Static Maps API requests through the server so we can use
 * the unrestricted server-side API key. The client-side key has HTTP referrer
 * restrictions that block direct browser fetches of static map images.
 *
 * Returns the raw PNG image bytes with appropriate cache headers.
 */
export async function GET(req: NextRequest) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Static map service unavailable." },
      { status: 503 },
    );
  }

  const { searchParams } = req.nextUrl;
  const polyline = searchParams.get("polyline");
  const stopsRaw = searchParams.get("stops");

  if (!polyline || !stopsRaw) {
    return NextResponse.json(
      { error: "Missing required parameters: polyline, stops." },
      { status: 400 },
    );
  }

  const stops = stopsRaw.split("\0").filter(Boolean);
  if (stops.length < 2) {
    return NextResponse.json(
      { error: "At least two stops are required." },
      { status: 400 },
    );
  }

  const params = new URLSearchParams({
    size: "600x250",
    scale: "2",
    maptype: "roadmap",
    key: apiKey,
  });

  params.append("path", `weight:4|color:0x1e40afff|enc:${polyline}`);

  // Mid/default size and predefined color required for labels; small/tiny or custom hex can omit them.
  stops.forEach((addr, i) => {
    const label = LABELS[i] ?? String(i + 1);
    params.append("markers", `size:mid|color:blue|label:${label}|${addr}`);
  });

  const upstream = await fetch(`${STATIC_MAP_BASE}?${params.toString()}`);
  if (!upstream.ok) {
    return NextResponse.json(
      { error: "Failed to fetch map image from upstream." },
      { status: 502 },
    );
  }

  const imageBytes = await upstream.arrayBuffer();
  const contentType = upstream.headers.get("content-type") ?? "image/png";

  return new NextResponse(imageBytes, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "private, max-age=60",
    },
  });
}
