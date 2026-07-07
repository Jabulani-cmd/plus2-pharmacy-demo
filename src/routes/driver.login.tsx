import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Mail, Lock, Home, Truck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import kingsLogo from "@/assets/kings-logo.png";

export const Route = createFileRoute("/driver/login")({
  head: () => ({ meta: [{ title: "Driver Sign-in — Kings Pharmacy" }] }),
  component: DriverLogin,
});

const DEMO_DRIVERS = [
  { email: "siphamandla@kingspharmacy.co.zw", name: "Siphamandla Dube" },
  { email: "tatenda@kingspharmacy.co.zw", name: "Tatenda Chirwa" },
  { email: "bongani@kingspharmacy.co.zw", name: "Bongani Sithole" },
  { email: "rudo@kingspharmacy.co.zw", name: "Rudo Mhlanga" },
];
const DEMO_PASSWORD = "Driver123!";
const DRIVER_INSTALL_CONFIRMED_KEY = "kp-driver-app-installed-v2";

function DriverLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState(DEMO_DRIVERS[0].email);
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [loading, setLoading] = useState(false);

  // ---- Install gate (mobile-only) ----
  const [gateState, setGateState] = useState<"checking" | "show-gate" | "pass">(
    "checking",
  );
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    if (isStandalone) {
      setGateState("pass");
      return () => window.removeEventListener("beforeinstallprompt", onPrompt);
    }
    if (localStorage.getItem(DRIVER_INSTALL_CONFIRMED_KEY) === "1") {
      setGateState("pass");
      return () => window.removeEventListener("beforeinstallprompt", onPrompt);
    }
    const ua = navigator.userAgent;
    const isMobile =
      /android|iphone|ipad|ipod/i.test(ua) || window.innerWidth <= 640;
    if (!isMobile) {
      setGateState("pass");
      return () => window.removeEventListener("beforeinstallprompt", onPrompt);
    }
    const t = setTimeout(() => setGateState("show-gate"), 800);
    return () => {
      clearTimeout(t);
      window.removeEventListener("beforeinstallprompt", onPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (installPrompt) {
      setInstalling(true);
      try {
        installPrompt.prompt();
        const { outcome } = await installPrompt.userChoice;
        if (outcome === "accepted") {
          localStorage.setItem(DRIVER_INSTALL_CONFIRMED_KEY, "1");
          setGateState("pass");
        }
      } finally {
        setInstalling(false);
      }
    } else {
      document
        .getElementById("kp-manual-steps")
        ?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleAlreadyInstalled = () => {
    localStorage.setItem(DRIVER_INSTALL_CONFIRMED_KEY, "1");
    setGateState("pass");
  };

  // If already signed in as a driver, redirect.
  useEffect(() => {
    if (gateState !== "pass") return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled || !data.session) return;
      navigate({ to: "/driver", replace: true });
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate, gateState]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back");
    navigate({ to: "/driver", replace: true });
  };

  const oneClick = async (em: string) => {
    setEmail(em);
    setPassword(DEMO_PASSWORD);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: em,
      password: DEMO_PASSWORD,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back");
    navigate({ to: "/driver", replace: true });
  };

  if (gateState === "checking") {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg,#1B3A6B,#1E5BC6)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          padding: 16,
        }}
      >
        <div style={{ fontSize: 56 }}>🛵</div>
        <div
          className="animate-spin"
          style={{
            marginTop: 20,
            width: 32,
            height: 32,
            border: "3px solid rgba(255,255,255,0.3)",
            borderTopColor: "white",
            borderRadius: "50%",
          }}
        />
      </div>
    );
  }

  if (gateState === "show-gate") {
    const ua = navigator.userAgent;
    const isAndroid = /android/i.test(ua);
    const isIOS =
      /iphone|ipad|ipod/i.test(ua) && !(window as any).MSStream;
    const androidSteps = [
      'Tap "Tap to Install KP Driver" above',
      'Tap "Install" or "Add to Home screen" in the popup',
      "Open KP Driver from your home screen",
      "Sign in with your driver email and password",
    ];
    const iosSteps = [
      "Open this page in Safari browser",
      "Tap the Share button (□↑) at the bottom of the screen",
      'Scroll down and tap "Add to Home Screen"',
      'Tap "Add" in the top right corner',
      "Open KP Driver from your home screen",
      "Sign in with your driver email and password",
    ];
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(160deg,#1B3A6B 0%,#1E5BC6 100%)",
          color: "white",
          padding: "32px 20px 48px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          fontFamily:
            "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: 24,
            background: "rgba(255,255,255,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 52,
            boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
          }}
        >
          🛵
        </div>

        <div
          style={{
            marginTop: 20,
            fontSize: 26,
            fontWeight: 900,
            letterSpacing: -0.3,
          }}
        >
          KP Driver
        </div>
        <div style={{ marginTop: 4, fontSize: 13, opacity: 0.85 }}>
          Kings Pharmacy Delivery
        </div>

        <div
          style={{
            marginTop: 20,
            background: "rgba(255,193,7,0.18)",
            border: "1px solid rgba(255,193,7,0.6)",
            color: "#FFE7A0",
            padding: "8px 14px",
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 700,
            textAlign: "center",
            maxWidth: 340,
          }}
        >
          ⚠️ Install the app before signing in
        </div>

        <button
          type="button"
          onClick={handleInstall}
          disabled={installing}
          style={{
            marginTop: 24,
            width: "100%",
            maxWidth: 340,
            padding: "16px 20px",
            borderRadius: 16,
            border: "none",
            background: "white",
            color: "#1B3A6B",
            fontSize: 16,
            fontWeight: 900,
            boxShadow: "0 12px 30px rgba(0,0,0,0.25)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            cursor: "pointer",
          }}
        >
          {installing ? (
            <>
              <span
                className="animate-spin"
                style={{
                  width: 18,
                  height: 18,
                  border: "3px solid rgba(27,58,107,0.25)",
                  borderTopColor: "#1B3A6B",
                  borderRadius: "50%",
                  display: "inline-block",
                }}
              />
              Installing...
            </>
          ) : (
            <>
              <span style={{ fontSize: 18 }}>📲</span>
              {installPrompt
                ? "Tap to Install KP Driver"
                : "Add to Home Screen"}
            </>
          )}
        </button>

        <div
          id="kp-manual-steps"
          style={{
            marginTop: 28,
            width: "100%",
            maxWidth: 340,
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 20,
            padding: 18,
          }}
        >
          {isIOS && (
            <div
              style={{
                marginBottom: 12,
                padding: "8px 12px",
                background: "rgba(255,193,7,0.18)",
                border: "1px solid rgba(255,193,7,0.5)",
                borderRadius: 10,
                fontSize: 12,
                fontWeight: 700,
                color: "#FFE7A0",
              }}
            >
              ⚠️ Must use Safari on iPhone — not Chrome
            </div>
          )}

          <div
            style={{
              fontSize: 13,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: 0.6,
              opacity: 0.85,
              marginBottom: 10,
            }}
          >
            {isAndroid ? "Install on Android" : "Install on iPhone"}
          </div>

          {(isAndroid ? androidSteps : iosSteps).map((text, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: 10,
                alignItems: "flex-start",
                padding: "8px 0",
              }}
            >
              <div
                style={{
                  minWidth: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: "white",
                  color: "#1B3A6B",
                  fontSize: 12,
                  fontWeight: 900,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {i + 1}
              </div>
              <div style={{ fontSize: 13.5, lineHeight: 1.4 }}>{text}</div>
            </div>
          ))}

          {isAndroid && !installPrompt && (
            <div
              style={{
                marginTop: 14,
                padding: 12,
                borderRadius: 12,
                background: "rgba(0,0,0,0.15)",
              }}
            >
              <div
                style={{ fontSize: 12, fontWeight: 800, marginBottom: 6 }}
              >
                If button above did not work
              </div>
              {[
                "Open this page in Chrome",
                'Tap ⋮ menu → "Add to Home screen"',
                'Tap "Install"',
              ].map((t, i) => (
                <div key={i} style={{ fontSize: 12.5, padding: "2px 0" }}>
                  {i + 1}. {t}
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleAlreadyInstalled}
          style={{
            marginTop: 20,
            width: "100%",
            maxWidth: 340,
            padding: "14px 18px",
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.35)",
            background: "transparent",
            color: "white",
            fontSize: 14,
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          ✅ I have installed it — Sign In
        </button>

        <div
          style={{
            marginTop: 22,
            fontSize: 11,
            opacity: 0.7,
            textAlign: "center",
          }}
        >
          Kings Pharmacy · Bulawayo, Zimbabwe
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-sky-100 px-4 py-10">
      <div className="mx-auto w-full max-w-md">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-sky-600"
        >
          <Home className="h-3.5 w-3.5" /> Home
        </Link>

        <div className="overflow-hidden rounded-3xl border border-sky-100 bg-white shadow-xl">
          <div className="bg-gradient-to-r from-sky-500 to-sky-700 px-6 py-7 text-white">
            <div className="flex items-center gap-3">
              <img
                src={kingsLogo}
                alt="Kings Pharmacy"
                className="h-14 w-14 rounded-xl bg-white/95 p-1.5"
              />
              <div>
                <div className="text-lg font-black leading-tight">
                  Driver Portal
                </div>
                <div className="text-xs text-sky-100">
                  Kings Pharmacy · Delivery team
                </div>
              </div>
            </div>
            <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider">
              <Truck className="h-3 w-3" /> Drivers only
            </div>
          </div>

          <form onSubmit={submit} className="space-y-3 p-6">
            <label className="block">
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Email
              </span>
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus-within:border-sky-500 focus-within:bg-white">
                <Mail className="h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent text-sm outline-none"
                  required
                />
              </div>
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Password
              </span>
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus-within:border-sky-500 focus-within:bg-white">
                <Lock className="h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent text-sm outline-none"
                  required
                />
              </div>
            </label>
            <button
              type="submit"
              disabled={loading}
              className="h-11 w-full rounded-xl bg-sky-600 text-sm font-black text-white shadow transition hover:bg-sky-700 disabled:opacity-60"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="border-t border-slate-100 bg-slate-50 px-6 py-4">
            <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Demo drivers · password Driver123!
            </div>
            <div className="space-y-1.5">
              {DEMO_DRIVERS.map((d) => (
                <button
                  key={d.email}
                  type="button"
                  onClick={() => oneClick(d.email)}
                  disabled={loading}
                  className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-left transition hover:border-sky-400 hover:bg-sky-50 disabled:opacity-60"
                >
                  <span className="text-xs font-semibold text-slate-700">
                    {d.name}
                  </span>
                  <span className="text-[10px] text-slate-400">{d.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}