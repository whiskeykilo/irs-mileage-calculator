/**
 * In-memory rate limiter using sliding window counters.
 *
 * Two layers:
 * 1. Per-IP: configurable requests per minute and per hour
 * 2. Global: daily cap on actual API calls (not cached hits)
 *
 * Same caveats as the cache: resets on cold start, per-instance only.
 * For multi-instance deployments, swap to Redis-backed rate limiting.
 */

type WindowEntry = {
  timestamps: number[];
};

function getEnv(key: string, fallback: number): number {
  const val = parseInt(process.env[key] ?? "", 10);
  return isNaN(val) ? fallback : val;
}

class RateLimiter {
  private perIp = new Map<string, WindowEntry>();
  private cleanupCounter = 0;

  private get maxPerMinute(): number {
    return getEnv("RATE_LIMIT_MAX_PER_MINUTE", 20);
  }

  private get maxPerHour(): number {
    return getEnv("RATE_LIMIT_MAX_PER_HOUR", 100);
  }

  /**
   * Check if a request from this IP should be allowed.
   * Returns { allowed: true } or { allowed: false, retryAfter: seconds }.
   */
  check(ip: string): { allowed: boolean; retryAfter?: number } {
    const now = Date.now();
    const entry = this.perIp.get(ip) ?? { timestamps: [] };

    // Prune timestamps older than 1 hour
    const oneHourAgo = now - 60 * 60 * 1000;
    entry.timestamps = entry.timestamps.filter((t) => t > oneHourAgo);

    // Count requests in the last minute
    const oneMinuteAgo = now - 60 * 1000;
    const lastMinute = entry.timestamps.filter((t) => t > oneMinuteAgo).length;
    if (lastMinute >= this.maxPerMinute) {
      const oldestInWindow = entry.timestamps.find((t) => t > oneMinuteAgo)!;
      const retryAfter = Math.ceil((oldestInWindow + 60 * 1000 - now) / 1000);
      return { allowed: false, retryAfter: Math.max(retryAfter, 1) };
    }

    // Count requests in the last hour
    if (entry.timestamps.length >= this.maxPerHour) {
      const oldestInWindow = entry.timestamps[0];
      const retryAfter = Math.ceil(
        (oldestInWindow + 60 * 60 * 1000 - now) / 1000,
      );
      return { allowed: false, retryAfter: Math.max(retryAfter, 1) };
    }

    // Record this request
    entry.timestamps.push(now);
    this.perIp.set(ip, entry);

    // Periodic cleanup of stale IPs (every 50 checks)
    this.cleanupCounter++;
    if (this.cleanupCounter % 50 === 0) {
      this.cleanup(now);
    }

    return { allowed: true };
  }

  private cleanup(now: number): void {
    const oneHourAgo = now - 60 * 60 * 1000;
    for (const [ip, entry] of this.perIp) {
      if (
        entry.timestamps.length === 0 ||
        entry.timestamps[entry.timestamps.length - 1] < oneHourAgo
      ) {
        this.perIp.delete(ip);
      }
    }
  }
}

/**
 * Alert hook type. Implement your own (e.g., send to Discord, PagerDuty, email)
 * and register it via `dailyApiCounter.onAlert`.
 */
export type UsageAlertHook = (alert: {
  level: "warning" | "critical" | "exhausted";
  used: number;
  cap: number;
  percentUsed: number;
  date: string;
}) => void;

/**
 * Default alert hook: logs to console.
 * Replace with your own (Discord webhook, email, etc.) in production.
 */
const defaultAlertHook: UsageAlertHook = (alert) => {
  const prefix = `[API USAGE ${alert.level.toUpperCase()}]`;
  const msg = `${prefix} ${alert.used}/${alert.cap} calls used (${alert.percentUsed}%) on ${alert.date}`;
  if (alert.level === "exhausted") {
    console.error(msg);
  } else {
    console.warn(msg);
  }
};

// Alert thresholds as percentages of the daily cap
const ALERT_THRESHOLDS = [
  { percent: 50, level: "warning" as const },
  { percent: 80, level: "critical" as const },
  { percent: 100, level: "exhausted" as const },
];

/**
 * Global daily API call counter.
 * Resets at midnight UTC. Only counts actual upstream API calls (not cache hits).
 * Fires alert hooks at 50%, 80%, and 100% usage thresholds.
 */
class DailyApiCounter {
  private count = 0;
  private resetDate = this.todayUtc();
  private firedAlerts = new Set<number>();
  private alertHook: UsageAlertHook = defaultAlertHook;

  private get cap(): number {
    return getEnv("DAILY_API_CAP", 1000);
  }

  private todayUtc(): string {
    return new Date().toISOString().slice(0, 10);
  }

  /**
   * Register a custom alert hook. Called when usage crosses thresholds (50%, 80%, 100%).
   */
  set onAlert(hook: UsageAlertHook) {
    this.alertHook = hook;
  }

  /**
   * Try to consume one API call from the daily budget.
   * Returns true if allowed, false if the cap has been reached.
   */
  consume(): boolean {
    const today = this.todayUtc();
    if (today !== this.resetDate) {
      this.count = 0;
      this.resetDate = today;
      this.firedAlerts.clear();
    }

    if (this.count >= this.cap) {
      this.fireAlerts();
      return false;
    }

    this.count++;
    this.fireAlerts();
    return true;
  }

  get remaining(): number {
    const today = this.todayUtc();
    if (today !== this.resetDate) {
      return this.cap;
    }
    return Math.max(0, this.cap - this.count);
  }

  private fireAlerts(): void {
    const cap = this.cap;
    if (cap <= 0) return;

    const percentUsed = Math.round((this.count / cap) * 100);

    for (const threshold of ALERT_THRESHOLDS) {
      if (percentUsed >= threshold.percent && !this.firedAlerts.has(threshold.percent)) {
        this.firedAlerts.add(threshold.percent);
        try {
          this.alertHook({
            level: threshold.level,
            used: this.count,
            cap,
            percentUsed,
            date: this.resetDate,
          });
        } catch {
          // Alert hooks must never take down the request path
        }
      }
    }
  }
}

export const rateLimiter = new RateLimiter();
export const dailyApiCounter = new DailyApiCounter();
