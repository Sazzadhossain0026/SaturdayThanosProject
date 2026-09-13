import { NextResponse } from "next/server";
import { listCustomers } from "@/server/orders";

export async function GET() {
  return NextResponse.json({ customers: listCustomers() });
}
