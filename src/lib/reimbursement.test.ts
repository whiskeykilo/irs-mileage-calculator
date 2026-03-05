import { describe, it, expect } from "vitest";
import { computeReimbursement } from "./reimbursement";

describe("computeReimbursement", () => {
  it("one way: distance and rate round to two decimals", () => {
    const { distanceMiles, reimbursement } = computeReimbursement(
      100.456,
      0.67,
      false,
    );
    expect(distanceMiles).toBe(100.46);
    expect(reimbursement).toBe(67.31);
  });

  it("round trip: doubles distance then rounds", () => {
    const { distanceMiles, reimbursement } = computeReimbursement(
      50.111,
      0.70,
      true,
    );
    expect(distanceMiles).toBe(100.22);
    expect(reimbursement).toBe(70.15);
  });

  it("reimbursement is distance × rate rounded to two decimals", () => {
    const { distanceMiles, reimbursement } = computeReimbursement(
      10,
      0.725,
      false,
    );
    expect(distanceMiles).toBe(10);
    expect(reimbursement).toBe(7.25);
  });

  it("handles zero distance", () => {
    const { distanceMiles, reimbursement } = computeReimbursement(0, 0.67, false);
    expect(distanceMiles).toBe(0);
    expect(reimbursement).toBe(0);
  });
});
