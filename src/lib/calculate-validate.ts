import { MAX_STOPS, type CalculateRequest } from "@/lib/types";
import { getAvailableYears } from "@/lib/irs-rates";

/**
 * Validates the request body for POST /api/calculate.
 * Returns either { ok: true, data } or { ok: false, error }.
 */
export function validateCalculateRequest(
  body: unknown,
): { ok: true; data: CalculateRequest } | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Request body must be a JSON object." };
  }

  const { origin, destination, stops: stopsRaw, year, roundTrip } = body as Record<
    string,
    unknown
  >;

  let stops: string[];
  if (Array.isArray(stopsRaw)) {
    const trimmed = stopsRaw
      .filter((s): s is string => typeof s === "string")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    if (trimmed.length < 2) {
      return {
        ok: false,
        error: "At least two stops (origin and destination) are required.",
      };
    }
    if (trimmed.some((s) => s.length > 500)) {
      return { ok: false, error: "Address too long (max 500 characters)." };
    }
    if (trimmed.length > MAX_STOPS) {
      return {
        ok: false,
        error: `Maximum ${MAX_STOPS} stops (origin + up to ${MAX_STOPS - 2} waypoints + destination).`,
      };
    }
    stops = trimmed;
  } else if (typeof origin === "string" && typeof destination === "string") {
    const o = origin.trim();
    const d = destination.trim();
    if (o.length === 0 || d.length === 0) {
      return { ok: false, error: "Origin and destination are required." };
    }
    if (o.length > 500 || d.length > 500) {
      return { ok: false, error: "Address too long (max 500 characters)." };
    }
    stops = [o, d];
  } else {
    return {
      ok: false,
      error: "Provide either 'stops' (array of 2+ addresses) or 'origin' and 'destination'.",
    };
  }

  const availableYears = getAvailableYears();
  const parsedYear =
    typeof year === "number"
      ? year
      : typeof year === "string"
        ? parseInt(year, 10)
        : availableYears[0];

  if (!availableYears.includes(parsedYear)) {
    return {
      ok: false,
      error: `Invalid year. Available years: ${availableYears.join(", ")}`,
    };
  }

  return {
    ok: true,
    data: {
      stops,
      year: parsedYear,
      roundTrip: roundTrip === true,
    },
  };
}
