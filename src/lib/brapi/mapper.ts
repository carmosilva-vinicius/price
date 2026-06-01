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

function getIsoDateYear(dateText: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateText);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null;
  }

  return year;
}

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
    const rate = dividend.rate;
    if (!dateText || rate === undefined || !Number.isFinite(rate) || rate < 0) {
      continue;
    }

    const year = getIsoDateYear(dateText);
    if (year === null) {
      continue;
    }

    totals.set(year, (totals.get(year) ?? 0) + rate);
  }

  return [...totals.entries()]
    .map(([year, amount]) => ({ ticker, year, amount }))
    .sort((a, b) => b.year - a.year);
}
