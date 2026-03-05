import type { CalculateRequest } from "@/lib/types";
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

  const { origin, destination, year, roundTrip } = body as Record<
    string,
    unknown
  >;

  if (typeof origin !== "string" || origin.trim().length === 0) {
    return { ok: false, error: "Origin address is required." };
  }
  if (typeof destination !== "string" || destination.trim().length === 0) {
    return { ok: false, error: "Destination address is required." };
  }
  if (origin.trim().length > 500 || destination.trim().length > 500) {
    return { ok: false, error: "Address too long (max 500 characters)." };
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
      origin: origin.trim(),
      destination: destination.trim(),
      year: parsedYear,
      roundTrip: roundTrip === true,
    },
  };
}
