import { useEffect } from "react";

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

const DISMISS_KEY = "kings-pwa-install-dismissed";

/**
 * Auto-triggers the native browser install prompt 3s after page load.
 * Renders no UI. If the user dismisses, we don't ask again in the same session.
 */
export function InstallPWA() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isPreviewHost()) return;

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    if (standalone) return;

    if (sessionStorage.getItem(DISMISS_KEY) === "1") return;

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
    }

    let deferred: BeforeInstallPromptEvent | null = null;
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
      }
    };

    const onPrompt = (e: Event) => {
      e.preventDefault();
      deferred = e as BeforeInstallPromptEvent;
      if (timer) clearTimeout(timer);
      timer = setTimeout(showPrompt, 3000);
    };

    const onInstalled = () => {
      if (timer) clearTimeout(timer);
      deferred = null;
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  return null;
}