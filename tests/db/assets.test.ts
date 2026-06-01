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
