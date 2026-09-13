import { NextRequest, NextResponse } from "next/server";
import { applyKitchenAction, InvalidTransitionError, OrderNotFoundError } from "@/server/orders";

const VALID_ACTIONS = ["accept", "ready", "complete"] as const;

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const action = body?.action;

  if (!VALID_ACTIONS.includes(action)) {
    return NextResponse.json({ error: "validation", message: `action must be one of ${VALID_ACTIONS.join(", ")}` }, { status: 400 });
  }

  try {
    const order = applyKitchenAction(id, action);
    return NextResponse.json({ order });
  } catch (err) {
    if (err instanceof OrderNotFoundError) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    if (err instanceof InvalidTransitionError) {
      // This is the guard that stops "kitchen marks ready before payment
      // confirms" — an order still in pending_payment has no `ready`
      // transition from it, so this 409 is the correct, expected outcome,
      // not a bug.
      return NextResponse.json(
        { error: "invalid_transition", message: err.message, currentStatus: err.from },
        { status: 409 },
      );
    }
    console.error("kitchen action failed", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
