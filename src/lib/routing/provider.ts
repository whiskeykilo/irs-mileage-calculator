import type { RouteResult, RoutingError } from "@/lib/types";

/**
 * Abstract routing provider interface.
 *
 * Implement this to add a new routing backend (Google, Mapbox, etc.).
 * The factory in ./index.ts decides which provider to instantiate.
 */
export interface RoutingProvider {
  readonly name: string;
  /** Ordered stops: first = origin, last = destination; 2 to MAX_STOPS (see @/lib/types). */
  getRoute(stops: string[]): Promise<RouteResult>;
}

/**
 * Thrown by routing providers when the upstream API returns a known error.
 * The `code` field maps to user-friendly error messages in the API route.
 * `upstreamDetail` is the provider's raw explanation (e.g. why a key was
 * denied). It is for server logs only and must never be sent to the client.
 */
export class RoutingProviderError extends Error {
  constructor(
    public readonly code: RoutingError["code"],
    message: string,
    public readonly upstreamDetail?: string,
  ) {
    super(message);
    this.name = "RoutingProviderError";
  }
}
