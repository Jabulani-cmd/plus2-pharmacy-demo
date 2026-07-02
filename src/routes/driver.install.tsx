import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { InstallDriverApp } from "@/components/driver/InstallDriverApp";

export const Route = createFileRoute("/driver/install")({
  head: () => ({
    meta: [
      { title: "Install KP Driver App — Kings Pharmacy" },
      {
        name: "description",
        content:
          "Step-by-step instructions to install the Kings Pharmacy Driver app on your Android or iPhone.",
      },
    ],
  }),
  component: DriverInstallPage,
});

function DriverInstallPage() {
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const fromPWA = params.get("source") === "pwa";
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    if (standalone) {
      localStorage.setItem("kp-driver-installed", "1");
    }
    if (standalone || fromPWA) {
      navigate({ to: "/driver", replace: true });
    }
  }, [navigate]);

  const driverUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/driver/install`
      : "https://kingspharmacy-mavingtech.online/driver/install";

  const waMessage = encodeURIComponent(
    "Hi! Here is your Kings Pharmacy Driver App link:\n\n" +
      driverUrl +
      "\n\n*How to install on Android:*\n" +
      "1. Open the link in Chrome\n" +
      "2. Tap the menu (3 dots) → 'Add to Home screen'\n" +
      "3. Tap 'Install'\n\n" +
      "*How to install on iPhone:*\n" +
      "1. Open the link in Safari\n" +
      "2. Tap the Share button ↑\n" +
      "3. Tap 'Add to Home Screen'\n" +
      "4. Tap 'Add'",
  );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(driverUrl);
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Copy failed");
    }
  };

  const androidSteps = [
    "Open this page in Chrome browser",
    "Tap the three dots menu (⋮) at the top right",
    "Tap 'Add to Home screen'",
    "Tap 'Install' in the popup",
    "KP Driver app appears on your home screen",
  ];
  const iosSteps = [
    "Open this page in Safari browser (not Chrome)",
    "Tap the Share button (□↑) at the bottom",
    "Scroll down and tap 'Add to Home Screen'",
    "Tap 'Add' in the top right corner",
    "KP Driver app appears on your home screen",
  ];

  return (
    <div className="min-h-screen bg-[#1B3A6B] px-6 py-8 text-white">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-3xl bg-white/10 text-6xl">
            🛵
          </div>
          <div className="text-2xl font-black">KP Driver</div>
          <div className="mt-1 text-sm opacity-70">Kings Pharmacy Driver App</div>
        </div>

        <div className="mb-8">
          <InstallDriverApp variant="card" persistent />
        </div>

        <Section title="Install on Android" steps={androidSteps} />
        <Section title="Install on iPhone" steps={iosSteps} />

        <div className="mt-6 rounded-2xl bg-white/10 p-4">
          <div className="mb-2 text-xs font-black uppercase tracking-wider opacity-80">
            Share driver app link
          </div>
          <div className="mb-3 break-all rounded-xl bg-black/25 p-3 font-mono text-[11px] leading-relaxed">
            {driverUrl}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={copy}
              className="h-10 flex-1 rounded-full border-2 border-white/60 text-xs font-black text-white transition hover:bg-white/10"
            >
              {copied ? "✅ Copied" : "📋 Copy link"}
            </button>
            <a
              href={`https://wa.me/?text=${waMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-10 flex-1 items-center justify-center gap-1 rounded-full bg-emerald-500 text-xs font-black text-white transition hover:bg-emerald-600"
            >
              📲 WhatsApp
            </a>
          </div>
        </div>

        <a
          href="/driver/login?fromInstall=1"
          className="mt-6 flex h-14 w-full items-center justify-center rounded-full bg-white text-base font-black text-[#1B3A6B]"
        >
          Continue to Driver Sign In →
        </a>

        <div className="mt-4 text-center text-[11px] opacity-50">
          kingspharmacy-mavingtech.online
        </div>
      </div>
    </div>
  );
}

function Section({ title, steps }: { title: string; steps: string[] }) {
  return (
    <div className="mb-8">
      <div className="mb-4 text-lg font-black">{title}</div>
      <div className="space-y-3">
        {steps.map((step, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 text-sm font-black">
              {i + 1}
            </div>
            <div className="pt-1 text-sm opacity-90">{step}</div>
          </div>
        ))}
      </div>
    </div>
  );
}