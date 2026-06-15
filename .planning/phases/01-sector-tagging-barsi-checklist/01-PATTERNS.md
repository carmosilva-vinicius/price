# Phase 1: Sector Tagging & Barsi Checklist - Patterns

This document details the code patterns, import paths, and implementation structures to use for Phase 1. It compares each proposed file with its closest analog in the existing codebase.

---

## 1. File: `src/lib/db/schema.ts` (Modify)

* **Action**: Modify
* **Analog File**: `src/lib/db/schema.ts` (itself)
* **Description**: Extend the initialization code in `ensureSchema` to add a `sector` column to `assets` and create the `asset_checklist` table. Use SQLite's `PRAGMA table_info` to perform safe, idempotent migrations.

### Code Pattern to Copy (from `src/lib/db/schema.ts`)
We must preserve the existing table initialization style using `db.exec()` and standard SQL types:
```typescript
import type Database from "better-sqlite3";

export function ensureSchema(db: Database.Database) {
  db.pragma("foreign_keys = ON");
  db.exec(`
    CREATE TABLE IF NOT EXISTS assets (
      ticker TEXT PRIMARY KEY,
      name TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    // ...
  `);
}
```

### Excerpts & Migration Pattern
To prevent crashes on subsequent boots, do not execute raw `ALTER TABLE` without checking column existence. Copy this safe column checking pattern:
```typescript
// Inspect columns dynamically first
const columns = db.prepare("PRAGMA table_info(assets)").all() as Array<{ name: string }>;
const hasSector = columns.some(col => col.name === "sector");
if (!hasSector) {
  db.exec("ALTER TABLE assets ADD COLUMN sector TEXT;");
}

// Relational cascade table creation
db.exec(`
  CREATE TABLE IF NOT EXISTS asset_checklist (
    ticker TEXT NOT NULL,
    criterion_id TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('yes', 'no', 'unsure')),
    updated_at TEXT NOT NULL,
    PRIMARY KEY (ticker, criterion_id),
    FOREIGN KEY (ticker) REFERENCES assets(ticker) ON DELETE CASCADE
  );
`);
```

---

## 2. File: `src/lib/db/assets.ts` (Modify)

* **Action**: Modify
* **Analog File**: `src/lib/db/assets.ts` (itself)
* **Description**: Update type definitions (`StoredAsset`) to include nullable `sector` and helper CRUD methods.

### Code Pattern to Copy (from `src/lib/db/assets.ts`)
* Use synchronous execution patterns (`db.prepare().run()` or `db.prepare().all()`).
* Ensure all tickers are normalized using `normalizeTicker(ticker)`.
* Keep the repo wrapper structure returning query/command functions.

```typescript
import type Database from "better-sqlite3";

export function normalizeTicker(ticker: string) {
  return ticker.trim().toUpperCase().replace(/\.SA$/, "");
}

export function createAssetRepository(db: Database.Database) {
  // Analog for standard query pattern:
  function createAsset(tickerInput: string, name: string | null = null) {
    const ticker = normalizeTicker(tickerInput);
    const now = new Date().toISOString();
    db.prepare(
      `INSERT INTO assets (ticker, name, created_at, updated_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(ticker) DO UPDATE SET name = COALESCE(excluded.name, assets.name), updated_at = excluded.updated_at`
    ).run(ticker, name, now, now);
    return ticker;
  }
  
  // Analog list pattern:
  function listAssets() {
    return db.prepare(`SELECT ticker, name, updated_at FROM assets`).all();
  }
}
```

---

## 3. File: `src/lib/services/assets.ts` (Modify)

* **Action**: Modify
* **Analog File**: `src/lib/services/assets.ts` (itself)
* **Description**: Create service-layer orchestrators for sectors and checklists.

### Code Pattern to Copy (from `src/lib/services/assets.ts`)
* Access the database repository using the local helper function `repo()`.
* Keep service functions synchronous when not dealing with third-party network APIs.
* Encompass multiple mutations inside database transactions using `db.transaction()`.

```typescript
import { createAssetRepository, normalizeTicker } from "@/lib/db/assets";
import { getDatabase } from "@/lib/db/connection";

function repo() {
  return createAssetRepository(getDatabase());
}

// Transaction Orchestration analog (from lines 93-138):
const refreshApiDataTransaction = db.transaction((input: ApiRefreshInput) => {
  // executes multiple prepared statements in atomic safety
});
```

---

## 4. File: `src/app/api/assets/[ticker]/sector/route.ts` (Create)

* **Action**: Create
* **Analog File**: `src/app/api/assets/[ticker]/quote/route.ts`
* **Description**: Expose the dynamic segment route to update an asset's sector.

### Code Pattern to Copy (from `src/app/api/assets/[ticker]/quote/route.ts`)
* Await `context.params` dynamically in compliance with Next.js 16 requirements.
* Parse inputs using `zod`.
* Wrap execution in `try/catch` and use `badRequestResponse(error)` for validation failures.

```typescript
import { NextResponse } from "next/server";
import { z } from "zod";
import { badRequestResponse } from "@/app/api/errors";
import { listAssetRows } from "@/lib/services/assets"; // Or specific update handler

const schema = z.object({
  sector: z.string().trim().min(1).nullable() // Or enum of BESST / others
});

export async function PUT(
  request: Request,
  context: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await context.params;

  try {
    const body = schema.parse(await request.json());
    // Update sector logic here...
    return NextResponse.json({ assets: listAssetRows() });
  } catch (error) {
    return badRequestResponse(error);
  }
}
```

---

## 5. File: `src/app/api/assets/[ticker]/checklist/route.ts` (Create)

* **Action**: Create
* **Analog File**: `src/app/api/assets/[ticker]/payouts/route.ts`
* **Description**: Expose GET and PUT dynamic API endpoints for saving checklist options per asset.

### Code Pattern to Copy (from `src/app/api/assets/[ticker]/payouts/route.ts`)
* Use `zod` schema to parse the incoming checklist payload arrays.
* Retrieve path parameters asynchronously using a promise: `context: { params: Promise<{ ticker: string }> }`.

```typescript
import { NextResponse } from "next/server";
import { z } from "zod";
import { badRequestResponse } from "@/app/api/errors";

const itemSchema = z.object({
  criterionId: z.string().min(1),
  status: z.enum(["yes", "no", "unsure"])
});
const schema = z.object({
  checklist: z.array(itemSchema)
});

export async function GET(
  request: Request,
  context: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await context.params;
  // ... fetch and return JSON checklist
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await context.params;
  try {
    const body = schema.parse(await request.json());
    // ... update checklist
    return NextResponse.json({ success: true });
  } catch (error) {
    return badRequestResponse(error);
  }
}
```

---

## 6. File: `src/components/AssetRadar.tsx` (Modify)

* **Action**: Modify
* **Analog File**: `src/components/AssetRadar.tsx` (itself)
* **Description**: Add sector tags to the UI table, implement dropdown filter states (handling BESST and custom sectors), and trigger the modal view.

### Code Pattern to Copy (from `src/components/AssetRadar.tsx`)
* Styling: CSS Module classes imported from `@/app/page.module.css`.
* Data representation formatters: `money()` and `percent()` (lines 24-42).
* Filter state and derived views (`useMemo` structure in lines 102-112).
* Busy/Loading status indicators using `busyTickers` reference arrays to prevent double-submit.

```typescript
// Derived view memo pattern to replicate:
const visibleAssets = useMemo(() => {
  if (filter === "all") {
    return assets;
  }
  // Extend filtering condition for BESST and sectors:
  return assets.filter((asset) => {
    if (filter === "besst") {
      const besstSectors = ["banco", "energia", "saneamento", "seguro", "telecom"];
      return asset.sector && besstSectors.includes(asset.sector.toLowerCase());
    }
    return asset.metrics.economicStatus === filter;
  });
}, [assets, filter]);
```

---

## 7. File: `src/components/ChecklistModal.tsx` (Create)

* **Action**: Create
* **Analog File**: `src/components/AssetRadar.tsx`
* **Description**: Interactive modal overlay allowing users to view and toggle stock checklist options.

### Code Pattern to Copy (from `src/components/AssetRadar.tsx`)
* Use standard React event handlers and `fetch` request cycles.
* Render semantic buttons and native inputs (e.g. checkbox or custom radio arrays).
* Use the HTML5 `<dialog>` component or React conditional portal nodes for modals to support clean DOM lifecycle hooks and reset cached states.

```typescript
// Component style structure:
import styles from "@/app/page.module.css";
import { useState, useEffect } from "react";

type Criterion = {
  criterionId: string;
  name: string;
  description: string;
  status: "yes" | "no" | "unsure";
};

export function ChecklistModal({
  ticker,
  onClose,
  onSave
}: {
  ticker: string;
  onClose: () => void;
  onSave: () => void;
}) {
  const [checklist, setChecklist] = useState<Criterion[]>([]);
  
  // Reset states when ticker changes to avoid caching stale data
  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/assets/${ticker}/checklist`);
      if (res.ok) {
        const data = await res.json();
        setChecklist(data.checklist);
      }
    }
    load();
  }, [ticker]);

  // Render modal layout using page.module.css styles...
}
```
