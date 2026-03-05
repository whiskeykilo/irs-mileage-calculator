import { describe, it, expect } from "vitest";
import { validateCalculateRequest } from "./calculate-validate";
import { getAvailableYears } from "./irs-rates";

describe("validateCalculateRequest", () => {
  const validYear = getAvailableYears()[0];

  it("accepts valid body with origin, destination, year, roundTrip", () => {
    const result = validateCalculateRequest({
      origin: " 1600 Pennsylvania Ave ",
      destination: " 350 Fifth Ave, NY ",
      year: validYear,
      roundTrip: true,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.origin).toBe("1600 Pennsylvania Ave");
      expect(result.data.destination).toBe("350 Fifth Ave, NY");
      expect(result.data.year).toBe(validYear);
      expect(result.data.roundTrip).toBe(true);
    }
  });

  it("rejects non-object body", () => {
    const r = validateCalculateRequest(null);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("JSON object");
    expect(validateCalculateRequest(undefined).ok).toBe(false);
    expect(validateCalculateRequest("").ok).toBe(false);
  });

  it("rejects missing or empty origin", () => {
    let r = validateCalculateRequest({
      origin: "",
      destination: "Boston",
      year: validYear,
      roundTrip: false,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("Origin");

    r = validateCalculateRequest({
      origin: "   ",
      destination: "Boston",
      year: validYear,
      roundTrip: false,
    });
    expect(r.ok).toBe(false);
  });

  it("rejects missing or empty destination", () => {
    const r = validateCalculateRequest({
      origin: "NYC",
      destination: "",
      year: validYear,
      roundTrip: false,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("Destination");
  });

  it("rejects address longer than 500 chars", () => {
    const long = "a".repeat(501);
    const r = validateCalculateRequest({
      origin: long,
      destination: "Boston",
      year: validYear,
      roundTrip: false,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("500");
  });

  it("rejects invalid year", () => {
    const r = validateCalculateRequest({
      origin: "A",
      destination: "B",
      year: 1999,
      roundTrip: false,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("Invalid year");
  });

  it("parses string year when valid", () => {
    const result = validateCalculateRequest({
      origin: "A",
      destination: "B",
      year: String(validYear),
      roundTrip: false,
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.year).toBe(validYear);
  });

  it("defaults year to current when missing or invalid type", () => {
    const result = validateCalculateRequest({
      origin: "A",
      destination: "B",
      roundTrip: false,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(getAvailableYears()).toContain(result.data.year);
    }
  });

  it("roundTrip is false unless explicitly true", () => {
    const r1 = validateCalculateRequest({
      origin: "A",
      destination: "B",
      year: validYear,
    });
    expect(r1.ok).toBe(true);
    if (r1.ok) expect(r1.data.roundTrip).toBe(false);

    const r2 = validateCalculateRequest({
      origin: "A",
      destination: "B",
      year: validYear,
      roundTrip: "yes",
    });
    expect(r2.ok).toBe(true);
    if (r2.ok) expect(r2.data.roundTrip).toBe(false);
  });
});
