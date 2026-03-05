"use client";

import { useRef, useEffect } from "react";
import { useGoogleMaps } from "./google-maps-loader";

type RouteMapPreviewProps = {
  origin: string;
  destination: string;
};

/**
 * Small map preview showing the driving route between origin and destination.
 * Uses Google Maps DirectionsService + DirectionsRenderer; requires "maps" and "routes"
 * to be loaded by GoogleMapsProvider.
 */
export function RouteMapPreview({ origin, destination }: RouteMapPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { loaded } = useGoogleMaps();

  useEffect(() => {
    if (!loaded || !containerRef.current || !origin || !destination) return;

    const el = containerRef.current;
    if (!window.google?.maps) return;

    const { Map } = window.google.maps;
    const map = new Map(el, {
      zoom: 4,
      center: { lat: 39.5, lng: -98.5 },
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      zoomControl: true,
      scrollwheel: true,
      gestureHandling: "cooperative",
    });

    const directionsService = new window.google.maps.DirectionsService();
    const directionsRenderer = new window.google.maps.DirectionsRenderer({
      map,
      suppressMarkers: false,
      preserveViewport: false,
    });

    directionsService
      .route({
        origin,
        destination,
        travelMode: window.google.maps.TravelMode.DRIVING,
      })
      .then((response) => {
        directionsRenderer.setDirections(response);
      })
      .catch(() => {
        // Route request failed (e.g. invalid address); map still shows default view
      });

    return () => {
      directionsRenderer.setMap(null);
    };
  }, [loaded, origin, destination]);

  if (!loaded) return null;

  return (
    <div
      ref={containerRef}
      className="w-full rounded-xl border border-border overflow-hidden bg-surface-alt"
      style={{ height: 220 }}
      aria-hidden
    />
  );
}
