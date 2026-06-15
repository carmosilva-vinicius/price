# Preco-Teto Barsi Radar

## What This Is

A local dashboard and decision tool for Brazilian stock market investors based on Luiz Barsi's dividend-focused investment philosophy. It helps users track stock prices, aggregate historical dividends, calculate Preço-Teto (ceiling price) targets, and identify discounted assets to generate passive income.

## Core Value

Identify highly discounted stocks that pay reliable dividends to maximize the user's long-term passive income yield.

## Requirements

### Validated

- ✓ Local SQLite database storage and programmatic schema setup — existing
- ✓ Yahoo Finance and BRAPI data fetching with automatic fallback — existing
- ✓ Luiz Barsi Preço-Teto (ceiling price) and status calculations (discounted, near, expensive) — existing
- ✓ Interactive frontend stock radar and manual override controls — existing
- ✓ Core domain and repository unit tests with Vitest — existing

### Active

- [x] BESST Sector Classification: Tag stocks by Barsi's BESST sectors (*Bancos, Energia, Saneamento, Seguros, Telecom*) and filter/sort the dashboard by these categories.
- [x] SQLite-backed Barsi Checklist: Pre-populate stocks with default Barsi checklist items (sustainable payout, stable debt, history of profit) stored in the SQLite database and editable per asset in the UI.
- [ ] Passive Income Goal & Share Calculator: Allow users to specify target monthly passive income and calculate the number of shares and total capital required to achieve it.
- [ ] Visual Dividend History Charts: Display a visual 5-year dividend history bar chart for individual stocks to identify growth or decline trends.

### Out of Scope

- Multi-user authentication — kept local-only to maintain simplicity, privacy, and ease of setup.
- Automated broker synchronization — users manually trigger refreshes or input overrides.

## Context

Luiz Barsi's strategy focuses on building a "future guarantee portfolio" of dividend-paying stocks. The application was built as a local Next.js dashboard using a SQLite file (`data/price.sqlite`) to store assets, quotes, and payouts. The codebase includes programmatic schema migration and fallback stock scraping logic, but needs extensions to support qualitative sector tagging, goal tracking, and visual graphs.

## Constraints

- **Storage**: Must utilize local SQLite file storage via the native synchronous `better-sqlite3` library.
- **Frontend**: Built using Next.js App Router and React 19 Client Components styled with vanilla CSS.
- **Environment**: Dependent on `BRAPI_TOKEN` for fallback scans and standard Node.js native compilation environment.

## Key Decisions

| Implement Option 1 (BESST Sectors & Checklist) first | Establishes the database schemas, UI grids, and filter hooks needed before layering calculators and charts. | — Complete (Phase 1) |
| Store Barsi Checklist in SQLite database | Enables persistency and allows customization of checklist answers per asset, rather than hardcoding static rules in the UI. | — Complete (Phase 1) |
| Sequential Checklist & Sector Save Lifecycle | Minimizes REST calls and keeps UI state synchronized by saving both qualitative updates under one transaction-like flow. | — Complete (Phase 1) |
| Native Dialog Modal Overlay | Uses HTML5 <dialog> with conditional mounting guard to ensure clean accessibility support and proper component-state unmounting. | — Complete (Phase 1) |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-06-14 after initialization*
