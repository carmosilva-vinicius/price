import Database from "better-sqlite3";
import { beforeAll, describe, expect, it } from "vitest";
import { createAssetRepository } from "@/lib/db/assets";
import { ensureSchema } from "@/lib/db/schema";

// Set environment variable to ensure getDatabase creates in-memory database
beforeAll(() => {
  process.env.PRICE_DB_PATH = ":memory:";
});

import { getDatabase } from "@/lib/db/connection";
import {
  getAssetChecklist,
  updateAssetChecklist,
  updateAssetSector
} from "@/lib/services/assets";

describe("checklist and sector tests", () => {
  it("adds the sector column and does not throw on multiple calls", () => {
    const db = new Database(":memory:");
    
    // First call creates schema and adds sector
    ensureSchema(db);
    let columns = db.prepare("PRAGMA table_info(assets)").all() as Array<{ name: string }>;
    let hasSector = columns.some((col) => col.name === "sector");
    expect(hasSector).toBe(true);

    // Second call should not throw
    expect(() => ensureSchema(db)).not.toThrow();
    columns = db.prepare("PRAGMA table_info(assets)").all() as Array<{ name: string }>;
    hasSector = columns.some((col) => col.name === "sector");
    expect(hasSector).toBe(true);
  });

  it("updates sectors, saves checklist rows, and deletes cascades to clean the database", () => {
    const db = new Database(":memory:");
    ensureSchema(db);
    const repo = createAssetRepository(db);

    repo.createAsset("VALE3");
    repo.updateSector("VALE3", "Mineração");
    
    let assets = repo.listAssets();
    expect(assets[0].sector).toBe("Mineração");

    // Save checklist items
    repo.upsertChecklist("VALE3", "profitable", "yes");
    repo.upsertChecklist("VALE3", "stable_debt", "no");

    let checklist = repo.getChecklist("VALE3");
    expect(checklist).toHaveLength(2);
    expect(checklist.find((c) => c.criterionId === "profitable")?.status).toBe("yes");
    expect(checklist.find((c) => c.criterionId === "stable_debt")?.status).toBe("no");

    // Deleting the asset should cascade delete checklist items
    db.prepare("DELETE FROM assets WHERE ticker = ?").run("VALE3");
    checklist = repo.getChecklist("VALE3");
    expect(checklist).toHaveLength(0);
  });

  it("verifies service defaults fallback when checklist hasn't been saved yet", () => {
    const db = getDatabase();
    
    // Clear existing test data
    db.prepare("DELETE FROM asset_checklist").run();
    db.prepare("DELETE FROM assets").run();

    const repo = createAssetRepository(db);
    repo.createAsset("PETR4");

    // Check defaults
    const checklist = getAssetChecklist("PETR4");
    expect(checklist).toHaveLength(3);
    expect(checklist).toEqual([
      { criterionId: "profitable", status: "unsure" },
      { criterionId: "stable_debt", status: "unsure" },
      { criterionId: "sustainable_payout", status: "unsure" }
    ]);

    // Update sector via service
    updateAssetSector("PETR4", "Petróleo");
    const assets = repo.listAssets();
    expect(assets.find((a) => a.ticker === "PETR4")?.sector).toBe("Petróleo");

    // Update checklist via service
    updateAssetChecklist("PETR4", [
      { criterionId: "profitable", status: "yes" },
      { criterionId: "stable_debt", status: "no" }
    ]);

    const updatedChecklist = getAssetChecklist("PETR4");
    expect(updatedChecklist).toEqual([
      { criterionId: "profitable", status: "yes" },
      { criterionId: "stable_debt", status: "no" },
      { criterionId: "sustainable_payout", status: "unsure" }
    ]);
  });
});
