import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Disclaimer } from "@/components/disclaimer";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn how the IRS Mileage Calculator works, including mileage reimbursement estimates and PDF receipt generation for expense reports.",
};

function AboutJsonLd() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Can I generate a PDF mileage report for an expense report?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. After your route is calculated, select Download PDF receipt to export the route details, IRS rate, and reimbursement amount.",
        },
      },
      {
        "@type": "Question",
        name: "Does this use official IRS mileage rates?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. The calculator uses IRS standard business mileage rates by year.",
        },
      },
      {
        "@type": "Question",
        name: "Can I calculate multi-stop and round-trip routes?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. Add stops in order and toggle round trip when needed before creating the PDF receipt.",
        },
      },
    ],
  };

  const safeJson = JSON.stringify(structuredData).replace(/</g, "\\u003c");

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJson }}
    />
  );
}

export default function AboutPage() {
  return (
    <>
      <AboutJsonLd />
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-6">
            About This Calculator
          </h1>

          <div className="space-y-6 text-sm sm:text-base leading-relaxed text-text-muted">
            <section>
              <h2 className="text-lg font-semibold text-text mb-2">
                What It Does
              </h2>
              <p>
                This tool calculates driving distance along a route (two or more
                stops) and estimates the IRS mileage reimbursement amount using
                the official IRS standard business mileage rate for the year of
                your trip date. Enter your stops in order, and the calculator
                returns the total distance, applicable rate, reimbursement, and
                a downloadable PDF receipt for expense reporting.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-text mb-2">
                How It Works
              </h2>
              <ol className="list-decimal list-inside space-y-2">
                <li>
                  You enter your trip stops in order (start, end, and any stops
                  in between). Autocomplete helps with partial addresses.
                </li>
                <li>
                  The app sends the stops to a routing service to calculate the
                  total driving distance along the route.
                </li>
                <li>
                  The distance is multiplied by the IRS standard business
                  mileage rate for the year of your trip date.
                </li>
                <li>
                  The result shows the distance (miles), rate ($/mile), and
                  total reimbursement amount.
                </li>
              </ol>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-text mb-2">
                Built for clean expense reporting
              </h2>
              <p>
                Your PDF receipt includes route stops, trip type, total miles,
                IRS rate, and reimbursement amount, ready to attach to internal
                expense workflows.
              </p>
              <p className="mt-2">
                Need historical rates too?{" "}
                <Link href="/rates" className="underline hover:text-primary">
                  See IRS mileage rates by year
                </Link>
                .
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-text mb-2">
                Mileage report FAQ
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-medium text-text">
                    Can I generate a PDF mileage report for an expense report?
                  </h3>
                  <p>
                    Yes. After your route is calculated, select Download PDF
                    receipt to export the route details, IRS rate, and
                    reimbursement amount.
                  </p>
                </div>
                <div>
                  <h3 className="text-base font-medium text-text">
                    Does this use official IRS mileage rates?
                  </h3>
                  <p>
                    Yes. The calculator uses IRS standard business mileage rates
                    by year.
                  </p>
                </div>
                <div>
                  <h3 className="text-base font-medium text-text">
                    Can I calculate multi-stop and round-trip routes?
                  </h3>
                  <p>
                    Yes. Add stops in order and toggle round trip when needed
                    before creating the PDF receipt.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-text mb-2">
                IRS Standard Mileage Rate
              </h2>
              <p>
                The IRS publishes a standard mileage rate each year that
                reflects the average cost of operating a vehicle for business
                purposes. This includes gas, depreciation, insurance, and
                maintenance. Employers may reimburse employees at this rate
                tax-free, and self-employed individuals may use it to calculate
                their vehicle expense deduction. See the{" "}
                <Link href="/rates" className="underline hover:text-primary">
                  full rate table
                </Link>{" "}
                for all supported years.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-text mb-2">
                Data Sources
              </h2>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  <strong className="text-text">Mileage rates:</strong>{" "}
                  <a
                    href="https://www.irs.gov/tax-professionals/standard-mileage-rates"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-primary"
                  >
                    IRS.gov Standard Mileage Rates
                  </a>
                </li>
                <li>
                  <strong className="text-text">Driving distance:</strong>{" "}
                  Google Maps Directions API
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-text mb-2">
                Important Disclaimer
              </h2>
              <Disclaimer />
            </section>
          </div>

          <div className="mt-8">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-dark transition-colors"
            >
              ← Back to calculator
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
