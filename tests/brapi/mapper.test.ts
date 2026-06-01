import { describe, expect, it } from "vitest";
import { mapBrapiDividendsToAnnualPayouts, mapBrapiQuote } from "@/lib/brapi/mapper";

describe("brapi mapper", () => {
  it("maps quote data from a brapi result", () => {
    const quote = mapBrapiQuote({
      symbol: "TAEE11",
      shortName: "TAESA",
      regularMarketPrice: 34.12,
      currency: "BRL",
      regularMarketTime: "2026-05-31T12:00:00.000Z"
    });

    expect(quote).toEqual({
      ticker: "TAEE11",
      name: "TAESA",
      price: 34.12,
      currency: "BRL",
      quotedAt: "2026-05-31T12:00:00.000Z"
    });
  });

  it("consolidates dividends and JCP by payment year", () => {
    const payouts = mapBrapiDividendsToAnnualPayouts("TAEE11", [
      { paymentDate: "2025-03-01", rate: 1.1, label: "DIVIDEND" },
      { paymentDate: "2025-08-01", rate: 0.4, label: "JCP" },
      { paymentDate: "2024-04-01", rate: 2, label: "DIVIDEND" }
    ]);

    expect(payouts).toEqual([
      { ticker: "TAEE11", year: 2025, amount: 1.5 },
      { ticker: "TAEE11", year: 2024, amount: 2 }
    ]);
  });
});
