import type { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Calculator } from "@/components/calculator";
import { getCurrentYear, getRateForYear } from "@/lib/irs-rates";

export const metadata: Metadata = {
  title: "IRS Mileage Calculator and PDF Mileage Receipts",
  description:
    "Instantly calculate what your drive is worth with official IRS rates, then download a PDF mileage receipt for expense reports.",
  keywords: [
    "IRS mileage calculator",
    "mileage expense report",
    "mileage reimbursement PDF",
    "PDF mileage receipt",
    "business mileage reimbursement",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "IRS Mileage Calculator and PDF Mileage Receipts",
    description:
      "Calculate what your drive is worth and export a clean PDF receipt for expense reports.",
    url: "/",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "IRS Mileage Calculator and PDF Mileage Receipts",
    description:
      "Calculate mileage reimbursement and export a PDF receipt for expenses.",
  },
};

function JsonLd() {
  const currentYear = getCurrentYear();
  const rate = getRateForYear(currentYear);
  const rateLabel = rate?.label ?? "current IRS standard business mileage rate";

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "IRS Mileage Calculator",
    url: "https://irsmileagecalculator.com",
    description: `Instantly calculate what your drive is worth and download a PDF mileage receipt for expense reports. Current ${currentYear} rate: ${rateLabel}/mile.`,
    applicationCategory: "FinanceApplication",
    operatingSystem: "Any",
    isAccessibleForFree: true,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "Calculate driving distance between addresses",
      "IRS standard business mileage rate lookup",
      "Mileage reimbursement calculation",
      "Downloadable PDF mileage receipt for expense reports",
      "Round trip support",
      "Address autocomplete",
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

export default function Home() {
  return (
    <>
      <JsonLd />
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text mb-3">
              What&apos;s your drive worth?
            </h1>
            <p className="text-text-muted text-sm sm:text-base leading-relaxed max-w-md mx-auto">
              Enter your route and get the IRS reimbursement amount, then
              download a PDF receipt for your expense report.
            </p>
          </div>
          <Calculator />
        </div>
      </main>
      <Footer />
    </>
  );
}
