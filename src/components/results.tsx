"use client";

import { useState, useCallback } from "react";
import { pdf } from "@react-pdf/renderer";
import type { CalculateResponse } from "@/lib/types";
import { fetchStaticMapDataUri } from "@/lib/static-map";
import { Disclaimer } from "./disclaimer";
import { MileageReceiptPdf } from "./mileage-receipt-pdf";
import { RoundTripToggle } from "./round-trip-toggle";
import { TripDatePicker } from "./trip-date-picker";

type ResultsProps = {
  data: CalculateResponse;
  stops: string[];
  /** Required for PDF; YYYY-MM-DD. Button disabled when empty. */
  tripDate: string;
  onTripDateChange: (isoDate: string) => void;
  roundTrip: boolean;
  onRoundTripChange: (checked: boolean) => void;
  /** Current business reason input (controlled from parent). */
  businessReason: string;
  onBusinessReasonChange: (value: string) => void;
  /** Sanitized business reason from server; used for PDF when present. */
  businessReasonPdf?: string;
};

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className="text-xs text-text-muted hover:text-primary transition-colors
        px-2 py-1 rounded border border-border hover:border-primary-light
        focus:outline-none focus:ring-2 focus:ring-primary-light/40 focus:border-primary-light"
      aria-label={`Copy ${label}`}
      title={`Copy ${label}`}
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

function ResultRow({
  label,
  value,
  copyValue,
  detail,
}: {
  label: string;
  value: string;
  copyValue: string;
  detail?: string;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-b-0">
      <div>
        <p className="text-sm text-text-muted">{label}</p>
        <p className="text-lg font-semibold">{value}</p>
        {detail && <p className="text-xs text-text-muted mt-0.5">{detail}</p>}
      </div>
      <CopyButton text={copyValue} label={label} />
    </div>
  );
}

function Spinner() {
  return (
    <svg
      className="animate-spin h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

function formatPdfGeneratedAt(): string {
  return new Date().toLocaleDateString("en-US", { dateStyle: "medium" });
}

export function Results({
  data,
  stops,
  tripDate,
  onTripDateChange,
  roundTrip,
  onRoundTripChange,
  businessReason,
  onBusinessReasonChange,
  businessReasonPdf,
}: ResultsProps) {
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const distanceLabel = data.roundTrip ? "round trip" : "one way";
  const canDownloadPdf = tripDate.trim().length > 0;

  const handleDownloadPdf = useCallback(async () => {
    if (!canDownloadPdf) return;
    setPdfLoading(true);
    setPdfError(null);
    try {
      const mapImageUri = await fetchStaticMapDataUri(
        stops,
        data.overviewPolyline,
      );

      const blob = await pdf(
        <MileageReceiptPdf
          stops={stops}
          result={data}
          tripDate={tripDate.trim()}
          generatedAt={formatPdfGeneratedAt()}
          mapImageUri={mapImageUri}
          businessReason={businessReasonPdf}
        />,
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mileage-receipt-${tripDate.trim()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "PDF generation failed";
      setPdfError(message);
      if (process.env.NODE_ENV === "development") {
        console.error("PDF download failed:", err);
      }
    } finally {
      setPdfLoading(false);
    }
  }, [stops, data, tripDate, canDownloadPdf, businessReasonPdf]);

  return (
    <div className="space-y-4">
      <div className="bg-surface rounded-xl border border-border p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4 mb-3">
          <h2 className="text-base font-semibold text-text">Results</h2>
          <RoundTripToggle
            id="round-trip-results"
            checked={roundTrip}
            onChange={onRoundTripChange}
          />
        </div>
        <ResultRow
          label="Driving Distance"
          value={`${data.distanceMiles.toFixed(2)} miles`}
          copyValue={data.distanceMiles.toFixed(2)}
          detail={distanceLabel}
        />
        <ResultRow
          label="IRS Mileage Rate"
          value={`$${data.rate.toFixed(3)}/mile`}
          copyValue={data.rate.toFixed(3)}
          detail={`${data.year} standard business rate (${data.rateLabel}/mi)`}
        />
        <ResultRow
          label="Reimbursement"
          value={`$${data.reimbursement.toFixed(2)}`}
          copyValue={data.reimbursement.toFixed(2)}
          detail={`${data.distanceMiles.toFixed(2)} mi × $${data.rate.toFixed(3)}/mi`}
        />
        <div className="mt-4 pt-4 border-t border-border space-y-3">
          {pdfError && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
              {pdfError}
            </p>
          )}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[auto_1fr_auto] md:items-end">
            <div className="min-w-0 max-md:w-full">
              <TripDatePicker
                value={tripDate}
                onChange={onTripDateChange}
                id="trip-date"
              />
            </div>
            <div className="min-w-0 flex flex-col gap-0.5 max-md:w-full">
              <label
                htmlFor="business-reason-results"
                className="block text-sm font-medium text-text mb-1.5"
              >
                Business reason (optional)
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="business-reason-results"
                  type="text"
                  maxLength={50}
                  value={businessReason}
                  onChange={(e) => onBusinessReasonChange(e.target.value)}
                  placeholder="e.g. Client meeting"
                  className="w-full min-w-0 rounded-lg border border-border bg-surface text-text px-3 py-2 text-sm
                    placeholder:text-text-muted/60 focus:outline-none focus:ring-2
                    focus:ring-primary-light/40 focus:border-primary-light transition-shadow"
                  aria-describedby="business-reason-count-results"
                />
                <span
                  id="business-reason-count-results"
                  className="text-xs text-text-muted tabular-nums shrink-0"
                  aria-live="polite"
                >
                  {businessReason.length}/50
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={pdfLoading || !canDownloadPdf}
              className="min-w-0 w-full justify-self-stretch rounded-lg border border-primary bg-surface px-4 py-2 text-sm font-semibold text-primary
                hover:bg-primary hover:text-white focus:outline-none focus:ring-2 focus:ring-primary-light/40
                disabled:opacity-50 disabled:cursor-not-allowed transition-colors
                md:w-auto md:justify-self-auto"
            >
              {pdfLoading ? (
                <span
                  className="flex items-center justify-center gap-2"
                  role="status"
                  aria-live="polite"
                >
                  <Spinner />
                  Generating PDF...
                </span>
              ) : (
                "Download PDF receipt"
              )}
            </button>
          </div>
        </div>
      </div>
      <Disclaimer className="px-1" />
    </div>
  );
}
