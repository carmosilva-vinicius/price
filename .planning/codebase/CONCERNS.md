# Codebase Concerns

**Analysis Date:** 2026-06-14

## Tech Debt

**Synchronous SQLite Execution:**
- Issue: Database CRUD operations are executed synchronously using `better-sqlite3` (`db.prepare().run()`, `db.transaction()`).
- Why: Simple local dashboard setup with zero async promise overhead.
- Impact: Blocks the Node.js event loop during database operations. If the application scales to support multiple concurrent users, this will degrade response latency.
- Fix approach: Keep for single-user local runs. If transitioning to a multi-user service, migrate to an asynchronous client (e.g., SQLite via `sqlite3` npm library, PostgreSQL, or Turso).

**Monolithic Frontend UI State:**
- Issue: `AssetRadar.tsx` handles table rendering, add/delete forms, manual overrides, inline quote drafts, and background refresh polling in a single file (~380 lines).
- Why: Rapid prototyping of the single-page radar application.
- Impact: Difficult to read and modify. Enhancing the override form or adding charts increases complexity and risks regression.
- Fix approach: Split the component into smaller subcomponents (e.g., `AssetTable`, `AssetRow`, `AddAssetForm`, `PayoutEditModal`).

## Known Bugs

- **Yahoo Finance API Drift:** The Yahoo Finance query endpoint (`query1.finance.yahoo.com`) is unofficial and subject to sudden changes in response formatting or User-Agent blocking. If Yahoo changes its JSON path structures, stock refreshes will fail.
- **Hardcoded Currency:** The application hardcodes `"BRL"` in multiple locations (e.g. `currency = "BRL"` in `refreshAsset` and manual quote updates). If international stocks are imported, their metrics may be displayed incorrectly as Reais (BRL).

## Security Considerations

**API Key Transmission:**
- Risk: The `BRAPI_TOKEN` secret is transmitted as a query parameter in URLs (`?token=...`). If URL strings are printed in server logs, proxy records, or error stack traces, the API key may be exposed.
- Current mitigation: The query parameter is only sent from the server-side environment (Next.js route handler to BRAPI servers). It is not exposed to the browser.
- Recommendations: Check if BRAPI supports authorization headers (e.g. `Authorization: Bearer <token>`) and update the client fetch function to pass it securely.

**Database Input Sanitization:**
- Current mitigation: All SQL statements in `src/lib/db/assets.ts` use parameterized query placeholders (`?`) to prevent SQL injection.
- Recommendations: Maintain this strict pattern. Avoid dynamic string interpolation inside raw queries.

## Performance Bottlenecks

**Synchronous External API Requests:**
- Problem: The `/api/assets/[ticker]/refresh` route makes blocking external network requests to Yahoo Finance and BRAPI within the request context.
- Measurement: Average response times can range from 800ms to 2.5s depending on external API response latency.
- Cause: Synchronous network chain (Fetch Yahoo -> Fail -> Fetch BRAPI -> Save to DB).
- Improvement path: Introduce caching with short TTLs or perform refreshes asynchronously in background worker processes, returning an immediate "queued" status to the client.

## Fragile Areas

**Yahoo Dividend Year Mapping:**
- Why fragile: Extracted by converting Epoch seconds to UTCFullYear: `new Date(dateSeconds * 1000).getUTCFullYear()`.
- Common failures: Timezone drift on boundaries (e.g., a payment scheduled on Dec 31st UTC might fall into a different local calendar year).
- Safe modification: Standardize dates to ISO strings before performing calendar calculations.

**Fallback Cascade Logic:**
- Why fragile: BRAPI fallback only executes if Yahoo Finance throws an exception OR the returned price is explicitly null. If Yahoo returns a stale price or zero payouts, BRAPI is not queried.
- Test coverage: Partially tested under mock environments (`tests/brapi/client.test.ts`).

## Scaling Limits

**Serverless SQLite Storage:**
- Current capacity: Single-user local host database file (`price.sqlite`).
- Limit: Serverless hosting environments (like Vercel or AWS Lambda) have ephemeral file systems. SQLite database modifications are lost whenever the container restarts.
- Scaling path: Must be deployed to a persistent server (VPS, VM, Docker container with persistent volumes) or migrated to a cloud SQLite provider like Turso.

## Missing Critical Features

- **Automated Background Refresh:** No background scheduler (cron or worker) is configured. Stock prices and dividends only update when a user manually clicks the refresh buttons.
- **Historic Dividend Charts:** Math results are printed in a textual grid. There are no visual charts (bar/line graphs) tracking payouts over the 5-year calculation span.

## Test Coverage Gaps

**Frontend Component Tests:**
- What's not tested: User interface events (clicking buttons, entering custom quotes in the inputs, saving manual inputs) are not covered by Vitest/JSDOM.
- Risk: Changes in the UI code might break data sync hooks unnoticed.
- Priority: Medium.
- Difficulty to test: Requires setting up UI wrapper tests using `@testing-library/react` or E2E tests using Playwright.

---

*Concerns audit: 2026-06-14*
*Update as issues are fixed or new ones discovered*
