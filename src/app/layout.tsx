import type { Metadata } from "next";
import { SpeedInsightsWrapper } from "@/components/speed-insights-wrapper";
import "./globals.css";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://irsmileagecalculator.com";

export const metadata: Metadata = {
  title: {
    default:
      "IRS Mileage Calculator, Instantly Calculate What Your Drive Is Worth",
    template: "%s | IRS Mileage Calculator",
  },
  description:
    "IRS Mileage Calculator with PDF receipt export. Instantly calculate what your drive is worth using official IRS mileage rates, then download a clean expense report PDF.",
  keywords: [
    "IRS mileage calculator",
    "PDF mileage report",
    "mileage expense report",
    "mileage receipt PDF",
    "mileage reimbursement calculator",
    "IRS mileage rate",
    "standard mileage rate",
    "business mileage rate",
    "driving distance calculator",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "IRS Mileage Calculator, Instantly Know What Your Drive Is Worth",
    description:
      "Calculate distance and reimbursement, then download a PDF mileage receipt for expense reporting.",
    url: "/",
    siteName: "IRS Mileage Calculator",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: "IRS Mileage Calculator, Instantly Know What Your Drive Is Worth",
    description:
      "Calculate IRS mileage reimbursement and export a PDF receipt for expense reports.",
  },
  metadataBase: new URL(BASE_URL),
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
};

const themeScript = `
(function(){
  var k='theme';
  var t=localStorage.getItem(k);
  var d=(t==='system'||!t)?window.matchMedia('(prefers-color-scheme: dark)').matches:(t==='dark');
  document.documentElement.classList.toggle('dark',d);
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen flex flex-col bg-surface-alt">
        {children}
        <SpeedInsightsWrapper />
      </body>
    </html>
  );
}
