"use client";

import { useState, useCallback, type FormEvent } from "react";
import type { CalculateResponse } from "@/lib/types";
import { getCurrentYear } from "@/lib/irs-rates";
import { GoogleMapsProvider, useGoogleMaps } from "./google-maps-loader";
import { AddressInput } from "./address-input";
import { YearSelector } from "./year-selector";
import { RoundTripToggle } from "./round-trip-toggle";
import { Results } from "./results";

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
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
      Address autocomplete unavailable. You can still type addresses manually.
    </div>
  );
}

export function Calculator() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [year, setYear] = useState(getCurrentYear());
  const [roundTrip, setRoundTrip] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CalculateResponse | null>(null);

  const canSubmit = origin.trim().length > 0 && destination.trim().length > 0;

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!canSubmit || loading) return;

      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/calculate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ origin, destination, year, roundTrip }),
        });

        const data: unknown = await res.json();

        if (!res.ok) {
          setError(isApiError(data) ? data.error : "Something went wrong.");
          setResult(null);
        } else {
          setResult(data as CalculateResponse);
          setError(null);
        }
      } catch {
        setError(
          "Could not reach the server. Check your internet connection and try again.",
        );
        setResult(null);
      } finally {
        setLoading(false);
      }
    },
    [origin, destination, year, roundTrip, canSubmit, loading],
  );

  return (
    <GoogleMapsProvider>
      <form onSubmit={handleSubmit} className="space-y-5">
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

        <button
          type="submit"
          disabled={!canSubmit || loading}
          className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white
            hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-light/40
            disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Spinner />
              Calculating...
            </span>
          ) : (
            "Calculate Mileage"
          )}
        </button>

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {result && !error && (
          <Results data={result} origin={origin} destination={destination} />
        )}
      </form>
    </GoogleMapsProvider>
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
