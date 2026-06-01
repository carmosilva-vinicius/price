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

  it("maps zero quote price when present", () => {
    const quote = mapBrapiQuote({
      symbol: "TAEE11",
      regularMarketPrice: 0,
      regularMarketTime: "2026-05-31T12:00:00.000Z"
    });

    expect(quote).toMatchObject({
      ticker: "TAEE11",
      price: 0
    });
  });

  it("throws when quote symbol is missing", () => {
    expect(() =>
      mapBrapiQuote({
        regularMarketPrice: 34.12
      })
    ).toThrow("brapi quote result is missing symbol or price");
  });

  it("throws when quote price is missing or non-finite", () => {
    expect(() =>
      mapBrapiQuote({
        symbol: "TAEE11"
      })
    ).toThrow("brapi quote result is missing symbol or price");

    expect(() =>
      mapBrapiQuote({
        symbol: "TAEE11",
        regularMarketPrice: Number.NaN
      })
    ).toThrow("brapi quote result is missing symbol or price");

    expect(() =>
      mapBrapiQuote({
        symbol: "TAEE11",
        regularMarketPrice: Number.POSITIVE_INFINITY
      })
    ).toThrow("brapi quote result is missing symbol or price");
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

  it("skips invalid dividend entries and keeps valid payouts", () => {
    const payouts = mapBrapiDividendsToAnnualPayouts("taee11.sa", [
      { paymentDate: "2025-03-01", rate: 1.1, label: "DIVIDEND" },
      { paymentDate: "invalid", rate: 0.4, label: "JCP" },
      { paymentDate: "2025-08-01", rate: Number.NaN, label: "DIVIDEND" },
      { approvedOn: "2024-04-01", rate: 2, label: "DIVIDEND" },
      { paymentDate: "2023-05-01", label: "DIVIDEND" }
    ]);

    expect(payouts).toEqual([
      { ticker: "TAEE11", year: 2025, amount: 1.1 },
      { ticker: "TAEE11", year: 2024, amount: 2 }
    ]);
  });
});
