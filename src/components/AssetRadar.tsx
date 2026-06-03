"use client";

import { useMemo, useState } from "react";
import styles from "@/app/page.module.css";

type AssetRow = {
  ticker: string;
  name: string | null;
  currentPrice: number | null;
  currency: string | null;
  quoteSource: "api" | "manual" | null;
  updatedAt: string;
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
  const [busyTicker, setBusyTicker] = useState<string | null>(null);

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
    const payload = (await response.json()) as { assets: AssetRow[] };
    setAssets(payload.assets);
  }

  async function createAsset() {
    setMessage(null);
    const response = await fetch("/api/assets", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ticker })
    });
    const payload = await response.json();

    if (!response.ok) {
      setMessage(payload.error ?? "Nao foi possivel adicionar o ativo.");
      return;
    }

    setAssets(payload.assets);
    setTicker("");
  }

  async function refreshAsset(assetTicker: string) {
    setBusyTicker(assetTicker);
    setMessage(null);
    const response = await fetch(`/api/assets/${assetTicker}/refresh`, { method: "POST" });

    if (!response.ok) {
      const payload = await response.json();
      setMessage(`Falha ao atualizar ${assetTicker}: ${payload.error}`);
      setBusyTicker(null);
      return;
    }

    await loadAssets();
    setBusyTicker(null);
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
          <button type="submit">Adicionar</button>
        </form>
        <select value={filter} onChange={(event) => setFilter(event.target.value)}>
          <option value="all">Todos</option>
          <option value="discounted">Descontadas</option>
          <option value="near">Proximas</option>
          <option value="expensive">Caras</option>
          <option value="incomplete">Incompletos</option>
        </select>
      </div>

      {message ? <p className={styles.message}>{message}</p> : null}

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
                <td>{money(asset.currentPrice)}</td>
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
                    disabled={busyTicker === asset.ticker}
                    onClick={() => void refreshAsset(asset.ticker)}
                  >
                    {busyTicker === asset.ticker ? "Atualizando" : "Atualizar"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
