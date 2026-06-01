import { fetchBrapiAsset } from "@/lib/brapi/client";
import {
  mapBrapiDividendsToAnnualPayouts,
  mapBrapiQuote
} from "@/lib/brapi/mapper";
import { createAssetRepository, normalizeTicker } from "@/lib/db/assets";
import { getDatabase } from "@/lib/db/connection";
import { calculateAssetMetrics } from "@/lib/domain/pricing";
import type { DataSource } from "@/lib/types";

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
  const result = await fetchBrapiAsset(ticker);
  const quote = mapBrapiQuote(result);
  const payouts = mapBrapiDividendsToAnnualPayouts(
    ticker,
    result.dividendsData?.cashDividends ?? []
  );
  const assetRepo = repo();

  assetRepo.createAsset(quote.ticker, quote.name);
  assetRepo.upsertQuote({
    ticker: quote.ticker,
    price: quote.price,
    currency: quote.currency,
    source: "api",
    quotedAt: quote.quotedAt
  });

  for (const payout of payouts) {
    assetRepo.upsertAnnualPayout({
      ticker: payout.ticker,
      year: payout.year,
      amount: payout.amount,
      source: "api"
    });
  }

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
