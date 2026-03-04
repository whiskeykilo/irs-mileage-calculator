import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "IRS Mileage Calculator - Calculate Your Mileage Reimbursement",
    template: "%s | IRS Mileage Calculator",
  },
  description:
    "Free IRS mileage calculator. Enter origin and destination to calculate driving distance and mileage reimbursement using official IRS standard business mileage rates.",
  keywords: [
    "IRS mileage calculator",
    "mileage reimbursement calculator",
    "IRS mileage rate",
    "standard mileage rate",
    "business mileage rate",
    "mileage deduction calculator",
    "driving distance calculator",
  ],
  openGraph: {
    title: "IRS Mileage Calculator",
    description:
      "Calculate driving distance and IRS mileage reimbursement between any two addresses.",
    url: "https://irsmileagecalculator.com",
    siteName: "IRS Mileage Calculator",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "IRS Mileage Calculator",
    description:
      "Calculate driving distance and IRS mileage reimbursement between any two addresses.",
  },
  metadataBase: new URL("https://irsmileagecalculator.com"),
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-surface-alt">
        {children}
      </body>
    </html>
  );
}
