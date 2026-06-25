import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

declare global {
  interface Window {
    __kingsPwaDeferredPrompt?: BeforeInstallPromptEvent;
  }
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

const DISMISS_KEY = "kings-pwa-install-dismissed";

/**
 * Auto-triggers the native browser install prompt 3s after page load.
 * Renders no UI on Android/Chrome. On iOS Safari we show a small hint,
 * because iOS does not support the native install prompt event.
 */
export function InstallPWA() {
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isPreviewHost()) return;

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    if (standalone) return;

    if (sessionStorage.getItem(DISMISS_KEY) === "1") return;

    // Ensure the service worker is registered for install eligibility.
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
    }

    // iOS Safari does not fire beforeinstallprompt; show a manual hint.
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    if (isIos && isSafari) {
      setIosHint(true);
      return;
    }

    let deferred = window.__kingsPwaDeferredPrompt || null;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let promptShown = false;

    const showPrompt = async () => {
      if (!deferred || promptShown) return;
      promptShown = true;
      try {
        await deferred.prompt();
        const choice = await deferred.userChoice;
        if (choice.outcome === "dismissed") {
          sessionStorage.setItem(DISMISS_KEY, "1");
        }
      } catch {
        // ignore
      } finally {
        deferred = null;
        window.__kingsPwaDeferredPrompt = undefined;
      }
    };

    const onPrompt = (e: Event) => {
      e.preventDefault();
      deferred = e as BeforeInstallPromptEvent;
      window.__kingsPwaDeferredPrompt = deferred;
      if (timer) clearTimeout(timer);
      timer = setTimeout(showPrompt, 3000);
    };

    const onInstalled = () => {
      if (timer) clearTimeout(timer);
      deferred = null;
      window.__kingsPwaDeferredPrompt = undefined;
    };

    if (deferred) {
      timer = setTimeout(showPrompt, 3000);
    } else {
      window.addEventListener("beforeinstallprompt", onPrompt);
    }
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!iosHint) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-lg border border-sky-200 bg-white p-3 shadow-lg">
      <p className="text-sm font-medium text-slate-800">
        Install Kings Pharmacy: tap the Share button, then choose "Add to Home Screen".
      </p>
      <button
        onClick={() => setIosHint(false)}
        className="mt-2 text-xs font-semibold text-sky-600"
      >
        Dismiss
      </button>
    </div>
  );
}
