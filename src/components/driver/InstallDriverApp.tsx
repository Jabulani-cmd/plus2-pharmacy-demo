import { useEffect, useState, useCallback } from "react";
import { Download, X, Share2, PlusSquare, Smartphone } from "lucide-react";
import { toast } from "sonner";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "driver-install-dismissed";

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    (window.navigator as any).standalone === true
  );
}

function isIosSafari(): boolean {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent;
  const isIos = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
  const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
  return isIos && isSafari;
}

function isAndroidChrome(): boolean {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent;
  return /android/i.test(ua) && /chrome/i.test(ua) && !/edge/i.test(ua);
}

function canInstall(): boolean {
  return typeof window !== "undefined";
}

function isChromeFamily(): boolean {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent;
  return /chrome/i.test(ua) && !/edge|edg/i.test(ua);
}

/**
 * Reusable driver PWA install card/banner.
 * - Shows the native Android install prompt if available.
 * - Shows iOS Safari "Add to Home Screen" instructions if needed.
 * - Remains dismissible for 24 hours.
 */
export function InstallDriverApp({
  variant = "card",
  onDismiss,
}: {
  variant?: "banner" | "card";
  onDismiss?: () => void;
}) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const [visible, setVisible] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isStandalone()) {
      setInstalled(true);
      return;
    }
    if (!canInstall()) return;
    if (sessionStorage.getItem(DISMISS_KEY) === "1") return;

    const pre = (window as any).__kingsPwaDeferredPrompt;
    if (pre) {
      setDeferredPrompt(pre);
      setVisible(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      const prompt = e as BeforeInstallPromptEvent;
      (window as any).__kingsPwaDeferredPrompt = prompt;
      setDeferredPrompt(prompt);
      setVisible(true);
    };

    const installedHandler = () => {
      setInstalled(true);
      setVisible(false);
      setDeferredPrompt(null);
      toast.success("Driver app installed successfully");
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", installedHandler);

    // For iOS Safari, we never get a native prompt, so show instructions immediately.
    if (isIosSafari()) {
      setVisible(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    setShowIosHint(false);
    sessionStorage.setItem(DISMISS_KEY, "1");
    onDismiss?.();
  }, [onDismiss]);

  const handleInstall = useCallback(async () => {
    if (isIosSafari()) {
      setShowIosHint(true);
      return;
    }
    const prompt = deferredPrompt || (window as any).__kingsPwaDeferredPrompt;
    if (!prompt) {
      toast.info("Install not ready yet. Wait a moment, then tap Install again.", {
        duration: 4000,
      });
      return;
    }
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      if (choice?.outcome === "accepted") {
        toast.success("Driver app installed");
        setInstalled(true);
      } else {
        handleDismiss();
      }
    } catch {
      toast.error("Install prompt failed. Try using your browser menu.");
    } finally {
      setDeferredPrompt(null);
      (window as any).__kingsPwaDeferredPrompt = undefined;
    }
  }, [deferredPrompt, handleDismiss]);

  if (installed) return null;
  if (!visible) return null;

  if (variant === "banner") {
    return (
      <>
        <div
          className="sticky top-0 z-50 flex items-center gap-3 px-4 py-3 shadow-md"
          style={{ background: "linear-gradient(135deg,#1B3A6B,#1E5BC6)" }}
        >
          <div className="text-2xl">📱</div>
          <div className="min-w-0 flex-1 text-white">
            <div className="text-sm font-black leading-tight">Install Driver App</div>
            <div className="truncate text-[11px] text-white/80">
              Add to home screen for quick access
            </div>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="text-xs font-bold text-white/70 hover:text-white"
          >
            Later
          </button>
          <button
            type="button"
            onClick={handleInstall}
            className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-black text-[#1B3A6B] shadow"
          >
            <Download className="h-3.5 w-3.5" /> Install
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss"
            className="text-white/60 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {showIosHint && (
          <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-4 sm:items-center">
            <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-2xl">
              <div className="mb-3 flex items-center gap-2 text-[#1B3A6B]">
                <Share2 className="h-5 w-5" />
                <span className="font-semibold">Install on iPhone / iPad</span>
              </div>
              <ol className="ml-4 list-decimal space-y-2 text-sm text-slate-700">
                <li>
                  Tap the{" "}
                  <span className="inline-flex items-center gap-1 font-semibold text-slate-900">
                    <Share2 className="h-3.5 w-3.5" /> Share
                  </span>{" "}
                  button in Safari’s toolbar.
                </li>
                <li>
                  Scroll down and tap{" "}
                  <span className="inline-flex items-center gap-1 font-semibold text-slate-900">
                    <PlusSquare className="h-3.5 w-3.5" /> Add to Home Screen
                  </span>
                  .
                </li>
                <li>Tap <strong>Add</strong> in the top-right corner.</li>
              </ol>
              <button
                onClick={() => setShowIosHint(false)}
                className="mt-5 w-full rounded-lg bg-[#1B3A6B] py-2 text-sm font-semibold text-white transition hover:bg-sky-700"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Card variant
  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-sky-200 bg-gradient-to-br from-[#1B3A6B] to-[#1E5BC6] p-5 text-white shadow-md">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15">
            <Smartphone className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-black leading-tight">Download Driver App</div>
            <div className="mt-1 text-[11px] text-sky-100">
              {isIosSafari()
                ? "Add this page to your Home Screen for one-tap access."
                : isAndroidChrome()
                ? "Install on your Android phone for quick access and notifications."
                : "Install this app on your phone for quick access and notifications."}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={handleInstall}
                className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-black text-[#1B3A6B] shadow transition active:scale-95"
              >
                <Download className="h-3.5 w-3.5" />
                {isIosSafari() ? "How to install" : "Install app"}
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                className="rounded-full px-3 py-2 text-xs font-bold text-white/80 transition hover:bg-white/10"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>

      {showIosHint && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-2xl">
            <div className="mb-3 flex items-center gap-2 text-[#1B3A6B]">
              <Share2 className="h-5 w-5" />
              <span className="font-semibold">Install on iPhone / iPad</span>
            </div>
            <ol className="ml-4 list-decimal space-y-2 text-sm text-slate-700">
              <li>
                Tap the{" "}
                <span className="inline-flex items-center gap-1 font-semibold text-slate-900">
                  <Share2 className="h-3.5 w-3.5" /> Share
                </span>{" "}
                button in Safari’s toolbar.
              </li>
              <li>
                Scroll down and tap{" "}
                <span className="inline-flex items-center gap-1 font-semibold text-slate-900">
                  <PlusSquare className="h-3.5 w-3.5" /> Add to Home Screen
                </span>
                .
              </li>
              <li>Tap <strong>Add</strong> in the top-right corner.</li>
            </ol>
            <button
              onClick={() => setShowIosHint(false)}
              className="mt-5 w-full rounded-lg bg-[#1B3A6B] py-2 text-sm font-semibold text-white transition hover:bg-sky-700"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
