<!-- GSD:project-start source:PROJECT.md -->

## Project

**Preco-Teto Barsi Radar**

A local dashboard and decision tool for Brazilian stock market investors based on Luiz Barsi's dividend-focused investment philosophy. It helps users track stock prices, aggregate historical dividends, calculate Preço-Teto (ceiling price) targets, and identify discounted assets to generate passive income.

**Core Value:** Identify highly discounted stocks that pay reliable dividends to maximize the user's long-term passive income yield.

### Constraints

- **Storage**: Must utilize local SQLite file storage via the native synchronous `better-sqlite3` library.
- **Frontend**: Built using Next.js App Router and React 19 Client Components styled with vanilla CSS.
- **Environment**: Dependent on `BRAPI_TOKEN` for fallback scans and standard Node.js native compilation environment.

<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->

## Technology Stack

## Languages

- TypeScript 6.0.x - All application code and type definitions (`src/`, `tests/`)
- CSS - Styling (`globals.css`, `page.module.css`)

## Runtime

- Node.js 20.x or higher - Next.js server-side environment and local development
- Browser environment - React components execution
- npm 10.x
- Lockfile: `package-lock.json` present

## Frameworks

- Next.js 16.2.x - Full-stack framework (App Router architecture)
- React 19.2.x - UI library with React Server Components (RSC) and Client Components
- Vitest 4.1.x - Test runner and assertion library
- JSDOM 29.1.x - Browser environment emulation for component testing
- @testing-library/react 16.3.x - UI component testing utilities
- @testing-library/jest-dom 6.9.x - DOM assertion matchers for tests
- TypeScript 6.0.x - Typechecking and compilation
- Next.js Compiler - Rust-based compiler for Next.js app bundling

## Key Dependencies

- `better-sqlite3` 12.10.x - C++ SQLite3 wrapper for high-performance synchronous local database access
- `zod` 4.4.x - Schema declaration and validation library (used for API responses and inputs validation)
- Node.js standard library - `fs`, `path` for database initialization and directory operations

## Configuration

- `.env.local` - Local developer variables (gitignored)
- `.env.example` - Example template containing configuration variables:
- `tsconfig.json` - TypeScript compile-time configurations and import path mapping (`@/*` to `./src/*`)
- `next.config.ts` - Next.js framework configuration
- `vitest.config.ts` - Vitest configuration mapping plugins and alias setup

## Platform Requirements

- macOS, Linux, or Windows (platforms supporting Node.js and C++ native compilation for `better-sqlite3`)
- Node.js >= 20.0.0
- Standard Node.js environment supporting native dependencies (`better-sqlite3` requires compilation/binary compatibility)
- Deployment target: Custom Node.js server, VPS, or Docker container (Vercel has serverless limitations with local SQLite files unless using writeless/read-only, so Docker or persistent VM is preferred due to SQLite storage needs).

<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

## Naming Patterns

- **React Components:** PascalCase (`AssetRadar.tsx`)
- **Modules & Libs:** lowercase or kebab-case (`assets.ts`, `pricing.ts`, `connection.ts`)
- **Next.js Conventions:** lowercase special files (`page.tsx`, `layout.tsx`, `route.ts`, `globals.css`, `page.module.css`)
- **Test files:** `*.test.ts` placed inside a dedicated `tests/` directory matching the path of the source file.
- **Standard Functions:** camelCase (`listAssetRows`, `refreshAsset`, `calculateAssetMetrics`, `normalizeTicker`)
- **Utility Formatters:** camelCase (`money`, `percent`)
- **Event Handlers:** camelCase (`handleDelete`, `onSave`)
- **Instance Variables:** camelCase (`assets`, `ticker`, `isCreating`)
- **Constants:** UPPER_SNAKE_CASE (`DEFAULT_TARGET_YIELD`, `NEAR_LIMIT`, `TARGET_YIELD`)
- **References:** camelCase suffixes for references (`busyTickersRef`, `manualSaveSequenceRef`)
- **Types/Interfaces:** PascalCase (`AssetRow`, `StoredAsset`, `StoredAnnualPayout`, `ApiRefreshInput`, `DataSource`, `EconomicStatus`, `AssetMetrics`)
- No special prefix (like `I`) for interfaces or types.

## Code Style

- **Indent:** 2 spaces.
- **Semicolons:** Required.
- **Quotes:** Double quotes preferred for strings, imports, and CSS modules where applicable (`import styles from "@/app/page.module.css";`, `currency = "BRL"`). Single quotes also used depending on file consistency.
- **Line Length:** Kept clean under 120 characters to preserve readability.
- **Path Aliases:** Uses `@/*` path mapping to reference the `./src/*` directory, avoiding deep relative path nesting (e.g., `import { getDatabase } from "@/lib/db/connection"`).
- **Order:**

## Error Handling

- Database operations are executed using **synchronous** prepared statements since `better-sqlite3` is synchronous. No async/await handles are needed in repository files.
- Route handlers wrap business operations in `try/catch` blocks.
- Caught errors are structured and returned as standardized JSON payloads via custom helper converters (e.g., `apiResponseError` from `src/app/api/errors.ts`).
- APIs try-catch HTTP calls individually, logging warning descriptors using `console.error` to support graceful fallbacks before ultimately throwing an API failure exception when all attempts fail.

## Functional Domain Segregation

- **Pure Functions:** Business math logic (Luiz Barsi formula, averages, economic classifications) are strictly pure functions isolated in `src/lib/domain/pricing.ts` with no network, DB, or clock dependencies. They are highly testable.
- **IO Side-effects:** Side-effects (retrievals, edits, updates) are cleanly isolated inside `/lib/db`, `/lib/yahoo`, `/lib/brapi`, and `/lib/services`.

<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

## Pattern Overview

- **Hybrid Rendering:** Server-rendered initial pages (`src/app/page.tsx`) with client-side interactive React components (`src/components/AssetRadar.tsx`).
- **Synchronous Persistence:** Uses synchronous `better-sqlite3` operations on the server side, avoiding asynchronous DB overhead.
- **Service-Oriented backend:** Explicit separation between API controllers, orchestrating services, pure domain logic, and database repositories.
- **Failover Data Fetching:** Multi-tier client integration that prioritizes Yahoo Finance and falls back to BRAPI.

## Layers

- Purpose: Render the dashboard, manage user interactions, input draft states, and trigger state refreshes.
- Contains: `src/components/AssetRadar.tsx` (Client component)
- Depends on: Next.js frontend router and styling files (`page.module.css`)
- Used by: `src/app/page.tsx`
- Purpose: Expose JSON endpoints for asset operations, parse request bodies, validate input types, and return HTTP status codes.
- Contains: `src/app/api/assets/route.ts`, `src/app/api/assets/[ticker]/refresh/route.ts`, etc.
- Depends on: Services Layer (`src/lib/services/assets.ts`)
- Used by: Frontend UI component fetches
- Purpose: Orchestrate use cases, handle integrations failover, combine repository operations, and maps data formats.
- Contains: `src/lib/services/assets.ts`
- Depends on: Database Repository (`src/lib/db/assets.ts`), External Clients (`src/lib/yahoo/`, `src/lib/brapi/`), Domain Logic (`src/lib/domain/pricing.ts`)
- Used by: API Handlers, Page Server Components
- Purpose: Pure, side-effect-free mathematical functions implementing Barsi's Preço-Teto (ceiling price) calculations and asset classification.
- Contains: `src/lib/domain/pricing.ts`
- Depends on: None (only core types)
- Used by: Services Layer
- Purpose: Encapsulate database interactions using prepared SQLite statements and transaction execution.
- Contains: `src/lib/db/assets.ts`
- Depends on: Database Connection (`src/lib/db/connection.ts`), Schema (`src/lib/db/schema.ts`)
- Used by: Services Layer

## Data Flow

### 1. Asset Refresh Flow (HTTP POST)

### 2. Initial Page Load (SSR)

### State Management:

- **Persistent State:** Contained in the local SQLite database (`price.sqlite`).
- **Transient UI State:** React `useState` hooks inside `AssetRadar.tsx` representing ticker inputs, filtering options, user message alerts, and processing statuses.

## Key Abstractions

- Encapsulates database read and write access behind a clean TypeScript API interface, hiding SQL statement details.
- Encapsulates Luiz Barsi's algorithm formulas:

## Entry Points

- `src/app/page.tsx` - Handles the initial route rendering.
- `src/app/api/assets/route.ts` - Retrieves all assets or registers a new ticker.
- `src/app/api/assets/[ticker]/refresh/route.ts` - Pulls live data and updates database state.
- `src/app/api/assets/[ticker]/quote/route.ts` - Manages manual stock price overrides.
- `src/app/api/assets/[ticker]/payouts/route.ts` - Manages manual annual dividend overrides.

## Error Handling

- Individual client errors (e.g., Yahoo Finance timeout) are caught and logged using `console.error` to allow fallback execution.
- If both external providers fail to retrieve a price, a standard `Error` is thrown, which propagates to the API layer.
- Standardized error mapping via `/api/errors.ts` returning JSON objects with clear messages (e.g., `400 Bad Request` or `500 Internal Server Error`).

<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->

## Project Skills

No project skills found. Add skills to any of: `.agent/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:

- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
