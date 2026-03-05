"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { CalculateResponse } from "@/lib/types";
import { MAX_STOPS } from "@/lib/types";
import { getAvailableYears, getCurrentYear } from "@/lib/irs-rates";
import { GoogleMapsProvider, useGoogleMaps } from "./google-maps-loader";
import { AddressInput } from "./address-input";
import { RoundTripToggle } from "./round-trip-toggle";
import { TripDatePicker } from "./trip-date-picker";
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

type Stop = { id: number; value: string };

let nextStopId = 0;
function makeStop(value = ""): Stop {
  return { id: nextStopId++, value };
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Trip date clamped to years we have IRS rates for (e.g. 2020–current). */
function initialTripDate(): string {
  const today = todayIso();
  const years = getAvailableYears();
  const minYear = years.at(-1) ?? 2020;
  const maxYear = years[0];
  const y = parseInt(today.slice(0, 4), 10);
  if (y < minYear) return `${minYear}-01-01`;
  if (y > maxYear) return `${maxYear}-12-31`;
  return today;
}

export function Calculator() {
  const [stops, setStops] = useState<Stop[]>(() => [makeStop(), makeStop()]);
  const [roundTrip, setRoundTrip] = useState(false);
  const [tripDate, setTripDate] = useState(initialTripDate);
  const availableYears = getAvailableYears();
  const year = (() => {
    const y = parseInt(tripDate.slice(0, 4), 10);
    return availableYears.includes(y) ? y : getCurrentYear();
  })();
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

  const WAYPOINT_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const stopLabel = (index: number) => {
    if (index === 0) return "Start";
    if (index === stops.length - 1) return "End";
    return `Stop ${index}`;
  };
  const markerLabel = (index: number) =>
    WAYPOINT_LETTERS[index] ?? String(index + 1);

  const moveStop = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (fromIndex === toIndex || toIndex < 0 || toIndex >= stops.length)
        return;
      setStops((prev) => {
        const next = [...prev];
        const [removed] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, removed);
        return next;
      });
    },
    [stops.length],
  );

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    e.dataTransfer.setData("text/plain", String(index));
    e.dataTransfer.effectAllowed = "move";
  }, []);
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);
  const handleDrop = useCallback(
    (e: React.DragEvent, dropIndex: number) => {
      e.preventDefault();
      const from = e.dataTransfer.getData("text/plain");
      if (from === "") return;
      const fromIndex = parseInt(from, 10);
      if (Number.isNaN(fromIndex) || fromIndex === dropIndex) return;
      moveStop(fromIndex, dropIndex);
    },
    [moveStop],
  );

  return (
    <GoogleMapsProvider>
      <div className="space-y-4">
        <MapsLoadError />
        <div className="flex items-stretch gap-4">
          <div className="w-9 shrink-0" aria-hidden />
          <div className="flex flex-wrap items-end justify-end gap-3 sm:gap-4 min-w-0 flex-1">
            <TripDatePicker
              value={tripDate}
              onChange={setTripDate}
              id="trip-date"
            />
            <div className="flex items-center pb-[0.4375rem]">
              <RoundTripToggle checked={roundTrip} onChange={setRoundTrip} />
            </div>
          </div>
        </div>
        <div className="flex flex-col">
          {stops.map((stop, index) => (
            <div
              key={stop.id}
              className="flex items-stretch gap-4"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
            >
              {/* Marker column: circle vertically centered on the address input, with connector to next stop */}
              <div className="flex w-9 shrink-0 flex-col items-center">
                <div className="h-[2.125rem] shrink-0 w-0" aria-hidden />
                <div
                  className="flex shrink-0 items-center justify-center"
                  aria-hidden
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-primary bg-transparent text-xs font-semibold text-primary">
                    {markerLabel(index)}
                  </div>
                </div>
                {index < stops.length - 1 ? (
                  <div
                    className="w-0.5 flex-1 -mb-[2.125rem] rounded-full bg-gradient-to-b from-primary/30 via-primary/15 to-primary/30"
                    aria-hidden
                  />
                ) : (
                  <div className="flex-1" aria-hidden />
                )}
              </div>
              {/* Content: address + actions */}
              <div className="flex min-w-0 flex-1 gap-2 pb-4">
                <div className="min-w-0 flex-1 pt-0.5">
                  <AddressInput
                    id={`stop-${index}`}
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
                    <div className="flex shrink-0 items-center gap-0.5 pt-[2.125rem]">
                      <button
                        type="button"
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        className="rounded-md p-1.5 text-text-muted hover:bg-surface-alt hover:text-text cursor-grab active:cursor-grabbing focus:outline-none focus:ring-2 focus:ring-primary-light/40"
                        aria-label={`Reorder ${stopLabel(index)}`}
                        title="Drag to reorder"
                      >
                        <GripIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeStop(index)}
                        className="rounded-md p-1.5 text-text-muted hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-primary-light/40"
                        aria-label={`Remove ${stopLabel(index)}`}
                        title="Remove stop"
                      >
                        <XIcon className="h-4 w-4" />
                      </button>
                    </div>
                  )}
              </div>
            </div>
          ))}
        </div>

        {stops.length < MAX_STOPS && (
          <div className="-mt-6 flex justify-end">
            <button
              type="button"
              onClick={addStop}
              className="text-sm font-medium text-text-muted hover:text-text
                focus:outline-none focus:ring-2 focus:ring-primary-light/40 rounded-md px-0.5
                transition-colors"
            >
              + Add stop
            </button>
          </div>
        )}

        {canCalculate && loading && (
          <p
            className="text-sm text-text-muted flex items-center gap-2"
            role="status"
            aria-live="polite"
          >
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
          <div className="animate-results-in space-y-5">
            <RouteMapPreview stops={trimmedStops} />
            <Results data={result} stops={trimmedStops} tripDate={tripDate} />
          </div>
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

function GripIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M8 6h2v2H8V6zm4 0h2v2h-2V6zm-4 4h2v2H8v-2zm4 0h2v2h-2v-2zm-4 4h2v2H8v-2zm4 0h2v2h-2v-2z" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
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
