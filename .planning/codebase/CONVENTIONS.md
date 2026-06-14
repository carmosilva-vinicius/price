# Coding Conventions

**Analysis Date:** 2026-06-14

## Naming Patterns

**Files:**
- **React Components:** PascalCase (`AssetRadar.tsx`)
- **Modules & Libs:** lowercase or kebab-case (`assets.ts`, `pricing.ts`, `connection.ts`)
- **Next.js Conventions:** lowercase special files (`page.tsx`, `layout.tsx`, `route.ts`, `globals.css`, `page.module.css`)
- **Test files:** `*.test.ts` placed inside a dedicated `tests/` directory matching the path of the source file.

**Functions:**
- **Standard Functions:** camelCase (`listAssetRows`, `refreshAsset`, `calculateAssetMetrics`, `normalizeTicker`)
- **Utility Formatters:** camelCase (`money`, `percent`)
- **Event Handlers:** camelCase (`handleDelete`, `onSave`)

**Variables:**
- **Instance Variables:** camelCase (`assets`, `ticker`, `isCreating`)
- **Constants:** UPPER_SNAKE_CASE (`DEFAULT_TARGET_YIELD`, `NEAR_LIMIT`, `TARGET_YIELD`)
- **References:** camelCase suffixes for references (`busyTickersRef`, `manualSaveSequenceRef`)

**Types:**
- **Types/Interfaces:** PascalCase (`AssetRow`, `StoredAsset`, `StoredAnnualPayout`, `ApiRefreshInput`, `DataSource`, `EconomicStatus`, `AssetMetrics`)
- No special prefix (like `I`) for interfaces or types.

## Code Style

**Formatting:**
- **Indent:** 2 spaces.
- **Semicolons:** Required.
- **Quotes:** Double quotes preferred for strings, imports, and CSS modules where applicable (`import styles from "@/app/page.module.css";`, `currency = "BRL"`). Single quotes also used depending on file consistency.
- **Line Length:** Kept clean under 120 characters to preserve readability.

**Import Organization:**
- **Path Aliases:** Uses `@/*` path mapping to reference the `./src/*` directory, avoiding deep relative path nesting (e.g., `import { getDatabase } from "@/lib/db/connection"`).
- **Order:**
  1. React core hooks and React imports
  2. Next.js modules and components
  3. External dependencies (`better-sqlite3`, `zod`)
  4. Alias-based internal libraries (`@/lib/services/assets`, `@/components/AssetRadar`)
  5. Relative files (`./style.css`)
  6. Type-only imports (`import type { DataSource } from "@/lib/types"`)

## Error Handling

**Database Operations:**
- Database operations are executed using **synchronous** prepared statements since `better-sqlite3` is synchronous. No async/await handles are needed in repository files.

**API Route Boundaries:**
- Route handlers wrap business operations in `try/catch` blocks.
- Caught errors are structured and returned as standardized JSON payloads via custom helper converters (e.g., `apiResponseError` from `src/app/api/errors.ts`).

**Integration Clients:**
- APIs try-catch HTTP calls individually, logging warning descriptors using `console.error` to support graceful fallbacks before ultimately throwing an API failure exception when all attempts fail.

## Functional Domain Segregation

- **Pure Functions:** Business math logic (Luiz Barsi formula, averages, economic classifications) are strictly pure functions isolated in `src/lib/domain/pricing.ts` with no network, DB, or clock dependencies. They are highly testable.
- **IO Side-effects:** Side-effects (retrievals, edits, updates) are cleanly isolated inside `/lib/db`, `/lib/yahoo`, `/lib/brapi`, and `/lib/services`.

---

*Convention analysis: 2026-06-14*
*Update when conventions or rules are updated*
