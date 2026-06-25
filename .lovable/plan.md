## Goal

Move orders, prescriptions, and notifications from local Zustand/localStorage stores to **Lovable Cloud (Supabase)** with **realtime subscriptions** so any device sees changes within ~2 seconds. Add a Live/Reconnecting indicator on staff dashboards, optimistic updates, and seed demo data so a fresh login still shows a populated demo.

This is a substantial migration — every screen that currently reads `useSharedOrders`, `useSharedPrescriptions`, `useNotifications`, `useOrderExtras` will switch to Supabase-backed data.

---

## Step 1 — Enable Lovable Cloud

Enable Cloud (creates Supabase project, sets env vars, generates `src/integrations/supabase/client.ts`).

## Step 2 — Schema (one migration)

Tables (all in `public`, all with explicit GRANTs + RLS):

- `profiles` — id (uuid, FK auth.users), full_name, phone, email, role
- `orders` — id (text PK, e.g. KP-...), customer_id (uuid), customer_name, phone, branch_id, address, delivery_method, payment_method, payment_ref, total, item_count, status, driver_id, driver_name, driver_phone, driver_vehicle, packed_at, dispatched_at, delivered_at, out_for_delivery_ts, eta, placed_at (timestamptz)
- `order_items` — id, order_id (FK), name, qty, price
- `prescriptions` — id (text PK), customer_id, customer_name, customer_email, customer_phone, file_name, patient_name, doctor_name, notes, status, files (jsonb), delivery (text), delivery_address (jsonb), collection_branch_id, quotation (jsonb), payment_ref, payment_method, paid_at, pharmacist_notes, approved_at, rejection_reason, driver_id, driver_name, driver_phone, driver_vehicle, dispatched_at, uploaded_at
- `notifications` — id, audience ('customer'|'staff'|'driver'), user_id (nullable), title, body, link, link_search (jsonb), tone, read (bool), created_at
- `order_messages` — id, order_id, sender ('customer'|'driver'|'staff'), body, created_at  *(chat)*
- `order_ratings` — order_id PK, customer_id, stars, comment, created_at
- `loyalty_points` — customer_id PK, points

**RLS:**
- Customers: read/write only rows where `customer_id = auth.uid()`.
- Staff: read all orders/prescriptions/notifications-with-audience-staff; write status fields (via `has_role(auth.uid(),'staff')`).
- Drivers: read/write orders where `driver_id = auth.uid()`.
- `user_roles` table + `has_role()` security-definer function (per project memory rules).

**Realtime:** `alter publication supabase_realtime add table orders, order_items, prescriptions, notifications, order_messages, order_ratings, loyalty_points;`

## Step 3 — Data layer rewrite

Replace store internals (keep the same hook names + APIs so consumers don't change):

- `src/store/sharedOrders.ts` — fetch via supabase; subscribe to `orders` channel; mutators write to supabase with optimistic local state + rollback on error
- `src/store/sharedPrescriptions.ts` — same pattern
- `src/store/notifications.ts` — same pattern, scoped by audience + userId
- `src/store/orderExtras.ts` — messages → `order_messages` channel, ratings → `order_ratings`, points → `loyalty_points`

A single `src/lib/realtime.ts` provides `useRealtimeStatus()` returning `'live' | 'reconnecting'` by listening to channel subscription state.

## Step 4 — Auth wiring

- Customer auth already exists (`src/store/auth.ts`). Migrate to `supabase.auth` (email/password). On signup, insert into `profiles`.
- Staff login (`src/routes/staff.login.tsx`) — keep current role-based mock OR sign in real Supabase users seeded via migration with assigned roles. **Recommendation: real Supabase staff accounts** so RLS works. Seed 6 demo staff (`pharmacist@kings.demo`, `dispatcher@kings.demo`, `cashier@kings.demo`, `inventory@kings.demo`, `manager@kings.demo`, `admin@kings.demo`, all password `Kings2026!`).

## Step 5 — UI additions

- `src/components/staff/LiveStatusBadge.tsx` — 🟢 Live / 🔴 Reconnecting, placed in `DispatcherDashboard`, `PharmacistDashboard`, driver view.
- Toast on optimistic rollback (sonner `toast.error`).

## Step 6 — Seed demo data

Migration inserts:
- 3 sample OTC orders at different stages
- 2 sample prescriptions (one pending, one approved)
- A handful of notifications

So a fresh login shows a populated demo immediately.

## Step 7 — Verification

Playwright with two browser contexts on `localhost:8080`:
1. Context A places an OTC order as customer → Context B (signed in as dispatcher) sees it appear within 2 s.
2. Context B marks packed → Context A's `/track` page updates within 2 s.
3. Context A uploads prescription → Context B (pharmacist) sees it within 2 s.

Screenshots saved to `/tmp/browser/realtime/`.

---

## Open questions (please confirm)

1. **Staff accounts** — switch to real Supabase accounts so RLS works, or keep the current mock staff login and rely on a single shared "service" role for staff writes? Real accounts are the right answer for a presentation; confirming because it changes the staff login screen.
2. **Driver portal** — currently doesn't exist as a separate route. Build a minimal `/driver` route with login + assigned-orders list, or keep driver actions inside the dispatcher dashboard for now?
3. **Existing localStorage data** — wipe on first load after migration, or attempt a one-time import into Supabase? Wiping is simpler and safer for a demo.
4. **Demo seed scope** — seed just orders/prescriptions, or also seed a demo customer account (`demo@kings.test` / `Demo2026!`) pre-populated with order history?

Once you confirm these four, I'll implement end-to-end in one pass.