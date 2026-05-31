import { describe, expect, it } from "vitest";
import {
  calculateAssetMetrics,
  classifyAsset,
  summarizeAnnualPayouts
} from "@/lib/domain/pricing";

describe("pricing rules", () => {
  it("calculates average annual payouts and ceiling price from five years", () => {
    const summary = summarizeAnnualPayouts([
      { year: 2021, amount: 2 },
      { year: 2022, amount: 2.5 },
      { year: 2023, amount: 3 },
      { year: 2024, amount: 3.5 },
      { year: 2025, amount: 4 }
    ]);

    expect(summary.yearsUsed).toEqual([2025, 2024, 2023, 2022, 2021]);
    expect(summary.averageAnnualPayout).toBeCloseTo(3);
    expect(summary.isPartial).toBe(false);
  });

  it("marks metrics as partial when fewer than five years are available", () => {
    const metrics = calculateAssetMetrics({
      currentPrice: 20,
      annualPayouts: [
        { year: 2024, amount: 1.2 },
        { year: 2025, amount: 1.5 }
      ],
      targetYield: 0.06
    });

    expect(metrics.dataState).toBe("partial");
    expect(metrics.ceilingPrice).toBeCloseTo(22.5);
    expect(metrics.economicStatus).toBe("discounted");
  });

  it("marks metrics as incomplete without quote or payout data", () => {
    expect(
      calculateAssetMetrics({
        currentPrice: null,
        annualPayouts: [{ year: 2025, amount: 1 }],
        targetYield: 0.06
      }).dataState
    ).toBe("incomplete");

    expect(
      calculateAssetMetrics({
        currentPrice: 10,
        annualPayouts: [],
        targetYield: 0.06
      }).dataState
    ).toBe("incomplete");
  });

  it("classifies discounted, near, and expensive prices", () => {
    expect(classifyAsset({ currentPrice: 29, ceilingPrice: 30 })).toBe("discounted");
    expect(classifyAsset({ currentPrice: 31.5, ceilingPrice: 30 })).toBe("near");
    expect(classifyAsset({ currentPrice: 31.51, ceilingPrice: 30 })).toBe("expensive");
  });
});
