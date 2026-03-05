"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { getAvailableYears } from "@/lib/irs-rates";

type TripDatePickerProps = {
  value: string;
  onChange: (isoDate: string) => void;
  id?: string;
  "aria-label"?: string;
};

function parseIsoToLocalDate(iso: string): Date | undefined {
  const [y, m, d] = iso.split("-").map(Number);
  if (y === undefined || m === undefined || d === undefined) return undefined;
  if (m < 1 || m > 12) return undefined;
  const date = new Date(y, m - 1, d);
  if (Number.isNaN(date.getTime())) return undefined;
  return date;
}

function dateToIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Allowed range: Jan 1 of earliest rate year through Dec 31 of latest (e.g. 2020–2026). */
function getMinMaxDates(): { min: Date; max: Date } {
  const years = getAvailableYears();
  const minYear = years.at(-1) ?? 2020;
  const maxYear = years[0];
  return {
    min: new Date(minYear, 0, 1),
    max: new Date(maxYear, 11, 31),
  };
}

export function TripDatePicker({
  value,
  onChange,
  id = "trip-date",
  "aria-label": ariaLabel = "Trip date",
}: TripDatePickerProps) {
  const { min, max } = getMinMaxDates();
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState<Date>(
    () => parseIsoToLocalDate(value) ?? max,
  );
  const wrapperRef = useRef<HTMLDivElement>(null);
  const selectedDate = parseIsoToLocalDate(value);

  const displayValue = selectedDate
    ? selectedDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "";

  const handleSelect = useCallback(
    (date: Date | undefined) => {
      if (!date) return;
      onChange(dateToIso(date));
      setOpen(false);
    },
    [onChange],
  );

  useEffect(() => {
    if (!open) return;
    const next = parseIsoToLocalDate(value);
    if (next) setMonth(next);
  }, [open, value]);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={wrapperRef} className="relative max-w-[12rem]">
      <label
        htmlFor={id}
        className="block text-sm font-medium text-text mb-1.5"
      >
        Trip date
      </label>
      <button
        type="button"
        id={id}
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="w-full rounded-lg border border-border bg-surface text-text px-2.5 py-2 text-sm text-left
          focus:outline-none focus:ring-2 focus:ring-primary-light/40 focus:border-primary-light transition-shadow
          hover:border-primary-light/50"
      >
        {displayValue || "Select date"}
      </button>
      {open && (
        <div
          className="trip-date-picker-calendar absolute bottom-full left-0 z-10 mb-1 rounded-lg border border-border bg-surface shadow-lg p-1.5"
          role="dialog"
          aria-modal="true"
          aria-label="Choose trip date"
        >
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={handleSelect}
            month={month}
            onMonthChange={setMonth}
            startMonth={min}
            endMonth={max}
            disabled={{ before: min, after: max }}
            captionLayout="dropdown-years"
          />
        </div>
      )}
    </div>
  );
}
