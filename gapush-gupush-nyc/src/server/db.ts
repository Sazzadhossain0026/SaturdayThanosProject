import { Pool, types } from "pg";
import { MENU_ITEMS } from "@/lib/menu-data";

/**
 * ---------------------------------------------------------------------------
 * REAL POSTGRES — this replaced the earlier SQLite-file simulation.
 * ---------------------------------------------------------------------------
 * Run `docker compose up -d` (see docker-compose.yml at the repo root) to
 * start it locally. DATABASE_URL defaults to that compose file's
 * credentials, so a fresh `npm run dev` after `docker compose up -d` just
 * works with no extra config.
 *
 * Stripe and Twilio are still simulated (see mock-stripe.ts / mock-twilio.ts
 * and CLAUDE.md) — only the database became real. If this ever deploys for
 * real, point DATABASE_URL at a hosted Postgres (Supabase, RDS, etc.) —
 * nothing else in this file needs to change.
 * ---------------------------------------------------------------------------
 */

// node-postgres returns BIGINT (OID 20) as a string by default, to avoid
// silently losing precision on values bigger than Number.MAX_SAFE_INTEGER.
// Our BIGINT columns are all epoch-millisecond timestamps (~13 digits),
// nowhere near that ceiling, so converting to a plain number is safe and
// much more convenient than threading strings through every call site.
types.setTypeParser(20, (val: string) => parseInt(val, 10));

const connectionString =
  process.env.DATABASE_URL ??
  "postgresql://gapush:gapush_dev_password@localhost:5433/gapush_gupush";

declare global {
  var __gapushPool: Pool | undefined;
}

export const pool: Pool = global.__gapushPool ?? new Pool({ connectionString });
if (!global.__gapushPool) {
  global.__gapushPool = pool;
}

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS counters (
  name TEXT PRIMARY KEY,
  value INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS inventory (
  menu_item_id TEXT PRIMARY KEY,
  quantity_available INTEGER NOT NULL,
  is_limited BOOLEAN NOT NULL DEFAULT false
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
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL,
  estimated_ready_at BIGINT NOT NULL,
  is_demo BOOLEAN NOT NULL DEFAULT false,
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
  created_at BIGINT NOT NULL
);

-- Idempotency ledger for inbound Stripe webhooks. The UNIQUE constraint on
-- stripe_event_id is the actual fix for "webhook arrives twice": the second
-- insert is ignored, we detect that, and skip reprocessing.
CREATE TABLE IF NOT EXISTS payment_events (
  stripe_event_id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  payment_intent_id TEXT,
  received_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS sms_events (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  to_phone TEXT NOT NULL,
  body TEXT NOT NULL,
  kind TEXT NOT NULL,
  twilio_sid TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL,
  created_at BIGINT NOT NULL
);

-- Idempotency ledger for inbound Twilio status-callback webhooks.
CREATE TABLE IF NOT EXISTS sms_status_events (
  id TEXT PRIMARY KEY,
  twilio_sid TEXT NOT NULL,
  status TEXT NOT NULL,
  received_at BIGINT NOT NULL,
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
  created_at BIGINT NOT NULL
);

-- Auth: staff/owner accounts. Never touched by resetDemoData() — a demo
-- reset clears orders/payments/SMS/catering, not who's allowed to log in.
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL, -- 'owner' | 'staff'
  created_at BIGINT NOT NULL
);

-- Opaque, DB-backed sessions (not JWTs) so a logout or revocation takes
-- effect immediately — deleting the row invalidates the cookie.
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at BIGINT NOT NULL,
  expires_at BIGINT NOT NULL
);

-- Minimal brute-force guard on /api/auth/login.
CREATE TABLE IF NOT EXISTS login_attempts (
  email TEXT PRIMARY KEY,
  failed_count INTEGER NOT NULL DEFAULT 0,
  locked_until BIGINT
);
`;

let schemaReady: Promise<void> | null = null;

export function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = initSchema();
  }
  return schemaReady;
}

async function initSchema(): Promise<void> {
  await pool.query(SCHEMA_SQL);
  await seedInventoryIfEmpty();
  await seedCounterIfMissing();
}

async function seedInventoryIfEmpty(): Promise<void> {
  const { rows } = await pool.query<{ c: string }>("SELECT COUNT(*)::int as c FROM inventory");
  if (Number(rows[0].c) > 0) return;
  for (const item of MENU_ITEMS) {
    // "Naga Shingara" is deliberately scarce so the race-condition demo
    // (two customers, one last item) has something real to contend over.
    const isLimited = item.id === "naga-shingara";
    await pool.query(
      "INSERT INTO inventory (menu_item_id, quantity_available, is_limited) VALUES ($1, $2, $3)",
      [item.id, isLimited ? 3 : 999, isLimited],
    );
  }
}

async function seedCounterIfMissing(): Promise<void> {
  const { rows } = await pool.query("SELECT value FROM counters WHERE name = 'order_number'");
  if (rows.length === 0) {
    // claimNextOrderNumber() does `value = value + 1` and returns the new
    // value, so seeding 1041 makes the very first claimed order GG-1042.
    await pool.query("INSERT INTO counters (name, value) VALUES ('order_number', 1041)");
  }
}

/**
 * Wipes all *demo* data (orders, payments, SMS, catering leads, inventory)
 * and reseeds inventory + the order-number counter. Deliberately does NOT
 * touch users/sessions/login_attempts — resetting the demo should never
 * log the owner out or delete staff accounts.
 */
export async function resetDemoData(): Promise<void> {
  await ensureSchema();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "TRUNCATE sms_status_events, sms_events, payment_events, payment_intents, order_items, orders, catering_leads, inventory",
    );
    await client.query("UPDATE counters SET value = 1041 WHERE name = 'order_number'");
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
  await seedInventoryIfEmpty();
}

/** Simple one-off query helper — ensures the schema exists first. */
export async function query<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  await ensureSchema();
  const result = await pool.query(text, params);
  return result.rows as T[];
}

export interface DbClient {
  query<T = Record<string, unknown>>(
    text: string,
    params?: unknown[],
  ): Promise<{ rows: T[]; rowCount: number | null }>;
}

/**
 * Runs `fn` inside a single Postgres transaction (BEGIN/COMMIT/ROLLBACK on
 * one pooled client). better-sqlite3's db.transaction() let callers nest
 * transactions implicitly via savepoints; plain `pg` doesn't, so instead
 * every server function that needs to participate in a caller's
 * transaction accepts an optional `client` parameter and uses it instead
 * of opening its own — see orders.ts's createOrder() calling
 * reserveInventory(client, ...) for the pattern.
 */
export async function withTransaction<T>(fn: (client: DbClient) => Promise<T>): Promise<T> {
  await ensureSchema();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
