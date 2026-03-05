"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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

const MIN_STOPS = 2;
const MAX_STOPS = 26;

type Stop = { id: number; value: string };

let nextStopId = 0;
function makeStop(value = ""): Stop {
  return { id: nextStopId++, value };
}

export function Calculator() {
  const [stops, setStops] = useState<Stop[]>(() => [makeStop(), makeStop()]);
  const [year, setYear] = useState(getCurrentYear());
  const [roundTrip, setRoundTrip] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CalculateResponse | null>(null);

  const stopValues = stops.map((s) => s.value);
  const debouncedValues = useDebounce(stopValues, DEBOUNCE_MS);
  const trimmedStops = debouncedValues
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  const canCalculate = trimmedStops.length >= MIN_STOPS;
  const stopsKey = canCalculate ? trimmedStops.join("\n") : "";

  const setStop = useCallback((index: number, value: string) => {
    setStops((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], value };
      return next;
    });
  }, []);

  const addStop = useCallback(() => {
    setStops((prev) => {
      if (prev.length >= MAX_STOPS) return prev;
      return [...prev.slice(0, -1), makeStop(), prev[prev.length - 1]];
    });
  }, []);

  const removeStop = useCallback((index: number) => {
    setStops((prev) => {
      if (prev.length <= MIN_STOPS || index <= 0 || index >= prev.length - 1)
        return prev;
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  useEffect(() => {
    if (!canCalculate) {
      setResult(null);
      setError(null);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetch("/api/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stops: trimmedStops, year, roundTrip }),
      signal: controller.signal,
    })
      .then(async (res) => {
        const data: unknown = await res.json();
        return { ok: res.ok, data };
      })
      .then(({ ok, data }) => {
        if (ok && !isApiError(data)) {
          setResult(data as CalculateResponse);
          setError(null);
        } else {
          setError(isApiError(data) ? data.error : "Something went wrong.");
          setResult(null);
        }
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(
          "Could not reach the server. Check your internet connection and try again.",
        );
        setResult(null);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [stopsKey, year, roundTrip, canCalculate]);

  const stopLabel = (index: number) => {
    if (index === 0) return "Start";
    if (index === stops.length - 1) return "End";
    return `Stop ${index}`;
  };

  return (
    <GoogleMapsProvider>
      <div className="space-y-5">
        <MapsLoadError />
        <div className="space-y-4">
          {stops.map((stop, index) => (
            <div key={stop.id} className="flex gap-2 items-start">
              <div className="flex-1 min-w-0">
                <AddressInput
                  id={`stop-${stop.id}`}
                  label={stopLabel(index)}
                  placeholder={
                    index === 0
                      ? "e.g. 1600 Pennsylvania Ave, Washington DC"
                      : index === stops.length - 1
                        ? "e.g. 350 Fifth Ave, New York NY"
                        : "Address"
                  }
                  value={stop.value}
                  onChange={(v) => setStop(index, v)}
                  onPlaceSelected={(v) => setStop(index, v)}
                />
              </div>
              {stops.length > MIN_STOPS &&
                index > 0 &&
                index < stops.length - 1 && (
                  <button
                    type="button"
                    onClick={() => removeStop(index)}
                    className="mt-7 px-3 py-2.5 rounded-lg border border-border text-text-muted hover:text-red-600 hover:border-red-300 dark:hover:border-red-700 text-sm shrink-0"
                    aria-label={`Remove ${stopLabel(index)}`}
                    title="Remove stop"
                  >
                    Remove
                  </button>
                )}
            </div>
          ))}
          {stops.length < MAX_STOPS && (
            <button
              type="button"
              onClick={addStop}
              className="w-full rounded-lg border border-dashed border-border text-text-muted hover:text-text hover:border-primary-light/50 py-2.5 text-sm transition-colors"
            >
              + Add stop
            </button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
          <div className="flex-1 min-w-0">
            <YearSelector value={year} onChange={setYear} />
          </div>
          <div className="flex items-center sm:h-[42px]">
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
            <RouteMapPreview stops={trimmedStops} />
            <Results data={result} stops={trimmedStops} />
          </>
        )}
      </div>
    </GoogleMapsProvider>
  );
}

/**
 * Debounces an array of strings by joining them into a single string
 * for value comparison (avoids reference equality issues with arrays).
 */
function useDebounce(values: string[], ms: number): string[] {
  const [debounced, setDebounced] = useState(values);
  const prevKey = useRef(values.join("\0"));

  useEffect(() => {
    const key = values.join("\0");
    if (key === prevKey.current) return;
    prevKey.current = key;
    const t = setTimeout(() => {
      setDebounced(values);
    }, ms);
    return () => clearTimeout(t);
  }, [values, ms]);

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
