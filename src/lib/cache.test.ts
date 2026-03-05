import { describe, it, expect } from "vitest";
import { buildCacheKey } from "./cache";

describe("buildCacheKey", () => {
  it("returns a 64-char hex string (SHA-256)", () => {
    const key = buildCacheKey(["A", "B"]);
    expect(key).toMatch(/^[a-f0-9]{64}$/);
  });

  it("same stops produce the same key", () => {
    expect(buildCacheKey(["New York, NY", "Boston, MA"])).toBe(
      buildCacheKey(["New York, NY", "Boston, MA"]),
    );
  });

  it("normalizes whitespace and casing", () => {
    expect(buildCacheKey(["new york,  ny", "boston, ma"])).toBe(
      buildCacheKey(["New York, NY", "Boston, MA"]),
    );
  });

  it("different stops produce different keys", () => {
    const k1 = buildCacheKey(["A", "B"]);
    const k2 = buildCacheKey(["A", "C"]);
    const k3 = buildCacheKey(["C", "B"]);
    expect(k1).not.toBe(k2);
    expect(k1).not.toBe(k3);
    expect(k2).not.toBe(k3);
  });

  it("order of stops matters (multi-stop)", () => {
    expect(buildCacheKey(["A", "B", "C"])).not.toBe(buildCacheKey(["A", "C", "B"]));
  });
});
