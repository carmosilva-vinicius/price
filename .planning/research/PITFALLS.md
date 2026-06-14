# Pitfalls Research

**Domain:** Stock market pricing dashboard and qualitative analytics
**Researched:** 2026-06-14
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: SQLite ALTER COLUMN Crash on Startup

**What goes wrong:**
Adding the `sector` column to the `assets` table throws a "duplicate column name: sector" error on application startup after the migration has run once.

**Why it happens:**
`better-sqlite3` execution scripts run synchronously on database boot. If a migration script contains raw `ALTER TABLE assets ADD COLUMN sector TEXT` and executes every time `getDatabase()` is retrieved, it crashes the app from the second boot onward.

**How to avoid:**
Check if the column exists using SQLite `PRAGMA table_info` before running the ALTER command:
```typescript
const columns = db.prepare("PRAGMA table_info(assets)").all() as Array<{ name: string }>;
const hasSector = columns.some(col => col.name === "sector");
if (!hasSector) {
  db.exec("ALTER TABLE assets ADD COLUMN sector TEXT");
}
```

**Warning signs:**
App starts fine on the first run after code change, but crashes on reload or subsequent test runs.

**Phase to address:**
Phase 1 (Database and Schema initialization).

---

### Pitfall 2: Dividend Traps and Atypical Payout Skew

**What goes wrong:**
Calculating a simple mathematical average over 5 years yields an inflated Preço-Teto for cyclical stocks that paid a massive one-off dividend (e.g., from an asset sale or liquidation) but are now paying very little.

**Why it happens:**
 Luiz Barsi's average formula: `Preço-Teto = (Average Payout over 5 years) / 0.06`. A single year with R$ 10.00 payout and four years of R$ 0.00 yields an average of R$ 2.00, suggesting a ceiling price of R$ 33.33, even though the company is no longer paying dividends.

**How to avoid:**
- Implement the **Barsi Checklist** (specifically checking payout stability).
- In the **Visual Chart**, display the individual payout per year clearly so the user can easily spot outliers.
- Optionally add a warning badge if a single year accounts for >50% of the total 5-year payout.

**Warning signs:**
Cyclical companies (like mining or retail) showing up as highly discounted, yet their current yields are near zero.

**Phase to address:**
Phase 2 (Visual Charts and Checklist Integration).

---

### Pitfall 3: Hydration Mismatch in SVG Charting

**What goes wrong:**
Server-rendered Next.js pages display standard HTML, but when React hydrates on the client, charts using dynamic size calculations throw console warnings ("Text content does not match server-rendered HTML").

**Why it happens:**
Next.js SSR runs on the Node server where screen size is unknown, while the client attempts to resize SVG widths using window metrics.

**How to avoid:**
Use static relative percentage dimensions and `viewBox` coordinates on SVG elements (e.g., `viewBox="0 0 100 50"` and `width="100%"`), or delay chart rendering until the component mounts by using a state variable (`isMounted`) initialized to `false` and set to `true` in a `useEffect` hook.

**Warning signs:**
Console errors stating "Hydration failed" or flashes of layout shift where charts jump in size.

**Phase to address:**
Phase 2 (Charts Implementation).

---
*Pitfalls research: 2026-06-14*
