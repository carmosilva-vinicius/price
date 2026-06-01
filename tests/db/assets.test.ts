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
});
