import { normalizeTicker } from "@/lib/db/assets";

export async function fetchYahooAsset(tickerInput: string) {
  const ticker = normalizeTicker(tickerInput);
  const yahooTicker = ticker.includes(".") ? ticker : `${ticker}.SA`;

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooTicker}?interval=1d&range=5y&events=div`;
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "application/json"
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Yahoo Finance request failed with status ${response.status}`);
  }

  const json = (await response.json()) as any;
  const result = json.chart?.result?.[0];
  if (!result) {
    throw new Error("Yahoo Finance response missing result");
  }

  const price = result.meta?.regularMarketPrice ?? null;
  const currency = result.meta?.currency ?? "BRL";
  const name = result.meta?.longName ?? result.meta?.shortName ?? null;

  const rawDividends = result.events?.dividends ?? {};
  const payoutsMap = new Map<number, number>();

  for (const key of Object.keys(rawDividends)) {
    const div = rawDividends[key];
    const amount = div.amount;
    const dateSeconds = div.date;
    if (amount !== undefined && Number.isFinite(amount) && amount >= 0 && dateSeconds) {
      const year = new Date(dateSeconds * 1000).getUTCFullYear();
      payoutsMap.set(year, (payoutsMap.get(year) ?? 0) + amount);
    }
  }

  const payouts = [...payoutsMap.entries()]
    .map(([year, amount]) => ({ year, amount }))
    .sort((a, b) => b.year - a.year);

  return {
    ticker,
    name,
    price,
    currency,
    payouts
  };
}
