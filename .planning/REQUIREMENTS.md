# Project Requirements

## v1 Requirements (Active)

### Sector Tagging & Filters (SECT)

- [x] **SECT-01**: **Database Schema Migration**: Alter the SQLite `assets` table to add a nullable `sector` TEXT column in a safe, repeatable migration.
- [x] **SECT-02**: **Backend Update Service & API**: Expose a `PUT /api/assets/[ticker]/sector` endpoint to assign a sector tag to an asset.
- [x] **SECT-03**: **BESST Filters in UI**: Implement a dashboard dropdown filter to select "All", "BESST Sectors Only", or individual sectors, displaying BESST indicators.

### Barsi Qualitative Checklist (CHK)

- [x] **CHK-01**: **Checklist Database Schema**: Create `asset_checklist` table to store status (yes/no/unsure) for each standard Barsi criterion per stock.
- [x] **CHK-02**: **Backend Checklist APIs**: Create `GET /api/assets/[ticker]/checklist` and `PUT /api/assets/[ticker]/checklist` endpoints to retrieve and persist stock checklist answers.
- [x] **CHK-03**: **Interactive Checklist UI**: Render a modal overlay in the dashboard allowing users to view and toggle checklist items for any tracked asset, updating the database state synchronously.

## v2 Requirements (Deferred)

### Passive Income Goal Calculator (CALC)

- **CALC-01**: Add a simulation widget inside `AssetRadar` where the user enters a monthly income goal (e.g. R$ 1,500/month).
- **CALC-02**: Calculate the number of shares needed, cost to purchase, and projected progress based on the asset's 5-year average annual payout.

### Visual Dividend Charts (CHAR)

- **CHAR-01**: Draw a native SVG bar chart displaying the 5-year historical dividend payouts for a selected asset.
- **CHAR-02**: Highlight outlier years (atypical payouts) directly in the chart to prevent dividend trap miscalculations.

## Out of Scope

- **SYNC-01**: Automated broker connection — excluded because keeping logins and scraping credentials local increases security risk and maintenance complexity.
- **AUTH-01**: Multi-user accounts — excluded because the app is designed for local single-user developer usage.

## Traceability

| Requirement ID | Phase / Plan | Status |
|----------------|--------------|--------|
| SECT-01 | Phase 1 | Complete |
| SECT-02 | Phase 1 | Complete |
| SECT-03 | Phase 1 | Complete |
| CHK-01 | Phase 1 | Complete |
| CHK-02 | Phase 1 | Complete |
| CHK-03 | Phase 1 | Complete |
