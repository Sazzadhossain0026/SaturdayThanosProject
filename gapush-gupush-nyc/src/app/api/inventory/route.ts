import { NextResponse } from "next/server";
import { getInventorySnapshot } from "@/server/inventory";

export async function GET() {
  return NextResponse.json({ inventory: getInventorySnapshot() });
}
