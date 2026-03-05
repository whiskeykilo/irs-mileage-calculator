"use client";

import dynamic from "next/dynamic";
import { Component, type ReactNode } from "react";

// Use /next subpath so route is set automatically for Next.js (better aggregation in dashboard).
const SpeedInsights = dynamic(
  () => import("@vercel/speed-insights/next").then((m) => m.SpeedInsights),
  { ssr: false },
);

/**
 * Catches errors from Speed Insights (e.g. script blocked by content blocker)
 * so the app doesn't throw and we avoid noisy console messages where possible.
 */
class SpeedInsightsErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    // Script load or runtime error; don't rethrow. Speed Insights is non-essential.
  }

  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}

export function SpeedInsightsWrapper() {
  return (
    <SpeedInsightsErrorBoundary>
      <SpeedInsights />
    </SpeedInsightsErrorBoundary>
  );
}
