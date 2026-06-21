import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isPreviewHost(): boolean {
  if (typeof window === "undefined") return true;
  const h = window.location.hostname;
  return (
    h.startsWith("id-preview--") ||
    h.startsWith("preview--") ||
    h.endsWith(".lovableproject.com") ||
    h.endsWith(".lovableproject-dev.com") ||
    h === "localhost" ||
    window.self !== window.top
  );
}

type Platform = "android" | "ios" | "desktop" | "other";
function detectPlatform(): Platform {
  if (typeof window === "undefined") return "other";
  const ua = window.navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return "ios";
  if (/Android/.test(ua)) return "android";
  if (/Windows|Macintosh|Linux/.test(ua)) return "desktop";
  return "other";
}

export function InstallPWA() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [platform, setPlatform] = useState<Platform>("other");
  const [previewBlocked, setPreviewBlocked] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setPlatform(detectPlatform());
    const blocked = isPreviewHost();
    setPreviewBlocked(blocked);
    if (blocked) return;

    // Already installed (standalone)
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    if (standalone) {
      setInstalled(true);
      return;
    }

    // Register the service worker — required for install eligibility on Chrome.
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch(() => {});
    }

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const onClick = async () => {
    if (deferred) {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome === "accepted") setInstalled(true);
      setDeferred(null);
      return;
    }
    // No deferred prompt yet — show platform-specific instructions.
    setShowHelp(true);
  };

  // Hide entirely on Lovable preview / iframe / localhost or after install.
  if (previewBlocked || installed) return null;

  return (
    <>
      {/* Persistent Install App button — sits above the WhatsApp FAB */}
      <button
        onClick={onClick}
        className="fixed z-40 flex items-center gap-2 rounded-full bg-[#0EA5E9] px-4 py-2.5 text-sm font-bold text-white shadow-2xl ring-4 ring-white/40 transition hover:scale-105 hover:bg-[#0284C7] focus:outline-none focus:ring-4 focus:ring-[#0EA5E9]/30"
        style={{
          right: "max(16px, env(safe-area-inset-right))",
          bottom: "calc(env(safe-area-inset-bottom, 0px) + 220px)",
        }}
        aria-label="Install Kings Pharmacy app"
      >
        <Download className="h-4 w-4" strokeWidth={2.6} />
        <span className="hidden sm:inline">Install App</span>
        <span className="sm:hidden">Install</span>
      </button>

      {showHelp && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40"
            onClick={() => setShowHelp(false)}
            aria-hidden
          />
          <div
            role="dialog"
            aria-label="How to install Kings Pharmacy"
            className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,420px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-2xl"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0EA5E9]/10 text-[#0EA5E9]">
                <Download className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-base font-extrabold text-[#111827]">
                  Install Kings Pharmacy
                </div>
                {platform === "ios" && (
                  <p className="mt-1 text-sm text-[#374151]">
                    In Safari, tap the{" "}
                    <span className="font-bold">Share</span> button (square
                    with arrow), then{" "}
                    <span className="font-bold">Add to Home Screen</span>.
                  </p>
                )}
                {platform === "android" && (
                  <p className="mt-1 text-sm text-[#374151]">
                    Tap the browser{" "}
                    <span className="font-bold">menu (⋮)</span> in the top
                    right, then choose{" "}
                    <span className="font-bold">
                      Install app
                    </span>{" "}
                    or <span className="font-bold">Add to Home screen</span>.
                  </p>
                )}
                {platform === "desktop" && (
                  <p className="mt-1 text-sm text-[#374151]">
                    Click the{" "}
                    <span className="font-bold">install icon</span> in your
                    address bar, or open the browser menu and choose{" "}
                    <span className="font-bold">Install Kings Pharmacy</span>.
                  </p>
                )}
                {platform === "other" && (
                  <p className="mt-1 text-sm text-[#374151]">
                    Open your browser menu and choose{" "}
                    <span className="font-bold">Install app</span> or{" "}
                    <span className="font-bold">Add to Home Screen</span>.
                  </p>
                )}
                <p className="mt-2 text-[12px] text-[#6B7280]">
                  Tip: visit the site for a few seconds first — some browsers
                  unlock the install option after light usage.
                </p>
              </div>
              <button
                onClick={() => setShowHelp(false)}
                className="rounded-full p-1 text-[#6B7280] hover:bg-[#F3F4F6]"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <button
              onClick={() => setShowHelp(false)}
              className="mt-3 w-full rounded-lg bg-[#0EA5E9] py-2 text-sm font-bold text-white hover:bg-[#0284C7]"
            >
              Got it
            </button>
          </div>
        </>
      )}
    </>
  );
}