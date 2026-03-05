/**
 * Fetches a static map image for the given route via our server-side proxy
 * (/api/static-map) and returns it as a base64 data URI for embedding in
 * the PDF. The proxy uses the server-side API key, avoiding referrer
 * restriction issues with the client-side key.
 *
 * Returns null on any failure so the PDF can render without the map.
 */
export async function fetchStaticMapDataUri(
  stops: string[],
  overviewPolyline: string,
): Promise<string | null> {
  if (!overviewPolyline || stops.length < 2) return null;

  try {
    const params = new URLSearchParams({
      polyline: overviewPolyline,
      stops: stops.join("\0"),
    });

    const res = await fetch(`/api/static-map?${params.toString()}`, {
      cache: "no-store",
    });
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
