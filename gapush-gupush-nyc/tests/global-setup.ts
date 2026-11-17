import { Client } from "pg";

/**
 * Tests run against their own Postgres database (gapush_gupush_test), not
 * the one a developer might have open in `npm run dev` — otherwise running
 * the suite would wipe whatever demo data someone was looking at (every
 * spec calls /demo-reset). Postgres can't create a database with CREATE
 * DATABASE IF NOT EXISTS or inside a transaction, so this checks first.
 */
const ADMIN_URL = "postgresql://gapush:gapush_dev_password@localhost:5433/gapush_gupush";
const TEST_DB_NAME = "gapush_gupush_test";

export default async function globalSetup() {
  const client = new Client({ connectionString: ADMIN_URL });
  await client.connect();
  try {
    const { rows } = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [TEST_DB_NAME]);
    if (rows.length === 0) {
      await client.query(`CREATE DATABASE ${TEST_DB_NAME}`);
    }
  } finally {
    await client.end();
  }
}
