import { ImageResponse } from "next/og";

export const alt =
  "IRS Mileage Calculator - Calculate what your drive is worth and export a PDF receipt for expense reports.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const dollarSvg = (
  <svg
    width="80"
    height="80"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#2563eb"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" x2="12" y1="2" y2="22" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #f8fafc 0%, #e0e7ff 50%, #dbeafe 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "white",
            borderRadius: "16px",
            padding: "48px 64px",
            boxShadow: "0 4px 24px rgba(30, 64, 175, 0.12)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "120px",
              height: "120px",
              background: "#eff6ff",
              borderRadius: "50%",
              marginBottom: "24px",
            }}
          >
            {dollarSvg}
          </div>
          <div
            style={{
              fontSize: "42px",
              fontWeight: 700,
              color: "#0f172a",
              marginBottom: "12px",
              textAlign: "center",
            }}
          >
            IRS Mileage Calculator
          </div>
          <div
            style={{
              fontSize: "24px",
              color: "#64748b",
              textAlign: "center",
              maxWidth: "520px",
              lineHeight: 1.4,
            }}
          >
            Calculate what your drive is worth and export a PDF receipt for
            expense reports.
          </div>
          <div
            style={{
              fontSize: "18px",
              color: "#2563eb",
              marginTop: "20px",
              fontWeight: 600,
            }}
          >
            irsmileagecalculator.com
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
