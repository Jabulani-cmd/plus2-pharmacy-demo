import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/get-driver-app")({
  head: () => ({
    meta: [
      { title: "Install KP Driver — Kings Pharmacy" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: GetDriverApp,
});

type Device = "android" | "ios" | "checking";

interface BIPEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function GetDriverApp() {
  const navigate = useNavigate();
  const [device, setDevice] = useState<Device>("checking");
  const [installPrompt, setInstallPrompt] = useState<BIPEvent | null>(null);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BIPEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (standalone) {
      navigate({ to: "/driver", replace: true });
      return;
    }

    if (localStorage.getItem("kp-driver-app") === "1") {
      navigate({ to: "/driver", replace: true });
      return;
    }

    const ua = navigator.userAgent;
    if (/android/i.test(ua)) {
      setDevice("android");
    } else if (
      /iphone|ipad|ipod/i.test(ua) &&
      !(window as unknown as { MSStream?: unknown }).MSStream
    ) {
      setDevice("ios");
    } else {
      localStorage.setItem("kp-driver-app", "1");
      navigate({ to: "/driver", replace: true });
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, [navigate]);

  const handleInstallClick = async () => {
    if (installPrompt) {
      setInstalling(true);
      try {
        await installPrompt.prompt();
        const { outcome } = await installPrompt.userChoice;
        if (outcome === "accepted") {
          localStorage.setItem("kp-driver-app", "1");
          navigate({ to: "/driver", replace: true });
        }
      } catch {
        /* ignore */
      } finally {
        setInstalling(false);
      }
    } else {
      document
        .getElementById("install-steps")
        ?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleDone = () => {
    localStorage.setItem("kp-driver-app", "1");
    navigate({ to: "/driver", replace: true });
  };

  if (device === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#1B3A6B] text-white">
        <div className="text-sm opacity-80">Loading…</div>
      </div>
    );
  }

  const androidSteps = [
    'Tap the button above — a popup will appear',
    'Tap "Install" or "Add to Home screen"',
    "Wait for the app to install",
    "Open KP Driver from your home screen",
    "Sign in with your driver email and password",
  ];
  const androidFallback = [
    "Open this page in Chrome browser",
    "Tap the ⋮ three-dot menu (top right)",
    'Tap "Add to Home screen"',
    'Tap "Install"',
  ];
  const iosSteps = [
    "Open this link in Safari browser",
    "Tap the Share button (□↑) at the bottom",
    'Scroll down and tap "Add to Home Screen"',
    'Tap "Add" in the top right corner',
    "Open KP Driver from your home screen",
    "Sign in with your driver email and password",
  ];

  return (
    <div className="min-h-screen bg-[#1B3A6B] px-5 py-8 text-white">
      <div className="mx-auto w-full max-w-md">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-white/10 text-5xl">
          🛵
        </div>
        <div className="mt-4 text-center text-2xl font-black tracking-tight">
          KP Driver
        </div>
        <div className="mt-1 text-center text-xs opacity-75">
          Kings Pharmacy Delivery
        </div>

        <div className="mx-auto mt-5 w-fit rounded-full bg-amber-500 px-4 py-1.5 text-center text-[11px] font-black tracking-wide text-[#1B3A6B]">
          ⚠️ Install required before signing in
        </div>

        <button
          type="button"
          onClick={handleInstallClick}
          disabled={installing}
          className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-full bg-white text-base font-black text-[#1B3A6B] shadow-lg transition active:scale-[0.98] disabled:opacity-70"
        >
          {installing ? (
            <>
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[#1B3A6B] border-t-transparent" />
              Installing…
            </>
          ) : (
            <>
              <span>📲</span>
              {installPrompt ? "Install KP Driver App" : "Add to Home Screen"}
            </>
          )}
        </button>

        <div id="install-steps" className="mt-6 space-y-4">
          {device === "android" && (
            <>
              <div className="rounded-2xl bg-white/10 p-4">
                <div className="mb-3 text-sm font-black">How to install on Android</div>
                <ol className="space-y-2">
                  {androidSteps.map((text, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-white/20 text-[11px] font-black">
                        {i + 1}
                      </span>
                      <span className="text-sm leading-snug opacity-90">{text}</span>
                    </li>
                  ))}
                </ol>
              </div>
              <div className="rounded-2xl bg-white/5 p-4">
                <div className="mb-2 text-xs font-black opacity-90">
                  If the button above does not work
                </div>
                <ol className="space-y-1">
                  {androidFallback.map((text, i) => (
                    <li key={i} className="text-xs opacity-80">
                      {i + 1}. {text}
                    </li>
                  ))}
                </ol>
              </div>
            </>
          )}

          {device === "ios" && (
            <>
              <div className="rounded-2xl bg-amber-500/20 p-3 text-xs font-semibold text-amber-100">
                ⚠️ You must use Safari (not Chrome) to install this app on iPhone
              </div>
              <div className="rounded-2xl bg-white/10 p-4">
                <div className="mb-3 text-sm font-black">How to install on iPhone</div>
                <ol className="space-y-2">
                  {iosSteps.map((text, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-white/20 text-[11px] font-black">
                        {i + 1}
                      </span>
                      <span className="text-sm leading-snug opacity-90">{text}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </>
          )}

          <button
            type="button"
            onClick={handleDone}
            className="mt-2 h-12 w-full rounded-full border-2 border-white/50 text-sm font-black text-white transition active:scale-[0.98]"
          >
            ✅ I have installed it — Sign In
          </button>

          <div className="pt-2 text-center text-[11px] opacity-50">
            Kings Pharmacy · Bulawayo, Zimbabwe
          </div>
        </div>
      </div>
    </div>
  );
}