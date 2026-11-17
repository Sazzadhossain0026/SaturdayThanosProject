"use client";

import { useEffect, useState } from "react";
import { createStaffUser, fetchStaffUsers } from "@/lib/api-client";
import { ApiError } from "@/lib/api-client";
import { formatDateTime } from "@/lib/format";
import type { PublicUser, Role } from "@/server/auth";

/**
 * Owner-only (gated by src/proxy.ts). There's no public signup anywhere in
 * the app — this is the one place new staff/owner logins get created.
 */
export default function StaffAccountsPage() {
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("staff");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [justCreated, setJustCreated] = useState<string | null>(null);

  async function load() {
    try {
      const { users } = await fetchStaffUsers();
      setUsers(users);
      setLoadError(null);
    } catch {
      setLoadError("Couldn't load staff accounts.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { users } = await fetchStaffUsers();
        if (cancelled) return;
        setUsers(users);
        setLoadError(null);
      } catch {
        if (!cancelled) setLoadError("Couldn't load staff accounts.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setFormError(null);
    setJustCreated(null);
    try {
      await createStaffUser({ email, password, role });
      setJustCreated(email);
      setEmail("");
      setPassword("");
      setRole("staff");
      await load();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Couldn't create that account.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold text-brand-ink">Staff Accounts</h1>
      <p className="text-sm text-brand-ink/50">
        Owners get full dashboard access; staff can only use the kitchen view.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-5 grid gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 sm:grid-cols-[2fr_2fr_1fr_auto]"
      >
        <div>
          <label className="text-xs font-semibold text-brand-ink/50">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-brand-orange"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-brand-ink/50">Temporary Password</label>
          <input
            type="text"
            required
            minLength={10}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 10 characters"
            className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-brand-orange"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-brand-ink/50">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-brand-orange"
          >
            <option value="staff">Staff</option>
            <option value="owner">Owner</option>
          </select>
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-brand-orange px-4 py-2.5 text-sm font-bold text-white shadow-sm disabled:opacity-50 sm:w-auto"
          >
            {submitting ? "Adding…" : "Add Account"}
          </button>
        </div>

        {formError && (
          <p className="col-span-full rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">
            ⚠️ {formError}
          </p>
        )}
        {justCreated && !formError && (
          <p className="col-span-full rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-600">
            ✅ Created {justCreated} — share the temporary password with them directly; it won&apos;t be shown
            again here.
          </p>
        )}
      </form>

      {loadError && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">⚠️ {loadError}</p>}

      <div className="mt-5 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/5 text-left text-xs font-semibold text-brand-ink/40 uppercase">
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Created</th>
            </tr>
          </thead>
          <tbody>
            {!loading && users.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-brand-ink/40">
                  No accounts yet.
                </td>
              </tr>
            )}
            {users.map((u) => (
              <tr key={u.id} className="border-b border-black/5 last:border-0">
                <td className="px-4 py-3 font-semibold text-brand-ink">{u.email}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase ${
                      u.role === "owner" ? "bg-brand-orange/10 text-brand-orange-dark" : "bg-brand-teal-light text-brand-teal"
                    }`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-brand-ink/50">{formatDateTime(u.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
