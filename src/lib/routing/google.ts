import type { RouteResult } from "@/lib/types";
import { MAX_STOPS } from "@/lib/types";
import { RoutingProvider, RoutingProviderError } from "./provider";

const METERS_PER_MILE = 1609.344;

const DIRECTIONS_API_URL =
  "https://maps.googleapis.com/maps/api/directions/json";

/**
 * Google Maps Directions API response types (only the fields we use).
 */
type DirectionsStatus =
  | "OK"
  | "NOT_FOUND"
  | "ZERO_RESULTS"
  | "MAX_WAYPOINTS_EXCEEDED"
  | "INVALID_REQUEST"
  | "OVER_DAILY_LIMIT"
  | "OVER_QUERY_LIMIT"
  | "REQUEST_DENIED"
  | "UNKNOWN_ERROR";

type DirectionsResponse = {
  status: DirectionsStatus;
  error_message?: string;
  routes: Array<{
    summary: string;
    overview_polyline: { points: string };
    legs: Array<{
      distance: { value: number; text: string };
      duration: { value: number; text: string };
    }>;
  }>;
};

export class GoogleRoutingProvider implements RoutingProvider {
  readonly name = "google";
  private readonly apiKey: string;

  constructor() {
    const key = process.env.GOOGLE_MAPS_API_KEY;
    if (!key) {
      throw new Error(
        "GOOGLE_MAPS_API_KEY is not set. Add it to .env.local (server-side only).",
      );
    }
    this.apiKey = key;
  }

  async getRoute(stops: string[]): Promise<RouteResult> {
    if (stops.length < 2) {
      throw new RoutingProviderError(
        "INVALID_ADDRESS",
        "At least two stops are required.",
      );
    }
    if (stops.length > MAX_STOPS) {
      throw new RoutingProviderError(
        "INVALID_ADDRESS",
        `Too many stops. Maximum ${MAX_STOPS} (origin + up to ${MAX_STOPS - 2} waypoints + destination) allowed.`,
      );
    }
    const [origin, ...rest] = stops;
    const destination = rest.pop() ?? origin;
    const waypoints = rest;

    const params = new URLSearchParams({
      origin,
      destination,
      key: this.apiKey,
      mode: "driving",
      units: "imperial",
    });
    if (waypoints.length > 0) {
      params.set("waypoints", waypoints.join("|"));
    }

    const response = await fetch(`${DIRECTIONS_API_URL}?${params}`, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new RoutingProviderError(
        "PROVIDER_ERROR",
        `Google Directions API returned HTTP ${response.status}`,
      );
    }

    const data = (await response.json()) as DirectionsResponse;

    if (!data || typeof data.status !== "string") {
      throw new RoutingProviderError(
        "PROVIDER_ERROR",
        "Unexpected response format from routing API.",
      );
    }

    switch (data.status) {
      case "OK":
        break;
      case "NOT_FOUND":
      case "ZERO_RESULTS":
        throw new RoutingProviderError(
          data.status === "NOT_FOUND" ? "INVALID_ADDRESS" : "NO_ROUTE",
          data.status === "NOT_FOUND"
            ? "One or more addresses could not be found. Check spelling and try again."
            : "No driving route found between these addresses.",
        );
      case "MAX_WAYPOINTS_EXCEEDED":
        throw new RoutingProviderError(
          "INVALID_ADDRESS",
          `Too many stops. Maximum ${MAX_STOPS} stops allowed.`,
        );
      case "OVER_DAILY_LIMIT":
      case "OVER_QUERY_LIMIT":
        throw new RoutingProviderError(
          "QUOTA_EXCEEDED",
          "The routing service is temporarily at capacity. Please try again later.",
        );
      case "REQUEST_DENIED":
        throw new RoutingProviderError(
          "AUTH_ERROR",
          "Routing service authentication error. Contact the site administrator.",
        );
      default:
        throw new RoutingProviderError(
          "PROVIDER_ERROR",
          data.error_message ?? `Routing API error: ${data.status}`,
        );
    }

    const legs = data.routes[0]?.legs ?? [];
    if (legs.length === 0) {
      throw new RoutingProviderError(
        "PROVIDER_ERROR",
        "Unexpected empty response from routing API.",
      );
    }

    const distanceMeters = legs.reduce((sum, leg) => sum + leg.distance.value, 0);
    const durationSeconds = legs.reduce((sum, leg) => sum + leg.duration.value, 0);
    const distanceMiles =
      Math.round((distanceMeters / METERS_PER_MILE) * 100) / 100;
    const summary =
      legs.length === 1
        ? data.routes[0].summary
        : `${legs.length} legs, ${distanceMiles.toFixed(1)} mi total`;

    return {
      distanceMeters,
      distanceMiles,
      durationSeconds,
      summary,
      overviewPolyline: data.routes[0].overview_polyline?.points ?? "",
    };
  }
}
