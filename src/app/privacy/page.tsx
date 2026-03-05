import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Privacy policy for IRS Mileage Calculator. Learn what data we collect and how we handle your information.",
};

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-6">
            Privacy Policy
          </h1>

          <div className="space-y-6 text-sm sm:text-base leading-relaxed text-text-muted">
            <p>Last updated: March 5, 2026</p>

            <section>
              <h2 className="text-lg font-semibold text-text mb-2">
                What We Collect
              </h2>
              <p>
                <strong className="text-text">
                  We do not store your addresses or personal information.
                </strong>{" "}
                When you use the calculator, the addresses you enter are sent to
                our server to calculate the driving distance. They are processed
                in memory and are not written to any database or log file.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-text mb-2">Caching</h2>
              <p>
                To reduce costs and improve performance, we cache route distance
                results in server memory using a one-way hash of the addresses.
                The original address text cannot be recovered from this hash.
                Cached entries expire automatically and do not persist across
                server restarts.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-text mb-2">
                Third-Party Services
              </h2>
              <p>This site uses the following third-party services:</p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>
                  <strong className="text-text">Google Maps Platform</strong>{" "}
                  (Places Autocomplete and Directions API) to provide address
                  suggestions and calculate driving distances. Your address
                  queries are sent to Google. See{" "}
                  <a
                    href="https://policies.google.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-primary"
                  >
                    Google&apos;s Privacy Policy
                  </a>
                  .
                </li>
                <li>
                  <strong className="text-text">Vercel</strong> for hosting. See{" "}
                  <a
                    href="https://vercel.com/legal/privacy-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-primary"
                  >
                    Vercel&apos;s Privacy Policy
                  </a>
                  .
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-text mb-2">Cookies</h2>
              <p>
                This site does not set any first-party cookies. Third-party
                services (e.g., Google Maps) may set their own cookies as
                described in their respective privacy policies.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-text mb-2">
                Analytics
              </h2>
              <p>We do not currently use any analytics or tracking services.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-text mb-2">Contact</h2>
              <p>
                If you have questions about this privacy policy, please open an
                issue on our{" "}
                <a
                  href="https://github.com/whiskeykilo/irs-mileage-calculator"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-primary"
                >
                  GitHub repository
                </a>
                .
              </p>
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
