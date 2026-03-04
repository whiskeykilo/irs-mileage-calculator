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

let initPromise: Promise<void> | null = null;

function initGoogleMaps(): Promise<void> {
  if (initPromise) return initPromise;

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return Promise.reject(new Error("Google Maps API key not configured."));
  }

  setOptions({ key: apiKey, v: "weekly" });
  initPromise = importLibrary("places").then(() => undefined);
  return initPromise;
}

export function GoogleMapsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<MapsState>({
    loaded: false,
    error: null,
  });

  useEffect(() => {
    initGoogleMaps()
      .then(() => setState({ loaded: true, error: null }))
      .catch((err) =>
        setState({
          loaded: false,
          error:
            err instanceof Error ? err.message : "Failed to load Google Maps",
        }),
      );
  }, []);

  return (
    <GoogleMapsContext.Provider value={state}>
      {children}
    </GoogleMapsContext.Provider>
  );
}
