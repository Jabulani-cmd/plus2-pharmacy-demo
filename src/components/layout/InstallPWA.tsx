import { useEffect, useState } from "react";
import { Download, X, Share2, PlusSquare } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

declare global {
  interface Window {
    __kingsPwaDeferredPrompt?: BeforeInstallPromptEvent;
  }
}

const DISMISS_KEY = "kings-pwa-install-dismissed";

function isLikelyStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    (window.navigator as any).standalone === true
  );
}

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

function isIosSafari(): boolean {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent;
  const isIos = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
  const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
  return isIos && isSafari;
}

function isAndroid(): boolean {
  if (typeof window === "undefined") return false;
  return /android/i.test(navigator.userAgent);
}

function isInstallablePlatform(): boolean {
  return typeof window !== "undefined" && ("BeforeInstallPromptEvent" in window || isIosSafari());
}

/**
 * Shows a non-intrusive install banner when the browser reports the app is
 * installable. On Android/Chrome, tapping Install triggers the native browser
 * install prompt. On iOS Safari, we show manual Add-to-Home-Screen instructions
 * because Safari does not expose a programmatic prompt.
 */
export function InstallPWA() {
  const [visible, setVisible] = useState(false);
  const [iosHint, setIosHint] = useState(false);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isLikelyStandalone()) return;
    if (sessionStorage.getItem(DISMISS_KEY) === "1") return;
    // Preview iframes cannot fire beforeinstallprompt, so we still show the
    // banner but never attempt to call a native prompt.
    if (!isInstallablePlatform() && !isPreviewHost()) return;

    // Ensure the service worker is registered for Chrome install eligibility.
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
    }

    let promptTimeout: ReturnType<typeof setTimeout> | null = null;
    let mounted = true;

    const showBanner = () => {
      if (!mounted) return;
      setVisible(true);
    };

    const handlePrompt = (e: Event) => {
      e.preventDefault();
      const prompt = e as BeforeInstallPromptEvent;
      window.__kingsPwaDeferredPrompt = prompt;
      if (!mounted) return;
      setDeferred(prompt);
      showBanner();
    };

    const handleInstalled = () => {
      if (promptTimeout) clearTimeout(promptTimeout);
      window.__kingsPwaDeferredPrompt = undefined;
      if (!mounted) return;
      setDeferred(null);
      setVisible(false);
    };

    // If the prompt was already captured by the head script, use it immediately.
    const existing = window.__kingsPwaDeferredPrompt || null;
    if (existing) {
      setDeferred(existing);
      showBanner();
    } else if (isIosSafari()) {
      // iOS never fires beforeinstallprompt; show the banner with the manual hint.
      showBanner();
    } else {
      // Wait for Chrome to fire the event (usually within a second or two).
      window.addEventListener("beforeinstallprompt", handlePrompt);
      // If the browser never fires it, still show a fallback banner after a few seconds.
      promptTimeout = setTimeout(() => {
        if (!mounted) return;
        if (!window.__kingsPwaDeferredPrompt) showBanner();
      }, 4000);
    }

    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      mounted = false;
      if (promptTimeout) clearTimeout(promptTimeout);
      window.removeEventListener("beforeinstallprompt", handlePrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    setIosHint(false);
    sessionStorage.setItem(DISMISS_KEY, "1");
  };

  const handleInstall = async () => {
    if (isIosSafari()) {
      setIosHint(true);
      return;
    }
    const prompt = deferred || window.__kingsPwaDeferredPrompt;
    if (!prompt) {
      // No native prompt available yet; show the banner again after a delay.
      setVisible(false);
      setTimeout(() => setVisible(true), 1000);
      return;
    }
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      if (choice.outcome === "dismissed") {
        sessionStorage.setItem(DISMISS_KEY, "1");
      }
    } catch {
      // ignore
    } finally {
      setDeferred(null);
      window.__kingsPwaDeferredPrompt = undefined;
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <>
      <div className="fixed bottom-20 left-1/2 z-[60] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 overflow-hidden rounded-xl border border-sky-200 bg-white shadow-xl md:bottom-4">
        <div className="flex items-start gap-3 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
            <Download className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-900">Install Kings Pharmacy</p>
            <p className="mt-0.5 text-xs text-slate-600">
              Add our app to your home screen for faster orders, prescriptions, and delivery tracking.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={handleInstall}
                className="inline-flex items-center gap-1.5 rounded-lg bg-sky-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-sky-600 active:scale-95"
              >
                <Download className="h-3.5 w-3.5" />
                {isIosSafari() ? "How to install" : "Install app"}
              </button>
              <button
                onClick={handleDismiss}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-slate-100"
              >
                Not now
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="shrink-0 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Dismiss install banner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {iosHint && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-2xl">
            <div className="mb-3 flex items-center gap-2 text-sky-600">
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
              <li>Tap Add in the top-right corner.</li>
            </ol>
            <button
              onClick={() => setIosHint(false)}
              className="mt-5 w-full rounded-lg bg-sky-500 py-2 text-sm font-semibold text-white transition hover:bg-sky-600"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
