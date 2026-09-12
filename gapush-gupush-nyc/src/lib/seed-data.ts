import { buildCartLine } from "./cart";
import { getMenuItem, MENU_ITEMS, TAX_RATE } from "./menu-data";
import { CateringLead, Customer, Order, SpiceLevel } from "./types";

// Deterministic seeded RNG (mulberry32) so server & client render identically.
function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(19420326);

const CUSTOMER_POOL: { name: string; phone: string }[] = [
  { name: "Rahim Ahmed", phone: "(347) 555-0114" },
  { name: "Karim Uddin", phone: "(718) 555-0199" },
  { name: "Fatema Begum", phone: "(646) 555-0132" },
  { name: "Anika Rahman", phone: "(917) 555-0187" },
  { name: "Tanvir Islam", phone: "(347) 555-0161" },
  { name: "Nusrat Jahan", phone: "(718) 555-0143" },
  { name: "Sabbir Hossain", phone: "(929) 555-0176" },
  { name: "Mitu Akter", phone: "(646) 555-0128" },
  { name: "Jashim Uddin", phone: "(347) 555-0155" },
  { name: "Ruma Khatun", phone: "(718) 555-0190" },
  { name: "Farhan Kabir", phone: "(917) 555-0121" },
  { name: "Shirin Sultana", phone: "(646) 555-0167" },
  { name: "Imran Chowdhury", phone: "(347) 555-0182" },
  { name: "Lima Akhter", phone: "(718) 555-0139" },
  { name: "Omar Faruk", phone: "(929) 555-0148" },
  { name: "Nasima Begum", phone: "(646) 555-0173" },
  { name: "Habibur Rahman", phone: "(347) 555-0159" },
  { name: "Rakib Hasan", phone: "(718) 555-0196" },
];

const SPICE_OPTIONS: SpiceLevel[] = ["Mild", "Medium", "Hot", "Bangladeshi Hot"];

// Weighted item ids so top sellers line up with the insights leaderboard.
const WEIGHTED_ITEM_IDS = [
  "beef-chap",
  "beef-chap",
  "beef-chap",
  "fuchka",
  "fuchka",
  "fuchka",
  "chicken-chap",
  "chicken-chap",
  "special-jhalmuri",
  "special-jhalmuri",
  "chotpoti",
  "chotpoti",
  "orosh-biryani",
  "doi-fuchka",
  "jhal-muri",
  "bhel-puri",
  "naga-shingara",
  "chanachur-makha",
  "patenga-piyaji",
  "mini-fuchka",
  "cha",
  "soda-water",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function buildOrderNumber(n: number): string {
  return `GG-${n}`;
}

const NOW = (() => {
  // Fixed "now" anchor so seed data + demo counter is stable across renders.
  const d = new Date();
  d.setHours(19, 30, 0, 0);
  return d.getTime();
})();

export const DEMO_ANCHOR_TIME = NOW;

function randomOrderItems() {
  const numItems = rng() < 0.65 ? 1 : rng() < 0.85 ? 2 : 3;
  const lines = [];
  for (let i = 0; i < numItems; i++) {
    const itemId = pick(WEIGHTED_ITEM_IDS);
    const item = getMenuItem(itemId)!;
    const spice = item.spicy ? pick(SPICE_OPTIONS) : "Mild";
    const qty = rng() < 0.8 ? 1 : 2;
    const extras = {
      extraChili: Boolean(item.spicy) && rng() < 0.15,
      extraOnion: rng() < 0.12,
      extraSauce: rng() < 0.1,
      extraTamarind:
        (itemId.includes("fuchka") || itemId === "chotpoti") && rng() < 0.2,
    };
    lines.push(buildCartLine(item, spice, extras, qty, ""));
  }
  return lines;
}

function generateHistoricalOrders(): Order[] {
  const orders: Order[] = [];
  const totalOrders = 38;
  // Status distribution for the remaining 4 "waiting" orders (34 completed).
  const waitingStatuses: Order["status"][] = [
    "received",
    "preparing",
    "preparing",
    "ready",
  ];

  for (let i = 0; i < totalOrders; i++) {
    const orderNum = 1004 + i;
    const isWaiting = i >= totalOrders - 4;
    const status: Order["status"] = isWaiting
      ? waitingStatuses[i - (totalOrders - 4)]
      : "completed";
    const customer = pick(CUSTOMER_POOL);
    const items = randomOrderItems();
    const subtotal = Math.round(
      items.reduce((s, l) => s + l.lineTotal, 0) * 100,
    ) / 100;
    const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
    const total = Math.round((subtotal + tax) * 100) / 100;
    // Spread creation times through today, most recent orders are the "waiting" ones.
    const minutesAgo = isWaiting
      ? (totalOrders - i) * 6
      : (totalOrders - i) * 14 + 20;
    const createdAt = NOW - minutesAgo * 60 * 1000;

    orders.push({
      id: buildOrderNumber(orderNum),
      customerName: customer.name,
      phone: customer.phone,
      items,
      subtotal,
      tax,
      total,
      fulfillment: "asap",
      paymentMethod: rng() < 0.55 ? "online" : "pickup",
      status,
      createdAt,
      estimatedReadyAt: createdAt + 20 * 60 * 1000,
      reviewRequested: status === "completed",
    });
  }
  return orders;
}

function normalizeToTarget(orders: Order[], targetSum: number): Order[] {
  const rawSum = orders.reduce((s, o) => s + o.total, 0);
  const scale = targetSum / rawSum;
  const scaled = orders.map((o) => {
    const subtotal = Math.round(o.subtotal * scale * 100) / 100;
    const tax = Math.round(o.tax * scale * 100) / 100;
    const total = Math.round((subtotal + tax) * 100) / 100;
    return { ...o, subtotal, tax, total };
  });
  const drift =
    Math.round((targetSum - scaled.reduce((s, o) => s + o.total, 0)) * 100) /
    100;
  if (drift !== 0) {
    const last = scaled[scaled.length - 1];
    last.total = Math.round((last.total + drift) * 100) / 100;
  }
  return scaled;
}

export const SEED_ORDERS: Order[] = normalizeToTarget(
  generateHistoricalOrders(),
  487,
);
export const SEED_NEXT_ORDER_NUMBER = 1042;

// ---------------- CRM ----------------
export const SEED_CUSTOMERS: Customer[] = [
  {
    id: "cust-rahim",
    name: "Rahim Ahmed",
    phone: "(347) 555-0114",
    totalOrders: 12,
    totalSpent: 184,
    lastOrderAt: NOW - 2 * 24 * 60 * 60 * 1000,
    favoriteItem: "Beef Chap",
  },
  {
    id: "cust-karim",
    name: "Karim Uddin",
    phone: "(718) 555-0199",
    totalOrders: 9,
    totalSpent: 121,
    lastOrderAt: NOW - 5 * 24 * 60 * 60 * 1000,
    favoriteItem: "Chicken Chap",
  },
  {
    id: "cust-fatema",
    name: "Fatema Begum",
    phone: "(646) 555-0132",
    totalOrders: 15,
    totalSpent: 237,
    lastOrderAt: NOW - 1 * 24 * 60 * 60 * 1000,
    favoriteItem: "Fuchka",
  },
  {
    id: "cust-anika",
    name: "Anika Rahman",
    phone: "(917) 555-0187",
    totalOrders: 6,
    totalSpent: 78,
    lastOrderAt: NOW - 9 * 24 * 60 * 60 * 1000,
    favoriteItem: "Special Jhalmuri",
  },
  {
    id: "cust-tanvir",
    name: "Tanvir Islam",
    phone: "(347) 555-0161",
    totalOrders: 21,
    totalSpent: 342,
    lastOrderAt: NOW - 3 * 60 * 60 * 1000,
    favoriteItem: "Beef Chap",
  },
  {
    id: "cust-nusrat",
    name: "Nusrat Jahan",
    phone: "(718) 555-0143",
    totalOrders: 4,
    totalSpent: 46,
    lastOrderAt: NOW - 14 * 24 * 60 * 60 * 1000,
    favoriteItem: "Chotpoti",
  },
  {
    id: "cust-sabbir",
    name: "Sabbir Hossain",
    phone: "(929) 555-0176",
    totalOrders: 8,
    totalSpent: 103,
    lastOrderAt: NOW - 6 * 24 * 60 * 60 * 1000,
    favoriteItem: "Orosh Biryani",
  },
];

// ---------------- Catering leads ----------------
export const SEED_CATERING_LEADS: CateringLead[] = [
  {
    id: "cat-1",
    name: "Nadia Islam",
    phone: "(347) 555-0128",
    email: "nadia.islam@example.com",
    eventDate: "2026-10-03",
    guests: "80",
    location: "Jamaica, Queens NY",
    budget: "$1,200",
    preferences: "Beef Chap, Biryani, Fuchka station",
    message: "Engagement party — need a fuchka live station if possible.",
    createdAt: NOW - 2 * 24 * 60 * 60 * 1000,
  },
  {
    id: "cat-2",
    name: "Community Center of Astoria",
    phone: "(718) 555-0155",
    email: "events@astoriacc.example.com",
    eventDate: "2026-11-14",
    guests: "150",
    location: "Astoria, Queens NY",
    budget: "$2,500",
    preferences: "Mixed menu, vegetarian options needed",
    message: "Annual community dinner, need vegetarian-friendly street food.",
    createdAt: NOW - 6 * 24 * 60 * 60 * 1000,
  },
];

export const TOP_SELLING_ITEMS = [
  { name: "Beef Chap", unitsSold: 214 },
  { name: "Fuchka", unitsSold: 189 },
  { name: "Chicken Chap", unitsSold: 162 },
  { name: "Special Jhalmuri", unitsSold: 141 },
  { name: "Chotpoti", unitsSold: 128 },
];

export const WEEKLY_SALES = [
  { day: "Mon", sales: 312 },
  { day: "Tue", sales: 298 },
  { day: "Wed", sales: 356 },
  { day: "Thu", sales: 401 },
  { day: "Fri", sales: 512 },
  { day: "Sat", sales: 487 },
  { day: "Sun", sales: 445 },
];

export const ORDERS_BY_HOUR = [
  { hour: "11am", orders: 3 },
  { hour: "12pm", orders: 8 },
  { hour: "1pm", orders: 11 },
  { hour: "2pm", orders: 6 },
  { hour: "3pm", orders: 4 },
  { hour: "4pm", orders: 3 },
  { hour: "5pm", orders: 7 },
  { hour: "6pm", orders: 9 },
  { hour: "7pm", orders: 5 },
  { hour: "8pm", orders: 2 },
];

export const BUSINESS_INSIGHTS = {
  salesToday: 487,
  salesThisWeek: WEEKLY_SALES.reduce((s, d) => s + d.sales, 0),
  totalOrders: 38,
  returningCustomers: 27,
  newCustomers: 11,
  cateringLeads: SEED_CATERING_LEADS.length,
};

export { MENU_ITEMS };
