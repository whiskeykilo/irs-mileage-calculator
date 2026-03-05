import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { getAllRates } from "@/lib/irs-rates";

export const metadata: Metadata = {
  title: "IRS Standard Mileage Rates 2020–2026 | Rate Per Mile by Year",
  description:
    "Complete table of IRS standard business mileage rates from 2020 to 2026. Find the current rate per mile for tax deductions and employer reimbursement.",
  keywords: [
    "IRS mileage rate",
    "standard mileage rate",
    "mileage rate by year",
    "IRS mileage rate 2026",
    "IRS mileage rate 2025",
    "business mileage rate history",
  ],
};

function RatesJsonLd() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is the IRS standard mileage rate for 2026?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "The IRS standard business mileage rate for 2026 is 72.5 cents per mile ($0.725).",
        },
      },
      {
        "@type": "Question",
        name: "What is the IRS standard mileage rate for 2025?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "The IRS standard business mileage rate for 2025 is 70 cents per mile ($0.700).",
        },
      },
      {
        "@type": "Question",
        name: "Why did 2022 have two different IRS mileage rates?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Due to rising gas prices in 2022, the IRS issued a mid-year rate increase. The rate was 58.5¢/mile from January through June, and 62.5¢/mile from July through December.",
        },
      },
    ],
  };

  // Escape '<' to prevent </script> injection in inline JSON-LD
  const safeJson = JSON.stringify(structuredData).replace(/</g, "\\u003c");

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJson }}
    />
  );
}

export default function RatesPage() {
  const rates = getAllRates();

  return (
    <>
      <RatesJsonLd />
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text mb-4">
            IRS Standard Mileage Rates by Year
          </h1>

          <p className="text-text-muted text-sm sm:text-base leading-relaxed mb-8">
            The IRS sets a standard mileage rate each year for business use of a
            personal vehicle. Employers can reimburse employees at this rate
            tax-free, and self-employed individuals can use it to calculate their
            deduction. The rate is based on an annual study of the fixed and
            variable costs of operating a car.
          </p>

          <div className="overflow-x-auto rounded-xl border border-border shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-alt border-b border-border">
                  <th scope="col" className="text-left px-4 py-3 font-semibold text-text">
                    Tax Year
                  </th>
                  <th scope="col" className="text-left px-4 py-3 font-semibold text-text">
                    Rate (per mile)
                  </th>
                  <th scope="col" className="text-left px-4 py-3 font-semibold text-text">
                    Rate ($)
                  </th>
                  <th scope="col" className="text-left px-4 py-3 font-semibold text-text">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody>
                {rates
                  .slice()
                  .reverse()
                  .map((rate, i) => (
                    <tr
                      key={`${rate.year}-${rate.periodStart ?? "full"}`}
                      className={
                        i % 2 === 0 ? "bg-surface" : "bg-surface-alt"
                      }
                    >
                      <td className="px-4 py-3 font-medium">{rate.year}</td>
                      <td className="px-4 py-3">{rate.label}</td>
                      <td className="px-4 py-3">
                        ${rate.rate.toFixed(3)}
                      </td>
                      <td className="px-4 py-3 text-text-muted">
                        {rate.note ?? "Full year"}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 space-y-4 text-sm text-text-muted leading-relaxed">
            <p>
              <strong className="text-text">Note on 2022:</strong> The IRS
              issued two rates for 2022 due to rising gas prices. The rate was
              58.5¢/mile from January 1 through June 30, and 62.5¢/mile from
              July 1 through December 31. Our calculator uses the applicable
              rate based on your selected year (the later rate for 2022).
            </p>
            <p>
              Source:{" "}
              <a
                href="https://www.irs.gov/tax-professionals/standard-mileage-rates"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-primary"
              >
                IRS Standard Mileage Rates
              </a>
            </p>
          </div>

          <div className="mt-8">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-dark transition-colors"
            >
              ← Calculate your mileage reimbursement
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
