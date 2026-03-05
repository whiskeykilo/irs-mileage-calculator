"use client";

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { CalculateResponse } from "@/lib/types";

// Use system fonts that embed without registration (Helvetica is PDF standard)
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
    marginBottom: 6,
  },
  sectionValue: {
    fontSize: 12,
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
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 8,
    color: "#94a3b8",
    textAlign: "center",
  },
});

export type MileageReceiptPdfProps = {
  stops: string[];
  result: CalculateResponse;
  generatedAt: string;
};

export function MileageReceiptPdf({
  stops,
  result,
  generatedAt,
}: MileageReceiptPdfProps) {
  const tripType = result.roundTrip ? "Round trip" : "One way";
  const [origin, ...rest] = stops;
  const destination = rest.length > 0 ? rest[rest.length - 1] : origin;
  const waypoints = rest.slice(0, -1);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Mileage Reimbursement Receipt</Text>
          <Text style={styles.subtitle}>
            IRS standard business mileage rate · {result.year} ·{" "}
            {result.rateLabel}/mile
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Route</Text>
          <Text style={styles.sectionValue}>From: {origin}</Text>
          {waypoints.map((addr, i) => (
            <Text key={i} style={[styles.sectionValue, { marginTop: 6 }]}>
              Stop {i + 1}: {addr}
            </Text>
          ))}
          <Text style={[styles.sectionValue, { marginTop: 6 }]}>
            To: {destination}
          </Text>
          <Text style={[styles.sectionLabel, { marginTop: 8 }]}>
            {tripType}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Calculation</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Driving distance</Text>
            <Text style={styles.rowValue}>
              {result.distanceMiles.toFixed(2)} miles
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>IRS rate ({result.year})</Text>
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
          Generated on {generatedAt} · For expense reporting. Not tax or legal
          advice. Verify with your employer or tax professional.
        </Text>
      </Page>
    </Document>
  );
}
