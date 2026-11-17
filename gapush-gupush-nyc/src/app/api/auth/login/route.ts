import { NextRequest, NextResponse } from "next/server";
import { login, SESSION_COOKIE } from "@/server/auth";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email.trim() || !password) {
    return NextResponse.json({ error: "validation", message: "Email and password are required." }, { status: 400 });
  }

  const result = await login(email, password);
  if (!result.ok) {
    const message =
      result.error === "locked_out"
        ? "Too many failed attempts. Try again in 15 minutes."
        : "Incorrect email or password.";
    return NextResponse.json({ error: result.error, message }, { status: 401 });
  }

  const res = NextResponse.json({ user: result.user });
  res.cookies.set(SESSION_COOKIE, result.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days, matches the session's own expiry
  });
  return res;
}
