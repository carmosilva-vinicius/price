# Technology Stack

**Analysis Date:** 2026-06-14

## Languages

**Primary:**
- TypeScript 6.0.x - All application code and type definitions (`src/`, `tests/`)

**Secondary:**
- CSS - Styling (`globals.css`, `page.module.css`)

## Runtime

**Environment:**
- Node.js 20.x or higher - Next.js server-side environment and local development
- Browser environment - React components execution

**Package Manager:**
- npm 10.x
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- Next.js 16.2.x - Full-stack framework (App Router architecture)
- React 19.2.x - UI library with React Server Components (RSC) and Client Components

**Testing:**
- Vitest 4.1.x - Test runner and assertion library
- JSDOM 29.1.x - Browser environment emulation for component testing
- @testing-library/react 16.3.x - UI component testing utilities
- @testing-library/jest-dom 6.9.x - DOM assertion matchers for tests

**Build/Dev:**
- TypeScript 6.0.x - Typechecking and compilation
- Next.js Compiler - Rust-based compiler for Next.js app bundling

## Key Dependencies

**Critical:**
- `better-sqlite3` 12.10.x - C++ SQLite3 wrapper for high-performance synchronous local database access
- `zod` 4.4.x - Schema declaration and validation library (used for API responses and inputs validation)

**Infrastructure:**
- Node.js standard library - `fs`, `path` for database initialization and directory operations

## Configuration

**Environment:**
- `.env.local` - Local developer variables (gitignored)
- `.env.example` - Example template containing configuration variables:
  - `BRAPI_TOKEN` - Token for fetching stock info from BRAPI
  - `PRICE_DB_PATH` - Path to the SQLite database file (falls back to `data/price.sqlite`)

**Build:**
- `tsconfig.json` - TypeScript compile-time configurations and import path mapping (`@/*` to `./src/*`)
- `next.config.ts` - Next.js framework configuration
- `vitest.config.ts` - Vitest configuration mapping plugins and alias setup

## Platform Requirements

**Development:**
- macOS, Linux, or Windows (platforms supporting Node.js and C++ native compilation for `better-sqlite3`)
- Node.js >= 20.0.0

**Production:**
- Standard Node.js environment supporting native dependencies (`better-sqlite3` requires compilation/binary compatibility)
- Deployment target: Custom Node.js server, VPS, or Docker container (Vercel has serverless limitations with local SQLite files unless using writeless/read-only, so Docker or persistent VM is preferred due to SQLite storage needs).

---

*Stack analysis: 2026-06-14*
*Update after major dependency changes*
