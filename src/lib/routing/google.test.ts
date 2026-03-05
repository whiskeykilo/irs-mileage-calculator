import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GoogleRoutingProvider } from "./google";
import { RoutingProviderError } from "./provider";

// Minimal mock for fetch: returns a configurable JSON response
function mockFetch(status: number, body: unknown) {
  return vi.spyOn(globalThis, "fetch").mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response);
}

describe("GoogleRoutingProvider", () => {
  beforeEach(() => {
    process.env.GOOGLE_MAPS_API_KEY = "test-key";
  });

  afterEach(() => {
    delete process.env.GOOGLE_MAPS_API_KEY;
    vi.restoreAllMocks();
  });

  it("throws if GOOGLE_MAPS_API_KEY is not set", () => {
    delete process.env.GOOGLE_MAPS_API_KEY;
    expect(() => new GoogleRoutingProvider()).toThrow("GOOGLE_MAPS_API_KEY");
  });

  it("returns route result for a valid OK response", async () => {
    mockFetch(200, {
      status: "OK",
      routes: [
        {
          summary: "I-95 N",
          overview_polyline: { points: "abc123" },
          legs: [
            {
              distance: { value: 362_775, text: "225.4 mi" },
              duration: { value: 14_400, text: "4 hours" },
            },
          ],
        },
      ],
    });

    const provider = new GoogleRoutingProvider();
    const result = await provider.getRoute(["New York", "Boston"]);
    expect(result.distanceMeters).toBe(362_775);
    expect(result.distanceMiles).toBeGreaterThan(225);
    expect(result.durationSeconds).toBe(14_400);
    expect(result.summary).toBe("I-95 N");
    expect(result.overviewPolyline).toBe("abc123");
  });

  it("sums distance across multiple legs", async () => {
    mockFetch(200, {
      status: "OK",
      routes: [
        {
          summary: "multi",
          overview_polyline: { points: "xyz" },
          legs: [
            { distance: { value: 100_000, text: "" }, duration: { value: 1000, text: "" } },
            { distance: { value: 50_000, text: "" }, duration: { value: 500, text: "" } },
          ],
        },
      ],
    });

    const provider = new GoogleRoutingProvider();
    const result = await provider.getRoute(["A", "B", "C"]);
    expect(result.distanceMeters).toBe(150_000);
    expect(result.durationSeconds).toBe(1500);
  });

  it("throws INVALID_ADDRESS for NOT_FOUND status", async () => {
    mockFetch(200, { status: "NOT_FOUND" });
    const provider = new GoogleRoutingProvider();
    await expect(provider.getRoute(["Nowhere", "Void"])).rejects.toThrow(
      RoutingProviderError,
    );
    try {
      await provider.getRoute(["Nowhere", "Void"]);
    } catch (err) {
      expect((err as RoutingProviderError).code).toBe("INVALID_ADDRESS");
    }
  });

  it("throws NO_ROUTE for ZERO_RESULTS status", async () => {
    mockFetch(200, { status: "ZERO_RESULTS" });
    const provider = new GoogleRoutingProvider();
    try {
      await provider.getRoute(["Island A", "Island B"]);
    } catch (err) {
      expect(err).toBeInstanceOf(RoutingProviderError);
      expect((err as RoutingProviderError).code).toBe("NO_ROUTE");
    }
  });

  it("throws QUOTA_EXCEEDED for OVER_DAILY_LIMIT", async () => {
    mockFetch(200, { status: "OVER_DAILY_LIMIT" });
    const provider = new GoogleRoutingProvider();
    try {
      await provider.getRoute(["A", "B"]);
    } catch (err) {
      expect(err).toBeInstanceOf(RoutingProviderError);
      expect((err as RoutingProviderError).code).toBe("QUOTA_EXCEEDED");
    }
  });

  it("throws QUOTA_EXCEEDED for OVER_QUERY_LIMIT", async () => {
    mockFetch(200, { status: "OVER_QUERY_LIMIT" });
    const provider = new GoogleRoutingProvider();
    try {
      await provider.getRoute(["A", "B"]);
    } catch (err) {
      expect(err).toBeInstanceOf(RoutingProviderError);
      expect((err as RoutingProviderError).code).toBe("QUOTA_EXCEEDED");
    }
  });

  it("throws AUTH_ERROR for REQUEST_DENIED", async () => {
    mockFetch(200, { status: "REQUEST_DENIED", error_message: "bad key" });
    const provider = new GoogleRoutingProvider();
    try {
      await provider.getRoute(["A", "B"]);
    } catch (err) {
      expect(err).toBeInstanceOf(RoutingProviderError);
      expect((err as RoutingProviderError).code).toBe("AUTH_ERROR");
    }
  });

  it("throws PROVIDER_ERROR for UNKNOWN_ERROR", async () => {
    mockFetch(200, { status: "UNKNOWN_ERROR", error_message: "oops" });
    const provider = new GoogleRoutingProvider();
    try {
      await provider.getRoute(["A", "B"]);
    } catch (err) {
      expect(err).toBeInstanceOf(RoutingProviderError);
      expect((err as RoutingProviderError).code).toBe("PROVIDER_ERROR");
      expect((err as RoutingProviderError).message).toBe("oops");
    }
  });

  it("throws PROVIDER_ERROR for non-OK HTTP status", async () => {
    mockFetch(500, {});
    const provider = new GoogleRoutingProvider();
    try {
      await provider.getRoute(["A", "B"]);
    } catch (err) {
      expect(err).toBeInstanceOf(RoutingProviderError);
      expect((err as RoutingProviderError).code).toBe("PROVIDER_ERROR");
    }
  });

  it("throws PROVIDER_ERROR for empty routes array", async () => {
    mockFetch(200, { status: "OK", routes: [{ summary: "", overview_polyline: { points: "" }, legs: [] }] });
    const provider = new GoogleRoutingProvider();
    try {
      await provider.getRoute(["A", "B"]);
    } catch (err) {
      expect(err).toBeInstanceOf(RoutingProviderError);
      expect((err as RoutingProviderError).code).toBe("PROVIDER_ERROR");
    }
  });

  it("throws INVALID_ADDRESS for fewer than 2 stops", async () => {
    const provider = new GoogleRoutingProvider();
    try {
      await provider.getRoute(["OnlyOne"]);
    } catch (err) {
      expect(err).toBeInstanceOf(RoutingProviderError);
      expect((err as RoutingProviderError).code).toBe("INVALID_ADDRESS");
    }
  });

  it("throws INVALID_ADDRESS for MAX_WAYPOINTS_EXCEEDED", async () => {
    mockFetch(200, { status: "MAX_WAYPOINTS_EXCEEDED" });
    const provider = new GoogleRoutingProvider();
    try {
      await provider.getRoute(["A", "B"]);
    } catch (err) {
      expect(err).toBeInstanceOf(RoutingProviderError);
      expect((err as RoutingProviderError).code).toBe("INVALID_ADDRESS");
    }
  });

  it("includes waypoints in the request when stops > 2", async () => {
    const spy = mockFetch(200, {
      status: "OK",
      routes: [
        {
          summary: "via C",
          overview_polyline: { points: "wp" },
          legs: [
            { distance: { value: 50000, text: "" }, duration: { value: 500, text: "" } },
            { distance: { value: 50000, text: "" }, duration: { value: 500, text: "" } },
          ],
        },
      ],
    });

    const provider = new GoogleRoutingProvider();
    await provider.getRoute(["A", "C", "B"]);

    const url = spy.mock.calls[0][0] as string;
    expect(url).toContain("origin=A");
    expect(url).toContain("destination=B");
    expect(url).toContain("waypoints=C");
  });
});
