import { createHash } from "crypto";
import type { RouteResult } from "@/lib/types";

type CacheEntry = {
  data: RouteResult;
  expiresAt: number;
  lastAccessed: number;
};

const MAX_ENTRIES = 10_000;

/**
 * In-memory route cache with TTL and LRU eviction.
 *
 * Lives in the serverless function's memory. Entries survive for the lifetime
 * of the instance (on Vercel, that's typically a few minutes between cold starts).
 * Good enough for the MVP -- swap to Redis/KV for persistence across instances.
 */
class RouteCache {
  private store = new Map<string, CacheEntry>();
  private setCount = 0;

  private get ttlMs(): number {
    const seconds = parseInt(process.env.CACHE_TTL_SECONDS ?? "604800", 10);
    return (isNaN(seconds) ? 604800 : seconds) * 1000;
  }

  /**
   * Build a deterministic cache key from origin + destination.
   * Normalizes whitespace and casing so "New York, NY" and "new york,  ny"
   * hit the same entry.
   */
  static buildKey(origin: string, destination: string): string {
    const normalize = (s: string) =>
      s.toLowerCase().trim().replace(/\s+/g, " ");
    const raw = `${normalize(origin)}|${normalize(destination)}`;
    return createHash("sha256").update(raw).digest("hex");
  }

  get(key: string): RouteResult | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    entry.lastAccessed = Date.now();
    return entry.data;
  }

  set(key: string, data: RouteResult): void {
    // Periodic cleanup every 100 writes
    this.setCount++;
    if (this.setCount % 100 === 0) {
      this.evictExpired();
    }

    // LRU eviction if at capacity
    if (this.store.size >= MAX_ENTRIES && !this.store.has(key)) {
      this.evictLru();
    }

    this.store.set(key, {
      data,
      expiresAt: Date.now() + this.ttlMs,
      lastAccessed: Date.now(),
    });
  }

  get size(): number {
    return this.store.size;
  }

  private evictExpired(): void {
    const now = Date.now();
    for (const [k, v] of this.store) {
      if (now > v.expiresAt) {
        this.store.delete(k);
      }
    }
  }

  private evictLru(): void {
    let oldest: string | null = null;
    let oldestTime = Infinity;
    for (const [k, v] of this.store) {
      if (v.lastAccessed < oldestTime) {
        oldestTime = v.lastAccessed;
        oldest = k;
      }
    }
    if (oldest) {
      this.store.delete(oldest);
    }
  }
}

/**
 * Build a deterministic cache key from origin + destination.
 * Exported for use in the API route.
 */
export const buildCacheKey = RouteCache.buildKey;

/**
 * Singleton cache instance. Survives across requests within the same
 * serverless function invocation.
 */
export const routeCache = new RouteCache();
