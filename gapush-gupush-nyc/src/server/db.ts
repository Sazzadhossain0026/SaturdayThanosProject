import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { MENU_ITEMS } from "@/lib/menu-data";

/**
 * ---------------------------------------------------------------------------
 * SIMULATED BACKEND — read this before assuming anything here is "real"
 * ---------------------------------------------------------------------------
 * There is no Supabase project, no Stripe account, and no Twilio account
 * behind this app. This file stands in for a Supabase/Postgres database
 * using SQLite with the *same table shapes* documented in CLAUDE.md, so the
 * schema, the order state machine, and the webhook idempotency patterns are
 * all real and testable — they just don't talk to the real internet.
 *
 * If/when this becomes a real product, this file is what gets replaced by
 * an actual Supabase client; the SQL below is written close enough to
 * Postgres that the migration in CLAUDE.md should port with minimal changes.
 * ---------------------------------------------------------------------------
 */

const DATA_DIR = path.join(process.cwd(), ".data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
const DB_PATH = path.join(DATA_DIR, "gapush.db");

// A single shared connection per server process. better-sqlite3 is
// synchronous, so there is no connection-pool interleaving to worry about —
// every statement below runs to completion before the next one starts,
// which is what makes the inventory fix in inventory.ts actually atomic.
declare global {
  var __gapushDb: Database.Database | undefined;
}

export const db: Database.Database = global.__gapushDb ?? new Database(DB_PATH);
if (!global.__gapushDb) {
  global.__gapushDb = db;
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
}

db.exec(`
CREATE TABLE IF NOT EXISTS counters (
  name TEXT PRIMARY KEY,
  value INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS inventory (
  menu_item_id TEXT PRIMARY KEY,
  quantity_available INTEGER NOT NULL,
  is_limited INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  status TEXT NOT NULL,
  fulfillment TEXT NOT NULL,
  scheduled_time TEXT,
  payment_method TEXT NOT NULL,
  payment_intent_id TEXT,
  subtotal_cents INTEGER NOT NULL,
  tax_cents INTEGER NOT NULL,
  total_cents INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  estimated_ready_at INTEGER NOT NULL,
  is_demo INTEGER NOT NULL DEFAULT 0,
  idempotency_key TEXT UNIQUE
);

CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id TEXT NOT NULL,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price_cents INTEGER NOT NULL,
  line_total_cents INTEGER NOT NULL,
  spice_level TEXT NOT NULL,
  extras_json TEXT NOT NULL,
  instructions TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS payment_intents (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL,
  status TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

-- Idempotency ledger for inbound Stripe webhooks. The UNIQUE constraint on
-- stripe_event_id is the actual fix for "webhook arrives twice": the second
-- insert fails, we detect that, and skip reprocessing.
CREATE TABLE IF NOT EXISTS payment_events (
  stripe_event_id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  payment_intent_id TEXT,
  received_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sms_events (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  to_phone TEXT NOT NULL,
  body TEXT NOT NULL,
  kind TEXT NOT NULL,
  twilio_sid TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

-- Idempotency ledger for inbound Twilio status-callback webhooks.
CREATE TABLE IF NOT EXISTS sms_status_events (
  id TEXT PRIMARY KEY,
  twilio_sid TEXT NOT NULL,
  status TEXT NOT NULL,
  received_at INTEGER NOT NULL,
  UNIQUE(twilio_sid, status)
);

CREATE TABLE IF NOT EXISTS catering_leads (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  event_date TEXT,
  guests TEXT,
  location TEXT,
  budget TEXT,
  preferences TEXT,
  message TEXT,
  created_at INTEGER NOT NULL
);
`);

function seedInventoryIfEmpty() {
  const count = (db.prepare("SELECT COUNT(*) as c FROM inventory").get() as { c: number }).c;
  if (count > 0) return;
  const insert = db.prepare(
    "INSERT INTO inventory (menu_item_id, quantity_available, is_limited) VALUES (?, ?, ?)",
  );
  const seedAll = db.transaction(() => {
    for (const item of MENU_ITEMS) {
      // "Naga Shingara" is deliberately scarce so the race-condition demo
      // (two customers, one last item) has something real to contend over.
      const isLimited = item.id === "naga-shingara";
      insert.run(item.id, isLimited ? 3 : 999, isLimited ? 1 : 0);
    }
  });
  seedAll();
}
seedInventoryIfEmpty();

function seedCounterIfMissing() {
  const row = db.prepare("SELECT value FROM counters WHERE name = 'order_number'").get();
  if (!row) {
    // claimNextOrderNumber() does `value = value + 1` and returns the new
    // value, so seeding 1041 makes the very first claimed order GG-1042.
    db.prepare("INSERT INTO counters (name, value) VALUES ('order_number', ?)").run(1041);
  }
}
seedCounterIfMissing();

export function resetDemoData() {
  const reset = db.transaction(() => {
    db.exec(
      "DELETE FROM sms_status_events; DELETE FROM sms_events; DELETE FROM payment_events; DELETE FROM payment_intents; DELETE FROM order_items; DELETE FROM orders; DELETE FROM catering_leads; DELETE FROM inventory;",
    );
    db.prepare("UPDATE counters SET value = 1041 WHERE name = 'order_number'").run();
  });
  reset();
  seedInventoryIfEmpty();
}
