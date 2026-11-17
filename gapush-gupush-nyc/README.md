# Gapush Gupush NYC — Demo Ordering App

A mobile-first sales demo / prototype for **Gapush Gupush NYC**, an
authentic Bangladeshi street food business. Built with Next.js (App
Router), TypeScript, and Tailwind CSS.

There is no real Stripe account or Twilio account behind this — payments
and SMS are simulated (a Stripe/Twilio-shaped mock layer) so the order
state machine, webhooks, and race-condition fixes are real and testable
without needing anyone's credentials. The database and the auth system,
though, are real: a real Postgres server and real login-gated access to
customer data. See **[CLAUDE.md](./CLAUDE.md)** for the full architecture,
schema, auth model, and webhook reference — start there if you're touching
`src/server/*` or the checkout flow.

## Running it

```bash
docker compose up -d   # starts Postgres on localhost:5433
npm install
npm run dev
```

Then open http://localhost:3000. The schema is created automatically on
first request, and a default owner account is seeded (`owner@gapushgupush.nyc`
/ `ChangeMe123!` unless you set `OWNER_EMAIL`/`OWNER_PASSWORD` — see
`.env.example`). Sign in at **http://localhost:3000/login** to reach
`/admin` or `/kitchen` — both require a staff login now; see CLAUDE.md →
"Auth". Use `/demo-reset?key=letmein` for a one-tap reset of orders/
payments/SMS/catering data without restarting the server (it never touches
staff accounts).

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

**Kitchen view** (`/kitchen`, owner or staff login required) —
standalone, big-touch-target screen for a phone/tablet at the counter:
New / Preparing / Ready columns with one-tap Accept / Mark Ready / Mark
Completed.

**Owner dashboard** (`/admin/*`, owner login required)
- Overview stats (today's orders/sales/average/waiting/completed — live
  from the real order table).
- Order Queue kanban (Awaiting Payment / New / Preparing / Ready /
  Completed) with the same kitchen actions as `/kitchen`.
- Business Insights charts (daily sales, orders by hour, top sellers).
- Customer CRM aggregated from real order history — search by name/phone,
  filter by order count, sort, and export the visible list to CSV — with
  a "Send Promotion" demo action.
- Catering leads list.
- Staff Accounts — add owner/staff logins (no public signup anywhere in
  the app).

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
