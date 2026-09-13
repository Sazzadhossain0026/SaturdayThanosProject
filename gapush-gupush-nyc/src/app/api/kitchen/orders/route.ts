import { NextResponse } from "next/server";
import { listOrders } from "@/server/orders";

export async function GET() {
  return NextResponse.json({ orders: listOrders() });
}
