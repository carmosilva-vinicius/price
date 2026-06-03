import type Database from "better-sqlite3";
import type { DataSource } from "@/lib/types";

export type StoredAnnualPayout = {
  year: number;
  amount: number;
  source: DataSource;
};

export type StoredAsset = {
  ticker: string;
  name: string | null;
  currentPrice: number | null;
  currency: string | null;
  quoteSource: DataSource | null;
  updatedAt: string;
  annualPayouts: StoredAnnualPayout[];
};

export type ApiRefreshInput = {
  ticker: string;
  name: string | null;
  quote: {
    price: number;
    currency: string;
    quotedAt: string;
  };
  payouts: Array<{
    year: number;
    amount: number;
  }>;
};

export function normalizeTicker(ticker: string) {
  return ticker.trim().toUpperCase().replace(/\.SA$/, "");
}

export function createAssetRepository(db: Database.Database) {
  function createAsset(tickerInput: string, name: string | null = null) {
    const ticker = normalizeTicker(tickerInput);
    const now = new Date().toISOString();
    db.prepare(
      `INSERT INTO assets (ticker, name, created_at, updated_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(ticker) DO UPDATE SET name = COALESCE(excluded.name, assets.name), updated_at = excluded.updated_at`
    ).run(ticker, name, now, now);
    return ticker;
  }

  function upsertQuote(input: {
    ticker: string;
    price: number;
    currency: string;
    source: DataSource;
    quotedAt?: string;
  }) {
    const ticker = normalizeTicker(input.ticker);
    const now = new Date().toISOString();
    createAsset(ticker);
    db.prepare(
      `INSERT INTO quotes (ticker, price, currency, source, quoted_at, captured_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(ticker) DO UPDATE SET
         price = excluded.price,
         currency = excluded.currency,
         source = excluded.source,
         quoted_at = excluded.quoted_at,
         captured_at = excluded.captured_at`
    ).run(ticker, input.price, input.currency, input.source, input.quotedAt ?? now, now);
    db.prepare(`UPDATE assets SET updated_at = ? WHERE ticker = ?`).run(now, ticker);
  }

  function upsertAnnualPayout(input: {
    ticker: string;
    year: number;
    amount: number;
    source: DataSource;
  }) {
    const ticker = normalizeTicker(input.ticker);
    const now = new Date().toISOString();
    createAsset(ticker);
    db.prepare(
      `INSERT INTO annual_payouts (ticker, year, amount, source, updated_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(ticker, year) DO UPDATE SET
         amount = excluded.amount,
         source = excluded.source,
         updated_at = excluded.updated_at`
    ).run(ticker, input.year, input.amount, input.source, now);
    db.prepare(`UPDATE assets SET updated_at = ? WHERE ticker = ?`).run(now, ticker);
  }

  const refreshApiDataTransaction = db.transaction((input: ApiRefreshInput) => {
    const ticker = normalizeTicker(input.ticker);
    const now = new Date().toISOString();

    createAsset(ticker, input.name);

    const quoteRow = db
      .prepare(`SELECT source FROM quotes WHERE ticker = ?`)
      .get(ticker) as { source: DataSource } | undefined;

    if (quoteRow?.source !== "manual") {
      db.prepare(
        `INSERT INTO quotes (ticker, price, currency, source, quoted_at, captured_at)
         VALUES (?, ?, ?, 'api', ?, ?)
         ON CONFLICT(ticker) DO UPDATE SET
           price = excluded.price,
           currency = excluded.currency,
           source = excluded.source,
           quoted_at = excluded.quoted_at,
           captured_at = excluded.captured_at`
      ).run(ticker, input.quote.price, input.quote.currency, input.quote.quotedAt, now);
    }

    db.prepare(`DELETE FROM annual_payouts WHERE ticker = ? AND source = 'api'`).run(ticker);

    const manualYears = new Set(
      (
        db
          .prepare(`SELECT year FROM annual_payouts WHERE ticker = ? AND source = 'manual'`)
          .all(ticker) as Array<{ year: number }>
      ).map((row) => row.year)
    );

    const insertPayout = db.prepare(
      `INSERT INTO annual_payouts (ticker, year, amount, source, updated_at)
       VALUES (?, ?, ?, 'api', ?)`
    );

    for (const payout of input.payouts) {
      if (!manualYears.has(payout.year)) {
        insertPayout.run(ticker, payout.year, payout.amount, now);
      }
    }

    db.prepare(`UPDATE assets SET updated_at = ? WHERE ticker = ?`).run(now, ticker);
  });

  function refreshApiData(input: ApiRefreshInput) {
    refreshApiDataTransaction(input);
  }

  function listAssets(): StoredAsset[] {
    const assetRows = db
      .prepare(
        `SELECT
           a.ticker,
           a.name,
           a.updated_at as updatedAt,
           q.price as currentPrice,
           q.currency,
           q.source as quoteSource
         FROM assets a
         LEFT JOIN quotes q ON q.ticker = a.ticker
         ORDER BY a.ticker ASC`
      )
      .all() as Omit<StoredAsset, "annualPayouts">[];

    const payoutStatement = db.prepare(
      `SELECT year, amount, source FROM annual_payouts WHERE ticker = ? ORDER BY year DESC`
    );

    return assetRows.map((asset) => ({
      ...asset,
      annualPayouts: payoutStatement.all(asset.ticker) as StoredAnnualPayout[]
    }));
  }

  return {
    createAsset,
    upsertQuote,
    upsertAnnualPayout,
    refreshApiData,
    listAssets
  };
}
