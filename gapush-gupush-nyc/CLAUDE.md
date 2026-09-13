# CLAUDE.md — Gapush Gupush NYC

Architecture reference for this app: the order state machine, the database
schema, every webhook, the env vars, and the race conditions that were
found and fixed. Read this before touching `src/server/*` or the checkout
flow.

## ⚠️ Read this first: what's real and what's simulated

**There is no Supabase project, no Stripe account, and no Twilio account
behind this app.** That was a deliberate choice (see "Foundation" below) —
building this out meant either wiring up real third-party accounts (needs
credentials only you can provide) or simulating the same architecture
locally so the state machine, schema, and webhook idempotency patterns are
real and testable without any external dependency. We went with the
simulation:

| Thing              | What's real                                                                 | What's not                                    |
| ------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------- |
| Database            | Full schema, real transactions, real atomicity guarantees (SQLite)          | It's SQLite, not Postgres/Supabase             |
| Stripe              | PaymentIntent lifecycle, webhook payload shape, HMAC signature verification, idempotency | No real card network, no real Stripe account |
| Twilio              | Status-callback payload shape, HMAC signature verification, idempotency     | No SMS ever leaves the process                 |
| Race condition fixes | Same code you'd ship against real Postgres/Stripe/Twilio                    | —                                               |

If this ever becomes a real product, `src/server/db.ts` is the one file
that gets replaced with an actual Supabase client — the SQL in it is
written close enough to Postgres that the migration in this doc should
port with minimal changes. `mock-stripe.ts` and `mock-twilio.ts` get
replaced with the real `stripe` and `twilio` SDKs; the API routes that
call them (`src/app/api/**`) shouldn't need to change shape.

## What changed and why (audit trail)

The app started as a pure-frontend, `localStorage`-only prototype (cart,
"orders," "customers," and "catering leads" all lived in the browser, one
copy per device, no server truth). That's fundamentally incompatible with
a real order state machine, a shared kitchen view, or webhook-driven
payment confirmation — two browsers can't race each other for the same
inventory if there's no shared server to race on. This pass:

1. Added a real (simulated) backend: SQLite + mock Stripe/Twilio (`src/server/*`).
2. Moved orders, inventory, customers (CRM), and catering leads server-side.
   `src/lib/store.tsx` is now cart-only — everything else goes through
   `src/lib/api-client.ts`.
3. Found and fixed three race conditions (below).
4. Added `/demo-reset`, resilience (optimistic UI + retry queue + a
   confirmation-timeout error state), and a Playwright test suite.

**Inconsistencies found and fixed along the way:**

- The old client-only `Order` type used status names (`received`,
  `preparing`, `ready`, `completed`) that don't distinguish "paid" from
  "not yet paid" — there was no `pending_payment` state at all, which is
  exactly how the "kitchen marks ready before payment confirms" bug could
  exist unnoticed. The new `OrderStatus` (see below) makes that
  distinction a first-class state.
- The old "Create Demo Order" button hard-coded `total: 18, tax: 0`,
  bypassing the tax calculation every real order went through — a
  special case that would have quietly drifted from real pricing logic.
  Demo orders now go through the exact same `createOrder()` pricing path
  as a real checkout; there is no special-cased demo pricing anymore.
- Two call sites (`createOrder`'s pay-at-pickup path and
  `confirmOrderPayment`'s webhook path) had the "order received" SMS body
  copy-pasted verbatim. Consolidated into `smsBody.received()` /
  `smsBody.ready()` in `src/server/orders.ts` so the two can't drift
  apart — `tests/order-flow.spec.ts` pins the exact strings.
- `NEXT_PUBLIC_DEMO_RESET_KEY` (client-exposed) and `DEMO_RESET_SECRET`
  (server-only) both gate the same demo-reset action but are read at
  different times: the `NEXT_PUBLIC_` one is baked in at **build** time
  (`next build`), the server one is read at **runtime**. If you change one
  without the other and without rebuilding, the Demo Mode widget's
  one-tap reset button will silently send the wrong key. Keep them equal,
  and rebuild after changing either. See "Env vars" below.
- `TAX_RATE`, menu item prices/names, and spice/extras pricing all live in
  `src/lib/menu-data.ts` / `src/lib/cart.ts` and are imported directly by
  the server (`src/server/orders.ts`). This is intentional (one priced
  menu, not two), but it means those files are shared client+server code —
  don't add browser-only APIs (`window`, `localStorage`) to them.

## Order state machine

```
                 ┌─────────────────┐
   online        │ pending_payment │
   checkout ────▶│ (reserved stock)│
                 └───────┬─────────┘
                         │
         stripe webhook  │  stripe webhook
         succeeded       │  payment_failed
              ┌──────────┴──────────┐
              ▼                     ▼
        ┌───────────┐       ┌───────────────┐
pickup  │ confirmed │       │ payment_failed│ (terminal;
checkout│           │       │ stock released│  customer
───────▶└─────┬─────┘       └───────────────┘  re-checks out)
              │ kitchen: accept
              ▼
        ┌───────────┐
        │ preparing │
        └─────┬─────┘
              │ kitchen: ready
              ▼
        ┌───────────┐
        │   ready   │
        └─────┬─────┘
              │ kitchen: complete
              ▼
        ┌───────────┐
        │ completed │
        └───────────┘
```

Defined in `src/server/orders.ts` as `KITCHEN_TRANSITIONS`:

| Action (kitchen) | Valid from  | Goes to     |
| ----------------- | ----------- | ----------- |
| `accept`          | `confirmed` | `preparing` |
| `ready`           | `preparing` | `ready`     |
| `complete`        | `ready`     | `completed` |

Every kitchen action checks the order's *current* status inside a DB
transaction before applying the transition; anything else is a 409
`invalid_transition`. This is the fix for **"kitchen marks an order ready
before payment confirms"** — an order sitting in `pending_payment` has no
`ready` (or even `accept`) transition defined from it, so the attempt is
rejected, not silently accepted. Verified in
`tests/race-conditions.spec.ts`.

Pay-at-pickup orders skip `pending_payment` entirely — there's no payment
to wait on, so they're created directly in `confirmed`.

## Database schema

Implemented in SQLite (`src/server/db.ts`) but written close to Postgres —
this is the shape a real Supabase migration would use:

```sql
counters (name PK, value)                 -- order number sequence
inventory (menu_item_id PK, quantity_available, is_limited)
orders (
  id PK, order_number UNIQUE, customer_name, phone, status,
  fulfillment, scheduled_time, payment_method, payment_intent_id,
  subtotal_cents, tax_cents, total_cents,
  created_at, updated_at, estimated_ready_at, is_demo,
  idempotency_key UNIQUE
)
order_items (
  id PK, order_id FK -> orders, menu_item_id, name, quantity,
  unit_price_cents, line_total_cents, spice_level, extras_json, instructions
)
payment_intents (id PK, order_id FK, amount_cents, status, created_at)
payment_events (stripe_event_id PK, type, payment_intent_id, received_at)
sms_events (
  id PK, order_id FK, to_phone, body, kind, twilio_sid UNIQUE,
  status, created_at
)
sms_status_events (id PK, twilio_sid, status, received_at, UNIQUE(twilio_sid, status))
catering_leads (id PK, name, phone, email, event_date, guests, location,
  budget, preferences, message, created_at)
```

All money is stored in **cents** (integers) to avoid floating-point drift;
the API layer converts to dollars for display. Prices are always computed
server-side from `src/lib/menu-data.ts` — the client never gets to say
what something costs.

## Race conditions: audit + fixes

### 1. Two customers checking out the last item simultaneously

**What breaks (naive version):** read `quantity_available`, check it's
enough, then write `quantity_available - qty` back. Two concurrent
requests can both read "1 left," both pass the check, both write "0" —
the item sold twice. This is a real, reproducible bug shape; see the
comment block in `src/server/inventory.ts` for the exact broken code.

**The fix:** one atomic SQL statement does the check-and-decrement:

```sql
UPDATE inventory SET quantity_available = quantity_available - ?
WHERE menu_item_id = ? AND quantity_available >= ?
```

If `changes === 0`, nothing matched (not enough stock) — reject with a
409 `sold_out`, and roll back anything else this checkout's transaction
already reserved. Because better-sqlite3 statements are synchronous and
there's no `await` between the check and the write, there's no window for
a second request's JS to interleave.

**Verified:** `tests/race-conditions.spec.ts` fires 5 concurrent checkouts
for a 3-unit item ("Naga Shingara" is seeded scarce specifically for this)
and asserts exactly 3 succeed, 2 get `sold_out`, and stock lands at
exactly 0 (never negative).

A second, related bug this same fix doesn't cover: **a client retrying a
checkout it already sent** (e.g. after a dropped connection — see
"Resilience" below) looks identical to a second customer unless the
server can tell them apart. Fixed with a client-generated
`idempotencyKey`: `createOrder()` checks for an existing order with that
key before creating a new one, returning the original instead. Verified
in the same test file.

### 2. A Stripe webhook arriving twice

**What breaks:** without deduplication, a retried webhook delivery (which
Stripe explicitly does — see their docs on at-least-once delivery) would
re-run "mark order confirmed + send SMS," resulting in a duplicate SMS and
wasted work.

**The fix:** `payment_events.stripe_event_id` is `UNIQUE`. Every inbound
webhook does `INSERT OR IGNORE` on that table first; if the insert
reports 0 changes, the event was already processed and the handler
returns immediately without touching order state or sending SMS.
`confirmOrderPayment`/`failOrderPayment` also independently guard on the
order's current status (`if (order.status !== "pending_payment") return`)
as a second layer — belt-and-suspenders.

**Verified:** `tests/race-conditions.spec.ts` sends the identical signed
event twice and asserts the second is flagged `duplicate: true`, the
order transitions exactly once, and exactly one `order_received` SMS
exists in `sms_events`.

### 3. Kitchen marks an order ready before payment confirms

Covered under "Order state machine" above — the `KITCHEN_TRANSITIONS`
table makes this structurally impossible rather than checked ad hoc.

## Stripe simulation (`src/server/mock-stripe.ts`)

- `createPaymentIntent(orderId, amountCents)` — called from `createOrder`
  for `paymentMethod: "online"`. Returns a fake `pi_...` id + client
  secret, stored in `payment_intents`.
- `confirmPaymentIntent(paymentIntentId, cardNumber)` — called from
  `POST /api/checkout/confirm`, simulating `Stripe.js`'s
  `confirmCardPayment()`. Test card numbers (standard Stripe test-mode
  numbers):
  - `4242 4242 4242 4242` → succeeds
  - `4000 0000 0000 0002` → declined, `card_declined`
  - `4000 0000 0000 9995` → declined, `insufficient_funds`
  - `4000 0000 0000 0069` → declined, `expired_card`
  - anything else → declined, `card_not_supported`
  This resolves the *client-facing* confirmation, but **on purpose does
  not itself flip the order to `confirmed`** — it schedules a webhook
  delivery ~600ms later, recreating the real-world gap between "the
  client thinks the card worked" and "the server's source of truth (the
  webhook) has confirmed it." See "Resilience" for how the UI handles
  that gap.
- Webhook delivery (real or simulated) goes through
  `verifyAndHandleRawStripeWebhook(rawBody, signatureHeader)` — the exact
  function `POST /api/webhooks/stripe` calls. Signature format matches
  real Stripe: `Stripe-Signature: t=<unix ts>,v1=<hex hmac-sha256>`,
  computed over `${timestamp}.${rawBody}` with `STRIPE_WEBHOOK_SECRET`,
  verified with a timing-safe comparison and a 5-minute tolerance window.

## Twilio simulation (`src/server/mock-twilio.ts`)

- `sendSms(orderId, toPhone, body, kind)` — records the message
  immediately as `status: "queued"` in `sms_events`, then after ~400ms
  simulates Twilio's real async status-callback webhook delivering
  `status: "delivered"`.
- The status callback goes through
  `verifyAndHandleTwilioStatusCallback(url, params, signatureHeader)` —
  the same function `POST /api/webhooks/twilio` calls. Signature
  algorithm matches real Twilio:
  `base64(hmac-sha1(TWILIO_AUTH_TOKEN, url + sorted(key+value for every param)))`,
  sent as `X-Twilio-Signature`.
- Idempotency: `sms_status_events` is unique on `(twilio_sid, status)` — a
  redelivered *identical* status is a no-op; a genuinely new status
  (e.g. `delivered` → `undelivered`) still records.
- The two customer-facing messages, generated from `src/server/orders.ts`'s
  `smsBody`:
  - `order_received`: `"Gapush Gupush: We received order GG-####. We'll text you when it's ready."`
  - `order_ready`: `"Gapush Gupush: Your order GG-#### is READY for pickup!"`

## Env vars

| Variable                      | Used by                          | Notes                                                                 |
| ------------------------------ | --------------------------------- | ----------------------------------------------------------------------- |
| `STRIPE_WEBHOOK_SECRET`       | `mock-stripe.ts`                  | Signs/verifies simulated webhooks. Any string; default is dev-only.  |
| `TWILIO_ACCOUNT_SID`          | `mock-twilio.ts` (display only)   | Cosmetic — shows up in logs, not used for signing.                    |
| `TWILIO_AUTH_TOKEN`           | `mock-twilio.ts`                  | Signs/verifies simulated status callbacks.                            |
| `TWILIO_FROM_NUMBER`          | `mock-twilio.ts`                  | Cosmetic "From" number on outbound SMS records.                       |
| `APP_BASE_URL`                | `mock-twilio.ts`                  | Must match the actual origin the app is served from (e.g. `http://localhost:3100`) — used to build the URL Twilio-callback signatures are computed over. **Wrong value = every status callback fails signature verification.** |
| `DEMO_RESET_SECRET`           | `/demo-reset` route (server)      | Read at runtime. Default `letmein` if unset — **not real security**, just enough to stop an accidental tap/crawl wiping a live demo. |
| `NEXT_PUBLIC_DEMO_RESET_KEY`  | Demo Mode widget (client)         | Baked in at **build time** (`next build`), not read at runtime like the server var above. Must equal `DEMO_RESET_SECRET`, and the app must be rebuilt after changing it. |

None of these need real values from an external account — they're shared
secrets between this app's own client, server, and simulated third
parties, not credentials for any real Stripe/Twilio/Supabase account.

## Demo tooling

- **`/demo-reset?key=<DEMO_RESET_SECRET>`** — one GET request wipes all
  orders/payments/SMS/catering-leads and resets inventory to seed values
  (see `resetDemoData()` in `src/server/db.ts`), then renders a plain-HTML
  confirmation page. Bookmark the full URL (with `?key=...`) to your
  phone's home screen for a true one-tap reset — no dashboard, no second
  button. The Demo Mode widget's "Reset Demo" button hits the same route.
- **Demo Mode widget** (bottom-right FAB on every page): Create Demo Order
  (Rahim, Beef Chap + Fuchka, Hot, pay at pickup — goes through the real
  `createOrder()` path, no special-cased pricing), Simulate
  Preparing/Ready/Completed (real kitchen actions against that order),
  Reset Demo.
- **Limited inventory demo item**: "Naga Shingara" is seeded with 3 units
  (`is_limited: 1` in `inventory`) specifically so the sold-out /
  race-condition behavior has something real to demonstrate — the menu
  page shows a live "N left today" / "Sold Out" badge for it.

## Resilience (bad connections)

- **Optimistic UI**: tapping "Place Order" immediately swaps the tall
  form for a status panel ("Placing your order…") — the customer isn't
  staring at a disabled button waiting on the network.
- **Retry queue** (`submitCheckoutWithRetry` in `src/lib/api-client.ts`):
  up to 5 attempts, exponential backoff (1s/2s/4s/8s), 8s timeout per
  attempt. Retries only on network failure/5xx — a `sold_out` or
  validation error surfaces immediately since retrying won't help. The
  pending request (payload + idempotency key) is persisted to
  `localStorage` so a closed tab or app backgrounding doesn't lose it,
  and so a retry after a reload doesn't create a duplicate order (see
  race condition #1's idempotency-key fix).
- **Clear error states**: if all 5 checkout attempts fail, "Connection
  trouble — your order has NOT been placed, nothing was charged," with
  Try Again / Edit Order (cart and form state are preserved either way).
  Separately, the order-tracking page polls for the Stripe-webhook-driven
  `pending_payment → confirmed` transition and shows its own timeout
  message ("Still confirming your payment…") if that takes more than 15s,
  rather than optimistically claiming success forever.
- **3G proof**: `tests/manual/simulate-3g.mjs` drives a real Chromium
  instance against a **production build** (`next build && next start` —
  dev-mode bundles are too large/unminified to be a fair 3G test) with
  Chrome DevTools Protocol network throttling (`Network.emulateNetworkConditions`),
  covering: checkout succeeding end-to-end on Slow 3G, a connection drop
  mid-checkout that recovers automatically via the retry queue, and a
  connection that never recovers, ending in the clear error state with
  cart/form preserved. Run it manually (`node tests/manual/simulate-3g.mjs`
  against a running prod server) — it's not part of `npx playwright test`
  since its purpose is producing screenshots to look at, not pass/fail.

## Testing

```bash
npx playwright test                        # race conditions + full order-flow E2E
node tests/manual/simulate-3g.mjs          # 3G / offline screenshots (needs a running prod server)
```

`playwright.config.ts` boots its own dev server on port 3100 with fixed
test env vars (`TEST_ENV`) — signatures in `tests/helpers/*` are computed
against those same values. Tests run in a single worker
(`fullyParallel: false`) because several of them (especially the
inventory race-condition tests) need the SQLite file to themselves.

- `tests/race-conditions.spec.ts` — the three audited race conditions,
  each proven fixed against the real HTTP API.
- `tests/order-flow.spec.ts` — full path: scan-link → add 3 items →
  Stripe test-card checkout → order appears on `/kitchen` → mark ready →
  both SMS bodies asserted exactly, via reading `sms_events` directly
  from the SQLite file (`tests/helpers/db.ts`).
- `tests/manual/simulate-3g.mjs` — see "Resilience" above.

## Routes reference

| Route                                  | Purpose                                                        |
| ---------------------------------------- | ----------------------------------------------------------------- |
| `POST /api/checkout`                   | Create an order (reserves inventory atomically)                |
| `POST /api/checkout/confirm`           | Confirm a PaymentIntent with a test card                       |
| `POST /api/webhooks/stripe`            | Simulated Stripe webhook receiver                               |
| `POST /api/webhooks/twilio`            | Simulated Twilio status-callback receiver                       |
| `GET /api/orders/[id]`                 | Fetch one order by id or order number (customer tracking polls this) |
| `GET /api/kitchen/orders`              | List all orders (kitchen/admin views poll this)                |
| `POST /api/kitchen/orders/[id]/status` | Kitchen action: `accept` \| `ready` \| `complete`               |
| `GET/POST /api/catering`               | List / submit catering leads                                    |
| `GET /api/customers`                   | CRM summary, aggregated live from realized orders                |
| `GET /api/inventory`                   | Live stock snapshot (menu page's "N left" badges)                |
| `GET /demo-reset?key=...`              | One-tap full reset                                               |
| `/kitchen`                              | Standalone kitchen-facing view (big touch targets, no owner chrome) |
| `/admin/*`                              | Owner dashboard (stats, order queue, insights, CRM, catering)   |
