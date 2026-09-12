# Gapush Gupush NYC — Demo Ordering App

A mobile-first sales demo / prototype for **Gapush Gupush NYC**, an
authentic Bangladeshi street food business. Built with Next.js (App
Router), TypeScript, and Tailwind CSS. There is no real backend, no real
payments, and no real SMS — everything runs on local React state
(persisted to `localStorage`) so the whole ordering + owner-dashboard
flow can be demoed end-to-end from a phone or laptop.

## Running it

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## What's inside

**Customer app** (`/`, `/menu`, `/checkout`, `/order/[id]`, `/catering`,
`/how-it-works`)
- Home page with hero, popular items, and a QR-ordering callout.
- Menu grouped into Popular / Chap / Fuchka & Chotpoti / Street Snacks /
  Drinks, each item customizable (spice level, extras, quantity, notes).
- Sticky cart bar + slide-in cart drawer, one-column mobile checkout with
  ASAP/scheduled pickup and Pay Online (fake demo form) / Pay at Pickup.
- Order confirmation with a live status tracker (Received → Preparing →
  Ready) and simulated SMS + review-request toasts.
- Catering request form that also shows up in the owner dashboard.

**Owner dashboard** (`/admin/*`)
- Overview stats (today's orders/sales/average/waiting/completed — all
  computed live from the shared order state).
- Order Queue kanban (New / Preparing / Ready / Completed) with one-tap
  status actions that immediately update the customer's tracking screen.
- Business Insights charts (daily sales, orders by hour, top sellers).
- Customer CRM with a "Send Promotion" demo action.
- Catering leads list.

**Demo Mode** — a floating "DEMO" control lets you create a scripted
demo order, fast-forward it through Preparing → Ready → Completed, and
reset all demo data back to its seeded state.

This is a prototype for pitching the concept — no data leaves the
browser, and every "payment" and "SMS" in the app is simulated.
