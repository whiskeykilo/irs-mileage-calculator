const STATIC_MAP_BASE = "https://maps.googleapis.com/maps/api/staticmap";

/**
 * Builds a Google Static Maps URL that renders the route polyline with
 * labeled origin/destination/waypoint markers. Returns null when the
 * client-side API key is missing or no polyline is available.
 *
 * The URL uses scale=2 so the image is crisp when embedded in the PDF at
 * the dimensions below (effective 1200x500 px).
 */
export function buildStaticMapUrl(
  stops: string[],
  overviewPolyline: string,
): string | null {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();
  if (!apiKey || !overviewPolyline) return null;

  const params = new URLSearchParams({
    size: "600x250",
    scale: "2",
    maptype: "roadmap",
    key: apiKey,
  });

  params.append("path", `weight:4|color:0x1e40afff|enc:${overviewPolyline}`);

  const labels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  stops.forEach((addr, i) => {
    const label = labels[i] ?? String(i + 1);
    params.append("markers", `size:small|color:0x1e40af|label:${label}|${addr}`);
  });

  return `${STATIC_MAP_BASE}?${params.toString()}`;
}

/**
 * Fetches a static map image and returns it as a data URI (base64).
 * Returns null on any failure so the PDF can render without the map.
 */
export async function fetchStaticMapDataUri(
  url: string,
): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;

    const blob = await res.blob();
    return new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}
