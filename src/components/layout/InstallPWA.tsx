import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "kings-pwa-install-dismissed";

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

export function InstallPWA() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIos, setShowIos] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isPreviewHost()) return;
    if (localStorage.getItem(DISMISS_KEY) === "1") return;

    // Already installed (standalone)
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // iOS Safari
      (window.navigator as any).standalone === true;
    if (standalone) return;

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
    window.addEventListener("beforeinstallprompt", onPrompt);

    // iOS Safari never fires beforeinstallprompt — show a manual hint instead.
    const ua = window.navigator.userAgent;
    const isIos = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
    if (isIos && isSafari) setShowIos(true);

    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  };

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setHidden(true);
  };

  if (hidden) return null;
  if (!deferred && !showIos) return null;

  return (
    <div
      className="fixed left-1/2 z-50 w-[min(92vw,420px)] -translate-x-1/2 rounded-2xl border border-[#E5E7EB] bg-white p-3 shadow-2xl"
      style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 150px)" }}
      role="dialog"
      aria-label="Install Kings Pharmacy app"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0EA5E9]/10 text-[#0EA5E9]">
          <Download className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-extrabold text-[#111827]">
            Install Kings Pharmacy
          </div>
          {deferred ? (
            <p className="mt-0.5 text-[12px] text-[#6B7280]">
              Add it to your home screen for one-tap access.
            </p>
          ) : (
            <p className="mt-0.5 text-[12px] text-[#6B7280]">
              Tap <span className="font-bold">Share</span> →{" "}
              <span className="font-bold">Add to Home Screen</span> to install.
            </p>
          )}
          {deferred && (
            <button
              onClick={install}
              className="mt-2 w-full rounded-lg bg-[#0EA5E9] py-2 text-sm font-bold text-white hover:bg-[#0284C7]"
            >
              Install app
            </button>
          )}
        </div>
        <button
          onClick={dismiss}
          className="rounded-full p-1 text-[#6B7280] hover:bg-[#F3F4F6]"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}