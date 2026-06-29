import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Mail, Lock, Home, Truck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { InstallDriverApp } from "@/components/driver/InstallDriverApp";
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

function DriverLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState(DEMO_DRIVERS[0].email);
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [loading, setLoading] = useState(false);

  // If already signed in as a driver, redirect.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled || !data.session) return;
      navigate({ to: "/driver", replace: true });
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

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

        <div className="mt-4">
          <InstallDriverApp variant="card" />
        </div>
      </div>
    </div>
  );
}