"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchMe, logoutSession } from "@/lib/api-client";
import type { SessionUser } from "@/server/auth";

/**
 * Shows who's signed in and a logout button. Pages behind the proxy (see
 * src/proxy.ts) are only reachable with a valid session already, so `user`
 * being null here just means this client fetch hasn't resolved yet, not
 * that the visitor is unauthenticated.
 */
export function SessionBar() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    fetchMe()
      .then((res) => setUser(res.user))
      .catch(() => {});
  }, []);

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logoutSession();
    } catch {
      /* cookie clearing on the client proceeds regardless */
    }
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2 text-xs text-white/70">
      {user && (
        <span className="hidden sm:inline">
          {user.email} · <span className="uppercase">{user.role}</span>
        </span>
      )}
      <button
        onClick={handleLogout}
        disabled={loggingOut}
        className="rounded-full bg-white/10 px-3 py-1.5 font-semibold text-white disabled:opacity-50"
      >
        {loggingOut ? "…" : "Log Out"}
      </button>
    </div>
  );
}
