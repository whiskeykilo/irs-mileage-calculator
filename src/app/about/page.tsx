import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Disclaimer } from "@/components/disclaimer";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn how the IRS Mileage Calculator works, what data it uses, and how to calculate your mileage reimbursement.",
};

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-6">
            About This Calculator
          </h1>

          <div className="space-y-6 text-sm sm:text-base leading-relaxed text-text-muted">
            <section>
              <h2 className="text-lg font-semibold text-text mb-2">
                What It Does
              </h2>
              <p>
                This tool calculates driving distance between two addresses and
                estimates the IRS mileage reimbursement amount using the
                official IRS standard business mileage rate for your selected
                tax year. Enter an origin and destination, and the calculator
                returns the distance, applicable rate, and total reimbursement.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-text mb-2">
                How It Works
              </h2>
              <ol className="list-decimal list-inside space-y-2">
                <li>
                  You enter an origin and destination address (autocomplete
                  helps with partial addresses).
                </li>
                <li>
                  The app sends both addresses to a routing service to calculate
                  the driving distance.
                </li>
                <li>
                  The distance is multiplied by the IRS standard business
                  mileage rate for your selected tax year.
                </li>
                <li>
                  The result shows the distance (miles), rate ($/mile), and
                  total reimbursement amount.
                </li>
              </ol>
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
