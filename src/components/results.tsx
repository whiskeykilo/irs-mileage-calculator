"use client";

import { useState, useCallback } from "react";
import { pdf } from "@react-pdf/renderer";
import type { CalculateResponse } from "@/lib/types";
import { buildStaticMapUrl, fetchStaticMapDataUri } from "@/lib/static-map";
import { Disclaimer } from "./disclaimer";
import { MileageReceiptPdf } from "./mileage-receipt-pdf";

type ResultsProps = {
  data: CalculateResponse;
  stops: string[];
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
        px-2 py-1 rounded border border-border hover:border-primary-light"
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
  return new Date().toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function Results({ data, stops }: ResultsProps) {
  const [pdfLoading, setPdfLoading] = useState(false);
  const distanceLabel = data.roundTrip ? "round trip" : "one way";

  const handleDownloadPdf = useCallback(async () => {
    setPdfLoading(true);
    try {
      const staticMapUrl = buildStaticMapUrl(stops, data.overviewPolyline);
      const mapImageUri = staticMapUrl
        ? await fetchStaticMapDataUri(staticMapUrl)
        : null;

      const blob = await pdf(
        <MileageReceiptPdf
          stops={stops}
          result={data}
          generatedAt={formatPdfGeneratedAt()}
          mapImageUri={mapImageUri}
        />,
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mileage-receipt-${new Date().toISOString().slice(0, 10)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setPdfLoading(false);
    }
  }, [stops, data]);

  return (
    <div className="space-y-4">
      <div className="bg-surface rounded-xl border border-border p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-3">
          Results
        </h2>
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
        <div className="mt-4 pt-4 border-t border-border">
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={pdfLoading}
            className="w-full rounded-lg border border-primary bg-surface px-4 py-3 text-sm font-semibold text-primary
              hover:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-primary-light/40
              disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {pdfLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner />
                Generating PDF...
              </span>
            ) : (
              "Download PDF receipt"
            )}
          </button>
        </div>
      </div>
      <Disclaimer className="px-1" />
    </div>
  );
}
