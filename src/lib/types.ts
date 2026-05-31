export type DataSource = "api" | "manual";

export type AnnualPayoutInput = {
  year: number;
  amount: number;
};

export type DataState = "complete" | "partial" | "incomplete";
export type EconomicStatus = "discounted" | "near" | "expensive";

export type AssetMetrics = {
  dataState: DataState;
  economicStatus: EconomicStatus | null;
  averageAnnualPayout: number | null;
  ceilingPrice: number | null;
  differencePercent: number | null;
  yearsUsed: number[];
};
