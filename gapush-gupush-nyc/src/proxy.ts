import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, SESSION_COOKIE, type Role } from "@/server/auth";

/**
 * Proxy (Next.js 16's renamed `middleware.ts` — see CLAUDE.md "Auth" for
 * why this file is `proxy.ts` and not `middleware.ts`) defaults to the
 * Node.js runtime in this version, so it can talk to Postgres directly —
 * every protected request's session is validated against the real
 * `sessions` table here, not just "is some cookie present."
 *
 * This is the actual access-control boundary for customer data: before
 * this file existed, /admin, /kitchen, and the customer-list API routes
 * were reachable by anyone with the URL.
 */

type RequiredRole = Role | "owner-or-staff" | null;

function requiredRole(pathname: string, method: string): RequiredRole {
  if (pathname.startsWith("/admin")) return "owner";
  if (pathname.startsWith("/kitchen")) return "owner-or-staff";
  if (pathname.startsWith("/api/customers")) return "owner";
  if (pathname.startsWith("/api/auth/users")) return "owner";
  if (pathname === "/api/catering" && method === "GET") return "owner"; // leads list — POST (public submission) stays open
  if (pathname.startsWith("/api/kitchen")) return "owner-or-staff";
  return null;
}

function roleSatisfies(required: RequiredRole, role: Role): boolean {
  if (required === null) return true;
  if (required === "owner-or-staff") return role === "owner" || role === "staff";
  return role === required;
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const required = requiredRole(pathname, request.method);
  if (!required) return NextResponse.next();

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const user = await getSessionUser(token);
  const isApi = pathname.startsWith("/api/");

  if (!user || !roleSatisfies(required, user.role)) {
    if (isApi) {
      return NextResponse.json({ error: "unauthorized" }, { status: user ? 403 : 401 });
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/kitchen/:path*", "/api/customers/:path*", "/api/catering", "/api/kitchen/:path*", "/api/auth/users/:path*"],
};
