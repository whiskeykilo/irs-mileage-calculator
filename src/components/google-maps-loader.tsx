"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";

type MapsState = {
  /** Places library loaded (enough for autocomplete). */
  loaded: boolean;
  error: string | null;
};

const GoogleMapsContext = createContext<MapsState>({
  loaded: false,
  error: null,
});

export function useGoogleMaps() {
  return useContext(GoogleMapsContext);
}

let optionsSet = false;

function ensureOptions(): boolean {
  if (optionsSet) return true;
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) return false;
  setOptions({ key: apiKey, v: "weekly" });
  optionsSet = true;
  return true;
}

/**
 * Load only the Places library on init. This is all we need for autocomplete.
 * Maps, Routes, and Marker are loaded lazily when the map preview mounts.
 */
let placesPromise: Promise<void> | null = null;

function initPlaces(): Promise<void> {
  if (placesPromise) return placesPromise;
  if (!ensureOptions()) {
    return Promise.reject(new Error("Google Maps API key not configured."));
  }
  placesPromise = importLibrary("places").then(() => undefined);
  return placesPromise;
}

/**
 * Lazily load map-related libraries (maps, routes, marker).
 * Called by RouteMapPreview on first mount, not on initial page load.
 */
let mapLibsPromise: Promise<void> | null = null;

export function loadMapLibraries(): Promise<void> {
  if (mapLibsPromise) return mapLibsPromise;
  if (!ensureOptions()) {
    return Promise.reject(new Error("Google Maps API key not configured."));
  }
  mapLibsPromise = Promise.all([
    importLibrary("maps"),
    importLibrary("routes"),
    importLibrary("marker"),
  ]).then(() => undefined);
  return mapLibsPromise;
}

export function GoogleMapsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<MapsState>({
    loaded: false,
    error: null,
  });

  useEffect(() => {
    initPlaces()
      .then(() => setState({ loaded: true, error: null }))
      .catch((err) => {
        const raw =
          err instanceof Error ? err.message : "Failed to load Google Maps";
        const isBlocked =
          raw.includes("ApiTargetBlockedMapError") ||
          raw.includes("blocked") ||
          raw.includes("referer");
        const message = isBlocked
          ? "Maps API blocked. Enable Maps JavaScript API and Places API (New) in Google Cloud, turn on billing, and allow this site in key restrictions."
          : raw;
        setState({ loaded: false, error: message });
      });
  }, []);

  return (
    <GoogleMapsContext.Provider value={state}>
      {children}
    </GoogleMapsContext.Provider>
  );
}
