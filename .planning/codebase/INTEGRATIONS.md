# External Integrations

**Analysis Date:** 2026-06-14

## APIs & External Services

**Stock Market Data (Primary):**
- **Yahoo Finance API** - Fetch historical dividend payouts, currency, long/short names, and current prices
  - Integration method: REST API via `fetch`
  - URL pattern: `https://query1.finance.yahoo.com/v8/finance/chart/{ticker}.SA?interval=1d&range=5y&events=div`
  - Auth: Public endpoint (no API key required), but requires a realistic browser `User-Agent` header to avoid blocking
  - Rate limits: Undocumented public limits

**Stock Market Data (Fallback):**
- **BRAPI** - Fallback service to fetch quotes and dividend cash flows if Yahoo Finance fails
  - SDK/Client: REST API via `fetch` in `src/lib/brapi/client.ts`
  - URL pattern: `https://brapi.dev/api/quote/{ticker}?range=5y&interval=1d&fundamental=true&dividends=true`
  - Auth: API key configured in `BRAPI_TOKEN` environment variable
  - Rate limits: Depends on the subscription tier (free tier allows limited requests/minute)

## Data Storage

**Databases:**
- **SQLite (Local Database)** - Embedded database storage for asset records, quotes, annual payouts, and settings
  - Client: `better-sqlite3` npm package (synchronous native SQLite library)
  - Connection: Configured via `PRICE_DB_PATH` environment variable (defaults to `data/price.sqlite` inside the project root)
  - Migrations: Programmatic initialization via `ensureSchema()` in `src/lib/db/schema.ts` which runs `CREATE TABLE IF NOT EXISTS` commands on database connection retrieval.

## Authentication & Identity

- **None** - Local dashboard. No user authentication, login providers, or JWT tokens are currently implemented.

## Monitoring & Observability

- **None** - Application logs are sent directly to standard output (`stdout` / `stderr`) via `console.error` and `console.log`.

## CI/CD & Deployment

- **None** - No CI pipelines (e.g., GitHub Actions) or deployment configurations are defined in the workspace.

## Environment Configuration

**Development:**
- Required Env Vars:
  - `BRAPI_TOKEN` - Optional for primary Yahoo fetches, but required for BRAPI fallback fetches.
  - `PRICE_DB_PATH` - Optional. Overrides the default SQLite database path.
- Secrets Location:
  - Local configuration stored in `.env.local` (which is excluded in `.gitignore`).

---

*Integration audit: 2026-06-14*
*Update when adding/removing external services*
