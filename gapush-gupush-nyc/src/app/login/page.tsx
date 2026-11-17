"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.message ?? "Couldn't sign in.");
        return;
      }
      // Staff accounts only have kitchen access — land them there instead
      // of bouncing off an /admin redirect they can't get past.
      const destination = body.user?.role === "staff" && next.startsWith("/admin") ? "/kitchen" : next;
      router.push(destination);
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4 py-12">
      <div className="text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-orange to-brand-orange-dark text-2xl shadow-sm">
          🔥
        </span>
        <h1 className="font-display mt-4 text-2xl font-extrabold text-brand-ink">Staff Sign In</h1>
        <p className="mt-1 text-sm text-brand-ink/50">Gapush Gupush NYC — owner & kitchen access only.</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
        <div>
          <label className="text-xs font-semibold text-brand-ink/50">Email</label>
          <input
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-xl border border-black/10 px-3 py-3 text-sm outline-none focus:border-brand-orange"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-brand-ink/50">Password</label>
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-xl border border-black/10 px-3 py-3 text-sm outline-none focus:border-brand-orange"
          />
        </div>

        {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">⚠️ {error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-2xl bg-brand-orange py-3.5 font-bold text-white shadow-md disabled:opacity-50 active:scale-[0.98]"
        >
          {submitting ? "Signing in…" : "Sign In"}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-brand-ink/40">
        Customers don&apos;t need an account —{" "}
        <a href="/menu" className="font-semibold text-brand-teal">
          order here instead
        </a>
        .
      </p>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
