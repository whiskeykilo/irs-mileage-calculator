import type { RouteResult, RoutingError } from "@/lib/types";

/**
 * Abstract routing provider interface.
 *
 * Implement this to add a new routing backend (Google, Mapbox, etc.).
 * The factory in ./index.ts decides which provider to instantiate.
 */
export interface RoutingProvider {
  readonly name: string;
  getRoute(origin: string, destination: string): Promise<RouteResult>;
}

/**
 * Thrown by routing providers when the upstream API returns a known error.
 * The `code` field maps to user-friendly error messages in the API route.
 */
export class RoutingProviderError extends Error {
  constructor(
    public readonly code: RoutingError["code"],
    message: string,
  ) {
    super(message);
    this.name = "RoutingProviderError";
  }
}
