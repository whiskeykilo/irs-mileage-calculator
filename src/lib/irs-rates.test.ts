import { describe, it, expect } from "vitest";
import {
  getAllRates,
  getRateForYear,
  getAvailableYears,
  getCurrentYear,
  IRS_RATES,
} from "./irs-rates";

describe("irs-rates", () => {
  describe("getAllRates", () => {
    it("returns the full IRS_RATES array", () => {
      const rates = getAllRates();
      expect(rates).toBe(IRS_RATES);
      expect(rates.length).toBeGreaterThan(0);
    });
  });

  describe("getRateForYear", () => {
    it("returns the rate for a given year", () => {
      expect(getRateForYear(2024)).toEqual({
        year: 2024,
        rate: 0.67,
        label: "67¢",
      });
      expect(getRateForYear(2020)).toEqual({
        year: 2020,
        rate: 0.575,
        label: "57.5¢",
      });
    });

    it("for split-rate years returns the later period (e.g. 2022)", () => {
      const rate = getRateForYear(2022);
      expect(rate).not.toBeNull();
      expect(rate!.year).toBe(2022);
      expect(rate!.rate).toBe(0.625);
      expect(rate!.label).toBe("62.5¢");
    });

    it("returns null for years with no rate", () => {
      expect(getRateForYear(2019)).toBeNull();
      expect(getRateForYear(2030)).toBeNull();
    });
  });

  describe("getAvailableYears", () => {
    it("returns unique years newest first", () => {
      const years = getAvailableYears();
      expect(years).toEqual([...new Set(years)]);
      for (let i = 1; i < years.length; i++) {
        expect(years[i]).toBeLessThan(years[i - 1]);
      }
    });

    it("includes all years present in IRS_RATES", () => {
      const years = getAvailableYears();
      const rateYears = [...new Set(IRS_RATES.map((r) => r.year))];
      expect(years.sort()).toEqual(rateYears.sort());
    });
  });

  describe("getCurrentYear", () => {
    it("returns the most recent year with a rate", () => {
      const current = getCurrentYear();
      const years = getAvailableYears();
      expect(current).toBe(years[0]);
    });

    it("returns a year that has a rate", () => {
      const current = getCurrentYear();
      expect(getRateForYear(current)).not.toBeNull();
    });
  });
});
