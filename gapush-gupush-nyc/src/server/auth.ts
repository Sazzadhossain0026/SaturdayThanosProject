import crypto from "crypto";
import bcrypt from "bcryptjs";
import { query } from "./db";

/**
 * ---------------------------------------------------------------------------
 * AUTH — real sessions backed by Postgres, not JWTs.
 * ---------------------------------------------------------------------------
 * Sessions are opaque random tokens stored in the `sessions` table (not
 * self-contained JWTs) specifically so a logout, or an owner revoking a
 * staff account, takes effect immediately — deleting the row invalidates
 * every cookie referencing it, with no "wait for the token to expire"
 * window a stateless JWT would have.
 *
 * There is no public signup. Accounts are created by an existing owner
 * (see /api/auth/users) or by the one-time default-owner seed below — this
 * is staff tooling, not a customer-facing feature.
 * ---------------------------------------------------------------------------
 */

export type Role = "owner" | "staff";

export interface SessionUser {
  id: string;
  email: string;
  role: Role;
}

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const LOGIN_MAX_FAILURES = 5;
const LOGIN_LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes
export const SESSION_COOKIE = "gg_session";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  role: Role;
  created_at: number;
}

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const rows = await query<UserRow>("SELECT * FROM users WHERE email = $1", [email.toLowerCase().trim()]);
  return rows[0] ?? null;
}

export type PublicUser = Omit<UserRow, "password_hash">;

export async function listUsers(): Promise<PublicUser[]> {
  return query<PublicUser>("SELECT id, email, role, created_at FROM users ORDER BY created_at ASC");
}

export async function createUser(email: string, password: string, role: Role): Promise<void> {
  const id = crypto.randomUUID();
  const passwordHash = await hashPassword(password);
  await query(
    "INSERT INTO users (id, email, password_hash, role, created_at) VALUES ($1, $2, $3, $4, $5)",
    [id, email.toLowerCase().trim(), passwordHash, role, Date.now()],
  );
}

let defaultOwnerSeeded: Promise<void> | null = null;

/**
 * Seeds exactly one 'owner' account the first time the app runs against a
 * fresh database — otherwise there would be no way to log in at all. Safe
 * to call repeatedly; it no-ops once any user exists. Change
 * OWNER_EMAIL/OWNER_PASSWORD (and rebuild/restart) before this is anything
 * but a local demo — see CLAUDE.md → "Auth".
 */
export function ensureDefaultOwner(): Promise<void> {
  if (!defaultOwnerSeeded) {
    defaultOwnerSeeded = (async () => {
      const existing = await query<{ c: string }>("SELECT COUNT(*)::int as c FROM users");
      if (Number(existing[0].c) > 0) return;
      const email = process.env.OWNER_EMAIL ?? "owner@gapushgupush.nyc";
      const password = process.env.OWNER_PASSWORD ?? "ChangeMe123!";
      await createUser(email, password, "owner");
      console.warn(
        `[auth] Seeded default owner account ${email}. This is a demo default — set OWNER_EMAIL/OWNER_PASSWORD and rebuild before using this anywhere but local dev.`,
      );
    })();
  }
  return defaultOwnerSeeded;
}

async function isLockedOut(email: string): Promise<boolean> {
  const rows = await query<{ locked_until: number | null }>(
    "SELECT locked_until FROM login_attempts WHERE email = $1",
    [email.toLowerCase().trim()],
  );
  const lockedUntil = rows[0]?.locked_until;
  return Boolean(lockedUntil && lockedUntil > Date.now());
}

async function recordFailedLogin(email: string): Promise<void> {
  const normalized = email.toLowerCase().trim();
  const rows = await query<{ failed_count: number }>(
    "SELECT failed_count FROM login_attempts WHERE email = $1",
    [normalized],
  );
  const nextCount = (rows[0]?.failed_count ?? 0) + 1;
  const lockedUntil = nextCount >= LOGIN_MAX_FAILURES ? Date.now() + LOGIN_LOCKOUT_MS : null;
  await query(
    `INSERT INTO login_attempts (email, failed_count, locked_until) VALUES ($1, $2, $3)
     ON CONFLICT (email) DO UPDATE SET failed_count = $2, locked_until = $3`,
    [normalized, nextCount, lockedUntil],
  );
}

async function clearFailedLogins(email: string): Promise<void> {
  await query("DELETE FROM login_attempts WHERE email = $1", [email.toLowerCase().trim()]);
}

export type LoginResult =
  | { ok: true; token: string; user: SessionUser }
  | { ok: false; error: "locked_out" | "invalid_credentials" };

export async function login(email: string, password: string): Promise<LoginResult> {
  await ensureDefaultOwner();

  if (await isLockedOut(email)) {
    return { ok: false, error: "locked_out" };
  }

  const user = await findUserByEmail(email);
  // Always run bcrypt.compare, even against a dummy hash, so a login
  // attempt for a nonexistent email takes the same amount of time as one
  // for a real email with a wrong password — otherwise response timing
  // alone reveals which emails have accounts.
  const valid = user
    ? await verifyPassword(password, user.password_hash)
    : await verifyPassword(password, "$2a$12$CwTycUXWue0Thq9StjUM0uJ8zHZtkIieJJx8XkV7qR8j8ZQxvZq9S");

  if (!user || !valid) {
    await recordFailedLogin(email);
    return { ok: false, error: "invalid_credentials" };
  }

  await clearFailedLogins(email);
  const token = crypto.randomBytes(32).toString("hex");
  const now = Date.now();
  await query("INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES ($1, $2, $3, $4)", [
    token,
    user.id,
    now,
    now + SESSION_TTL_MS,
  ]);
  return { ok: true, token, user: { id: user.id, email: user.email, role: user.role } };
}

export async function logout(token: string): Promise<void> {
  await query("DELETE FROM sessions WHERE token = $1", [token]);
}

export async function getSessionUser(token: string | undefined | null): Promise<SessionUser | null> {
  if (!token) return null;
  const rows = await query<{ id: string; email: string; role: Role; expires_at: number }>(
    `SELECT u.id, u.email, u.role, s.expires_at
     FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.token = $1`,
    [token],
  );
  const row = rows[0];
  if (!row) return null;
  if (row.expires_at < Date.now()) {
    await query("DELETE FROM sessions WHERE token = $1", [token]);
    return null;
  }
  return { id: row.id, email: row.email, role: row.role };
}
