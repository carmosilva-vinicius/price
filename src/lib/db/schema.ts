import type Database from "better-sqlite3";

export function ensureSchema(db: Database.Database) {
  db.pragma("foreign_keys = ON");
  db.exec(`
    CREATE TABLE IF NOT EXISTS assets (
      ticker TEXT PRIMARY KEY,
      name TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS quotes (
      ticker TEXT PRIMARY KEY,
      price REAL NOT NULL,
      currency TEXT NOT NULL,
      source TEXT NOT NULL CHECK (source IN ('api', 'manual')),
      quoted_at TEXT NOT NULL,
      captured_at TEXT NOT NULL,
      FOREIGN KEY (ticker) REFERENCES assets(ticker) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS annual_payouts (
      ticker TEXT NOT NULL,
      year INTEGER NOT NULL,
      amount REAL NOT NULL,
      source TEXT NOT NULL CHECK (source IN ('api', 'manual')),
      updated_at TEXT NOT NULL,
      PRIMARY KEY (ticker, year),
      FOREIGN KEY (ticker) REFERENCES assets(ticker) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  const columns = db.prepare("PRAGMA table_info(assets)").all() as Array<{ name: string }>;
  const hasSector = columns.some((col) => col.name === "sector");
  if (!hasSector) {
    db.exec("ALTER TABLE assets ADD COLUMN sector TEXT;");
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS asset_checklist (
      ticker TEXT NOT NULL,
      criterion_id TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('yes', 'no', 'unsure')),
      updated_at TEXT NOT NULL,
      PRIMARY KEY (ticker, criterion_id),
      FOREIGN KEY (ticker) REFERENCES assets(ticker) ON DELETE CASCADE
    );
  `);
}

