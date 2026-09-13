import type { APIRequestContext } from "@playwright/test";
import { TEST_ENV } from "../../playwright.config";

export async function resetDemo(request: APIRequestContext) {
  const res = await request.get(`/demo-reset?key=${encodeURIComponent(TEST_ENV.DEMO_RESET_SECRET)}`);
  if (!res.ok()) throw new Error(`demo-reset failed: ${res.status()}`);
}

interface CheckoutItem {
  menuItemId: string;
  quantity: number;
  spiceLevel?: string;
  extras?: { extraChili: boolean; extraOnion: boolean; extraSauce: boolean; extraTamarind: boolean };
  instructions?: string;
}

const NO_EXTRAS = { extraChili: false, extraOnion: false, extraSauce: false, extraTamarind: false };

export function checkoutPayload(overrides: {
  customerName: string;
  phone: string;
  items: CheckoutItem[];
  paymentMethod: "online" | "pickup";
  idempotencyKey?: string;
}) {
  return {
    customerName: overrides.customerName,
    phone: overrides.phone,
    items: overrides.items.map((item) => ({
      menuItemId: item.menuItemId,
      quantity: item.quantity,
      spiceLevel: item.spiceLevel ?? "Mild",
      extras: item.extras ?? NO_EXTRAS,
      instructions: item.instructions ?? "",
    })),
    fulfillment: "asap" as const,
    paymentMethod: overrides.paymentMethod,
    idempotencyKey: overrides.idempotencyKey,
  };
}
