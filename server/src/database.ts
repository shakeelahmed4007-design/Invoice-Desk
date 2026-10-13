import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
export function openDatabase(filename: string) {
  if (filename !== ':memory:') mkdirSync(dirname(filename), { recursive: true });
  const db = new Database(filename);
  db.pragma('foreign_keys = ON');
  db.pragma('journal_mode = WAL');
  db.pragma('busy_timeout = 5000');
  db.exec(`
    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY,
      invoice_number TEXT NOT NULL,
      vendor_name TEXT NOT NULL,
      amount INTEGER NOT NULL CHECK (typeof(amount) = 'integer' AND amount >= 0),
      currency TEXT NOT NULL CHECK (length(currency) = 3),
      invoice_date TEXT NOT NULL,
      due_date TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('processing','needs_review','approved','rejected')),
      duplicate_of_id INTEGER REFERENCES invoices(id),
      flag_reason TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      decided_at TEXT,
      decision_note TEXT,
      CHECK (duplicate_of_id IS NULL OR duplicate_of_id <> id),
      CHECK ((status IN ('approved','rejected') AND decided_at IS NOT NULL)
          OR (status IN ('processing','needs_review') AND decided_at IS NULL))
    );
    CREATE INDEX IF NOT EXISTS invoices_status_created ON invoices(status, created_at DESC);
    CREATE INDEX IF NOT EXISTS invoices_duplicate_key ON invoices(lower(trim(vendor_name)), lower(trim(invoice_number)), amount);
    CREATE TABLE IF NOT EXISTS app_metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL);
  `);
  return db;
}
