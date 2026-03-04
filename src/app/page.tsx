import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Calculator } from "@/components/calculator";

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-xl px-4 py-8 sm:py-12">
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
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
