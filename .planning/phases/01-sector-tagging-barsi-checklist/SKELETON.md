# Walking Skeleton — Preco-Teto Barsi Radar

**Phase:** 1
**Generated:** 2026-06-14

## Capability Proven End-to-End

An investor can select a sector tag for any stock on the dashboard and toggle its qualitative checklist status (e.g. "Profitable") inside an interactive modal, with changes persisting in the local SQLite database.

## Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Framework | Next.js 16.2.x App Router | Standard codebase framework. Enables unified server components and API handlers. |
| Data layer | SQLite via better-sqlite3 | Local, high-performance, synchronous relational storage. Fully satisfies local-first data constraints. |
| Auth | None (Local Single-User Utility) | App runs strictly locally for a single investor. No login or authorization framework needed. |
| Deployment target | Local development / Custom Docker | Local execution on Linux/macOS/Windows, persisting the `price.sqlite` database file. |
| Directory layout | Unified App + Components + Lib | Follows standard Next.js layouts (`src/app/`, `src/components/`, `src/lib/`) to align with existing code patterns. |

## Stack Touched in Phase 1

- [ ] Project scaffold (framework, build, lint, test runner)
- [ ] Routing — at least one real route (`PUT /api/assets/[ticker]/sector` and `GET/PUT /api/assets/[ticker]/checklist`)
- [ ] Database — at least one real read AND one real write (inspect/alter tables, save & fetch asset_checklist, fetch sectors)
- [ ] UI — at least one interactive element wired to the API (Sector select dropdown & interactive Checklist modal)
- [ ] Deployment — running on dev environment OR documented local full-stack run command (`npm run dev`)

## Out of Scope (Deferred to Later Slices)

- **Goal Calculator (Phase 2 / CALC-01, CALC-02)**: Simulating passive income goal targets and share requirements.
- **Dividend Charts (Phase 3 / CHAR-01, CHAR-02)**: Rendering native SVG bar charts for 5-year dividend histories.
- **Automated Syncing (SYNC-01)**: Interfacing broker portfolios.
- **Multi-user Support (AUTH-01)**: Identity and tenant isolation.

## Subsequent Slice Plan

Each later phase adds one vertical slice on top of this skeleton without altering its architectural decisions:

- Phase 2: Passive Income Goal Calculator
- Phase 3: Visual Dividend History Charts
