# Driver Portal — Build Plan

A self-contained driver app at `/driver`, mobile-first, that lets a driver sign in, see orders assigned to them, start a delivery, and mark it delivered — with every change syncing to the dispatcher and customer in real time.

## Decisions that need your sign-off before I build

These four points are where my plan diverges from the spec in your message. Please confirm or correct.

1. **Driver accounts and login route.** This app uses `/auth` for customer sign-in and `/staff` for staff. I'll add a third entry, `/driver/login`, that signs in via Supabase email/password and redirects to `/driver`. I will **not** change the existing `/auth` page to multi-role-route on login — keeping the surfaces separate avoids breaking customer flows. Drivers will be real Supabase auth users with `profiles.role = 'driver'`.

2. **Creating the four driver auth users.** Lovable Cloud doesn't expose the Supabase dashboard, so I can't create auth users by hand. I'll create them programmatically in the migration via a one-time server-side seed (admin API) so `siphamandla@kingspharmacy.co.zw`, `tatenda@…`, `bongani@…`, `rudo@…` all exist with password `Driver123!`, are email-confirmed, and are linked to a row in `public.drivers`. Confirm the four emails + shared starter password.

3. **Order status strings.** The existing `shared_orders` table uses `"Assigned"` and `"Out for delivery"` (not `"Driver Assigned"` / `"Out for Delivery"` as in your spec). The dispatcher kanban, tracking page, notifications, and RLS update policy all depend on these exact strings. I will keep the existing strings and adapt the driver portal to them. Changing them app-wide is a separate, risky migration.

4. **Existing in-dashboard "Driver portal" tab.** The dispatcher dashboard has a `DriverPortalView` tab today. I'll leave it as-is (useful for demos where a dispatcher wants to peek), and the new `/driver` route will be the real driver experience. Tell me if you'd rather I remove the in-dashboard one.

## What gets built

### 1. Database (one migration)

- `public.drivers` table — `id` (uuid pk), `auth_user_id` (uuid, fk `auth.users`, unique), `name`, `phone`, `vehicle`, `plate`, `branch`, `off_duty` (bool, default false), `created_at`. Indexed by `name` and `auth_user_id`.
- GRANTs: `SELECT` to `anon` + `authenticated` (so the dispatcher's anonymous-readable kanban still works, matching the existing project pattern), full CRUD to `authenticated`, ALL to `service_role`.
- RLS:
  - Anyone authenticated can read drivers (needed by dispatcher).
  - A driver can update only their own row (`auth.uid() = auth_user_id`) — used for the online/offline toggle.
- `profiles.role` column already exists (`customer` default). The seed will set `role = 'driver'` for the four driver profiles.
- `shared_orders` RLS: add a policy allowing a driver to UPDATE rows where `driver_name` matches their `drivers.name` and the status transition is one of `Assigned → Out for delivery` or `Out for delivery → Delivered`. Today only staff (via `is_staff`) can update; without this, the driver's writes will silently fail.
- Realtime is already enabled on `shared_orders`. Add `drivers` to the publication so the dispatcher's online/offline indicator updates live.
- Seed: create the four Supabase auth users via `auth.admin.createUser` (inside the migration using a SECURITY DEFINER helper), insert matching `drivers` rows, set their `profiles.role = 'driver'`.

### 2. Routes

- `src/routes/driver.tsx` — pathless wrapper that:
  - Reads the current Supabase session.
  - If no session → redirect to `/driver/login`.
  - If session exists but `profiles.role !== 'driver'` → toast "Drivers only" and redirect to `/`.
  - Otherwise loads the matching `drivers` row by `auth_user_id` and renders `<DriverPortal driver={…} />`.
- `src/routes/driver.login.tsx` — branded sign-in (Kings logo, sky-blue), email + password, calls `supabase.auth.signInWithPassword`, then navigates to `/driver`. Independent of `/auth`.

Both routes are public (not under `_authenticated`) so we own the redirect logic and avoid the gate flashing the customer auth page.

### 3. Components (`src/components/driver/`)

- `DriverPortal.tsx` — shell with header + bottom tab nav, holds active tab state.
- `DriverHeader.tsx` — logo, avatar initials, name, vehicle · plate, Online/Offline toggle (writes `drivers.off_duty`), sign-out (`supabase.auth.signOut()` then navigate to `/driver/login`).
- `ActiveDeliveries.tsx` — fetches `shared_orders` where `driver_name = driver.name` AND `status IN ('Assigned','Out for delivery')`, subscribes to postgres_changes filtered by `driver_name`, renders a list of `ActiveDeliveryCard`.
- `ActiveDeliveryCard.tsx` — full order details (customer, address, items, total, payment), "Call customer", "Open in Maps" (Google Maps deep link with `encodeURIComponent(address)`), and the primary action:
  - When `status = 'Assigned'`: "Start delivery" → updates row to `status='Out for delivery'`, sets `out_for_delivery_ts`. Reuses `useSharedOrders.startDelivery` so notifications/stamps stay consistent.
  - When `status = 'Out for delivery'`: "Mark as Delivered" with inline confirmation → calls `useSharedOrders.updateStatus(id, 'Delivered')`. That already writes `delivered_at`, emits the customer notification, and triggers all downstream realtime subscribers.
- `CompletedDeliveries.tsx` — same query with `status='Delivered'`, Today/All-Time filter, totals (count + summed `total`), per-card delivered-at time and minutes elapsed from `placed_ts`.
- `DriverProfile.tsx` — read-only profile card + sign out.
- `DriverBottomNav.tsx` — three-tab bottom nav (Deliveries / Completed / Profile), mobile-first, fixed to bottom with safe-area padding.

### 4. Wiring to existing realtime

Because the driver writes through `useSharedOrders` (which is the same store the dispatcher and tracking page already subscribe to), no extra realtime code is needed for the dispatcher's kanban, drivers panel, customer's `/track` page, customer notifications, or My Orders list. Those already react to `shared_orders` changes. The only new subscription is the driver's own active-orders list, scoped by `driver_name`.

### 5. Dispatcher drivers panel

The drivers panel I built last turn reads `STAFF_DRIVERS` (hardcoded). I'll switch it to read from the new `drivers` Supabase table (with realtime), so the dispatcher sees the driver's live online/offline state and the seeded four real driver records — keeping name strings identical so the existing assignment flow keeps matching.

## What I will NOT touch

- `/auth` (customer) and `/staff` (staff) sign-in pages.
- The order status string set (`Assigned`, `Out for delivery`, `Delivered`) — see decision #3.
- Existing tracking page, dispatcher kanban, notifications store, RLS for staff. The driver's writes flow through code paths these already trust.

## Out of scope

- GPS live location of the driver on the customer's map (the existing tracking map uses a simulated path; tying it to real coordinates would be a separate piece of work).
- Push notifications to the driver's phone (would need PWA push setup — separate task).

---

**Please confirm the four points at the top, especially #2 (emails + password) and #3 (keep existing status strings), and I'll build it end-to-end in one pass.**