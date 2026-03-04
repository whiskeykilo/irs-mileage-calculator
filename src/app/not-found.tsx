import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
          <p className="text-text-muted mb-6">
            This page doesn&apos;t exist. Maybe you were looking for the
            calculator?
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2.5
              text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
          >
            Go to Calculator
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
