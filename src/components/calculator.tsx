"use client";

import { useState, useEffect, useRef } from "react";
import type { CalculateResponse } from "@/lib/types";
import { getCurrentYear } from "@/lib/irs-rates";
import { GoogleMapsProvider, useGoogleMaps } from "./google-maps-loader";
import { AddressInput } from "./address-input";
import { YearSelector } from "./year-selector";
import { RoundTripToggle } from "./round-trip-toggle";
import { Results } from "./results";
import { RouteMapPreview } from "./route-map-preview";

type ApiError = {
  error: string;
  code?: string;
};

function isApiError(data: unknown): data is ApiError {
  return (
    typeof data === "object" &&
    data !== null &&
    "error" in data &&
    typeof (data as ApiError).error === "string"
  );
}

function MapsLoadError() {
  const { error } = useGoogleMaps();
  if (!error) return null;
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
      Address autocomplete unavailable. You can still type addresses manually.
    </div>
  );
}

const DEBOUNCE_MS = 400;

export function Calculator() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [year, setYear] = useState(getCurrentYear());
  const [roundTrip, setRoundTrip] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CalculateResponse | null>(null);

  const debouncedOrigin = useDebounce(origin, DEBOUNCE_MS);
  const debouncedDestination = useDebounce(destination, DEBOUNCE_MS);

  const canCalculate =
    debouncedOrigin.trim().length > 0 && debouncedDestination.trim().length > 0;

  useEffect(() => {
    if (!canCalculate) {
      setResult(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch("/api/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        origin: debouncedOrigin.trim(),
        destination: debouncedDestination.trim(),
        year,
        roundTrip,
      }),
    })
      .then(async (res) => {
        const data: unknown = await res.json();
        return { ok: res.ok, data };
      })
      .then(({ ok, data }) => {
        if (cancelled) return;
        if (ok && !isApiError(data)) {
          setResult(data as CalculateResponse);
          setError(null);
        } else {
          setError(isApiError(data) ? data.error : "Something went wrong.");
          setResult(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(
            "Could not reach the server. Check your internet connection and try again.",
          );
          setResult(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedOrigin, debouncedDestination, year, roundTrip, canCalculate]);

  return (
    <GoogleMapsProvider>
      <div className="space-y-5">
        <MapsLoadError />
        <AddressInput
          id="origin"
          label="Origin"
          placeholder="e.g. 1600 Pennsylvania Ave, Washington DC"
          value={origin}
          onChange={setOrigin}
          onPlaceSelected={setOrigin}
        />
        <AddressInput
          id="destination"
          label="Destination"
          placeholder="e.g. 350 Fifth Ave, New York NY"
          value={destination}
          onChange={setDestination}
          onPlaceSelected={setDestination}
        />

        <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
          <div className="flex-1">
            <YearSelector value={year} onChange={setYear} />
          </div>
          <div className="flex items-center h-[42px]">
            <RoundTripToggle checked={roundTrip} onChange={setRoundTrip} />
          </div>
        </div>

        {canCalculate && loading && (
          <p className="text-sm text-text-muted flex items-center gap-2">
            <Spinner />
            Calculating...
          </p>
        )}

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-200"
          >
            {error}
          </div>
        )}

        {result && !error && (
          <>
            <RouteMapPreview
              origin={debouncedOrigin.trim()}
              destination={debouncedDestination.trim()}
            />
            <Results
              data={result}
              origin={debouncedOrigin.trim()}
              destination={debouncedDestination.trim()}
            />
          </>
        )}
      </div>
    </GoogleMapsProvider>
  );
}

function useDebounce<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  const prevValue = useRef(value);

  useEffect(() => {
    if (value === prevValue.current) return;
    prevValue.current = value;
    const t = setTimeout(() => {
      setDebounced(value);
      prevValue.current = value;
    }, ms);
    return () => clearTimeout(t);
  }, [value, ms]);

  return debounced;
}

function Spinner() {
  return (
    <svg
      className="animate-spin h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
