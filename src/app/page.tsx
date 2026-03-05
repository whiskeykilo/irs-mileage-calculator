import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Calculator } from "@/components/calculator";
import { getCurrentYear, getRateForYear } from "@/lib/irs-rates";

function JsonLd() {
  const currentYear = getCurrentYear();
  const rate = getRateForYear(currentYear);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "IRS Mileage Calculator",
    url: "https://irsmileagecalculator.com",
    description: `Calculate driving distance and IRS mileage reimbursement. Current ${currentYear} IRS rate: ${rate?.label}/mile.`,
    applicationCategory: "FinanceApplication",
    operatingSystem: "Any",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "Calculate driving distance between addresses",
      "IRS standard business mileage rate lookup",
      "Mileage reimbursement calculation",
      "Round trip support",
      "Address autocomplete",
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

export default function Home() {
  return (
    <>
      <JsonLd />
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-xl px-4 py-8 sm:py-12">
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text mb-3">
              Calculate Your IRS Mileage Reimbursement
            </h1>
            <p className="text-text-muted text-sm sm:text-base leading-relaxed max-w-md mx-auto">
              Enter an origin and destination to calculate driving distance and
              reimbursement using the official IRS standard business mileage
              rate.
            </p>
          </div>
          <Calculator />
        </div>
      </main>
      <Footer />
    </>
  );
}
