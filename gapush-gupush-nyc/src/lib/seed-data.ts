/**
 * Illustrative-only chart data for the Insights page (weekly sales trend,
 * orders-by-hour, top sellers). This used to also seed a fake in-browser
 * order/customer/catering history — that's gone now that orders live in
 * the real (simulated) backend (see src/server/*); "Today's Orders",
 * "Today's Sales", the CRM, and catering leads are all live queries now,
 * not client-side fixtures. See CLAUDE.md → "What changed and why".
 */
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
  salesThisWeek: WEEKLY_SALES.reduce((s, d) => s + d.sales, 0),
  returningCustomers: 27,
  newCustomers: 11,
};
