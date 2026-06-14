# Architecture

**Analysis Date:** 2026-06-14

## Pattern Overview

**Overall:** Monolithic Full-Stack Next.js App Router Application

**Key Characteristics:**
- **Hybrid Rendering:** Server-rendered initial pages (`src/app/page.tsx`) with client-side interactive React components (`src/components/AssetRadar.tsx`).
- **Synchronous Persistence:** Uses synchronous `better-sqlite3` operations on the server side, avoiding asynchronous DB overhead.
- **Service-Oriented backend:** Explicit separation between API controllers, orchestrating services, pure domain logic, and database repositories.
- **Failover Data Fetching:** Multi-tier client integration that prioritizes Yahoo Finance and falls back to BRAPI.

## Layers

**UI Layer (React Component):**
- Purpose: Render the dashboard, manage user interactions, input draft states, and trigger state refreshes.
- Contains: `src/components/AssetRadar.tsx` (Client component)
- Depends on: Next.js frontend router and styling files (`page.module.css`)
- Used by: `src/app/page.tsx`

**API Handler Layer (Next.js Routes):**
- Purpose: Expose JSON endpoints for asset operations, parse request bodies, validate input types, and return HTTP status codes.
- Contains: `src/app/api/assets/route.ts`, `src/app/api/assets/[ticker]/refresh/route.ts`, etc.
- Depends on: Services Layer (`src/lib/services/assets.ts`)
- Used by: Frontend UI component fetches

**Services Layer:**
- Purpose: Orchestrate use cases, handle integrations failover, combine repository operations, and maps data formats.
- Contains: `src/lib/services/assets.ts`
- Depends on: Database Repository (`src/lib/db/assets.ts`), External Clients (`src/lib/yahoo/`, `src/lib/brapi/`), Domain Logic (`src/lib/domain/pricing.ts`)
- Used by: API Handlers, Page Server Components

**Domain Logic Layer:**
- Purpose: Pure, side-effect-free mathematical functions implementing Barsi's Preço-Teto (ceiling price) calculations and asset classification.
- Contains: `src/lib/domain/pricing.ts`
- Depends on: None (only core types)
- Used by: Services Layer

**Database Repository Layer:**
- Purpose: Encapsulate database interactions using prepared SQLite statements and transaction execution.
- Contains: `src/lib/db/assets.ts`
- Depends on: Database Connection (`src/lib/db/connection.ts`), Schema (`src/lib/db/schema.ts`)
- Used by: Services Layer

## Data Flow

### 1. Asset Refresh Flow (HTTP POST)

1. **User Action:** User clicks "Refresh" or inputs a new ticker.
2. **UI Layer:** Sends a `POST` request to `/api/assets/[ticker]/refresh`.
3. **API Handler:** Matches route and invokes `refreshAsset(ticker)` from the Service layer.
4. **Services Layer:**
   - Calls `fetchYahooAsset(ticker)` to obtain price, currency, long name, and historical payouts.
   - If Yahoo Finance fails or returns no price, calls `fetchBrapiAsset(ticker)` as a fallback.
   - Maps the fetched results to `ApiRefreshInput` schema.
   - Executes `repo().refreshApiData(input)` to persist the new data.
5. **Database Repository:** Transactionally updates the asset info, overwrites the current API quote, purges old API payout records, and inserts the new API payouts (preserving manual entries).
6. **Services Layer:** Fetches the updated asset, computes Luiz Barsi metrics (`calculateAssetMetrics`), and returns the hydrated asset structure.
7. **API Handler:** Responds with `200 OK` and the updated asset JSON.
8. **UI Layer:** Updates local React state and rerenders the table.

### 2. Initial Page Load (SSR)

1. **User Request:** User loads `/`.
2. **Page Server Component:** Executes `listAssetRows()` from the Service layer.
3. **Services Layer:** Asks the Database Repository to retrieve all stored assets, quotes, and payouts.
4. **Database Repository:** Performs query with left-joins on `quotes` and `annual_payouts`.
5. **Services Layer:** Loops through each asset, runs `calculateAssetMetrics()`, and generates the initial assets list.
6. **Page Server Component:** Renders the page structure and passes the initial array to the `AssetRadar` client component as a prop (`initialAssets`).

### State Management:
- **Persistent State:** Contained in the local SQLite database (`price.sqlite`).
- **Transient UI State:** React `useState` hooks inside `AssetRadar.tsx` representing ticker inputs, filtering options, user message alerts, and processing statuses.

## Key Abstractions

**Repository Pattern (`createAssetRepository`):**
- Encapsulates database read and write access behind a clean TypeScript API interface, hiding SQL statement details.

**Domain Calculation Engine (`calculateAssetMetrics`):**
- Encapsulates Luiz Barsi's algorithm formulas:
  - `Ceiling Price = Average Payout / Target Yield`
  - `Status = Price < Ceiling ? "discounted" : Price <= Ceiling * 1.05 ? "near" : "expensive"`

## Entry Points

**Page SSR Entry Point:**
- `src/app/page.tsx` - Handles the initial route rendering.

**API Route Controllers:**
- `src/app/api/assets/route.ts` - Retrieves all assets or registers a new ticker.
- `src/app/api/assets/[ticker]/refresh/route.ts` - Pulls live data and updates database state.
- `src/app/api/assets/[ticker]/quote/route.ts` - Manages manual stock price overrides.
- `src/app/api/assets/[ticker]/payouts/route.ts` - Manages manual annual dividend overrides.

## Error Handling

**Services & Clients:**
- Individual client errors (e.g., Yahoo Finance timeout) are caught and logged using `console.error` to allow fallback execution.
- If both external providers fail to retrieve a price, a standard `Error` is thrown, which propagates to the API layer.

**API Handlers:**
- Standardized error mapping via `/api/errors.ts` returning JSON objects with clear messages (e.g., `400 Bad Request` or `500 Internal Server Error`).

---

*Architecture analysis: 2026-06-14*
*Update when major patterns change*
