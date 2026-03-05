import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { buildStaticMapUrl } from "./static-map";

describe("buildStaticMapUrl", () => {
  const originalEnv = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = "test-key";
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = originalEnv;
    } else {
      delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    }
  });

  it("returns null when API key is missing", () => {
    delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    expect(buildStaticMapUrl(["A", "B"], "enc123")).toBeNull();
  });

  it("returns null when polyline is empty", () => {
    expect(buildStaticMapUrl(["A", "B"], "")).toBeNull();
  });

  it("builds a valid URL with polyline and markers", () => {
    const url = buildStaticMapUrl(["New York", "Boston"], "abc123");
    expect(url).not.toBeNull();
    const parsed = new URL(url!);
    expect(parsed.hostname).toBe("maps.googleapis.com");
    expect(parsed.pathname).toBe("/maps/api/staticmap");
    expect(parsed.searchParams.get("size")).toBe("600x250");
    expect(parsed.searchParams.get("scale")).toBe("2");
    expect(parsed.searchParams.get("key")).toBe("test-key");
    expect(parsed.searchParams.get("path")).toContain("enc:abc123");

    const markers = parsed.searchParams.getAll("markers");
    expect(markers).toHaveLength(2);
    expect(markers[0]).toContain("label:A");
    expect(markers[0]).toContain("New York");
    expect(markers[1]).toContain("label:B");
    expect(markers[1]).toContain("Boston");
  });

  it("adds markers for intermediate stops", () => {
    const url = buildStaticMapUrl(["A", "B", "C"], "poly");
    const parsed = new URL(url!);
    const markers = parsed.searchParams.getAll("markers");
    expect(markers).toHaveLength(3);
    expect(markers[0]).toContain("label:A");
    expect(markers[1]).toContain("label:B");
    expect(markers[2]).toContain("label:C");
  });
});
