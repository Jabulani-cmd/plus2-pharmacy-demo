import { useState } from "react";
import { MessageCircle, X, Check } from "lucide-react";
import { BRANCHES, getBranch } from "@/data/branches";
import { useBranch } from "@/store/branch";

const GREETING =
  "Hi Kings Pharmacy, I'd like to ask about ";

// Pre-filled menu sent when the customer chooses "Choose a branch in WhatsApp".
// They reply with the number inside WhatsApp and our team routes them.
const BRANCH_MENU = (branches: { shortName: string; address: string }[]) =>
  "Hi Kings Pharmacy 👋\n\nI'd like to chat with a branch. Please connect me with:\n\n" +
  branches.map((b, i) => `${i + 1}. ${b.shortName} — ${b.address}`).join("\n") +
  "\n\nReply with the number of your preferred branch.";

/**
 * Build a WhatsApp deep link that avoids the `wa.me` → `api.whatsapp.com`
 * redirect (which some corporate / ISP networks block with
 * ERR_BLOCKED_BY_RESPONSE). Uses the native app scheme on mobile and
 * `web.whatsapp.com` on desktop.
 */
function buildWhatsAppUrl(phone: string, text: string): string {
  const encoded = encodeURIComponent(text);
  const isMobile =
    typeof navigator !== "undefined" &&
    /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  if (isMobile) {
    return `whatsapp://send?phone=${phone}&text=${encoded}`;
  }
  return `https://web.whatsapp.com/send?phone=${phone}&text=${encoded}`;
}

export function FloatingWhatsApp() {
  const selectedBranchId = useBranch((s) => s.selectedBranchId);
  const [open, setOpen] = useState(false);

  const openChat = (whatsapp: string, name: string) => {
    const url = buildWhatsAppUrl(whatsapp, GREETING + "(" + name + ")");
    window.open(url, "_blank", "noopener,noreferrer");
    setOpen(false);
  };

  // Opens WhatsApp with a numbered branch menu so the customer can pick the
  // branch from inside WhatsApp itself. Routed via the main (9th Ave) number.
  const openBranchMenu = () => {
    const main = BRANCHES[0].whatsapp;
    const url = buildWhatsAppUrl(main, BRANCH_MENU(BRANCHES));
    window.open(url, "_blank", "noopener,noreferrer");
    setOpen(false);
  };

  const quickOpen = () => {
    if (!open) {
      // First click on the FAB: just show the menu so the user can confirm
      // (or choose a different) branch.
      setOpen(true);
      return;
    }
    setOpen(false);
  };

  return (
    <>
      {/* Popover panel */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/10 md:bg-transparent"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div
            className="fixed z-50 w-[min(92vw,320px)] rounded-2xl border border-[#E5E7EB] bg-white p-3 shadow-2xl"
            style={{
              right: "max(16px, env(safe-area-inset-right))",
              bottom: "calc(env(safe-area-inset-bottom, 0px) + 156px)",
            }}
          >
            <div className="flex items-center justify-between px-1 pb-2">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#25D366] text-white">
                  <MessageCircle className="h-4 w-4" />
                </span>
                <div className="text-sm font-extrabold text-[#111827]">
                  Chat on WhatsApp
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-full p-1 hover:bg-[#F3F4F6]"
                aria-label="Close"
              >
                <X className="h-4 w-4 text-[#6B7280]" />
              </button>
            </div>
            <p className="px-1 pb-2 text-[11px] text-[#6B7280]">
              Pick a branch below, or let the customer choose inside WhatsApp.
            </p>
            <button
              onClick={openBranchMenu}
              className="mb-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#25D366] bg-white py-2 text-xs font-bold text-[#128C7E] hover:bg-[#F0FDF4]"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              Choose a branch in WhatsApp
            </button>
            <ul className="max-h-[60vh] overflow-y-auto">
              {BRANCHES.map((b) => {
                const active = b.id === selectedBranchId;
                return (
                  <li key={b.id}>
                    <button
                      onClick={() => openChat(b.whatsapp, b.shortName)}
                      className={
                        "flex w-full items-start gap-2 rounded-lg px-2.5 py-2.5 text-left transition hover:bg-[#F0FDF4] " +
                        (active ? "bg-[#F0FDF4]" : "")
                      }
                    >
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#25D366]/15 text-[#128C7E]">
                        <MessageCircle className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          <span className="truncate text-sm font-bold text-[#111827]">
                            {b.shortName}
                          </span>
                          {active && (
                            <Check className="h-3 w-3 shrink-0 text-[#128C7E]" aria-label="Your branch" />
                          )}
                        </span>
                        <span className="block truncate text-[11px] text-[#6B7280]">
                          {b.address}
                        </span>
                        <span className="mt-0.5 block font-mono text-[11px] font-semibold text-[#128C7E]">
                          {b.phone}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="mt-1 border-t border-[#F3F4F6] px-2 py-2 text-center text-[10px] text-[#9CA3AF]">
              Pre-filled with a friendly greeting — chat opens in WhatsApp.
            </div>
            {/* One-tap to selected branch */}
            <button
              onClick={() => {
                const b = getBranch(selectedBranchId);
                openChat(b.whatsapp, b.shortName);
              }}
              className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#25D366] py-2.5 text-sm font-bold text-white shadow hover:bg-[#1DA851]"
            >
              <MessageCircle className="h-4 w-4" />
              Chat with {getBranch(selectedBranchId).shortName}
            </button>
          </div>
        </>
      )}

      {/* Floating FAB — sits above the mobile bottom nav (which is ~64px tall) */}
      <button
        onClick={quickOpen}
        className="fixed z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-2xl ring-4 ring-white/40 transition hover:scale-105 hover:bg-[#1DA851] focus:outline-none focus:ring-4 focus:ring-[#25D366]/30"
        style={{
          right: "max(16px, env(safe-area-inset-right))",
          bottom: "calc(env(safe-area-inset-bottom, 0px) + 80px)",
        }}
        aria-label="Chat on WhatsApp"
        aria-expanded={open}
      >
        <MessageCircle className="h-7 w-7" strokeWidth={2.4} />
        <span className="absolute -top-1 -right-1 hidden h-3 w-3 rounded-full border-2 border-white bg-[#10B981] md:block" />
      </button>
    </>
  );
}