# Codebase Structure

**Analysis Date:** 2026-06-14

## Directory Layout

```text
[project-root]/
├── data/                    # Local SQLite database files (gitignored)
├── docs/                    # Documentation
├── src/                     # Application source code
│   ├── app/                 # Next.js App Router folders
│   │   ├── api/             # API Route Handlers
│   │   │   └── assets/      # Asset-related API endpoints
│   │   ├── globals.css      # Base styling and variables
│   │   ├── layout.tsx       # Root layout component
│   │   ├── page.module.css  # Styling classes for pages/components
│   │   └── page.tsx         # Dashboard landing page (SSR)
│   ├── components/          # Reusable React components
│   │   └── AssetRadar.tsx   # Dashboard UI controller
│   └── lib/                 # Core logic libraries
│       ├── brapi/           # BRAPI external service client
│       ├── db/              # SQLite connection, schema, and repository
│       ├── domain/          # Pure business logic calculations
│       ├── services/        # Application services orchestrator
│       ├── yahoo/           # Yahoo Finance external service client
│       └── types.ts         # Shared typescript type definitions
├── tests/                   # Test suite directory
│   ├── brapi/               # BRAPI integration tests
│   ├── db/                  # SQLite repository unit tests
│   └── domain/              # Pricing calculation tests
├── tsconfig.json            # TypeScript compile options
├── vitest.config.ts         # Vitest configuration
├── next.config.ts           # Next.js configuration
├── package.json             # Package scripts and dependencies
├── .env.example             # Env variables template
└── idea.md                  # Project overview text
```

## Directory Purposes

**src/app/api:**
- Purpose: Exposes backend endpoints for frontend UI fetches.
- Contains: `route.ts` handlers, `/assets/[ticker]` subfolders, error mapper (`errors.ts`).
- Subdirectories:
  - `assets/route.ts` - List and register assets.
  - `assets/[ticker]/refresh/route.ts` - Scrapes Live API and updates db.
  - `assets/[ticker]/quote/route.ts` - Overrides ticker price manually.
  - `assets/[ticker]/payouts/route.ts` - Overrides annual payouts manually.

**src/components:**
- Purpose: Contains modular React elements for the browser.
- Contains: `AssetRadar.tsx` representing the entire interactive dashboard page.

**src/lib/db:**
- Purpose: Manages SQLite storage, table setups, and CRUD queries.
- Contains: Connection pooling, schema creation scripts, and repository models.
- Key files:
  - `connection.ts` - Singleton database retriever.
  - `schema.ts` - Database tables structure setup.
  - `assets.ts` - SQL transaction statements for assets, quotes, and payouts.

**src/lib/domain:**
- Purpose: Houses core financial math calculations.
- Contains: pure utility functions for averaging dividends, calculating ceiling prices, and checking boundaries.
- Key files:
  - `pricing.ts` - Preço-Teto equations logic.

**src/lib/services:**
- Purpose: Handles data orchestration, coordinating API fetchers and database updates.
- Contains: Service actions like fetching quotes from multiple sources with failover logic.
- Key files:
  - `assets.ts` - Primary workspace coordinator service.

**tests:**
- Purpose: House test files mirroring the production file tree.
- Subdirectories:
  - `domain/pricing.test.ts` - Tests math logic and status categorization.
  - `db/assets.test.ts` - Tests repository inserts, transaction refreshes, and reads.
  - `brapi/` - Tests API clients and mapping functions.

## Key File Locations

**Entry Points:**
- `src/app/page.tsx` - Initial server rendering entry point.
- `src/app/layout.tsx` - Wraps the document markup.

**Configuration:**
- `tsconfig.json` - TS compiler path mappings (`@/*` -> `./src/*`).
- `next.config.ts` - Next.js compiler settings.
- `vitest.config.ts` - Configures testing environment aliases and plugins.

---

*Structure analysis: 2026-06-14*
*Update when directories are rearranged*
