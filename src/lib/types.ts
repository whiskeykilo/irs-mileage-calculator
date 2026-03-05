/**
 * Max stops = origin + waypoints + destination.
 * We cap at 12 (10 waypoints between start and end) for a reasonable UI and to stay well under the Directions API limit (25 waypoints).
 */
export const MAX_STOPS = 12;

/** Ordered stops: first = origin, last = destination, middle = waypoints. Min length 2, max MAX_STOPS. */
export type CalculateRequest = {
  stops: string[];
  year: number;
  roundTrip: boolean;
};

export type CalculateResponse = {
  distanceMiles: number;
  rate: number;
  rateLabel: string;
  reimbursement: number;
  roundTrip: boolean;
  year: number;
  cached: boolean;
  overviewPolyline: string;
};

export type RouteResult = {
  distanceMeters: number;
  distanceMiles: number;
  durationSeconds: number;
  summary: string;
  overviewPolyline: string;
};

export type RoutingError = {
  code:
  | "INVALID_ADDRESS"
  | "NO_ROUTE"
  | "QUOTA_EXCEEDED"
  | "AUTH_ERROR"
  | "PROVIDER_ERROR";
  message: string;
};
