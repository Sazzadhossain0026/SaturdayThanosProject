# Gapush Gupush NYC — Demo Ordering App

A mobile-first sales demo / prototype for **Gapush Gupush NYC**, an
authentic Bangladeshi street food business. Built with Next.js (App
Router), TypeScript, and Tailwind CSS.

There is no real Stripe account, Twilio account, or Supabase project
behind this — payments and SMS are simulated locally (SQLite + a
Stripe/Twilio-shaped mock layer) so the order state machine, webhooks, and
race-condition fixes are real and testable without needing anyone's
credentials. See **[CLAUDE.md](./CLAUDE.md)** for the full architecture,
schema, and webhook reference — start there if you're touching
`src/server/*` or the checkout flow.

## Running it

```bash
npm install
npm run dev
```

Then open http://localhost:3000. A `.data/gapush.db` SQLite file is
created on first run (git-ignored) — delete it to reset to a clean slate,
or use `/demo-reset?key=letmein` for a one-tap reset without restarting
the server.

## What's inside

**Customer app** (`/`, `/menu`, `/checkout`, `/order/[id]`, `/catering`,
`/how-it-works`)
- Home page with hero, popular items, and a QR-ordering callout.
- Menu grouped into Popular / Chap / Fuchka & Chotpoti / Street Snacks /
  Drinks, each item customizable (spice level, extras, quantity, notes),
  with a live "N left today" / "Sold Out" badge on the one intentionally
  scarce item.
- Sticky cart bar + slide-in cart drawer, one-column mobile checkout with
  ASAP/scheduled pickup and Pay Online (Stripe test cards, e.g.
  `4242 4242 4242 4242`) / Pay at Pickup.
- Optimistic checkout UI with a retry-with-backoff queue for bad
  connections, and a clear error state if payment confirmation times out.
- Order confirmation with a live, polling status tracker (Order Received →
  Preparing → Ready) and simulated SMS + review-request toasts.
- Catering request form that also shows up in the owner dashboard.

**Kitchen view** (`/kitchen`) — standalone, big-touch-target screen for a
phone/tablet at the counter: New / Preparing / Ready columns with one-tap
Accept / Mark Ready / Mark Completed.

**Owner dashboard** (`/admin/*`)
- Overview stats (today's orders/sales/average/waiting/completed — live
  from the real order table).
- Order Queue kanban (Awaiting Payment / New / Preparing / Ready /
  Completed) with the same kitchen actions as `/kitchen`.
- Business Insights charts (daily sales, orders by hour, top sellers).
- Customer CRM aggregated from real order history, with a "Send
  Promotion" demo action.
- Catering leads list.

**Demo Mode** — a floating "DEMO" control lets you create a scripted
demo order, fast-forward it through Preparing → Ready → Completed, and
fully reset all data (orders, payments, SMS, inventory) back to seeded
defaults.

## Testing

```bash
npm test                             # race-condition + full order-flow E2E (Playwright)
node tests/manual/simulate-3g.mjs    # bad-connection screenshots (needs `npm run build && npm start` first)
```

See CLAUDE.md's "Testing" section for what each covers.

This is a prototype for pitching the concept — no data leaves your
machine, and no real charge or SMS is ever sent.
