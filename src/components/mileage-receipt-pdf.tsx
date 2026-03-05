"use client";

import {
  Document,
  Page,
  Text,
  View,
  Image,
  Link,
  StyleSheet,
} from "@react-pdf/renderer";
import type { CalculateResponse } from "@/lib/types";

const IRS_RATE_URL =
  "https://www.irs.gov/tax-professionals/standard-mileage-rates";
const SITE_URL = "https://irsmileagecalculator.com";

const MARKER_SIZE = 18;
const CONNECTOR_GAP = 6;

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: "Helvetica",
  },
  header: {
    borderBottomWidth: 2,
    borderBottomColor: "#1e40af",
    paddingBottom: 12,
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e40af",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 9,
    color: "#64748b",
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 9,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  routeStop: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  routeTimeline: {
    width: MARKER_SIZE,
    alignItems: "center",
    marginRight: 10,
  },
  routeMarker: {
    width: MARKER_SIZE,
    height: MARKER_SIZE,
    borderRadius: MARKER_SIZE / 2,
    backgroundColor: "#2563eb",
    justifyContent: "center",
    alignItems: "center",
  },
  routeMarkerLetter: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#ffffff",
    fontFamily: "Helvetica",
  },
  routeConnector: {
    width: 0,
    height: CONNECTOR_GAP,
    borderLeftWidth: 1.5,
    borderLeftColor: "#cbd5e1",
    marginVertical: 2,
  },
  routeContent: {
    flex: 1,
    paddingBottom: CONNECTOR_GAP + 4,
  },
  routeContentLast: {
    paddingBottom: 0,
  },
  routeLabel: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#64748b",
    marginBottom: 1,
  },
  routeAddress: {
    fontSize: 11,
    color: "#0f172a",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowLabel: {
    fontSize: 10,
    color: "#64748b",
  },
  rowValue: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#0f172a",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: "#1e40af",
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#0f172a",
  },
  totalValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1e40af",
  },
  mapSection: {
    marginBottom: 20,
  },
  mapImage: {
    width: "100%",
    borderRadius: 6,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 8,
    color: "#94a3b8",
    textAlign: "center",
  },
  link: {
    color: "#1e40af",
    textDecoration: "none",
  },
});

export type MileageReceiptPdfProps = {
  stops: string[];
  result: CalculateResponse;
  /** Trip date in YYYY-MM-DD; shown on receipt for expense evidence. */
  tripDate: string;
  generatedAt: string;
  mapImageUri?: string | null;
};

function formatTripDate(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("en-US", { dateStyle: "long" });
}

const WAYPOINT_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function stopLabel(index: number, total: number): string {
  if (index === 0) return "Start";
  if (index === total - 1) return "End";
  return `Stop ${index}`;
}

export function MileageReceiptPdf({
  stops,
  result,
  tripDate,
  generatedAt,
  mapImageUri,
}: MileageReceiptPdfProps) {
  const routeHeading = result.roundTrip ? "ROUND TRIP ROUTE" : "ONE WAY ROUTE";
  const isLast = (i: number) => i === stops.length - 1;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Mileage Reimbursement Receipt</Text>
          <Text style={styles.subtitle}>
            Trip date: {formatTripDate(tripDate)}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{routeHeading}</Text>
          {stops.map((addr, i) => (
            <View key={i} style={styles.routeStop}>
              <View style={styles.routeTimeline}>
                <View style={styles.routeMarker}>
                  <Text style={styles.routeMarkerLetter}>
                    {WAYPOINT_LETTERS[i] ?? String(i + 1)}
                  </Text>
                </View>
                {!isLast(i) && <View style={styles.routeConnector} />}
              </View>
              <View
                style={
                  isLast(i)
                    ? [styles.routeContent, styles.routeContentLast]
                    : styles.routeContent
                }
              >
                <Text style={styles.routeLabel}>
                  {stopLabel(i, stops.length)}
                </Text>
                <Text style={styles.routeAddress}>{addr}</Text>
              </View>
            </View>
          ))}
        </View>

        {mapImageUri && (
          <View style={styles.mapSection}>
            <Text style={styles.sectionLabel}>Route Map</Text>
            <Image src={mapImageUri} style={styles.mapImage} />
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Calculation</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Driving distance</Text>
            <Text style={styles.rowValue}>
              {result.distanceMiles.toFixed(2)} miles
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>
              <Link src={IRS_RATE_URL} style={styles.link}>
                IRS rate ({result.year})
              </Link>
            </Text>
            <Text style={styles.rowValue}>
              ${result.rate.toFixed(3)}/mile ({result.rateLabel}/mi)
            </Text>
          </View>
          <View style={[styles.row, styles.rowLast]}>
            <Text style={styles.rowLabel}>Calculation</Text>
            <Text style={styles.rowValue}>
              {result.distanceMiles.toFixed(2)} × ${result.rate.toFixed(3)}
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Reimbursement amount</Text>
            <Text style={styles.totalValue}>
              ${result.reimbursement.toFixed(2)}
            </Text>
          </View>
        </View>

        <Text style={styles.footer}>
          Generated on {generatedAt} at{" "}
          <Link src={SITE_URL} style={styles.link}>
            irsmileagecalculator.com
          </Link>{" "}
          · For expense reporting. Not tax or legal advice. Verify with your
          employer or tax professional.
        </Text>
      </Page>
    </Document>
  );
}
