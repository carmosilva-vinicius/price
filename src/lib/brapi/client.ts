import { z } from "zod";
import type { BrapiQuoteResult } from "@/lib/brapi/mapper";
import { normalizeTicker } from "@/lib/db/assets";

const brapiResponseSchema = z.object({
  results: z.array(z.unknown()).min(1)
});

export async function fetchBrapiAsset(tickerInput: string): Promise<BrapiQuoteResult> {
  const ticker = normalizeTicker(tickerInput);
  const token = process.env.BRAPI_TOKEN;
  const params = new URLSearchParams({
    range: "5y",
    interval: "1d",
    fundamental: "true",
    dividends: "true"
  });

  if (token) {
    params.set("token", token);
  }

  const response = await fetch(`https://brapi.dev/api/quote/${ticker}?${params.toString()}`, {
    headers: { accept: "application/json" },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`brapi request failed with status ${response.status}`);
  }

  const payload = brapiResponseSchema.parse(await response.json());
  return payload.results[0] as BrapiQuoteResult;
}
