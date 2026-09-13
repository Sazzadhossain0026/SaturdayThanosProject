import { NextRequest, NextResponse } from "next/server";
import { getOrder, getOrderByNumber } from "@/server/orders";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = getOrder(id) ?? getOrderByNumber(id);
  if (!order) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ order });
}
