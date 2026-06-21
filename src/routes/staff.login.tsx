import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useStaffAuth } from "@/store/staffAuth";
import { DEMO_STAFF, ROLE_BADGE_BG } from "@/data/demoAccounts";
import { ShieldCheck, Lock, Mail, Home, ChevronRight, KeyRound } from "lucide-react";
import kingsLogo from "@/assets/kings-logo.png";

export const Route = createFileRoute("/staff/login")({
  head: () => ({ meta: [{ title: "Staff Sign-in — Kings Pharmacy" }] }),
  component: StaffLogin,
});

function StaffLogin() {
  const staff = useStaffAuth((s) => s.staff);
  const login = useStaffAuth((s) => s.login);
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@kingspharmacy.co.zw");
  const [password, setPassword] = useState("Admin1234!");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (staff) navigate({ to: "/staff/dashboard", replace: true });
  }, [staff, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const r = await login(email, password);
    setLoading(false);
    if (!r.ok) return toast.error(r.error ?? "Sign-in failed");
    toast.success(`Welcome, ${r.staff?.name.split(" ")[0]}`);
    navigate({ to: "/staff/dashboard", replace: true });
  };

  const oneClick = async (em: string, pw: string) => {
    setEmail(em); setPassword(pw); setLoading(true);
    const r = await login(em, pw);
    setLoading(false);
    if (!r.ok) return toast.error(r.error ?? "Sign-in failed");
    toast.success(`Signed in as ${r.staff?.roleLabel}`);
    navigate({ to: "/staff/dashboard", replace: true });
  };

  return (
    <div className="mx-auto grid min-h-screen max-w-7xl gap-8 px-4 py-8 lg:grid-cols-[1fr_440px] lg:py-12">
      {/* Hero */}
      <div className="hidden flex-col justify-between rounded-2xl bg-white/10 p-8 text-white shadow-2xl ring-1 ring-white/20 backdrop-blur lg:flex">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white p-1.5">
              <img src={kingsLogo} alt="Kings Pharmacy" className="h-full w-full object-contain" />
            </div>
            <div>
              <div className="text-3xl font-black tracking-tight">Kings <span className="font-bold text-white/90">Pharmacy</span></div>
              <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/80">Staff Portal · Zimbabwe</div>
            </div>
          </div>
          <h1 className="mt-10 text-4xl font-extrabold leading-tight">Run the pharmacy.<br />From one secure portal.</h1>
          <p className="mt-3 max-w-md text-white/85">Sign in with your staff credentials. Your role determines the modules you can access — from prescription approvals to dispatch, POS, inventory, and finance.</p>
          <ul className="mt-8 space-y-2.5 text-sm">
            <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-300" /> PCZ-compliant Rx audit trail</li>
            <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-300" /> Role-based access control</li>
            <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-300" /> Encrypted at rest &amp; in transit</li>
          </ul>
        </div>
        <a href="/" className="inline-flex w-fit items-center gap-2 rounded-md border border-white/30 bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/20">
          <Home className="h-3.5 w-3.5" /> Back to customer site
        </a>
      </div>

      {/* Form */}
      <div className="rounded-2xl border border-white/20 bg-white p-6 shadow-2xl md:p-8">
        <a href="/" className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary lg:hidden">
          <Home className="h-3.5 w-3.5" /> Customer site
        </a>
        <div className="mb-6">
          <div className="mb-4 flex justify-center">
            <img src={kingsLogo} alt="Kings Pharmacy" className="h-24 w-24 object-contain" />
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
            <Lock className="h-3 w-3" /> Staff Access Only
          </div>
          <h2 className="mt-4 text-2xl font-extrabold text-foreground">Sign in to your workspace</h2>
          <p className="text-sm text-muted-foreground">Use your Kings staff email and password.</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted-foreground">Staff email</span>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-input bg-background py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted-foreground">Password</span>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-input bg-background py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </label>
          <button
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-primary py-3 text-sm font-bold uppercase tracking-wide text-primary-foreground hover:bg-primary-dark disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in to staff portal"} <ChevronRight className="h-4 w-4" />
          </button>
        </form>

        {/* Demo accounts */}
        <div className="mt-6 rounded-lg border border-[#FECACA] bg-[#FEF2F2] p-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#DC2626]">
            <ShieldCheck className="h-3.5 w-3.5" /> Demo Staff Accounts — Click to Sign In
          </div>
          <ul className="mt-3 space-y-2">
            {DEMO_STAFF.map((s) => (
              <li key={s.email}>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => oneClick(s.email, s.password)}
                  className="flex w-full items-center gap-3 rounded-md border border-border bg-white px-3 py-2 text-left transition hover:border-primary hover:shadow disabled:opacity-60"
                >
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                    style={{ background: ROLE_BADGE_BG[s.role] }}
                  >
                    {s.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-bold text-foreground">{s.roleLabel}</div>
                    <div className="truncate text-[11px] text-muted-foreground">{s.email}</div>
                  </div>
                  <span className="shrink-0 rounded border border-primary px-2 py-1 text-[10px] font-bold text-primary">Login</span>
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[10px] text-muted-foreground">Demo passwords: <span className="font-mono">SysAdmin1234! · Admin1234! · Staff1234!</span></p>
        </div>
      </div>
    </div>
  );
}