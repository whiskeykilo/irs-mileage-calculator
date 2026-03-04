import type { RoutingProvider } from "./provider";
import { GoogleRoutingProvider } from "./google";

export { RoutingProviderError } from "./provider";
export type { RoutingProvider } from "./provider";

/**
 * Returns the configured routing provider.
 *
 * To swap providers (e.g., Google → Mapbox), change this function.
 * Everything else in the app goes through this factory.
 */
let cachedProvider: RoutingProvider | null = null;

export function getRoutingProvider(): RoutingProvider {
  if (!cachedProvider) {
    cachedProvider = new GoogleRoutingProvider();
  }
  return cachedProvider;
}
