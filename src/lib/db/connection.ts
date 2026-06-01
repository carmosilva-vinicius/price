import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { ensureSchema } from "@/lib/db/schema";

let db: Database.Database | null = null;

export function getDatabase() {
  if (db) {
    return db;
  }

  const dbPath = process.env.PRICE_DB_PATH ?? join(process.cwd(), "data", "price.sqlite");
  mkdirSync(dirname(dbPath), { recursive: true });
  db = new Database(dbPath);
  ensureSchema(db);
  return db;
}
