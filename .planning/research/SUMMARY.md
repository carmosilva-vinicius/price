# Project Research Summary

**Project:** Preco-Teto Barsi Radar
**Domain:** Stock market pricing dashboard and qualitative analytics
**Researched:** 2026-06-14
**Confidence:** HIGH

## Executive Summary

The goal of this project update is to integrate qualitative analysis features (BESST sector filtering, a Barsi Checklist) and quantitative simulators/visualizations (Goal Calculator, SVG Payout Charts) into the existing Barsi Stock Radar.

We recommend a phased approach that keeps database dependencies lean. By altering the `assets` table to support `sector` tagging and creating a lightweight relation `asset_checklist` table, we can track qualitative criteria in SQLite. Charts will be drawn using pure React SVG tags to bypass React 19 charting framework incompatibilities and keep the application lightweight.

Key risks include SQLite migration conflicts on duplicate app startup cycles and "dividend traps" (inflated averages from cyclical outlier years). We mitigate the migration risk by querying column existence before altering tables, and the dividend trap risk by presenting a checklist and displaying explicit 5-year bar visualizers.

## Key Findings

### Recommended Stack

Our stack leverages the existing Next.js, React 19, Zod, and `better-sqlite3` technologies. To display graphs without library conflicts in React 19, we recommend **native React SVG components**.

**Core technologies:**
- Next.js 16 / React 19: Application framework and components.
- SQLite (better-sqlite3): Local persistence.
- React SVGs: Clean rendering of dividend history charts.
- Lucide React: Dashboard icons.

### Expected Features

**Must have (table stakes):**
- Sector Tagging & Filters: Group and filter stocks by sector, particularly highlighting Barsi's "BESST" defensive categories.
- Barsi checklist: Qualitative checklist per asset (debt, profit history, payout consistency) saved in SQLite.

**Should have (competitive):**
- Passive Income Simulator: Calculator to estimate shares and capital required to generate target monthly dividends.
- SVG Payout Charts: Visual 5-year dividend bar graph.

### Architecture Approach

A monolithic, full-stack design utilizing Next.js API endpoints on the server side and React Client Components on the client side. State is stored locally in the SQLite database file and mapped in the service layers.

**Major components:**
1. Database Repository Schema (`schema.ts`): Creates tables and runs safe columns initialization.
2. API handlers: JSON controllers for tagging sectors and saving/retrieving checklist rows.
3. Interactive UI dashboard: Form overlays and rendering SVGs based on data tables.

### Critical Pitfalls

1. **ALTER TABLE crashes:** Handled by check-before-alter scripting in schema setup.
2. **Dividend average skewing:** Mitigated by visual year graphs and Barsi Checklist constraints.
3. **React 19 hydration issues:** Solved by static viewBox SVGs or mounting checks.

---
*Summary compiled: 2026-06-14*
