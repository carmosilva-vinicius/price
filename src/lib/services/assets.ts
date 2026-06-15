import { fetchBrapiAsset } from "@/lib/brapi/client";
import {
  mapBrapiDividendsToAnnualPayouts,
  mapBrapiQuote
} from "@/lib/brapi/mapper";
import { createAssetRepository, normalizeTicker } from "@/lib/db/assets";
import { getDatabase } from "@/lib/db/connection";
import { calculateAssetMetrics } from "@/lib/domain/pricing";
import type { DataSource } from "@/lib/types";
import { fetchYahooAsset } from "@/lib/yahoo/client";

const TARGET_YIELD = 0.06;

function repo() {
  return createAssetRepository(getDatabase());
}

export function listAssetRows() {
  return repo().listAssets().map((asset) => ({
    ...asset,
    metrics: calculateAssetMetrics({
      currentPrice: asset.currentPrice,
      annualPayouts: asset.annualPayouts,
      targetYield: TARGET_YIELD
    })
  }));
}

export function createAsset(ticker: string) {
  return repo().createAsset(ticker);
}

export async function refreshAsset(tickerInput: string) {
  const ticker = normalizeTicker(tickerInput);
  let name: string | null = null;
  let price: number | null = null;
  let currency = "BRL";
  let quotedAt = new Date().toISOString();
  let payouts: Array<{ year: number; amount: number }> = [];
  let yahooSuccess = false;

  // 1. Try to fetch from Yahoo Finance first
  try {
    const yahooData = await fetchYahooAsset(ticker);
    price = yahooData.price;
    currency = yahooData.currency;
    name = yahooData.name;
    payouts = yahooData.payouts;
    yahooSuccess = true;
  } catch (yahooError) {
    console.error("Yahoo Finance primary fetch failed:", yahooError);
  }

  // 2. If Yahoo Finance failed or got no price, fallback to BRAPI
  if (!yahooSuccess || price === null) {
    try {
      const result = await fetchBrapiAsset(ticker);
      const quote = mapBrapiQuote(result);
      name = name ?? quote.name;
      price = price ?? quote.price;
      currency = quote.currency;
      quotedAt = quote.quotedAt;
      
      if (payouts.length === 0) {
        const brapiPayouts = mapBrapiDividendsToAnnualPayouts(
          ticker,
          result.dividendsData?.cashDividends ?? []
        );
        payouts = brapiPayouts.map((payout) => ({
          year: payout.year,
          amount: payout.amount
        }));
      }
    } catch (brapiError) {
      console.error("BRAPI fallback fetch failed:", brapiError);
    }
  }

  // If both failed to get a price, we throw the error so the UI knows
  if (price === null) {
    throw new Error(`Failed to refresh asset ${ticker} from both Yahoo Finance and BRAPI`);
  }

  repo().refreshApiData({
    ticker,
    name,
    quote: {
      price,
      currency,
      quotedAt
    },
    payouts
  });

  return listAssetRows().find((asset) => asset.ticker === ticker) ?? null;
}

export function updateManualQuote(input: { ticker: string; price: number }) {
  repo().upsertQuote({
    ticker: input.ticker,
    price: input.price,
    currency: "BRL",
    source: "manual"
  });
}

export function updateManualPayout(input: {
  ticker: string;
  year: number;
  amount: number;
  source?: DataSource;
}) {
  repo().upsertAnnualPayout({
    ticker: input.ticker,
    year: input.year,
    amount: input.amount,
    source: input.source ?? "manual"
  });
}

export function updateAssetSector(ticker: string, sector: string | null) {
  repo().updateSector(ticker, sector);
}

export type ChecklistItem = {
  criterionId: string;
  status: "yes" | "no" | "unsure";
};

export function getAssetChecklist(ticker: string): ChecklistItem[] {
  const dbChecklist = repo().getChecklist(ticker);
  const defaultCriteria = ["profitable", "stable_debt", "sustainable_payout"];

  return defaultCriteria.map((criterionId) => {
    const matched = dbChecklist.find((item) => item.criterionId === criterionId);
    return {
      criterionId,
      status: matched ? matched.status : "unsure"
    };
  });
}

export function updateAssetChecklist(
  ticker: string,
  checklist: Array<{ criterionId: string; status: "yes" | "no" | "unsure" }>
) {
  const db = getDatabase();
  const repository = repo();

  db.transaction(() => {
    for (const item of checklist) {
      repository.upsertChecklist(ticker, item.criterionId, item.status);
    }
  })();
}

