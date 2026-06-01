import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchBrapiAsset } from "@/lib/brapi/client";

describe("brapi client", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("fetches a normalized ticker with required params and token", async () => {
    vi.stubEnv("BRAPI_TOKEN", "secret-token");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ results: [{ symbol: "TAEE11", regularMarketPrice: 30 }] })
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchBrapiAsset("taee11.sa");

    expect(result).toEqual({ symbol: "TAEE11", regularMarketPrice: 30 });
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, options] = fetchMock.mock.calls[0];
    const requestUrl = new URL(String(url));
    expect(requestUrl.origin + requestUrl.pathname).toBe("https://brapi.dev/api/quote/TAEE11");
    expect(requestUrl.searchParams.get("range")).toBe("5y");
    expect(requestUrl.searchParams.get("interval")).toBe("1d");
    expect(requestUrl.searchParams.get("fundamental")).toBe("true");
    expect(requestUrl.searchParams.get("dividends")).toBe("true");
    expect(requestUrl.searchParams.get("token")).toBe("secret-token");
    expect(options).toMatchObject({ headers: { accept: "application/json" }, cache: "no-store" });
  });

  it("throws on non-ok responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 503 })
    );

    await expect(fetchBrapiAsset("TAEE11")).rejects.toThrow(
      "brapi request failed with status 503"
    );
  });

  it("throws when results are empty or malformed", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ results: [] }) })
    );

    await expect(fetchBrapiAsset("TAEE11")).rejects.toThrow();

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ results: null }) })
    );

    await expect(fetchBrapiAsset("TAEE11")).rejects.toThrow();
  });
});
