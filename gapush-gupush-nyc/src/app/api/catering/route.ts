import { NextRequest, NextResponse } from "next/server";
import { createCateringLead, listCateringLeads } from "@/server/catering";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body?.name?.trim() || !body?.phone?.trim() || !body?.email?.trim()) {
    return NextResponse.json({ error: "validation" }, { status: 400 });
  }
  const lead = createCateringLead(body);
  return NextResponse.json({ lead }, { status: 201 });
}

export async function GET() {
  return NextResponse.json({ leads: listCateringLeads() });
}
