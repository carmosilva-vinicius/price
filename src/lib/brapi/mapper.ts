import { normalizeTicker } from "@/lib/db/assets";

export type BrapiQuoteResult = {
  symbol?: string;
  shortName?: string;
  regularMarketPrice?: number;
  currency?: string;
  regularMarketTime?: string;
  dividendsData?: {
    cashDividends?: BrapiDividend[];
  };
};

export type BrapiDividend = {
  paymentDate?: string;
  approvedOn?: string;
  rate?: number;
  label?: string;
};

export function mapBrapiQuote(result: BrapiQuoteResult) {
  if (
    !result.symbol ||
    result.regularMarketPrice === undefined ||
    !Number.isFinite(result.regularMarketPrice)
  ) {
    throw new Error("brapi quote result is missing symbol or price");
  }

  return {
    ticker: normalizeTicker(result.symbol),
    name: result.shortName ?? null,
    price: result.regularMarketPrice,
    currency: result.currency ?? "BRL",
    quotedAt: result.regularMarketTime ?? new Date().toISOString()
  };
}

export function mapBrapiDividendsToAnnualPayouts(
  tickerInput: string,
  dividends: BrapiDividend[]
) {
  const ticker = normalizeTicker(tickerInput);
  const totals = new Map<number, number>();

  for (const dividend of dividends) {
    const dateText = dividend.paymentDate ?? dividend.approvedOn;
    if (!dateText || !Number.isFinite(dividend.rate) || dividend.rate === undefined) {
      continue;
    }

    const year = new Date(dateText).getUTCFullYear();
    if (!Number.isFinite(year)) {
      continue;
    }

    totals.set(year, (totals.get(year) ?? 0) + dividend.rate);
  }

  return [...totals.entries()]
    .map(([year, amount]) => ({ ticker, year, amount }))
    .sort((a, b) => b.year - a.year);
}
