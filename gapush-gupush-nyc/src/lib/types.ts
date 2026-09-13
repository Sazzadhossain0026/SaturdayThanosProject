export type MenuCategory =
  | "Popular"
  | "Chap"
  | "Fuchka & Chotpoti"
  | "Street Snacks"
  | "Drinks";

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  categories: MenuCategory[];
  description: string;
  emoji: string;
  gradient: string;
  popular?: boolean;
  spicy?: boolean;
}

export type SpiceLevel = "Mild" | "Medium" | "Hot" | "Bangladeshi Hot";

export interface CartExtras {
  extraChili: boolean;
  extraOnion: boolean;
  extraSauce: boolean;
  extraTamarind: boolean;
}

export interface CartLine {
  lineId: string;
  menuItemId: string;
  name: string;
  emoji: string;
  gradient: string;
  basePrice: number;
  spiceLevel: SpiceLevel;
  extras: CartExtras;
  quantity: number;
  instructions: string;
  unitPrice: number;
  lineTotal: number;
}

// Order/Customer/CateringLead types used to live here as a client-only
// localStorage model. That model is gone — the server (src/server/*) is now
// the single source of truth for orders, customers, and catering leads.
// Import OrderDTO / OrderStatus from "@/server/types" (type-only) instead.
export type FulfillmentType = "asap" | "scheduled";
export type PaymentMethod = "online" | "pickup";

export interface ToastMessage {
  id: string;
  kind: "sms" | "info" | "success" | "review";
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
}
