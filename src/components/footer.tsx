import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface mt-auto">
      <div className="mx-auto max-w-3xl px-4 py-6 text-center text-sm text-text-muted space-y-3">
        <p>
          This calculator is for informational purposes only. Always confirm
          mileage rates and reimbursement policies with your employer and the{" "}
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
        <nav aria-label="Footer navigation" className="flex justify-center gap-4">
          <Link href="/rates" className="hover:text-primary transition-colors">
            Rates
          </Link>
          <Link href="/about" className="hover:text-primary transition-colors">
            About
          </Link>
          <Link
            href="/privacy"
            className="hover:text-primary transition-colors"
          >
            Privacy
          </Link>
        </nav>
        <p>&copy; {new Date().getFullYear()} IRS Mileage Calculator</p>
      </div>
    </footer>
  );
}
