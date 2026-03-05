import { NextRequest, NextResponse } from "next/server";
import type { CalculateResponse } from "@/lib/types";
import { getRateForYear } from "@/lib/irs-rates";
import { validateCalculateRequest } from "@/lib/calculate-validate";
import { computeReimbursement } from "@/lib/reimbursement";
import { getRoutingProvider, RoutingProviderError } from "@/lib/routing";
import { routeCache, buildCacheKey } from "@/lib/cache";
import { rateLimiter, dailyApiCounter } from "@/lib/rate-limit";

/** Success responses are cacheable by the browser for 5 minutes. */
const SUCCESS_HEADERS = {
  "Cache-Control": "private, max-age=300",
};

function getClientIp(req: NextRequest): string {
  // NextRequest.ip is set by Vercel's edge network to the true client IP.
  // This is the most reliable source on Vercel deployments.
  if (req.ip) return req.ip;

  // x-real-ip is set by reverse proxies (Nginx, Vercel) to the client IP.
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  // Rightmost x-forwarded-for entry is closest to the proxy, harder to spoof.
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded.split(",").map((s) => s.trim());
    return parts[parts.length - 1];
  }

  // No IP info at all. All headerless requests share one bucket, which is
  // intentional: we'd rather rate-limit aggressively than not at all.
  return "unknown";
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

  const validation = validateCalculateRequest(body);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }
  const { stops, year, roundTrip } = validation.data;

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
  const cacheKey = buildCacheKey(stops);
  const cached = routeCache.get(cacheKey);

  if (cached) {
    const { distanceMiles, reimbursement } = computeReimbursement(
      cached.distanceMiles,
      irsRate.rate,
      roundTrip,
    );
    return NextResponse.json<CalculateResponse>(
      {
        distanceMiles,
        rate: irsRate.rate,
        rateLabel: irsRate.label,
        reimbursement,
        roundTrip,
        year,
        cached: true,
      },
      { headers: SUCCESS_HEADERS },
    );
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
    const result = await provider.getRoute(stops);

    // 7. Cache the route result (distance is provider-agnostic)
    routeCache.set(cacheKey, result);

    // 8. Calculate reimbursement
    const { distanceMiles, reimbursement } = computeReimbursement(
      result.distanceMiles,
      irsRate.rate,
      roundTrip,
    );

    return NextResponse.json<CalculateResponse>(
      {
        distanceMiles,
        rate: irsRate.rate,
        rateLabel: irsRate.label,
        reimbursement,
        roundTrip,
        year,
        cached: false,
      },
      { headers: SUCCESS_HEADERS },
    );
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
