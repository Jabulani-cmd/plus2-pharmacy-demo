# Kings Pharmacy — Pre-Presentation Audit & Build Plan

This is a very large scope (5 parts, 30+ discrete features). I want to confirm the approach before spending several hours of build time, because some items in the brief are partially built already and others are new from scratch.

## Scope Confirmation

I have read the current codebase. Status of each requested area:

| Area | Status today |
|---|---|
| 1.1 Registration → auto-login → welcome | Auth flow exists; needs welcome notification + branch field check |
| 1.2 OTC 10-stage workflow | Already rebuilt last session — manual transitions in place |
| 1.3 Prescription workflow | Exists end-to-end; needs Print Rx + Print Packing Slip buttons |
| 2.1 Customer ↔ Driver chat | NOT built |
| 2.2 Mock call screen | NOT built |
| 2.3 "Message Pharmacy" on tracking pages | Floating WA exists; per-page button NOT built |
| 3.1 Active-order banner on dashboard | NOT built |
| 3.2 Delivery countdown | NOT built |
| 3.3 Animated driver marker on map | Map is a placeholder today |
| 3.4 Post-delivery rating | NOT built |
| 3.5 Repeat prescription | NOT built |
| 3.6 Loyalty points | NOT built |
| 3.7 Per-branch stock badges on product cards | NOT built (products have no per-branch stock model) |
| 3.8 Consultation booking page | `consultation.tsx` exists — needs full form + .ics |
| 3.9 KINGS10 coupon | NOT built |
| 3.10 Pulsing "N New Orders" badge on staff | Partial (counts exist) |
| 3.11 Driver profile card w/ availability | Partial (driver name/phone/vehicle exist) |
| 3.12 Multi-item Rx quotation | Single-item today |
| 4.1 Two demo flows + narrator + Next Stage | DemoController removed last turn at user's request |
| 4.2 Demo data pre-pop | Partial |
| 4.3 Dual-view split screen | NOT built |

## Build Approach

I will work in this order so each layer is testable:

1. **Store extensions** — add to `sharedOrders` and `sharedPrescriptions`: chat messages, rating, loyalty points, coupon, driver roster with availability, multi-line Rx quotation, per-branch stock map.
2. **Customer surfaces** — dashboard active-order banner + loyalty card; tracking page countdown + animated map + Call/Chat/Message Pharmacy buttons + rating modal; repeat-Rx button.
3. **Staff surfaces** — pulsing new-orders badge + driver picker with avatars/availability + driver profile card + Print Rx + Print Packing Slip + multi-line quotation editor.
4. **Checkout** — KINGS10 coupon collapsible on review step.
5. **Consultation booking** — full form, confirmation screen, `.ics` download, notification.
6. **Comms** — Chat component (shared between customer & driver views, persisted in store with seeded demo messages) + mock Call screen component.
7. **Demo mode** — re-introduce a Demo controller (off the homepage; lives in a hidden `/demo` route or a small staff-only launcher) with two flows, narrator, Next Stage, Restart. Dual-view at `/demo/dual`.
8. **QA pass** — Playwright at 375 px and 1280 px for: registration, OTC 10 stages, Rx flow, chat, call, coupon, rating. Fix anything broken.

## Things I need to flag

- **Cost / time**: this is roughly a full day of edits across ~25 files. I'll do it in one go but the response will be long.
- **Driver portal**: there is no separate driver auth today — the "driver view" is a tab inside the staff dashboard. I'll keep it that way (cheapest, demo-safe) unless you want a separate `/driver` login.
- **Map**: real maps need a tile provider key. I'll do an animated SVG route (branch → customer pin, car icon tweening along a polyline) — looks great in a demo, no key required.
- **Per-branch stock**: products today have a single global stock field. I'll add a small per-branch stock map keyed by branch id with realistic demo values, without rewriting the product schema.
- **Demo mode placement**: last turn you asked me to *remove* the Demo button from the homepage so you can present "as a customer". The new brief asks for it back with two flows + narrator. I'll put the launcher on a **dedicated `/demo` route** (linked only from the footer's small print, not the homepage) so the customer-facing home stays clean. Tell me if you'd rather have it as a floating button again.

## Two quick confirmations before I start

1. **Driver portal** — keep as a tab inside the staff dashboard (recommended), or build a separate `/driver` login?
2. **Demo launcher placement** — hidden `/demo` route (recommended), floating button visible only to staff role, or floating button visible to everyone?

Once you answer those (or say "your call on both"), I'll execute the whole plan in one pass and run the Playwright QA at the end.
