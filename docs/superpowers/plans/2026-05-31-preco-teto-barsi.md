# Preco-Teto Barsi/Bazin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local fullstack Next.js app that calculates B3 stock price ceilings from average dividends using the Bazin/Barsi method.

**Architecture:** Use one Next.js App Router project for frontend and backend. Backend route handlers call brapi, persist normalized data in local SQLite, and expose calculated asset rows to the frontend. Domain calculation, brapi mapping, and SQLite persistence stay in focused modules with tests around financial rules first.

**Tech Stack:** Next.js, React, TypeScript, SQLite via `better-sqlite3`, Zod, Vitest, Testing Library, plain CSS modules.

---

## File Structure

- `package.json`: npm scripts and dependencies.
- `tsconfig.json`: TypeScript config.
- `next.config.ts`: Next.js config.
- `vitest.config.ts`: Vitest config.
- `src/app/layout.tsx`: app shell metadata.
- `src/app/page.tsx`: main radar screen server component.
- `src/app/page.module.css`: operational dashboard styling.
- `src/app/api/assets/route.ts`: list and create assets.
- `src/app/api/assets/[ticker]/refresh/route.ts`: refresh one asset from brapi.
- `src/app/api/assets/[ticker]/quote/route.ts`: manual quote update.
- `src/app/api/assets/[ticker]/payouts/route.ts`: manual annual payout update.
- `src/components/AssetRadar.tsx`: client-side table and actions.
- `src/lib/domain/pricing.ts`: pure pricing and classification rules.
- `src/lib/brapi/client.ts`: HTTP client and response validation for brapi.
- `src/lib/brapi/mapper.ts`: convert brapi quote/dividend payloads to app types.
- `src/lib/db/connection.ts`: SQLite connection singleton.
- `src/lib/db/schema.ts`: schema creation.
- `src/lib/db/assets.ts`: asset repository.
- `src/lib/services/assets.ts`: orchestration for list/create/refresh/manual edits.
- `src/lib/types.ts`: shared domain types.
- `tests/domain/pricing.test.ts`: financial rule tests.
- `tests/brapi/mapper.test.ts`: brapi mapping tests.
- `tests/db/assets.test.ts`: persistence tests.
- `.gitignore`: ignore generated files and local database.

## Task 1: Initialize Project Shell

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `vitest.config.ts`
- Create: `.gitignore`

- [ ] **Step 1: Initialize git if needed**

Run:

```bash
git init
```

Expected: repository initialized, or message that the repository already exists.

- [ ] **Step 2: Create `package.json`**

```json
{
  "name": "preco-teto-barsi",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "next lint"
  },
  "dependencies": {
    "@vitejs/plugin-react": "latest",
    "better-sqlite3": "latest",
    "next": "latest",
    "react": "latest",
    "react-dom": "latest",
    "zod": "latest"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "latest",
    "@testing-library/react": "latest",
    "@types/better-sqlite3": "latest",
    "@types/node": "latest",
    "@types/react": "latest",
    "@types/react-dom": "latest",
    "jsdom": "latest",
    "typescript": "latest",
    "vitest": "latest"
  }
}
```

- [ ] **Step 3: Create TypeScript and tool config files**

`tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "es2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

`next.config.ts`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

export default nextConfig;
```

`vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"]
  },
  resolve: {
    alias: {
      "@": new URL("./src", import.meta.url).pathname
    }
  }
});
```

`.gitignore`:

```gitignore
node_modules
.next
dist
coverage
data/*.sqlite
data/*.sqlite-shm
data/*.sqlite-wal
.env.local
```

- [ ] **Step 4: Install dependencies**

Run:

```bash
npm install
```

Expected: dependencies installed and `package-lock.json` created.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json tsconfig.json next.config.ts vitest.config.ts .gitignore
git commit -m "chore: initialize next app shell"
```

## Task 2: Domain Pricing Rules with TDD

**Files:**
- Create: `src/lib/types.ts`
- Create: `src/lib/domain/pricing.ts`
- Create: `tests/domain/pricing.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
import { describe, expect, it } from "vitest";
import {
  calculateAssetMetrics,
  classifyAsset,
  summarizeAnnualPayouts
} from "@/lib/domain/pricing";

describe("pricing rules", () => {
  it("calculates average annual payouts and ceiling price from five years", () => {
    const summary = summarizeAnnualPayouts([
      { year: 2021, amount: 2 },
      { year: 2022, amount: 2.5 },
      { year: 2023, amount: 3 },
      { year: 2024, amount: 3.5 },
      { year: 2025, amount: 4 }
    ]);

    expect(summary.yearsUsed).toEqual([2025, 2024, 2023, 2022, 2021]);
    expect(summary.averageAnnualPayout).toBeCloseTo(3);
    expect(summary.isPartial).toBe(false);
  });

  it("marks metrics as partial when fewer than five years are available", () => {
    const metrics = calculateAssetMetrics({
      currentPrice: 20,
      annualPayouts: [
        { year: 2024, amount: 1.2 },
        { year: 2025, amount: 1.5 }
      ],
      targetYield: 0.06
    });

    expect(metrics.dataState).toBe("partial");
    expect(metrics.ceilingPrice).toBeCloseTo(22.5);
    expect(metrics.economicStatus).toBe("discounted");
  });

  it("marks metrics as incomplete without quote or payout data", () => {
    expect(
      calculateAssetMetrics({
        currentPrice: null,
        annualPayouts: [{ year: 2025, amount: 1 }],
        targetYield: 0.06
      }).dataState
    ).toBe("incomplete");

    expect(
      calculateAssetMetrics({
        currentPrice: 10,
        annualPayouts: [],
        targetYield: 0.06
      }).dataState
    ).toBe("incomplete");
  });

  it("classifies discounted, near, and expensive prices", () => {
    expect(classifyAsset({ currentPrice: 29, ceilingPrice: 30 })).toBe("discounted");
    expect(classifyAsset({ currentPrice: 31.5, ceilingPrice: 30 })).toBe("near");
    expect(classifyAsset({ currentPrice: 31.51, ceilingPrice: 30 })).toBe("expensive");
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```bash
npm test tests/domain/pricing.test.ts
```

Expected: FAIL because `@/lib/domain/pricing` does not exist.

- [ ] **Step 3: Create shared types and implementation**

`src/lib/types.ts`:

```ts
export type DataSource = "api" | "manual";

export type AnnualPayoutInput = {
  year: number;
  amount: number;
};

export type DataState = "complete" | "partial" | "incomplete";
export type EconomicStatus = "discounted" | "near" | "expensive";

export type AssetMetrics = {
  dataState: DataState;
  economicStatus: EconomicStatus | null;
  averageAnnualPayout: number | null;
  ceilingPrice: number | null;
  differencePercent: number | null;
  yearsUsed: number[];
};
```

`src/lib/domain/pricing.ts`:

```ts
import type { AnnualPayoutInput, AssetMetrics, EconomicStatus } from "@/lib/types";

const DEFAULT_TARGET_YIELD = 0.06;
const NEAR_LIMIT = 1.05;

export function summarizeAnnualPayouts(
  annualPayouts: AnnualPayoutInput[],
  maxYears = 5
) {
  const positivePayouts = annualPayouts
    .filter((payout) => Number.isFinite(payout.amount) && payout.amount > 0)
    .sort((a, b) => b.year - a.year)
    .slice(0, maxYears);

  const total = positivePayouts.reduce((sum, payout) => sum + payout.amount, 0);
  const averageAnnualPayout =
    positivePayouts.length > 0 ? total / positivePayouts.length : null;

  return {
    yearsUsed: positivePayouts.map((payout) => payout.year),
    averageAnnualPayout,
    isPartial: positivePayouts.length > 0 && positivePayouts.length < maxYears
  };
}

export function classifyAsset(input: {
  currentPrice: number;
  ceilingPrice: number;
}): EconomicStatus {
  if (input.currentPrice < input.ceilingPrice) {
    return "discounted";
  }

  if (input.currentPrice <= input.ceilingPrice * NEAR_LIMIT) {
    return "near";
  }

  return "expensive";
}

export function calculateAssetMetrics(input: {
  currentPrice: number | null;
  annualPayouts: AnnualPayoutInput[];
  targetYield?: number;
}): AssetMetrics {
  const targetYield = input.targetYield ?? DEFAULT_TARGET_YIELD;
  const summary = summarizeAnnualPayouts(input.annualPayouts);

  if (
    input.currentPrice === null ||
    !Number.isFinite(input.currentPrice) ||
    input.currentPrice <= 0 ||
    summary.averageAnnualPayout === null ||
    targetYield <= 0
  ) {
    return {
      dataState: "incomplete",
      economicStatus: null,
      averageAnnualPayout: summary.averageAnnualPayout,
      ceilingPrice: null,
      differencePercent: null,
      yearsUsed: summary.yearsUsed
    };
  }

  const ceilingPrice = summary.averageAnnualPayout / targetYield;
  const economicStatus = classifyAsset({
    currentPrice: input.currentPrice,
    ceilingPrice
  });

  return {
    dataState: summary.isPartial ? "partial" : "complete",
    economicStatus,
    averageAnnualPayout: summary.averageAnnualPayout,
    ceilingPrice,
    differencePercent: (input.currentPrice - ceilingPrice) / ceilingPrice,
    yearsUsed: summary.yearsUsed
  };
}
```

- [ ] **Step 4: Run tests to verify pass**

Run:

```bash
npm test tests/domain/pricing.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/types.ts src/lib/domain/pricing.ts tests/domain/pricing.test.ts
git commit -m "feat: add price ceiling domain rules"
```

## Task 3: SQLite Persistence with TDD

**Files:**
- Create: `src/lib/db/connection.ts`
- Create: `src/lib/db/schema.ts`
- Create: `src/lib/db/assets.ts`
- Create: `tests/db/assets.test.ts`

- [ ] **Step 1: Write failing persistence tests**

```ts
import Database from "better-sqlite3";
import { describe, expect, it } from "vitest";
import { createAssetRepository } from "@/lib/db/assets";
import { ensureSchema } from "@/lib/db/schema";

describe("asset repository", () => {
  it("creates an asset and returns calculated rows", () => {
    const db = new Database(":memory:");
    ensureSchema(db);
    const repo = createAssetRepository(db);

    repo.createAsset("taee11");
    repo.upsertQuote({ ticker: "TAEE11", price: 34, currency: "BRL", source: "manual" });
    repo.upsertAnnualPayout({ ticker: "TAEE11", year: 2025, amount: 2.4, source: "manual" });

    const assets = repo.listAssets();

    expect(assets).toHaveLength(1);
    expect(assets[0].ticker).toBe("TAEE11");
    expect(assets[0].currentPrice).toBe(34);
    expect(assets[0].annualPayouts).toEqual([{ year: 2025, amount: 2.4, source: "manual" }]);
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```bash
npm test tests/db/assets.test.ts
```

Expected: FAIL because database modules do not exist.

- [ ] **Step 3: Implement database modules**

`src/lib/db/connection.ts`:

```ts
import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { ensureSchema } from "@/lib/db/schema";

let db: Database.Database | null = null;

export function getDatabase() {
  if (db) {
    return db;
  }

  const dbPath = process.env.PRICE_DB_PATH ?? join(process.cwd(), "data", "price.sqlite");
  mkdirSync(dirname(dbPath), { recursive: true });
  db = new Database(dbPath);
  ensureSchema(db);
  return db;
}
```

`src/lib/db/schema.ts`:

```ts
import type Database from "better-sqlite3";

export function ensureSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS assets (
      ticker TEXT PRIMARY KEY,
      name TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS quotes (
      ticker TEXT PRIMARY KEY,
      price REAL NOT NULL,
      currency TEXT NOT NULL,
      source TEXT NOT NULL CHECK (source IN ('api', 'manual')),
      quoted_at TEXT NOT NULL,
      captured_at TEXT NOT NULL,
      FOREIGN KEY (ticker) REFERENCES assets(ticker) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS annual_payouts (
      ticker TEXT NOT NULL,
      year INTEGER NOT NULL,
      amount REAL NOT NULL,
      source TEXT NOT NULL CHECK (source IN ('api', 'manual')),
      updated_at TEXT NOT NULL,
      PRIMARY KEY (ticker, year),
      FOREIGN KEY (ticker) REFERENCES assets(ticker) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
}
```

`src/lib/db/assets.ts`:

```ts
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

export function normalizeTicker(ticker: string) {
  return ticker.trim().toUpperCase().replace(/\.SA$/, "");
}

export function createAssetRepository(db: Database.Database) {
  return {
    createAsset(tickerInput: string, name: string | null = null) {
      const ticker = normalizeTicker(tickerInput);
      const now = new Date().toISOString();
      db.prepare(
        `INSERT INTO assets (ticker, name, created_at, updated_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(ticker) DO UPDATE SET name = COALESCE(excluded.name, assets.name), updated_at = excluded.updated_at`
      ).run(ticker, name, now, now);
      return ticker;
    },

    upsertQuote(input: {
      ticker: string;
      price: number;
      currency: string;
      source: DataSource;
      quotedAt?: string;
    }) {
      const ticker = normalizeTicker(input.ticker);
      const now = new Date().toISOString();
      this.createAsset(ticker);
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
    },

    upsertAnnualPayout(input: {
      ticker: string;
      year: number;
      amount: number;
      source: DataSource;
    }) {
      const ticker = normalizeTicker(input.ticker);
      const now = new Date().toISOString();
      this.createAsset(ticker);
      db.prepare(
        `INSERT INTO annual_payouts (ticker, year, amount, source, updated_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(ticker, year) DO UPDATE SET
           amount = excluded.amount,
           source = excluded.source,
           updated_at = excluded.updated_at`
      ).run(ticker, input.year, input.amount, input.source, now);
      db.prepare(`UPDATE assets SET updated_at = ? WHERE ticker = ?`).run(now, ticker);
    },

    listAssets(): StoredAsset[] {
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
  };
}
```

- [ ] **Step 4: Run tests to verify pass**

Run:

```bash
npm test tests/db/assets.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/db/connection.ts src/lib/db/schema.ts src/lib/db/assets.ts tests/db/assets.test.ts
git commit -m "feat: add sqlite asset persistence"
```

## Task 4: brapi Mapping with TDD

**Files:**
- Create: `src/lib/brapi/mapper.ts`
- Create: `src/lib/brapi/client.ts`
- Create: `tests/brapi/mapper.test.ts`

- [ ] **Step 1: Write failing mapper tests**

```ts
import { describe, expect, it } from "vitest";
import { mapBrapiQuote, mapBrapiDividendsToAnnualPayouts } from "@/lib/brapi/mapper";

describe("brapi mapper", () => {
  it("maps quote data from a brapi result", () => {
    const quote = mapBrapiQuote({
      symbol: "TAEE11",
      shortName: "TAESA",
      regularMarketPrice: 34.12,
      currency: "BRL",
      regularMarketTime: "2026-05-31T12:00:00.000Z"
    });

    expect(quote).toEqual({
      ticker: "TAEE11",
      name: "TAESA",
      price: 34.12,
      currency: "BRL",
      quotedAt: "2026-05-31T12:00:00.000Z"
    });
  });

  it("consolidates dividends and JCP by payment year", () => {
    const payouts = mapBrapiDividendsToAnnualPayouts("TAEE11", [
      { paymentDate: "2025-03-01", rate: 1.1, label: "DIVIDEND" },
      { paymentDate: "2025-08-01", rate: 0.4, label: "JCP" },
      { paymentDate: "2024-04-01", rate: 2, label: "DIVIDEND" }
    ]);

    expect(payouts).toEqual([
      { ticker: "TAEE11", year: 2025, amount: 1.5 },
      { ticker: "TAEE11", year: 2024, amount: 2 }
    ]);
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```bash
npm test tests/brapi/mapper.test.ts
```

Expected: FAIL because mapper module does not exist.

- [ ] **Step 3: Implement brapi mapper and client**

`src/lib/brapi/mapper.ts`:

```ts
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
  if (!result.symbol || !result.regularMarketPrice) {
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
```

`src/lib/brapi/client.ts`:

```ts
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
```

- [ ] **Step 4: Run tests to verify pass**

Run:

```bash
npm test tests/brapi/mapper.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/brapi/mapper.ts src/lib/brapi/client.ts tests/brapi/mapper.test.ts
git commit -m "feat: map brapi asset data"
```

## Task 5: Asset Service and API Routes

**Files:**
- Create: `src/lib/services/assets.ts`
- Create: `src/app/api/assets/route.ts`
- Create: `src/app/api/assets/[ticker]/refresh/route.ts`
- Create: `src/app/api/assets/[ticker]/quote/route.ts`
- Create: `src/app/api/assets/[ticker]/payouts/route.ts`

- [ ] **Step 1: Create asset service**

```ts
import { fetchBrapiAsset } from "@/lib/brapi/client";
import {
  mapBrapiDividendsToAnnualPayouts,
  mapBrapiQuote
} from "@/lib/brapi/mapper";
import { calculateAssetMetrics } from "@/lib/domain/pricing";
import { createAssetRepository, normalizeTicker } from "@/lib/db/assets";
import { getDatabase } from "@/lib/db/connection";
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
```

- [ ] **Step 2: Create `src/app/api/assets/route.ts`**

```ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { createAsset, listAssetRows } from "@/lib/services/assets";

const createAssetSchema = z.object({
  ticker: z.string().min(1).max(12)
});

export async function GET() {
  return NextResponse.json({ assets: listAssetRows() });
}

export async function POST(request: Request) {
  const body = createAssetSchema.parse(await request.json());
  createAsset(body.ticker);
  return NextResponse.json({ assets: listAssetRows() }, { status: 201 });
}
```

- [ ] **Step 3: Create refresh route**

`src/app/api/assets/[ticker]/refresh/route.ts`:

```ts
import { NextResponse } from "next/server";
import { refreshAsset } from "@/lib/services/assets";

export async function POST(
  _request: Request,
  context: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await context.params;

  try {
    const asset = await refreshAsset(ticker);
    return NextResponse.json({ asset });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected refresh error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
```

- [ ] **Step 4: Create manual edit routes**

`src/app/api/assets/[ticker]/quote/route.ts`:

```ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { listAssetRows, updateManualQuote } from "@/lib/services/assets";

const schema = z.object({
  price: z.number().positive()
});

export async function PUT(
  request: Request,
  context: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await context.params;
  const body = schema.parse(await request.json());
  updateManualQuote({ ticker, price: body.price });
  return NextResponse.json({ assets: listAssetRows() });
}
```

`src/app/api/assets/[ticker]/payouts/route.ts`:

```ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { listAssetRows, updateManualPayout } from "@/lib/services/assets";

const schema = z.object({
  year: z.number().int().min(1900).max(2200),
  amount: z.number().nonnegative()
});

export async function PUT(
  request: Request,
  context: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await context.params;
  const body = schema.parse(await request.json());
  updateManualPayout({ ticker, year: body.year, amount: body.amount });
  return NextResponse.json({ assets: listAssetRows() });
}
```

- [ ] **Step 5: Run tests**

Run:

```bash
npm test
```

Expected: PASS for domain, database, and brapi mapper tests.

- [ ] **Step 6: Commit**

```bash
git add src/lib/services/assets.ts src/app/api/assets/route.ts src/app/api/assets/[ticker]/refresh/route.ts src/app/api/assets/[ticker]/quote/route.ts src/app/api/assets/[ticker]/payouts/route.ts
git commit -m "feat: add asset api routes"
```

## Task 6: Main App UI

**Files:**
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/page.module.css`
- Create: `src/components/AssetRadar.tsx`

- [ ] **Step 1: Create app layout**

`src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Preco-Teto Barsi",
  description: "Radar local de preco-teto para acoes da B3"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 2: Create global CSS**

Create `src/app/globals.css`:

```css
:root {
  color-scheme: light;
  --background: #f5f7fa;
  --surface: #ffffff;
  --text: #18202a;
  --muted: #5d6978;
  --line: #d9e0e8;
  --green: #1f7a4d;
  --amber: #9a6500;
  --red: #b33a3a;
  --blue: #2457a6;
}

* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  min-height: 100%;
  background: var(--background);
  color: var(--text);
  font-family: Arial, Helvetica, sans-serif;
}

button,
input {
  font: inherit;
}
```

- [ ] **Step 3: Create server page**

`src/app/page.tsx`:

```tsx
import { AssetRadar } from "@/components/AssetRadar";
import { listAssetRows } from "@/lib/services/assets";
import styles from "./page.module.css";

export default function Home() {
  const assets = listAssetRows();

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>Preco-Teto Barsi</h1>
          <p>Radar local para comparar cotacao, dividendos e margem de seguranca.</p>
        </div>
      </header>
      <AssetRadar initialAssets={assets} />
    </main>
  );
}
```

- [ ] **Step 4: Create UI component**

`src/components/AssetRadar.tsx`:

```tsx
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

function label(asset: AssetRow) {
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

export function AssetRadar({ initialAssets }: { initialAssets: AssetRow[] }) {
  const [assets, setAssets] = useState(initialAssets);
  const [ticker, setTicker] = useState("");
  const [filter, setFilter] = useState("all");
  const [message, setMessage] = useState<string | null>(null);

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

  async function createAsset() {
    setMessage(null);
    const response = await fetch("/api/assets", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ticker })
    });
    const payload = await response.json();
    setAssets(payload.assets);
    setTicker("");
  }

  async function refreshAsset(assetTicker: string) {
    setMessage(null);
    const response = await fetch(`/api/assets/${assetTicker}/refresh`, { method: "POST" });
    if (!response.ok) {
      const payload = await response.json();
      setMessage(`Falha ao atualizar ${assetTicker}: ${payload.error}`);
      return;
    }
    const latest = await fetch("/api/assets");
    const payload = await latest.json();
    setAssets(payload.assets);
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
                  <span className={styles.status}>{label(asset)}</span>
                </td>
                <td>{asset.quoteSource ?? "-"}</td>
                <td>{new Date(asset.updatedAt).toLocaleString("pt-BR")}</td>
                <td>
                  <button type="button" onClick={() => void refreshAsset(asset.ticker)}>
                    Atualizar
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
```

- [ ] **Step 5: Create page styling**

`src/app/page.module.css`:

```css
.page {
  width: min(1180px, calc(100vw - 32px));
  margin: 0 auto;
  padding: 32px 0;
}

.header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 24px;
}

.header h1 {
  margin: 0;
  font-size: 32px;
}

.header p {
  margin: 8px 0 0;
  color: var(--muted);
}

.tool {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 8px;
  overflow: hidden;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 16px;
  border-bottom: 1px solid var(--line);
}

.toolbar form {
  display: flex;
  gap: 8px;
}

.toolbar input,
.toolbar select {
  height: 36px;
  border: 1px solid var(--line);
  border-radius: 6px;
  padding: 0 10px;
}

.toolbar button,
.tableWrap button {
  height: 36px;
  border: 1px solid var(--blue);
  border-radius: 6px;
  padding: 0 12px;
  background: var(--blue);
  color: white;
  cursor: pointer;
}

.message {
  margin: 0;
  padding: 12px 16px;
  color: var(--red);
  border-bottom: 1px solid var(--line);
}

.tableWrap {
  overflow-x: auto;
}

.tableWrap table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.tableWrap th,
.tableWrap td {
  padding: 12px;
  border-bottom: 1px solid var(--line);
  text-align: left;
  white-space: nowrap;
}

.tableWrap th {
  color: var(--muted);
  font-size: 12px;
  text-transform: uppercase;
}

.tableWrap td span {
  display: block;
  color: var(--muted);
  font-size: 12px;
  margin-top: 2px;
}

.status {
  color: var(--text);
  font-weight: 700;
}

@media (max-width: 720px) {
  .page {
    width: min(100vw - 20px, 1180px);
    padding: 20px 0;
  }

  .toolbar {
    align-items: stretch;
    flex-direction: column;
  }
}
```

- [ ] **Step 6: Run build**

Run:

```bash
npm run build
```

Expected: Next.js production build succeeds.

- [ ] **Step 7: Commit**

```bash
git add src/app/layout.tsx src/app/globals.css src/app/page.tsx src/app/page.module.css src/components/AssetRadar.tsx
git commit -m "feat: add asset radar interface"
```

## Task 7: Manual Editing UI

**Files:**
- Modify: `src/components/AssetRadar.tsx`
- Modify: `src/app/page.module.css`

- [ ] **Step 1: Add quote and payout editing handlers to `AssetRadar.tsx`**

Insert these functions inside `AssetRadar` after `refreshAsset`:

```tsx
  async function saveManualQuote(assetTicker: string, value: string) {
    const price = Number(value.replace(",", "."));
    if (!Number.isFinite(price) || price <= 0) {
      setMessage("Cotacao manual invalida.");
      return;
    }

    const response = await fetch(`/api/assets/${assetTicker}/quote`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ price })
    });
    const payload = await response.json();
    setAssets(payload.assets);
  }

  async function saveManualPayout(assetTicker: string, year: number, value: string) {
    const amount = Number(value.replace(",", "."));
    if (!Number.isFinite(amount) || amount < 0) {
      setMessage("Provento manual invalido.");
      return;
    }

    const response = await fetch(`/api/assets/${assetTicker}/payouts`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ year, amount })
    });
    const payload = await response.json();
    setAssets(payload.assets);
  }
```

- [ ] **Step 2: Add editable inputs in each table row**

Replace the current quote `<td>{money(asset.currentPrice)}</td>` with:

```tsx
                <td>
                  <input
                    className={styles.cellInput}
                    defaultValue={asset.currentPrice ?? ""}
                    onBlur={(event) => void saveManualQuote(asset.ticker, event.target.value)}
                    aria-label={`Cotacao manual de ${asset.ticker}`}
                  />
                </td>
```

Add this block before the action button in the actions `<td>`:

```tsx
                  <details className={styles.payoutEditor}>
                    <summary>Dividendos</summary>
                    {[0, 1, 2, 3, 4].map((offset) => {
                      const year = new Date().getFullYear() - offset;
                      const payout = asset.annualPayouts.find((item) => item.year === year);
                      return (
                        <label key={year}>
                          {year}
                          <input
                            defaultValue={payout?.amount ?? ""}
                            onBlur={(event) =>
                              void saveManualPayout(asset.ticker, year, event.target.value)
                            }
                          />
                        </label>
                      );
                    })}
                  </details>
```

- [ ] **Step 3: Add editor styling**

Append to `src/app/page.module.css`:

```css
.cellInput {
  width: 96px;
  height: 32px;
  border: 1px solid var(--line);
  border-radius: 6px;
  padding: 0 8px;
}

.payoutEditor {
  display: inline-block;
  margin-right: 8px;
  position: relative;
}

.payoutEditor summary {
  cursor: pointer;
  color: var(--blue);
  font-weight: 700;
}

.payoutEditor label {
  display: grid;
  grid-template-columns: 48px 96px;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

.payoutEditor input {
  width: 96px;
  height: 30px;
  border: 1px solid var(--line);
  border-radius: 6px;
  padding: 0 8px;
}
```

- [ ] **Step 4: Run build**

Run:

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/components/AssetRadar.tsx src/app/page.module.css
git commit -m "feat: add manual asset editing"
```

## Task 8: Verification and Local Run

**Files:**
- No code changes expected.

- [ ] **Step 1: Run full test suite**

Run:

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 2: Run production build**

Run:

```bash
npm run build
```

Expected: production build succeeds.

- [ ] **Step 3: Start development server**

Run:

```bash
npm run dev
```

Expected: Next.js starts and prints a local URL, usually `http://localhost:3000`.

- [ ] **Step 4: Manual smoke test**

Open the local URL and perform these checks:

```text
1. Add TAEE11.
2. Confirm TAEE11 appears in the table.
3. Click Atualizar.
4. If brapi responds, confirm cotacao, media, preco-teto, diferenca and status are populated.
5. If brapi fails, confirm a visible error appears and the app remains usable.
6. Edit cotacao manually and leave the field.
7. Confirm the status recalculates after the API response returns.
8. Open Dividendos, edit one annual value and leave the field.
9. Confirm media and preco-teto recalculate.
```

- [ ] **Step 5: Commit final verification note if any doc changes were made**

If no files changed during verification, do not create an empty commit.

```bash
git status --short
```

Expected: clean working tree after all intended commits.

## Self-Review

Spec coverage:

- Local personal app: covered by Next.js local app and SQLite tasks.
- SQLite persistence: covered by Task 3.
- brapi as primary source: covered by Task 4 and Task 5.
- Automatic with manual edits: covered by Task 5 and Task 7.
- Price ceiling formula and partial data rules: covered by Task 2.
- Operational UI: covered by Task 6 and Task 7.
- Error handling: covered by Task 5 refresh route and Task 6 UI message.

Placeholder scan:

- No unresolved placeholders are intentionally left in the plan.

Type consistency:

- `DataSource`, `AnnualPayoutInput`, metrics names, repository row names, and UI row names are aligned across tasks.
