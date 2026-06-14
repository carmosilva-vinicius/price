# Testing Patterns

**Analysis Date:** 2026-06-14

## Test Framework

**Runner:**
- **Vitest 4.1.x** - Configured with ESM support and typescript execution out of the box.
- Configured in `vitest.config.ts` located in the project root.

**Assertion Library:**
- Built-in Vitest assertions (`expect()`, `describe()`, `it()`, `vi()`).

**Run Commands:**
```bash
npm run test           # Executes vitest run --passWithNoTests (single run)
npm run test:watch     # Executes vitest (watch mode)
npx vitest tests/db/assets.test.ts # Executes a single test file
```

## Test File Organization

**Location:**
- Test files reside in a dedicated `/tests` directory in the project root.
- The structure mirrors the production application library:
  - `tests/domain/pricing.test.ts` (tests `src/lib/domain/pricing.ts`)
  - `tests/db/assets.test.ts` (tests `src/lib/db/assets.ts`)
  - `tests/brapi/client.test.ts` (tests `src/lib/brapi/client.ts`)
  - `tests/brapi/mapper.test.ts` (tests `src/lib/brapi/mapper.ts`)

## Test Structure & Mocking Patterns

### 1. Pure Domain Logic tests
- Focus on verifying Barsi Preço-Teto mathematics and classification rules under various inputs.
- Simple, sync executions passing custom inputs (e.g. payout lists and current price) and matching the output metrics object structure.
- Example:
  ```typescript
  expect(calculateAssetMetrics({ currentPrice: 10, annualPayouts: [{ year: 2025, amount: 1 }] })).toEqual({
    dataState: "partial",
    economicStatus: "expensive",
    // ...
  });
  ```

### 2. Database Integration tests
- **In-Memory Isolation:** Every database test suite sets up a temporary in-memory database instance (`new Database(":memory:")`) and invokes `ensureSchema(db)` before running assertions. This ensures fast execution and zero interference with the actual local `price.sqlite` database file.
- **Transactional Verification:** Test suites explicitly assert that API updates transactionally store quotes and payout records while correctly preserving manual overrides.
- **Schema Constraints:** Asserts that SQLite constraints, such as foreign key checks (`foreign_keys = ON`), are active and throw expected database errors on violation.

### 3. API Integration and Network Mocking
- **Mocking Globals:** Utilizes `vi.stubGlobal("fetch", fetchMock)` to capture external calls to Yahoo Finance and BRAPI.
- **Environment Mocking:** Utilizes `vi.stubEnv("BRAPI_TOKEN", "mock-token")` to test behavior with or without tokens.
- **Teardown:** Each suite cleans up after itself in `afterEach()` to prevent leakages across tests:
  ```typescript
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });
  ```
- **Fallback Verification:** Checks that if the first query fails (e.g., status 400), the clients retry using fallbacks.

---

*Testing patterns audit: 2026-06-14*
*Update when introducing new test strategies or frameworks*
