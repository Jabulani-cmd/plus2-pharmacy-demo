
# Kings Pharmacy — Site-Wide Fix Pass

Note on WhatsApp numbers: only the 9th Ave number (+263 77 571 5520) was supplied. I'll use it as a placeholder for the other 3 branches and add a TODO comment in `src/data/branches.ts` so they're trivial to swap in. All branding (blue/white) and existing layout preserved.

## 1. Branch data (src/data/branches.ts)

Replace the 4 demo branches with the new list. Add `whatsapp` field to the `Branch` type:

- 9th Ave Branch — CBD · +263 77 571 5520
- 6th Ave Branch — CBD · placeholder
- Shop 4, Old Mutual Centre, Jason Moyo Ave · placeholder
- Ascot Shopping Centre · placeholder

Update any place that hard-codes branch names (checkout's "Hillside" pickup label, footer addresses, branches section on homepage if present).

## 2. Floating WhatsApp button (new `src/components/layout/FloatingWhatsApp.tsx`)

- Fixed bottom-right (above mobile bottom-nav: `bottom: calc(safe + 80px)` on mobile, `bottom: 24px` desktop, `right: 16-24px`).
- Renders a green circular FAB with `MessageCircle` icon and "WhatsApp" tooltip.
- Click → opens a Popover listing all 4 branches. Currently-selected branch (from `useBranch`) is highlighted and pre-selected; user can pick any.
- Selecting opens `https://wa.me/<intl-format>?text=<encoded greeting>` in a new tab.
- Mount once in `__root.tsx` so it shows on every page.

## 3. Header promo text (src/components/layout/Navbar.tsx + MobileBottomNav if relevant)

Change "Free delivery over US$50" / promo strings → "Free delivery within 10km on orders over $30". Same change anywhere this string appears (footer trust strip, home trust strip in `src/routes/index.tsx`).

## 4. OTC dispatch bug (root cause: orders never written to a shared store)

Today the checkout flow calls `clearCart()` and shows a confirmation, but never persists the order anywhere the dispatcher reads. `DispatcherDashboard` only reads `STAFF_DELIVERIES` (static demo) + `useSharedPrescriptions`.

Fix:
- Create `src/store/sharedOrders.ts` (zustand + persist, mirrors prescription store): `SharedOrder { id, customer, phone, email, branchId, items[], address, deliveryMethod, paymentMethod, paymentRef, total, status, placedAt, driverName?, dispatchedAt?, deliveredAt? }` with actions `addOrder`, `assignDriver`, `updateStatus`.
- In `checkout.tsx` `handlePaymentSuccess`, push a `SharedOrder` into the store (status `"Ready to dispatch"`) right before `clearCart()`.
- In `DispatcherDashboard.tsx`, read from `useSharedOrders` and merge into the kanban columns alongside `STAFF_DELIVERIES`. Wire Assign/Mark out/Mark delivered to the new store actions.
- Customer-facing `track.tsx` and `account.tsx` read from the same store so status updates flow through.

## 5. Book Consultation (new route + store)

- New `src/store/consultations.ts` (zustand+persist) with `addConsultation` returning a reference number.
- New `src/routes/consultation.tsx` with the form (name, phone, branch select sourced from `BRANCHES`, date/time, reason). On submit show confirmation screen with `KP-CONS-<6 digits>`.
- Find existing "Book Consultation" CTA (likely in `services.tsx` or a home section) — replace stale onClick with `<Link to="/consultation">`.

## 6. Real-time notifications (new `src/store/notifications.ts` + bell)

- Lightweight notification store: `{ id, audience: "customer"|"staff"|"driver", userId?, title, body, link, ts, read }`.
- Hook into existing store actions:
  - `sharedPrescriptions.approvePrescription` → customer notification "Quotation ready".
  - `sharedPrescriptions.markPaid` → staff notification "Payment received for #X — ready to pack".
  - `sharedPrescriptions.assignDriver` → customer notification "Out for delivery".
  - `sharedPrescriptions.updateStatus(..., 'Delivered')` → customer "Delivered".
  - `sharedOrders.addOrder` → customer "Order confirmed" + staff "New OTC order".
  - `sharedOrders.updateStatus` likewise.
- Bell component in `Navbar` (customer) and `staff.tsx` header (staff) with unread badge; opening clears unread; clicking a notification routes to its `link`.

## 7. Payment → packing → dispatch chain

Covered by #6 wiring: `markPaid` already exists, the new side-effect raises the staff notification. Add "Mark Packed" button to the rx card before "Assign Driver" (intermediate status `"Dispensing"` already exists). Track-order page reflects the dispatch timeline (already mostly built; add the "Out for Delivery" step from notifications).

## 8. Mobile-friendly pass

Targeted sweep (no global redesign), focused on known pain points:
- Checkout 2-col form on mobile → single column (`grid-cols-1 sm:grid-cols-2`).
- All primary buttons → `min-h-11` (44px).
- Floating WhatsApp positioned to clear `MobileBottomNav` (~64px) and cart FAB.
- Dispatch kanban: horizontal scroll on small screens with snap.
- Notifications panel: full-width sheet on mobile, popover on desktop.
- Modal dialogs: `max-h-[90vh] overflow-y-auto`.

## 9. Delivered status badge (customer dashboard)

In `account.tsx` order/prescription rows: when status is `"Delivered"`, render a navy badge `bg-primary/10 text-primary` with `CheckCircle2` icon + delivery timestamp. Same on track-order page final step.

## 10. End-to-end verification

After build, drive Playwright through:
- OTC: home → product → cart → checkout → pay (sim) → dispatch dashboard shows order → assign driver → mark delivered → customer dashboard shows "Delivered".
- Rx: upload prescription → staff approves with quote → customer pays → staff notification fires → assign driver → mark delivered → customer dashboard shows "Delivered".

Capture screenshots at each step; report any console errors.

---

## Technical notes

- All new stores use `zustand` + `persist` so customer and staff portals (same browser) share state — consistent with existing `sharedPrescriptions` pattern.
- No backend / Lovable Cloud needed (per your choice).
- No styling changes outside what's listed; existing blue (#0EA5E9 primary) and white palette preserved.
- New files: `branches.ts` (edit), `FloatingWhatsApp.tsx`, `sharedOrders.ts`, `consultation.tsx`, `consultations.ts`, `notifications.ts`, `NotificationsBell.tsx`. Edited: `Navbar.tsx`, `__root.tsx`, `checkout.tsx`, `DispatcherDashboard.tsx`, `account.tsx`, `track.tsx`, `services.tsx`/`index.tsx` (Book Consultation link), `index.tsx` (promo text), `Footer.tsx`.

Estimated ~14 file edits + 6 new files. I'll batch them aggressively and verify with Playwright at the end.
