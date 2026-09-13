import { NextRequest, NextResponse } from "next/server";
import { createOrder, SoldOutError } from "@/server/orders";
import { CreateOrderInput } from "@/server/types";

export async function POST(request: NextRequest) {
  let body: CreateOrderInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body.customerName?.trim() || !body.phone?.trim()) {
    return NextResponse.json({ error: "validation", message: "Name and phone are required." }, { status: 400 });
  }
  if (!Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ error: "validation", message: "Cart is empty." }, { status: 400 });
  }
  if (body.fulfillment === "scheduled" && !body.scheduledTime) {
    return NextResponse.json(
      { error: "validation", message: "Scheduled pickup requires a time." },
      { status: 400 },
    );
  }

  try {
    const { order, paymentIntent } = createOrder(body);
    return NextResponse.json({ order, paymentIntent }, { status: 201 });
  } catch (err) {
    if (err instanceof SoldOutError) {
      return NextResponse.json(
        { error: "sold_out", menuItemId: err.menuItemId, message: `${err.menuItemId} just sold out.` },
        { status: 409 },
      );
    }
    console.error("checkout failed", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
