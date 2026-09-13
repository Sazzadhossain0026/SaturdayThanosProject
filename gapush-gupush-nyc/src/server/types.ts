export type OrderStatus =
  | "pending_payment"
  | "payment_failed"
  | "confirmed"
  | "preparing"
  | "ready"
  | "completed"
  | "cancelled";

export type FulfillmentType = "asap" | "scheduled";
export type PaymentMethod = "online" | "pickup";

export interface OrderItemInput {
  menuItemId: string;
  quantity: number;
  spiceLevel: string;
  extras: { extraChili: boolean; extraOnion: boolean; extraSauce: boolean; extraTamarind: boolean };
  instructions?: string;
}

export interface CreateOrderInput {
  customerName: string;
  phone: string;
  items: OrderItemInput[];
  fulfillment: FulfillmentType;
  scheduledTime?: string;
  paymentMethod: PaymentMethod;
  isDemo?: boolean;
  /**
   * Client-generated key so a checkout retried after a dropped connection
   * (see lib/api-client.ts submitCheckoutWithRetry) can't create a second
   * order if the first attempt actually succeeded server-side but its
   * response never made it back to the browser.
   */
  idempotencyKey?: string;
}

export interface OrderItemDTO {
  id: string;
  menuItemId: string;
  name: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
  spiceLevel: string;
  extras: OrderItemInput["extras"];
  instructions: string;
}

export interface OrderDTO {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  status: OrderStatus;
  fulfillment: FulfillmentType;
  scheduledTime: string | null;
  paymentMethod: PaymentMethod;
  paymentIntentId: string | null;
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  createdAt: number;
  updatedAt: number;
  estimatedReadyAt: number;
  isDemo: boolean;
  items: OrderItemDTO[];
}
