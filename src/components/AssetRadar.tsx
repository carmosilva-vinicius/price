"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "@/app/page.module.css";
import { ChecklistModal } from "@/components/ChecklistModal";

type AssetRow = {
  ticker: string;
  name: string | null;
  currentPrice: number | null;
  currency: string | null;
  quoteSource: "api" | "manual" | null;
  updatedAt: string;
  sector: string | null;
  annualPayouts: { year: number; amount: number; source: "api" | "manual" }[];
  metrics: {
    dataState: "complete" | "partial" | "incomplete";
    economicStatus: "discounted" | "near" | "expensive" | null;
    averageAnnualPayout: number | null;
    ceilingPrice: number | null;
    differencePercent: number | null;
    yearsUsed: number[];
  };
};

function money(value: number | null) {
  if (value === null) {
    return "-";
  }
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(value);
}

function percent(value: number | null) {
  if (value === null) {
    return "-";
  }
  return new Intl.NumberFormat("pt-BR", {
    style: "percent",
    maximumFractionDigits: 1
  }).format(value);
}

function statusLabel(asset: AssetRow) {
  if (asset.metrics.dataState === "incomplete") {
    return "Dados incompletos";
  }

  const economic =
    asset.metrics.economicStatus === "discounted"
      ? "Descontada"
      : asset.metrics.economicStatus === "near"
        ? "Proxima"
        : "Cara";

  return asset.metrics.dataState === "partial" ? `${economic} | dados parciais` : economic;
}

function statusClass(asset: AssetRow) {
  if (asset.metrics.dataState === "incomplete") {
    return styles.statusIncomplete;
  }
  if (asset.metrics.economicStatus === "discounted") {
    return styles.statusDiscounted;
  }
  if (asset.metrics.economicStatus === "near") {
    return styles.statusNear;
  }
  return styles.statusExpensive;
}

export function AssetRadar({ initialAssets }: { initialAssets: AssetRow[] }) {
  const [assets, setAssets] = useState(initialAssets);
  const [ticker, setTicker] = useState("");
  const [filter, setFilter] = useState("all");
  const [message, setMessage] = useState<string | null>(null);
  const [busyTickers, setBusyTickers] = useState<Set<string>>(() => new Set());
  const [isCreating, setIsCreating] = useState(false);
  const busyTickersRef = useRef<Set<string>>(new Set());
  const isCreatingRef = useRef(false);
  const manualSaveSequenceRef = useRef(0);
  const [quoteDrafts, setQuoteDrafts] = useState<Record<string, string>>({});
  const [payoutDrafts, setPayoutDrafts] = useState<Record<string, string>>({});
  const [selectedAssetForChecklist, setSelectedAssetForChecklist] = useState<AssetRow | null>(null);

  const normalizedTicker = ticker.trim();

  useEffect(() => {
    const nextQuoteDrafts: Record<string, string> = {};
    const nextPayoutDrafts: Record<string, string> = {};

    for (const asset of assets) {
      nextQuoteDrafts[asset.ticker] = asset.currentPrice?.toString() ?? "";
      for (const payout of asset.annualPayouts) {
        nextPayoutDrafts[`${asset.ticker}:${payout.year}`] = payout.amount.toString();
      }
    }

    setQuoteDrafts(nextQuoteDrafts);
    setPayoutDrafts(nextPayoutDrafts);
  }, [assets]);

  const visibleAssets = useMemo(() => {
    if (filter === "all") {
      return assets;
    }
    return assets.filter((asset) => {
      if (filter === "incomplete") {
        return asset.metrics.dataState === "incomplete";
      }
      return asset.metrics.economicStatus === filter;
    });
  }, [assets, filter]);

  async function loadAssets() {
    const response = await fetch("/api/assets");
    if (!response.ok) {
      throw new Error("Nao foi possivel carregar os ativos.");
    }
    const payload = (await response.json()) as { assets: AssetRow[] };
    setAssets(payload.assets);
  }

  async function createAsset() {
    if (isCreatingRef.current || normalizedTicker.length === 0) {
      return;
    }

    isCreatingRef.current = true;
    setMessage(null);
    setIsCreating(true);

    try {
      const response = await fetch("/api/assets", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ticker: normalizedTicker })
      });
      const payload = await response.json();

      if (!response.ok) {
        setMessage(payload.error ?? "Nao foi possivel adicionar o ativo.");
        return;
      }

      setAssets(payload.assets);
      setTicker("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Nao foi possivel adicionar o ativo.");
    } finally {
      isCreatingRef.current = false;
      setIsCreating(false);
    }
  }

  async function refreshAsset(assetTicker: string) {
    if (busyTickersRef.current.has(assetTicker)) {
      return;
    }

    busyTickersRef.current.add(assetTicker);
    setBusyTickers((current) => new Set(current).add(assetTicker));
    setMessage(null);

    try {
      const response = await fetch(`/api/assets/${assetTicker}/refresh`, { method: "POST" });

      if (!response.ok) {
        const payload = await response.json();
        setMessage(`Falha ao atualizar ${assetTicker}: ${payload.error}`);
        return;
      }

      await loadAssets();
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Erro inesperado";
      setMessage(`Falha ao atualizar ${assetTicker}: ${detail}`);
    } finally {
      busyTickersRef.current.delete(assetTicker);
      setBusyTickers((current) => {
        const next = new Set(current);
        next.delete(assetTicker);
        return next;
      });
    }
  }

  async function saveManualQuote(assetTicker: string, value: string) {
    const price = Number(value.replace(",", "."));
    if (!Number.isFinite(price) || price <= 0) {
      setMessage("Cotacao manual invalida.");
      return;
    }

    const sequence = ++manualSaveSequenceRef.current;

    try {
      const response = await fetch(`/api/assets/${assetTicker}/quote`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ price })
      });
      const payload = await response.json();

      if (!response.ok) {
        setMessage(payload.error ?? "Nao foi possivel salvar a cotacao.");
        return;
      }

      if (sequence === manualSaveSequenceRef.current) {
        await loadAssets();
        setMessage(null);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Nao foi possivel salvar a cotacao.");
    }
  }

  async function saveManualPayout(assetTicker: string, year: number, value: string) {
    const amount = Number(value.replace(",", "."));
    if (!Number.isFinite(amount) || amount < 0) {
      setMessage("Provento manual invalido.");
      return;
    }

    const sequence = ++manualSaveSequenceRef.current;

    try {
      const response = await fetch(`/api/assets/${assetTicker}/payouts`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ year, amount })
      });
      const payload = await response.json();

      if (!response.ok) {
        setMessage(payload.error ?? "Nao foi possivel salvar o provento.");
        return;
      }

      if (sequence === manualSaveSequenceRef.current) {
        await loadAssets();
        setMessage(null);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Nao foi possivel salvar o provento.");
    }
  }

  return (
    <section className={styles.tool}>
      <div className={styles.toolbar}>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void createAsset();
          }}
        >
          <input
            value={ticker}
            onChange={(event) => setTicker(event.target.value)}
            placeholder="TAEE11"
            aria-label="Ticker"
          />
          <button type="submit" disabled={isCreating || normalizedTicker.length === 0}>
            {isCreating ? "Adicionando" : "Adicionar"}
          </button>
        </form>
        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          aria-label="Filtrar ativos por status"
        >
          <option value="all">Todos</option>
          <option value="discounted">Descontadas</option>
          <option value="near">Proximas</option>
          <option value="expensive">Caras</option>
          <option value="incomplete">Incompletos</option>
        </select>
      </div>

      {message ? (
        <p className={styles.message} role="status" aria-live="polite">
          {message}
        </p>
      ) : null}

      <div className={styles.tableWrap}>
        <table>
          <thead>
            <tr>
              <th>Ativo</th>
              <th>Cotacao</th>
              <th>Media 5 anos</th>
              <th>Preco-teto</th>
              <th>Diferenca</th>
              <th>Status</th>
              <th>Origem</th>
              <th>Atualizacao</th>
              <th>Qualitativo</th>
              <th>Acoes</th>
            </tr>
          </thead>
          <tbody>
            {visibleAssets.map((asset) => (
              <tr key={asset.ticker}>
                <td>
                  <strong>{asset.ticker}</strong>
                  {asset.name ? <span>{asset.name}</span> : null}
                </td>
                <td>
                  <input
                    className={styles.cellInput}
                    inputMode="decimal"
                    value={quoteDrafts[asset.ticker] ?? ""}
                    onChange={(event) =>
                      setQuoteDrafts((current) => ({
                        ...current,
                        [asset.ticker]: event.target.value
                      }))
                    }
                    onBlur={(event) => void saveManualQuote(asset.ticker, event.target.value)}
                    aria-label={`Cotacao manual de ${asset.ticker}`}
                  />
                </td>
                <td>{money(asset.metrics.averageAnnualPayout)}</td>
                <td>{money(asset.metrics.ceilingPrice)}</td>
                <td>{percent(asset.metrics.differencePercent)}</td>
                <td>
                  <span className={`${styles.status} ${statusClass(asset)}`}>
                    {statusLabel(asset)}
                  </span>
                </td>
                <td>{asset.quoteSource ?? "-"}</td>
                <td>{new Date(asset.updatedAt).toLocaleString("pt-BR")}</td>
                <td>
                  <button
                    type="button"
                    onClick={() => setSelectedAssetForChecklist(asset)}
                  >
                    Checklist
                  </button>
                </td>
                <td>
                  <details className={styles.payoutEditor}>
                    <summary>Dividendos</summary>
                    {[0, 1, 2, 3, 4].map((offset) => {
                      const year = new Date().getFullYear() - offset;
                      const payout = asset.annualPayouts.find((item) => item.year === year);
                      return (
                        <label key={year}>
                          {year}
                          <input
                            inputMode="decimal"
                            value={payoutDrafts[`${asset.ticker}:${year}`] ?? ""}
                            onChange={(event) =>
                              setPayoutDrafts((current) => ({
                                ...current,
                                [`${asset.ticker}:${year}`]: event.target.value
                              }))
                            }
                            onBlur={(event) =>
                              void saveManualPayout(asset.ticker, year, event.target.value)
                            }
                            aria-label={`Provento manual de ${asset.ticker} em ${year}`}
                          />
                        </label>
                      );
                    })}
                  </details>
                  <button
                    type="button"
                    disabled={busyTickers.has(asset.ticker)}
                    onClick={() => void refreshAsset(asset.ticker)}
                  >
                    {busyTickers.has(asset.ticker) ? "Atualizando" : "Atualizar"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selectedAssetForChecklist && (
        <ChecklistModal
          ticker={selectedAssetForChecklist.ticker}
          companyName={selectedAssetForChecklist.name}
          currentSector={selectedAssetForChecklist.sector}
          onClose={() => setSelectedAssetForChecklist(null)}
          onSave={(updatedAssets) => {
            setAssets(updatedAssets);
            setSelectedAssetForChecklist(null);
          }}
        />
      )}
    </section>
  );
}
