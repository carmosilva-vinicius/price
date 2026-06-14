# Architecture Research

**Domain:** Stock market pricing dashboard and qualitative analytics
**Researched:** 2026-06-14
**Confidence:** HIGH

## Standard Architecture

### System Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                       Frontend UI Layer                     │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   AssetRadar    │  │ Barsi Checklist │  │ Goal Calc    │ │
│  │ (Filters/Table) │  │     (Modal)     │  │ (Simulator)  │ │
│  └────────┬────────┘  └────────┬────────┘  └──────┬───────┘ │
│           │                    │                  │         │
├───────────┼────────────────────┼──────────────────┼─────────┤
│           ▼                    ▼                  ▼         │
│                        Next.js API Layer                    │
├─────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────┐ │
│  │        API Route Controllers (/api/assets/...)         │ │
│  └────────────────────────────┬───────────────────────────┘ │
├───────────────────────────────┼─────────────────────────────┤
│                               ▼                             │
│                     Services & Domain Layer                 │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────┐  ┌──────────────────┐ │
│  │         Asset Services           │  │  Domain Pricing  │ │
│  │        (Orchestrator)            │  │  (Luiz Barsi math)│ │
│  └────────────────┬─────────────────┘  └──────────────────┘ │
├───────────────────┼─────────────────────────────────────────┤
│                   ▼                                         │
│                  SQLite Repository Layer                    │
│  ┌────────────────────────────────────────────────────────┐ │
│  │           Database Repository (better-sqlite3)         │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| `AssetRadar` | Renders main stock table, handles filters (including BESST sector views), displays metrics and goals. | React Client Component inside `src/components/` |
| `Barsi Checklist Modal` | Allows user to answer qualitative criteria for a selected ticker (payout, debt, profit). | Modal overlay inside UI |
| `Goal Simulator` | Simulates monthly deposits and calculated share counts to reach target yields. | UI calculations box inside `AssetRadar` |
| `Asset Service` | Handles sector updates, checklist fetching/saving, and coordinates calculations. | Functions in `src/lib/services/assets.ts` |
| `SQLite Repository` | Manages schemas, alters tables, and executes updates on assets/checklist. | Queries in `src/lib/db/` |

## Recommended Project Structure

We will integrate the new features directly into the existing project structure:

```text
src/
├── app/
│   └── api/
│       └── assets/
│           └── [ticker]/
│               ├── checklist/
│               │   └── route.ts  # GET/PUT checklist criteria per ticker
│               └── sector/
│                   └── route.ts  # PUT sector tag
├── components/
│   ├── AssetRadar.tsx            # Main dashboard (enhanced with filters & simulators)
│   ├── ChecklistModal.tsx        # Qualitative questionnaire modal
│   └── DividendChart.tsx         # SVG-based dividend history graph
├── lib/
│   ├── db/
│   │   ├── assets.ts             # Repository updates (sector tags, checklist saves)
│   │   └── schema.ts             # Database schema migrations (add column, create table)
│   ├── domain/
│   │   └── pricing.ts            # Pure domain goals/calculator math
│   └── services/
│       └── assets.ts             # Orchestrate sector/checklist saves and return values
```

## Data Model Updates

### 1. `assets` Table (Modify)
- Add `sector` TEXT (nullable) to group companies (e.g. Bank, Energy, Retail).

### 2. `asset_checklist` Table (New)
```sql
CREATE TABLE IF NOT EXISTS asset_checklist (
  ticker TEXT NOT NULL,
  criterion_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('yes', 'no', 'unsure')),
  updated_at TEXT NOT NULL,
  PRIMARY KEY (ticker, criterion_id),
  FOREIGN KEY (ticker) REFERENCES assets(ticker) ON DELETE CASCADE
);
```

---
*Architecture research: 2026-06-14*
