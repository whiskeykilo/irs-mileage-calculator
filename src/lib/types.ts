export type CalculateRequest = {
  origin: string;
  destination: string;
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
};

export type RouteResult = {
  distanceMeters: number;
  distanceMiles: number;
  durationSeconds: number;
  summary: string;
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
