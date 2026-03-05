/**
 * Pure reimbursement math: distance × rate, with round-trip and rounding rules.
 */

export function computeReimbursement(
  oneWayMiles: number,
  ratePerMile: number,
  roundTrip: boolean,
): { distanceMiles: number; reimbursement: number } {
  const distanceMiles = roundTrip ? oneWayMiles * 2 : oneWayMiles;
  const rounded = Math.round(distanceMiles * 100) / 100;
  const reimbursement = Math.round(rounded * ratePerMile * 100) / 100;
  return { distanceMiles: rounded, reimbursement };
}
