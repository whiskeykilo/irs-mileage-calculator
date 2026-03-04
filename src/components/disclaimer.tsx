export function Disclaimer({ className }: { className?: string }) {
  return (
    <p
      className={`text-xs text-text-muted leading-relaxed ${className ?? ""}`}
    >
      This calculator is for informational purposes only and does not constitute
      tax advice. Always verify mileage rates and reimbursement policies with
      your employer and the{" "}
      <a
        href="https://www.irs.gov/tax-professionals/standard-mileage-rates"
        target="_blank"
        rel="noopener noreferrer"
        className="underline hover:text-primary"
      >
        IRS
      </a>
      .
    </p>
  );
}
