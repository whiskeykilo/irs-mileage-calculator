"use client";

import { useRef, useEffect, useState } from "react";
import { useGoogleMaps, loadMapLibraries } from "./google-maps-loader";

type RouteMapPreviewProps = {
  stops: string[];
};

type MapTypeStyle = {
  featureType?: string;
  elementType?: string;
  stylers: Array<{ color?: string; visibility?: string }>;
};

const DARK_MAP_STYLES: MapTypeStyle[] = [
  { featureType: "all", elementType: "geometry", stylers: [{ color: "#1d2c4d" }] },
  { featureType: "all", elementType: "labels.text.stroke", stylers: [{ color: "#1d2c4d" }] },
  { featureType: "all", elementType: "labels.text.fill", stylers: [{ color: "#8ec3b9" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0e1626" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#304a7d" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#98a5be" }] },
  { featureType: "road", elementType: "labels.text.stroke", stylers: [{ color: "#1d2c4d" }] },
  { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#1d2c4d" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#1d2c4d" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#8ec3b9" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#1d2c4d" }] },
  { featureType: "administrative", elementType: "labels.text.fill", stylers: [{ color: "#8ec3b9" }] },
];

const LIGHT_MAP_STYLES: MapTypeStyle[] = [];

function useIsDark(): boolean {
  const [isDark, setIsDark] = useState(() =>
    typeof document !== "undefined"
      ? document.documentElement.classList.contains("dark")
      : false,
  );
  useEffect(() => {
    const root = document.documentElement;
    const check = () => root.classList.contains("dark");
    setIsDark(check());
    const obs = new MutationObserver(() => setIsDark(check()));
    obs.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);
  return isDark;
}

type LegLike = {
  startLocation?:
    | { lat: number; lng: number }
    | { lat(): number; lng(): number };
  endLocation?: { lat: number; lng: number } | { lat(): number; lng(): number };
};

function toLatLng(
  loc:
    | { lat: number; lng: number }
    | { lat(): number; lng(): number }
    | undefined,
): { lat: number; lng: number } | null {
  if (!loc) return null;
  const lat =
    typeof (loc as { lat: number }).lat === "function"
      ? (loc as { lat(): number }).lat()
      : (loc as { lat: number }).lat;
  const lng =
    typeof (loc as { lng: number }).lng === "function"
      ? (loc as { lng(): number }).lng()
      : (loc as { lng: number }).lng;
  if (typeof lat !== "number" || typeof lng !== "number") return null;
  return { lat, lng };
}

function addFallbackMarkers(
  legs: LegLike[] | undefined,
  map: google.maps.Map,
  g: typeof window.google.maps,
  markersRef: { current: Array<{ setMap: (m: unknown) => void }> },
) {
  if (!legs?.length) return;
  const Marker = g.Marker as unknown as new (opts: {
    position: { lat: number; lng: number };
    map: google.maps.Map;
    label?: string;
  }) => { setMap: (m: unknown) => void };
  const positions: { lat: number; lng: number }[] = [];
  const first = toLatLng(legs[0].startLocation);
  if (first) positions.push(first);
  for (const leg of legs) {
    const end = toLatLng(leg.endLocation);
    if (end) positions.push(end);
  }
  const labels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  positions.forEach((pos, i) => {
    const marker = new Marker({
      position: pos,
      map,
      label: labels[i] ?? String(i + 1),
    });
    markersRef.current.push(marker);
  });
}

/**
 * Map preview showing the driving route for the given ordered stops.
 *
 * Lazily loads map libraries (maps, routes, marker) on first mount instead
 * of at page load. Theme changes update styles in-place via map.setOptions()
 * rather than recreating the map and re-requesting the route.
 */
export function RouteMapPreview({ stops }: RouteMapPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const polylinesRef = useRef<Array<{ setMap: (m: unknown) => void }>>([]);
  const markersRef = useRef<Array<{ setMap: (m: unknown) => void }>>([]);
  const { loaded: placesLoaded } = useGoogleMaps();
  const [mapLibsReady, setMapLibsReady] = useState(false);
  const isDark = useIsDark();

  const [origin, ...rest] = stops;
  const destination = rest.length > 0 ? rest[rest.length - 1] : origin;
  const intermediates = rest.slice(0, -1);
  const intermediatesKey = intermediates.join("|");

  // Lazy-load map libraries on first mount
  useEffect(() => {
    if (!placesLoaded) return;
    loadMapLibraries()
      .then(() => setMapLibsReady(true))
      .catch(() => {
        // Map preview is non-essential; autocomplete still works
      });
  }, [placesLoaded]);

  // Create map and render route (does NOT depend on isDark)
  useEffect(() => {
    if (
      !mapLibsReady ||
      !containerRef.current ||
      stops.length < 2 ||
      !origin ||
      !destination
    )
      return;

    // Clean up previous map artifacts
    polylinesRef.current.forEach((p) => p.setMap(null));
    polylinesRef.current = [];
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    mapRef.current = null;

    const el = containerRef.current;
    const g = window.google?.maps as typeof window.google.maps & {
      routes?: {
        Route?: {
          computeRoutes: (req: unknown) => Promise<{ routes?: unknown[] }>;
        };
      };
      LatLngBounds?: new () => {
        extend: (p: { lat: number; lng: number }) => void;
      };
      Marker?: new (opts: unknown) => { setMap: (m: unknown) => void };
    };
    if (!g) return;

    const mapId =
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID?.trim() || undefined;
    let cancelled = false;

    void (async () => {
      const isDarkNow = document.documentElement.classList.contains("dark");
      const baseOptions: google.maps.MapOptions = {
        zoom: 4,
        center: { lat: 39.5, lng: -98.5 },
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
        scrollwheel: true,
        gestureHandling: "cooperative",
      };

      let mapOptions: google.maps.MapOptions = baseOptions;
      if (mapId) {
        const core = await g.importLibrary?.("core");
        if (cancelled) return;
        const ColorScheme = (
          core as { ColorScheme: { DARK: string; LIGHT: string } }
        )?.ColorScheme;
        if (ColorScheme) {
          mapOptions = {
            ...baseOptions,
            mapId,
            colorScheme: isDarkNow ? ColorScheme.DARK : ColorScheme.LIGHT,
          };
        } else {
          mapOptions = { ...baseOptions, mapId };
        }
      } else if (isDarkNow) {
        mapOptions = { ...baseOptions, styles: DARK_MAP_STYLES };
      }

      const map = new g.Map(el, mapOptions);
      if (cancelled) return;
      mapRef.current = map;

      const Route = g.routes?.Route;
      if (!Route) return;

      const request: Record<string, unknown> = {
        origin,
        destination,
        travelMode: "DRIVING",
        fields: ["path", "legs"],
      };
      if (intermediates.length > 0) {
        request.intermediates = intermediates.map((addr) => ({
          address: addr,
        }));
      }
      Route.computeRoutes(request)
        .then((result) => {
          if (cancelled) return;
          const routes = result.routes as
            | Array<{
                createPolylines: () => Array<{ setMap: (m: unknown) => void }>;
                createWaypointAdvancedMarkers?: (opts?: {
                  map?: unknown;
                }) => Promise<Array<{ setMap: (m: unknown) => void }>>;
                path?: Array<{ lat: number; lng: number }>;
                legs?: Array<{
                  startLocation?: { lat: number; lng: number };
                  endLocation?: { lat: number; lng: number };
                }>;
              }>
            | undefined;
          if (!routes?.length) return;

          const route = routes[0];
          const lines = route.createPolylines();
          lines.forEach((p) => {
            p.setMap(map);
            polylinesRef.current.push(p);
          });

          const addWaypointMarkers = (
            mks: Array<{ setMap: (m: unknown) => void }>,
          ) => {
            if (cancelled) {
              mks.forEach((m) => m.setMap(null));
              return;
            }
            mks.forEach((marker) => {
              marker.setMap(map);
              markersRef.current.push(marker);
            });
          };

          if (mapId && route.createWaypointAdvancedMarkers) {
            route
              .createWaypointAdvancedMarkers({ map })
              .then(addWaypointMarkers)
              .catch(() => {
                if (cancelled) return;
                addFallbackMarkers(route.legs, map, g, markersRef);
              });
          } else {
            addFallbackMarkers(route.legs, map, g, markersRef);
          }

          if (route.path?.length && g.LatLngBounds) {
            const bounds = new g.LatLngBounds();
            route.path.forEach((p) => bounds.extend(p));
            map.fitBounds(bounds as unknown as google.maps.LatLngBounds);
          }
        })
        .catch(() => {
          // Route request failed; map still shows default view
        });
    })();

    return () => {
      cancelled = true;
      polylinesRef.current.forEach((p) => p.setMap(null));
      polylinesRef.current = [];
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapLibsReady, origin, destination, intermediatesKey]);

  // Update map theme in-place without recreating the map or route
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const mapId =
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID?.trim() || undefined;

    if (mapId) {
      // Cloud-styled maps use colorScheme
      const g = window.google?.maps;
      void g?.importLibrary?.("core").then((core) => {
        const ColorScheme = (
          core as { ColorScheme?: { DARK: string; LIGHT: string } }
        )?.ColorScheme;
        if (ColorScheme) {
          map.setOptions({
            colorScheme: isDark ? ColorScheme.DARK : ColorScheme.LIGHT,
          });
        }
      });
    } else {
      // JSON-styled maps: swap the styles array
      map.setOptions({ styles: isDark ? DARK_MAP_STYLES : LIGHT_MAP_STYLES });
    }
  }, [isDark]);

  if (!placesLoaded) return null;

  return (
    <div
      ref={containerRef}
      className="w-full rounded-xl border border-border overflow-hidden bg-surface-alt"
      style={{ height: 220 }}
      aria-hidden
    />
  );
}
