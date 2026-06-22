# OTC Workflow — 10-Stage Manual Demo Mode

Goal: every stage waits for a human click. No auto-advance anywhere. The presenter can pause indefinitely at any stage. Customer view, staff dispatch view, and driver view stay in sync via the existing `sharedOrders` store.

## Stage map (source of truth)

| # | Stage | Trigger | Status in store |
|---|-------|---------|-----------------|
| 1 | Shopping & Cart | Add to Cart → toast → manual nav to /cart → Proceed | (not yet created) |
| 2 | Delivery Details | Fill form → Continue to Payment | — |
| 3 | Payment | Pick method → method-specific verify → Continue to Review | — |
| 4 | Review | Place Order | — |
| 5 | Confirmation | Manual nav: Track / Continue Shopping | `Confirmed` |
| 6 | Staff sees new order | Staff clicks Mark as Packed | `Confirmed` → `Packed` |
| 7 | Packed | Staff assigns driver & dispatches | `Packed` → `Assigned` |
| 8 | Dispatched | Driver clicks Start Delivery | `Assigned` → `Out for delivery` |
| 9 | Out for Delivery | Driver clicks Mark as Delivered | `Out for delivery` → `Delivered` |
| 10 | Delivered | Terminal | `Delivered` |

We extend `SharedOrderStatus` to add `"Confirmed"` (between order placed and packed) so Stage 6 has a distinct state from Stage 7. Default status changes from `"Ready to dispatch"` → `"Confirmed"`.

## Files to change

### Store
- `src/store/sharedOrders.ts` — add `"Confirmed"` status, keep `markPacked`, `assignDriver` (now also takes vehicle), add `startDelivery` action, keep `updateStatus`. Each transition pushes a notification.

### Customer flow
- `src/routes/cart.tsx` — verify "Proceed to Checkout" is the only path (already is); confirm Add-to-Cart toast comes from `useShop` (audit).
- `src/components/cart/CartDrawer.tsx` — no auto-redirect; just a "View Cart" / "Checkout" button.
- `src/routes/checkout.tsx` — rebuild as 3-step wizard with explicit `step` state (1/2/3):
  - Step 1: Delivery form with per-field validation, Continue disabled until valid.
  - Step 2: Payment method picker → per-method sub-flow with verify button + spinner + success badge. Continue to Review disabled until verified.
  - Step 3: Review summary + Place Order button (1s spinner then advance).
  - Removes any auto-advance / auto-redirect to confirmation.
  - Visible progress bar at top showing current step.
- `src/components/checkout/PaymentSimulator.tsx` (or new `PaymentStepper.tsx`) — per-method inline forms with manual Verify buttons:
  - EcoCash/Telecash: phone → Send OTP → 6-digit OTP → Verify OTP → ✓
  - ZimSwitch: bank + account → Verify Account → ✓
  - ZIPIT: account + bank → Confirm Details → ✓
  - International Card: number/expiry/CVV/name → Validate Card → ✓
  - Cash on Delivery: confirm amount → Confirm COD → ✓
- `src/components/checkout/OrderConfirmation.tsx` — blue checkmark, ref #, summary, "Track My Order" + "Continue Shopping". No auto-redirect.

### Staff flow
- `src/components/staff/DispatcherDashboard.tsx` — three columns: **New Orders** (`Confirmed`, with blue "NEW" badge), **Ready for Dispatch** (`Packed`, driver dropdown + Assign & Dispatch), **Out for Delivery** (`Assigned`/`Out for delivery`), plus **Completed** (`Delivered`). Each transition button shows a 0.5s spinner. Read from `useSharedOrders`.

### Driver flow
- Add a minimal Driver view inside the existing staff dashboard (new tab or section in `DispatcherDashboard`) showing orders where `status === "Assigned"` with "Start Delivery" button, and `"Out for delivery"` with "Mark as Delivered" button. Avoids a new route/auth layer for the demo.

### Customer tracking
- `src/routes/track.tsx` — read selected order from `useSharedOrders` and render a 5-step timeline: Confirmed → Packed → Dispatched → Out for Delivery → Delivered. Each completed step shows timestamp. Map placeholder activates at Dispatched.

### Notifications
- `src/store/notifications.ts` — already exists; ensure every transition (`addOrder`, `markPacked`, `assignDriver`, `startDelivery`, deliver) sends the customer-facing copy specified in the brief.

### Demo Mode
- Locate existing Demo Mode button (likely in `DemoBadge.tsx` or `staff.tsx`). Replace with a controller that:
  - Seeds a sample order, then walks through stages 5 → 10 with 3s pauses (stages 1–4 are user-driven; demo starts from "Place Order").
  - Shows a top-right overlay label: "Stage N: <name>".
  - Provides **Pause / Resume** buttons; pause freezes the timer indefinitely.
  - Uses the real store actions so both customer and staff views update live.

## Technical notes

- All stage state lives in `useSharedOrders` (zustand+persist) — single source of truth, already shared across portals in the same browser.
- New status string `"Confirmed"` is added to the union; every `switch`/filter on status must be updated (dispatcher columns, track timeline, account page badge).
- No backend changes; no routing changes beyond possibly a `/staff/driver` subview (kept inside existing dispatcher to limit blast radius).
- Mobile: wizard steps stack to single column, buttons `min-h-11`, progress bar full-width.
- No visual redesign outside what each stage requires. Existing blue/white palette and grey page background preserved.

## Out of scope

- Real payment gateway integration (still simulated, just gated behind manual buttons).
- Real map / GPS — animated marker remains a placeholder.
- Multi-user auth for driver portal — driver view is a tab inside the staff dashboard for demo simplicity.

## Verification

After build, drive Playwright at 1280×1800:
1. Add product → toast → cart → checkout step 1 → fill → step 2 → EcoCash → OTP → verify → step 3 → place order → confirmation.
2. Open `/staff/dashboard` in a second tab → see NEW order → Mark Packed → Assign driver → switch to Driver tab → Start Delivery → Mark Delivered.
3. Open `/track?order=...` → confirm timeline updates after each staff/driver action.
4. Click Demo Mode → confirm overlay labels, 3s pauses, Pause/Resume works, no stage skipped.

Screenshots at each stage for the report.
