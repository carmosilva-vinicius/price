import type { AnnualPayoutInput, AssetMetrics, EconomicStatus } from "@/lib/types";

const DEFAULT_TARGET_YIELD = 0.06;
const NEAR_LIMIT = 1.05;

export function summarizeAnnualPayouts(
  annualPayouts: AnnualPayoutInput[],
  maxYears = 5
) {
  const positivePayouts = annualPayouts
    .filter((payout) => Number.isFinite(payout.amount) && payout.amount > 0)
    .sort((a, b) => b.year - a.year)
    .slice(0, maxYears);

  const total = positivePayouts.reduce((sum, payout) => sum + payout.amount, 0);
  const averageAnnualPayout =
    positivePayouts.length > 0 ? total / positivePayouts.length : null;

  return {
    yearsUsed: positivePayouts.map((payout) => payout.year),
    averageAnnualPayout,
    isPartial: positivePayouts.length > 0 && positivePayouts.length < maxYears
  };
}

export function classifyAsset(input: {
  currentPrice: number;
  ceilingPrice: number;
}): EconomicStatus {
  if (input.currentPrice < input.ceilingPrice) {
    return "discounted";
  }

  if (input.currentPrice <= input.ceilingPrice * NEAR_LIMIT) {
    return "near";
  }

  return "expensive";
}

export function calculateAssetMetrics(input: {
  currentPrice: number | null;
  annualPayouts: AnnualPayoutInput[];
  targetYield?: number;
}): AssetMetrics {
  const targetYield = input.targetYield ?? DEFAULT_TARGET_YIELD;
  const summary = summarizeAnnualPayouts(input.annualPayouts);

  if (
    input.currentPrice === null ||
    !Number.isFinite(input.currentPrice) ||
    input.currentPrice <= 0 ||
    summary.averageAnnualPayout === null ||
    targetYield <= 0
  ) {
    return {
      dataState: "incomplete",
      economicStatus: null,
      averageAnnualPayout: summary.averageAnnualPayout,
      ceilingPrice: null,
      differencePercent: null,
      yearsUsed: summary.yearsUsed
    };
  }

  const ceilingPrice = summary.averageAnnualPayout / targetYield;
  const economicStatus = classifyAsset({
    currentPrice: input.currentPrice,
    ceilingPrice
  });

  return {
    dataState: summary.isPartial ? "partial" : "complete",
    economicStatus,
    averageAnnualPayout: summary.averageAnnualPayout,
    ceilingPrice,
    differencePercent: (input.currentPrice - ceilingPrice) / ceilingPrice,
    yearsUsed: summary.yearsUsed
  };
}
