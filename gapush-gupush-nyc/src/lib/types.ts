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

export type OrderStatus = "received" | "preparing" | "ready" | "completed";

export type FulfillmentType = "asap" | "scheduled";
export type PaymentMethod = "online" | "pickup";

export interface Order {
  id: string;
  customerName: string;
  phone: string;
  items: CartLine[];
  subtotal: number;
  tax: number;
  total: number;
  fulfillment: FulfillmentType;
  scheduledTime?: string;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  createdAt: number;
  estimatedReadyAt: number;
  isDemo?: boolean;
  reviewRequested?: boolean;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderAt: number;
  favoriteItem: string;
}

export interface CateringLead {
  id: string;
  name: string;
  phone: string;
  email: string;
  eventDate: string;
  guests: string;
  location: string;
  budget: string;
  preferences: string;
  message: string;
  createdAt: number;
}

export interface ToastMessage {
  id: string;
  kind: "sms" | "info" | "success" | "review";
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
}
