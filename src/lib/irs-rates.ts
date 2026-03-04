/**
 * IRS Standard Business Mileage Rates
 *
 * Source: https://www.irs.gov/tax-professionals/standard-mileage-rates
 *
 * To add a new year: append an entry to the IRS_RATES array below.
 * The calculator uses the last entry for a given year (so for split-rate
 * years like 2022, add both periods and the later one wins for calculations).
 */

export type IrsRate = {
  year: number;
  /** Dollars per mile (e.g., 0.725 = 72.5 cents) */
  rate: number;
  /** Human-readable rate string */
  label: string;
  /** Optional note (e.g., for split-rate years) */
  note?: string;
  /** Period start date, if the year has multiple rates */
  periodStart?: string;
};

export const IRS_RATES: IrsRate[] = [
  { year: 2020, rate: 0.575, label: "57.5¢" },
  { year: 2021, rate: 0.56, label: "56¢" },
  {
    year: 2022,
    rate: 0.585,
    label: "58.5¢",
    note: "Jan 1 – Jun 30",
    periodStart: "2022-01-01",
  },
  {
    year: 2022,
    rate: 0.625,
    label: "62.5¢",
    note: "Jul 1 – Dec 31",
    periodStart: "2022-07-01",
  },
  { year: 2023, rate: 0.655, label: "65.5¢" },
  { year: 2024, rate: 0.67, label: "67¢" },
  { year: 2025, rate: 0.7, label: "70¢" },
  { year: 2026, rate: 0.725, label: "72.5¢" },
];

/**
 * Returns all rate entries (including both 2022 periods).
 * Useful for the /rates page table.
 */
export function getAllRates(): IrsRate[] {
  return IRS_RATES;
}

/**
 * Returns the applicable rate for a given tax year.
 * For split-rate years (2022), returns the later period's rate
 * since most mileage is calculated at year-end.
 */
export function getRateForYear(year: number): IrsRate | null {
  const matches = IRS_RATES.filter((r) => r.year === year);
  if (matches.length === 0) return null;
  return matches[matches.length - 1];
}

/**
 * Returns unique years available for selection, newest first.
 */
export function getAvailableYears(): number[] {
  const years = [...new Set(IRS_RATES.map((r) => r.year))];
  return years.sort((a, b) => b - a);
}

/**
 * Returns the current tax year (most recent year with a rate).
 */
export function getCurrentYear(): number {
  return getAvailableYears()[0];
}
