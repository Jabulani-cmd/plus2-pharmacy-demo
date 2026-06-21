import { useState } from "react";
import { MessageCircle, X, Check } from "lucide-react";
import { BRANCHES, getBranch } from "@/data/branches";
import { useBranch } from "@/store/branch";

const GREETING =
  "Hi Kings Pharmacy, I'd like to ask about ";

export function FloatingWhatsApp() {
  const selectedBranchId = useBranch((s) => s.selectedBranchId);
  const [open, setOpen] = useState(false);

  const openChat = (whatsapp: string, name: string) => {
    const url =
      "https://wa.me/" +
      whatsapp +
      "?text=" +
      encodeURIComponent(GREETING + "(" + name + ")");
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
              Choose a branch to start chatting
            </p>
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