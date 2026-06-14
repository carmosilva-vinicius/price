# Stack Research

**Domain:** Stock market pricing dashboard and qualitative analytics
**Researched:** 2026-06-14
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| React 19 / Next.js 16 | ^19.2.6 / ^16.2.6 | Full-stack application runtime | Matches existing codebase; provides Server Components and client-side hooks. |
| SQLite / better-sqlite3 | ^12.10.0 | Local relational data persistence | Native, fast, synchronous database engine. Perfect for single-user local storage. |
| Zod | ^4.4.3 | Data validation | Validates external API payloads and incoming manual inputs. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Native React SVG Components | N/A | High-performance charting and visualization | Use to render 5-year dividend histories without importing bulky/incompatible charting libraries in React 19. |
| lucide-react | ^0.450.0 | UI iconography | To display dashboard icons (arrows, checks, sector icons) consistently. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Vitest | Unit/Integration test runner | Leverages existing Vitest setup under `/tests` for regression testing DB and Domain changes. |

## Installation

```bash
# Core (Already installed in project)
# npm install next react react-dom better-sqlite3 zod

# Supporting
npm install lucide-react
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Native SVG Charts | Recharts / Chart.js | Use if advanced interactive tooltips, panning, zooming, or multi-axis charts are needed. Custom SVG is preferred here because it guarantees 100% compatibility with React 19 and avoids package bloat. |
| Programmatic SQL Migrations | Prisma / Drizzle | Use if the application schema becomes highly complex with dozens of relational tables. For 4-5 tables, `better-sqlite3` native exec statements keep the setup lean. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| TailwindCSS | Not requested by user; current styling uses vanilla CSS Modules. | Vanilla CSS Modules (`page.module.css`) |
| Ephemeral serverless filesystem deployments | Vercel Serverless Functions recycle local SQLite databases on timeout. | Persistent hosting (VPS, VM, Docker volume) or external SQLite service (Turso). |

## Stack Patterns by Variant

**If offline/no BRAPI Token:**
- Use Manual Override endpoints.
- Because users must still be able to input quotes and payouts manually even without internet access or valid tokens.

**If React 19 Dependency Warnings:**
- Prefer native SVG rendering for charts.
- Because it has zero external dependencies, is lightweight, and will never trigger peer dependency blockages during `npm install`.

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| better-sqlite3@12.10.x | Node.js 20+ | Requires native C++ compilation during installation. |
| React@19.2.x | next@16.2.x | Standard Next.js 16 peer dependencies. |

---
*Stack research: 2026-06-14*
