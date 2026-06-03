import Database from "better-sqlite3";
import { describe, expect, it } from "vitest";
import { createAssetRepository } from "@/lib/db/assets";
import { ensureSchema } from "@/lib/db/schema";

describe("asset repository", () => {
  it("creates an asset and returns calculated rows", () => {
    const db = new Database(":memory:");
    ensureSchema(db);
    const repo = createAssetRepository(db);

    repo.createAsset("taee11");
    repo.upsertQuote({ ticker: "TAEE11", price: 34, currency: "BRL", source: "manual" });
    repo.upsertAnnualPayout({ ticker: "TAEE11", year: 2025, amount: 2.4, source: "manual" });

    const assets = repo.listAssets();

    expect(assets).toHaveLength(1);
    expect(assets[0].ticker).toBe("TAEE11");
    expect(assets[0].currentPrice).toBe(34);
    expect(assets[0].annualPayouts).toEqual([{ year: 2025, amount: 2.4, source: "manual" }]);
  });

  it("enables sqlite foreign key enforcement", () => {
    const db = new Database(":memory:");
    ensureSchema(db);

    expect(db.pragma("foreign_keys", { simple: true })).toBe(1);
    expect(() =>
      db
        .prepare(
          `INSERT INTO quotes (ticker, price, currency, source, quoted_at, captured_at)
           VALUES (?, ?, ?, ?, ?, ?)`
        )
        .run("MISSING3", 10, "BRL", "manual", new Date().toISOString(), new Date().toISOString())
    ).toThrow();
  });

  it("allows repository methods to be destructured", () => {
    const db = new Database(":memory:");
    ensureSchema(db);
    const { listAssets, upsertAnnualPayout, upsertQuote } = createAssetRepository(db);

    upsertQuote({ ticker: "bbse3.sa", price: 40, currency: "BRL", source: "manual" });
    upsertAnnualPayout({ ticker: "BBSE3", year: 2025, amount: 3, source: "manual" });

    expect(listAssets()[0]).toMatchObject({
      ticker: "BBSE3",
      currentPrice: 40,
      annualPayouts: [{ year: 2025, amount: 3, source: "manual" }]
    });
  });
});

it("refreshes api data without overwriting manual overrides", () => {
  const db = new Database(":memory:");
  ensureSchema(db);
  const repo = createAssetRepository(db);

  repo.upsertQuote({ ticker: "TAEE11", price: 10, currency: "BRL", source: "manual" });
  repo.upsertAnnualPayout({ ticker: "TAEE11", year: 2025, amount: 1.5, source: "manual" });
  repo.upsertAnnualPayout({ ticker: "TAEE11", year: 2024, amount: 2, source: "api" });

  repo.refreshApiData({
    ticker: "TAEE11",
    name: "TAESA",
    quote: { price: 20, currency: "BRL", quotedAt: "2026-01-01T00:00:00.000Z" },
    payouts: [
      { year: 2025, amount: 9 },
      { year: 2023, amount: 3 }
    ]
  });

  expect(repo.listAssets()[0]).toMatchObject({
    ticker: "TAEE11",
    name: "TAESA",
    currentPrice: 10,
    quoteSource: "manual",
    annualPayouts: [
      { year: 2025, amount: 1.5, source: "manual" },
      { year: 2023, amount: 3, source: "api" }
    ]
  });
});
