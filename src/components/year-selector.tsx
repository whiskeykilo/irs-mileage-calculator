"use client";

import { getAvailableYears, getRateForYear } from "@/lib/irs-rates";

type YearSelectorProps = {
  value: number;
  onChange: (year: number) => void;
};

export function YearSelector({ value, onChange }: YearSelectorProps) {
  const years = getAvailableYears();

  return (
    <div>
      <label htmlFor="tax-year" className="block text-sm font-medium text-text mb-1.5">
        Tax Year
      </label>
      <select
        id="tax-year"
        value={value}
        onChange={(e) => {
          const n = parseInt(e.target.value, 10);
          if (!isNaN(n)) onChange(n);
        }}
        className="w-full rounded-lg border border-border bg-surface text-text px-3 py-2.5 text-sm
          focus:outline-none focus:ring-2 focus:ring-primary-light/40
          focus:border-primary-light transition-shadow"
      >
        {years.map((year) => {
          const rate = getRateForYear(year);
          return (
            <option key={year} value={year}>
              {year} ({rate?.label}/mi)
            </option>
          );
        })}
      </select>
    </div>
  );
}
