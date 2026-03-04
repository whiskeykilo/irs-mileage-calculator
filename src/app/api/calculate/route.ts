import { NextRequest, NextResponse } from "next/server";
import type { CalculateRequest, CalculateResponse } from "@/lib/types";
import { getRateForYear, getAvailableYears } from "@/lib/irs-rates";
import { getRoutingProvider, RoutingProviderError } from "@/lib/routing";
import { routeCache, buildCacheKey } from "@/lib/cache";
import { rateLimiter, dailyApiCounter } from "@/lib/rate-limit";

function getClientIp(req: NextRequest): string {
  // Prefer x-real-ip (set by Vercel/Nginx to the actual client IP).
  // Fall back to the rightmost x-forwarded-for entry (closest to the proxy),
  // which is harder to spoof than the leftmost.
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded.split(",").map((s) => s.trim());
    return parts[parts.length - 1];
  }

  return "unknown";
}

function validateRequest(
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

function computeReimbursement(
  oneWayMiles: number,
  ratePerMile: number,
  roundTrip: boolean,
): { distanceMiles: number; reimbursement: number } {
  const distanceMiles = roundTrip ? oneWayMiles * 2 : oneWayMiles;
  const rounded = Math.round(distanceMiles * 100) / 100;
  const reimbursement = Math.round(rounded * ratePerMile * 100) / 100;
  return { distanceMiles: rounded, reimbursement };
}

export async function POST(req: NextRequest) {
  // 1. Parse and validate
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON in request body." },
      { status: 400 },
    );
  }

  const validation = validateRequest(body);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }
  const { origin, destination, year, roundTrip } = validation.data;

  // 2. Rate limit (per-IP)
  const ip = getClientIp(req);
  const rateCheck = rateLimiter.check(ip);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      {
        status: 429,
        headers: { "Retry-After": String(rateCheck.retryAfter ?? 60) },
      },
    );
  }

  // 3. Look up IRS rate (fail early if year is somehow invalid)
  const irsRate = getRateForYear(year);
  if (!irsRate) {
    return NextResponse.json(
      { error: `No IRS rate found for year ${year}.` },
      { status: 400 },
    );
  }

  // 4. Check cache
  const cacheKey = buildCacheKey(origin, destination);
  const cached = routeCache.get(cacheKey);

  if (cached) {
    const { distanceMiles, reimbursement } = computeReimbursement(
      cached.distanceMiles,
      irsRate.rate,
      roundTrip,
    );
    return NextResponse.json<CalculateResponse>({
      distanceMiles,
      rate: irsRate.rate,
      rateLabel: irsRate.label,
      reimbursement,
      roundTrip,
      year,
      cached: true,
    });
  }

  // 5. Check daily API cap (only for uncached requests that hit upstream)
  if (!dailyApiCounter.consume()) {
    return NextResponse.json(
      {
        error:
          "Daily routing limit reached. Please try again tomorrow or use a previously calculated route.",
      },
      { status: 503 },
    );
  }

  // 6. Call routing provider
  try {
    const provider = getRoutingProvider();
    const result = await provider.getRoute(origin, destination);

    // 7. Cache the route result (distance is provider-agnostic)
    routeCache.set(cacheKey, result);

    // 8. Calculate reimbursement
    const { distanceMiles, reimbursement } = computeReimbursement(
      result.distanceMiles,
      irsRate.rate,
      roundTrip,
    );

    return NextResponse.json<CalculateResponse>({
      distanceMiles,
      rate: irsRate.rate,
      rateLabel: irsRate.label,
      reimbursement,
      roundTrip,
      year,
      cached: false,
    });
  } catch (err) {
    if (err instanceof RoutingProviderError) {
      const statusMap: Record<string, number> = {
        INVALID_ADDRESS: 400,
        NO_ROUTE: 400,
        QUOTA_EXCEEDED: 503,
        AUTH_ERROR: 502,
        PROVIDER_ERROR: 502,
      };
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: statusMap[err.code] ?? 502 },
      );
    }

    console.error("Unexpected routing error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 },
    );
  }
}
