import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchStaticMapDataUri } from "./static-map";

describe("fetchStaticMapDataUri", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns null when polyline is empty", async () => {
    expect(await fetchStaticMapDataUri(["A", "B"], "")).toBeNull();
  });

  it("returns null when fewer than 2 stops", async () => {
    expect(await fetchStaticMapDataUri(["A"], "poly123")).toBeNull();
  });

  it("returns null when fetch fails", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network"));
    expect(await fetchStaticMapDataUri(["A", "B"], "poly")).toBeNull();
  });

  it("returns null on non-ok response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("nope", { status: 502 }),
    );
    expect(await fetchStaticMapDataUri(["A", "B"], "poly")).toBeNull();
  });

  it("builds the correct proxy URL with stops and polyline", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("nope", { status: 502 }),
    );

    await fetchStaticMapDataUri(["New York", "Boston"], "abc123");

    expect(fetchSpy).toHaveBeenCalledOnce();
    const url = new URL(fetchSpy.mock.calls[0][0] as string, "http://localhost");
    expect(url.pathname).toBe("/api/static-map");
    expect(url.searchParams.get("polyline")).toBe("abc123");
    expect(url.searchParams.get("stops")).toBe("New York\0Boston");
  });
});
