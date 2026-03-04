"use client";

import { useState, useCallback } from "react";
import type { CalculateResponse } from "@/lib/types";
import { Disclaimer } from "./disclaimer";

type ResultsProps = {
  data: CalculateResponse;
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

export function Results({ data }: ResultsProps) {
  const distanceLabel = data.roundTrip ? "round trip" : "one way";

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
      </div>
      <Disclaimer className="px-1" />
    </div>
  );
}
