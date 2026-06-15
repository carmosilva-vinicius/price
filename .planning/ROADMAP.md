# Roadmap: Preco-Teto Barsi Radar

## Overview

Introduce qualitative analysis (BESST sector filtering, qualitative checklist) and quantitative simulators/visualizations (Passive Income Simulator, SVG Payout Charts) to Luiz Barsi's Stock Radar to help the user identify high-yielding defensive stocks and track financial goals.

## Phases

- [x] **Phase 1: Sector Tagging & Barsi Checklist** - Categorize assets by sector and track qualitative criteria in SQLite.
- [ ] **Phase 2: Passive Income Goal Calculator** - Build share/capital requirements simulator based on average payouts.
- [ ] **Phase 3: Visual Dividend History Charts** - Render native React SVG dividend bar charts to visualize trends.

## Phase Details

### Phase 1: Sector Tagging & Barsi Checklist

**Goal:** As a stock investor, I want to categorize my stocks by sector and fill out a Barsi checklist, so that I can identify discounted defensive assets.
**Mode:** mvp
**Depends on:** Nothing (first phase)
**Requirements:** SECT-01, SECT-02, SECT-03, CHK-01, CHK-02, CHK-03
**Success Criteria**:

  1. User can assign a sector tag (e.g. "Energia", "Bancos", "Varejo") to any stock on the dashboard.
  2. User can filter the dashboard to display only defensive "BESST" sectors.
  3. User can open a Barsi Checklist modal for any asset, toggle standard qualitative criteria, and save inputs which persist in SQLite.

**Plans:** 2/2 plans executed
Plans:

- [x] 01-01: SQLite schema migrations and sector/checklist update API endpoints
- [x] 01-02: Dashboard UI dropdown filters and Checklist modal integration

### Phase 2: Passive Income Goal Calculator

**Goal:** Enable simulation of passive income targets and display of target share counts based on average annual payout.
**Mode:** mvp
**Depends on:** Phase 1
**Requirements:** CALC-01, CALC-02
**Success Criteria**:

  1. User can enter a target monthly passive income goal (e.g. R$ 2,000) for a selected stock.
  2. User can view the number of shares and total capital required at the current price to generate that income.

**Plans:** 1 plan

Plans:

- [ ] 02-01: Build and integrate the client-side calculator simulator inside the UI

### Phase 3: Visual Dividend History Charts

**Goal:** Display 5-year dividend history visually as an SVG bar chart.
**Mode:** mvp
**Depends on:** Phase 2
**Requirements:** CHAR-01, CHAR-02
**Success Criteria**:

  1. User can view a visual 5-year dividend payout chart for a selected asset.
  2. Chart highlights outlier years or dividend traps (volatile payouts).

**Plans:** 1 plan

Plans:

- [ ] 03-01: Implement native React SVG dividend bar charts and integration in detail drawer/view

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Sector & Checklist | v1.0 | 2/2 | Complete | 2026-06-15 |
| 2. Goal Calculator | v1.0 | 0/1 | Not started | - |
| 3. Visual Charts | v1.0 | 0/1 | Not started | - |
