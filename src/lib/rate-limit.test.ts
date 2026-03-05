import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { RateLimiter, DailyApiCounter } from "./rate-limit";

describe("RateLimiter", () => {
  beforeEach(() => {
    // Low limits for easier testing
    process.env.RATE_LIMIT_MAX_PER_MINUTE = "3";
    process.env.RATE_LIMIT_MAX_PER_HOUR = "5";
  });

  afterEach(() => {
    delete process.env.RATE_LIMIT_MAX_PER_MINUTE;
    delete process.env.RATE_LIMIT_MAX_PER_HOUR;
    vi.restoreAllMocks();
  });

  it("allows requests under the per-minute limit", () => {
    const limiter = new RateLimiter();
    expect(limiter.check("1.2.3.4").allowed).toBe(true);
    expect(limiter.check("1.2.3.4").allowed).toBe(true);
    expect(limiter.check("1.2.3.4").allowed).toBe(true);
  });

  it("blocks requests exceeding per-minute limit", () => {
    const limiter = new RateLimiter();
    limiter.check("1.2.3.4");
    limiter.check("1.2.3.4");
    limiter.check("1.2.3.4");
    const result = limiter.check("1.2.3.4");
    expect(result.allowed).toBe(false);
    expect(result.retryAfter).toBeGreaterThan(0);
    expect(result.retryAfter).toBeLessThanOrEqual(60);
  });

  it("blocks requests exceeding per-hour limit", () => {
    const limiter = new RateLimiter();
    const now = Date.now();

    // Space requests across different minutes to avoid per-minute limit
    // but stay within the hour
    vi.spyOn(Date, "now")
      .mockReturnValueOnce(now)               // req 1
      .mockReturnValueOnce(now + 61_000)      // req 2 (1 min later)
      .mockReturnValueOnce(now + 122_000)     // req 3 (2 min later)
      .mockReturnValueOnce(now + 183_000)     // req 4 (3 min later)
      .mockReturnValueOnce(now + 244_000)     // req 5 (4 min later)
      .mockReturnValue(now + 305_000);        // req 6 (5 min later, should be blocked)

    limiter.check("10.0.0.1");
    limiter.check("10.0.0.1");
    limiter.check("10.0.0.1");
    limiter.check("10.0.0.1");
    limiter.check("10.0.0.1");

    const result = limiter.check("10.0.0.1");
    expect(result.allowed).toBe(false);
    expect(result.retryAfter).toBeGreaterThan(0);
  });

  it("tracks IPs independently", () => {
    const limiter = new RateLimiter();
    // Fill up IP A
    limiter.check("A");
    limiter.check("A");
    limiter.check("A");
    expect(limiter.check("A").allowed).toBe(false);

    // IP B should still be allowed
    expect(limiter.check("B").allowed).toBe(true);
  });

  it("allows requests again after the minute window passes", () => {
    const limiter = new RateLimiter();
    const now = Date.now();

    vi.spyOn(Date, "now").mockReturnValue(now);
    limiter.check("1.1.1.1");
    limiter.check("1.1.1.1");
    limiter.check("1.1.1.1");
    expect(limiter.check("1.1.1.1").allowed).toBe(false);

    // Jump forward past the minute window
    vi.spyOn(Date, "now").mockReturnValue(now + 61_000);
    expect(limiter.check("1.1.1.1").allowed).toBe(true);
  });

  it("retryAfter is at least 1 second", () => {
    const limiter = new RateLimiter();
    limiter.check("x");
    limiter.check("x");
    limiter.check("x");
    const result = limiter.check("x");
    expect(result.allowed).toBe(false);
    expect(result.retryAfter).toBeGreaterThanOrEqual(1);
  });
});

describe("DailyApiCounter", () => {
  beforeEach(() => {
    process.env.DAILY_API_CAP = "5";
  });

  afterEach(() => {
    delete process.env.DAILY_API_CAP;
    vi.restoreAllMocks();
  });

  it("allows requests under the daily cap", () => {
    const counter = new DailyApiCounter();
    expect(counter.consume()).toBe(true);
    expect(counter.consume()).toBe(true);
    expect(counter.consume()).toBe(true);
    expect(counter.remaining).toBe(2);
  });

  it("blocks requests at the daily cap", () => {
    const counter = new DailyApiCounter();
    for (let i = 0; i < 5; i++) {
      expect(counter.consume()).toBe(true);
    }
    expect(counter.consume()).toBe(false);
    expect(counter.remaining).toBe(0);
  });

  it("remaining reflects consumed calls", () => {
    const counter = new DailyApiCounter();
    expect(counter.remaining).toBe(5);
    counter.consume();
    counter.consume();
    expect(counter.remaining).toBe(3);
  });

  it("resets on a new UTC day", () => {
    const counter = new DailyApiCounter();

    // Use up the cap
    for (let i = 0; i < 5; i++) counter.consume();
    expect(counter.consume()).toBe(false);

    // Simulate next day by mocking Date to return tomorrow
    const tomorrow = new Date();
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    vi.spyOn(Date.prototype, "toISOString").mockReturnValue(
      tomorrow.toISOString(),
    );

    // Should reset and allow again
    expect(counter.consume()).toBe(true);
    expect(counter.remaining).toBe(4);
  });

  it("fires alert hooks at threshold percentages", () => {
    process.env.DAILY_API_CAP = "10";
    const counter = new DailyApiCounter();
    const alerts: Array<{ level: string; percentUsed: number }> = [];
    counter.onAlert = (alert) => {
      alerts.push({ level: alert.level, percentUsed: alert.percentUsed });
    };

    // Consume 5 (50%) -> should fire "warning"
    for (let i = 0; i < 5; i++) counter.consume();
    expect(alerts).toHaveLength(1);
    expect(alerts[0].level).toBe("warning");

    // Consume 3 more (80%) -> should fire "critical"
    for (let i = 0; i < 3; i++) counter.consume();
    expect(alerts).toHaveLength(2);
    expect(alerts[1].level).toBe("critical");

    // Consume 2 more (100%) -> should fire "exhausted"
    for (let i = 0; i < 2; i++) counter.consume();
    expect(alerts).toHaveLength(3);
    expect(alerts[2].level).toBe("exhausted");
  });

  it("does not fire the same alert threshold twice", () => {
    process.env.DAILY_API_CAP = "2";
    const counter = new DailyApiCounter();
    const alerts: string[] = [];
    counter.onAlert = (alert) => alerts.push(alert.level);

    counter.consume(); // 50% -> warning
    counter.consume(); // 100% -> critical + exhausted
    counter.consume(); // still 100% but already fired
    counter.consume(); // still 100% but already fired

    // warning, critical, exhausted should each fire exactly once
    expect(alerts.filter((a) => a === "exhausted")).toHaveLength(1);
  });

  it("swallows errors from alert hooks without crashing", () => {
    const counter = new DailyApiCounter();
    counter.onAlert = () => {
      throw new Error("webhook failed");
    };

    // Should not throw even though the hook explodes
    for (let i = 0; i < 6; i++) {
      expect(() => counter.consume()).not.toThrow();
    }
  });
});
