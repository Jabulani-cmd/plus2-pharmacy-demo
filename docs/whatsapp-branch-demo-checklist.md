# WhatsApp Branch Menu — Demo Checklist

Use this script to demo the floating WhatsApp flow end-to-end. Run it once on
**desktop** and once on **mobile** (use the device switcher above the preview).

## Setup
- [ ] Open the site as a guest (signed out is fine).
- [ ] Confirm the green WhatsApp FAB is visible bottom-right, above the chatbot.
- [ ] Confirm the header branch chip shows the current branch (default: 9th Ave CBD).

## A. "Choose a branch inside WhatsApp" (single entry point)
- [ ] Tap the green WhatsApp FAB → popover opens.
- [ ] Tap **Choose a branch in WhatsApp**.
- [ ] WhatsApp opens (web on desktop, app on mobile) to the main number
      (+263 77 571 5520) with a pre-filled numbered menu listing all 4 branches.
- [ ] Verify the menu reads in order:
      1. 9th Ave CBD
      2. 6th Ave CBD
      3. Old Mutual Centre
      4. Ascot Centre
- [ ] Reply with `1` — confirm message sends (staff would then route).

## B. Direct branch pick (CBD branches)
- [ ] Reopen the WhatsApp popover.
- [ ] Tap **9th Ave CBD** → WhatsApp opens to +263 77 571 5520, greeting ends
      with `(9th Ave CBD)`.
- [ ] Back to site, tap **6th Ave CBD** → WhatsApp opens with greeting
      `(6th Ave CBD)` (currently routed to the placeholder number until the
      6th Ave WhatsApp is provided).

## C. Direct branch pick (street / centre branches)
- [ ] Tap **Old Mutual Centre** → WhatsApp opens with greeting
      `(Old Mutual Centre)` and shows the Jason Moyo Ave address in the popover row.
- [ ] Tap **Ascot Centre** → WhatsApp opens with greeting `(Ascot Centre)`.

## D. "Chat with <your branch>" shortcut
- [ ] In the header, switch the active branch to **Old Mutual Centre**.
- [ ] Reopen the WhatsApp popover — the bottom green button now reads
      **Chat with Old Mutual Centre** and the row shows the green check.
- [ ] Tap it → WhatsApp opens to that branch with the matching greeting.

## E. Chatbot ↔ WhatsApp handoff
- [ ] Open the navy chatbot FAB.
- [ ] Tap the **Choose a branch** quick reply → branch picker renders inline.
- [ ] Pick **Ascot Centre** → bot confirms it's now your branch and shows a
      **Chat with Ascot Centre on WhatsApp** button.
- [ ] Tap that button → WhatsApp opens to Ascot Centre with the pre-filled greeting.

## Cross-device checks
- [ ] Desktop: popover sits above the FAB, doesn't cover the mobile bottom nav
      (n/a on desktop), and `wa.me` opens in a new tab.
- [ ] Mobile: FAB sits above the bottom nav, popover is full-width-ish (≤92vw),
      and tapping a branch opens the native WhatsApp app.
- [ ] No console errors at any step.

## Known placeholders
- 6th Ave CBD, Old Mutual Centre, and Ascot Centre currently use the 9th Ave
  WhatsApp number as a placeholder. Replace each `whatsapp` field in
  `src/data/branches.ts` once the real numbers are provided.