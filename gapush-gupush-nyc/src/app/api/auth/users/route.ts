import { NextRequest, NextResponse } from "next/server";
import { createUser, findUserByEmail, listUsers } from "@/server/auth";

// Already gated to role 'owner' by src/proxy.ts — this is how an owner
// adds staff (kitchen-only) or additional owner logins without anyone
// needing shell/DB access. There is no public signup anywhere in the app.
export async function GET() {
  return NextResponse.json({ users: await listUsers() });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const role = body?.role === "owner" ? "owner" : "staff";

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "validation", message: "A valid email is required." }, { status: 400 });
  }
  if (password.length < 10) {
    return NextResponse.json(
      { error: "validation", message: "Password must be at least 10 characters." },
      { status: 400 },
    );
  }
  if (await findUserByEmail(email)) {
    return NextResponse.json({ error: "validation", message: "That email already has an account." }, { status: 400 });
  }

  await createUser(email, password, role);
  return NextResponse.json({ ok: true }, { status: 201 });
}
