import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/store/auth";
import { Logo } from "@/components/layout/Logo";
import { ShieldCheck, Truck, Sparkles, Mail, Users, ChevronDown, ChevronUp, KeyRound, CheckCircle2, Loader2, Home, Eye, EyeOff } from "lucide-react";
import { DEMO_CUSTOMERS } from "@/data/demoAccounts";
import kingsLogo from "@/assets/kings-logo.png";

type Mode = "login" | "register" | "forgot";

function BrandMark({ size = 108 }: { size?: number }) {
  return (
    <div
      className="relative flex items-center justify-center rounded-3xl bg-white p-2 shadow-2xl ring-1 ring-black/5"
      style={{ width: size, height: size }}
    >
      <img src={kingsLogo} alt="Kings Pharmacy" className="h-full w-full object-contain" />
    </div>
  );
}

function BrandLockup({ compact = false }: { compact?: boolean }) {
  const onDark = !compact;
  return (
    <div className={`flex items-center ${compact ? "gap-3" : "gap-4"}`}>
      <BrandMark size={compact ? 64 : 132} />
      <div className="flex flex-col leading-none">
        <span
          className={`font-black tracking-tight ${onDark ? "text-white" : "text-primary"} ${compact ? "text-2xl" : "text-5xl"}`}
        >
          Kings
        </span>
        <span
          className={`mt-1.5 font-bold tracking-[0.25em] ${onDark ? "text-white/80" : "text-muted-foreground"} ${compact ? "text-[9px]" : "text-xs"}`}
        >
          PHARMACY
        </span>
        <span
          className={`mt-1 tracking-[0.2em] ${onDark ? "text-white/60" : "text-muted-foreground/80"} ${compact ? "text-[8px]" : "text-[10px]"}`}
        >
          AT YOUR SERVICE
        </span>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in or Register — Kings Pharmacy" }] }),
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<Mode>("login");
  const user = useAuth((s) => s.user);
  const navigate = useNavigate();
  const router = useRouter();
  const { redirect } = Route.useSearch();
  useEffect(() => {
    if (user) {
      if (redirect) {
        router.history.push(redirect);
      } else {
        navigate({ to: "/account" });
      }
    }
  }, [user, navigate, redirect]);

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 overflow-x-hidden px-4 py-6 sm:py-8 lg:grid-cols-2 lg:gap-8 lg:py-14" style={{ maxWidth: "100vw" }}>
      <div className="flex min-w-0 justify-start lg:col-span-2">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground shadow-sm transition hover:bg-muted"
        >
          <Home className="h-4 w-4" /> Home
        </Link>
      </div>
      <div className="relative hidden min-w-0 flex-col justify-center overflow-hidden rounded-md bg-primary p-10 text-primary-foreground shadow-sm lg:flex">
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-white/5 blur-3xl" />
        <BrandLockup />
        <h2 className="mt-10 text-3xl font-extrabold leading-tight">Your health, one tap away.</h2>
        <p className="mt-3 text-white/90">Manage prescriptions, track deliveries and shop the full pharmacy from anywhere in Zimbabwe.</p>
        <ul className="mt-8 space-y-3 text-sm">
          <li className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 text-white" /> Secure, encrypted account</li>
          <li className="flex items-start gap-3"><Truck className="mt-0.5 h-5 w-5 text-white" /> Free same-day delivery on orders over US$50</li>
          <li className="flex items-start gap-3"><Sparkles className="mt-0.5 h-5 w-5 text-white" /> Registered pharmacists available online</li>
        </ul>
        <div className="mt-10 rounded-lg border border-white/20 bg-white/10 p-4 text-sm backdrop-blur">
          <div className="font-bold">Demo account</div>
          <div className="mt-1 text-white/90"><span>demo@kingspharmacy.co.za</span> <span>/</span> <span className="font-mono">Demo1234!</span></div>
        </div>
      </div>

      <div className="mx-auto w-full min-w-0 max-w-[420px] rounded-xl border border-border bg-card p-4 shadow-sm sm:rounded-2xl sm:p-7 lg:max-w-none lg:p-8">
        <div className="mb-5 flex flex-col items-center lg:hidden">
          <BrandMark size={64} />
        </div>
        <div className="mb-6 hidden justify-center lg:flex"><BrandMark size={56} /></div>

        {mode !== "forgot" && (
          <div className="mb-6 flex rounded-md bg-muted p-1 text-sm font-semibold">
            <button onClick={() => setMode("login")} className={`flex-1 rounded-md py-2 transition ${mode === "login" ? "bg-card text-primary shadow-sm" : "text-muted-foreground"}`}>Sign in</button>
            <button onClick={() => setMode("register")} className={`flex-1 rounded-md py-2 transition ${mode === "register" ? "bg-card text-primary shadow-sm" : "text-muted-foreground"}`}>Create account</button>
          </div>
        )}

        {mode === "login" && <LoginForm onForgot={() => setMode("forgot")} onSuccess={() => router.history.back()} />}
        {mode === "register" && <RegisterForm onSuccess={() => navigate({ to: "/account" })} />}
        {mode === "forgot" && <ForgotForm onBack={() => setMode("login")} />}

        {mode === "login" && <DemoAccountsPanel onLoggedIn={() => navigate({ to: "/account" })} />}

        <Link
          to="/staff/login"
          className="mt-3 flex items-center justify-between rounded-lg border border-dashed border-border bg-muted/40 px-4 py-3 text-xs font-semibold text-foreground transition hover:border-primary hover:bg-primary/5"
        >
          <span className="flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            Pharmacy staff? Sign in to the Staff Portal →
          </span>
        </Link>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          By continuing you agree to Kings's <a href="#" className="underline">Terms</a> & <a href="#" className="underline">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}

function DemoAccountsPanel({ onLoggedIn }: { onLoggedIn: () => void }) {
  const login = useAuth((s) => s.login);
  const [open, setOpen] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const handleLogin = async (email: string, password: string) => {
    setBusy(email);
    const r = await login(email, password);
    setBusy(null);
    if (!r.ok) return toast.error(r.error ?? "Login failed");
    toast.success("Signed in to demo account");
    onLoggedIn();
  };

  const colors = ["bg-primary", "bg-[#0EA5E9]", "bg-[#7C3AED]", "bg-[#F59E0B]", "bg-[#EC4899]"];

  return (
    <div className="mt-6 rounded-lg border border-[#BBF7D0] bg-[#F0F9F4] p-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="flex items-center gap-2 text-sm font-bold text-primary-dark">
          <Users className="h-4 w-4" /> Demo Customer Accounts — Click to Login
        </span>
        {open ? <ChevronUp className="h-4 w-4 text-primary-dark" /> : <ChevronDown className="h-4 w-4 text-primary-dark" />}
      </button>
      {open && (
        <ul className="mt-3 space-y-2">
          {DEMO_CUSTOMERS.map((c, i) => {
            const initials = (c.user.firstName[0] + c.user.lastName[0]).toUpperCase();
            return (
              <li key={c.email}>
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() => handleLogin(c.email, c.password)}
                  className="flex w-full items-center gap-3 rounded-md border border-border bg-card px-4 py-3 text-left transition hover:border-primary hover:shadow-sm disabled:opacity-60"
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${colors[i % colors.length]}`}>
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-foreground">{c.user.firstName} {c.user.lastName}</div>
                    <div className="truncate text-xs text-muted-foreground">{c.email}</div>
                  </div>
                  <span className="shrink-0 rounded-md border border-primary px-3 py-1.5 text-xs font-bold text-primary">
                    {busy === c.email ? "…" : "Login"}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Field({ label, type, ...rest }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (show ? "text" : "password") : type;
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="relative block">
        <input
          {...rest}
          type={inputType}
          style={{ boxSizing: "border-box", maxWidth: "100%" }}
          className={`block w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 ${
            isPassword ? "h-12 pr-11" : "h-12"
          }`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground hover:text-foreground"
            aria-label={show ? "Hide password" : "Show password"}
            tabIndex={-1}
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </span>
    </label>
  );
}

function LoginForm({ onForgot, onSuccess }: { onForgot: () => void; onSuccess: () => void }) {
  const login = useAuth((s) => s.login);
  const [email, setEmail] = useState("demo@kingspharmacy.co.za");
  const [password, setPassword] = useState("Demo1234!");
  const [loading, setLoading] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const r = await login(email, password);
    setLoading(false);
    if (!r.ok) return toast.error(r.error ?? "Login failed");
    toast.success("Welcome back!");
    onSuccess();
  };
  return (
    <form onSubmit={submit} className="space-y-4">
      <h1 className="text-2xl font-extrabold">Welcome back</h1>
      <p className="-mt-2 text-sm text-muted-foreground">Sign in to view orders, scripts and rewards.</p>
      <Field label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      <Field label="Password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      <div className="flex items-center justify-between text-xs">
        <label className="flex items-center gap-2"><input type="checkbox" defaultChecked /> Remember me</label>
        <button type="button" onClick={onForgot} className="font-semibold text-primary hover:underline">Forgot password?</button>
      </div>
      <button disabled={loading} className="h-[52px] w-full rounded-full bg-primary text-sm font-bold uppercase tracking-wide text-primary-foreground transition hover:bg-primary-dark disabled:opacity-60">
        {loading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

function RegisterForm({ onSuccess }: { onSuccess: () => void }) {
  const register = useAuth((s) => s.register);
  const [f, setF] = useState({ firstName: "", lastName: "", email: "", phone: "", password: "" });
  const [loading, setLoading] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const r = await register(f);
    setLoading(false);
    if (!r.ok) return toast.error(r.error ?? "Registration failed");
    toast.success("Account created. Welcome to Kings!");
    onSuccess();
  };
  return (
    <form onSubmit={submit} className="space-y-4">
      <h1 className="text-2xl font-extrabold">Create your account</h1>
      <p className="-mt-2 text-sm text-muted-foreground">Join thousands of Zimbabwean families who trust Kings.</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="First name" required value={f.firstName} onChange={(e) => setF({ ...f, firstName: e.target.value })} />
        <Field label="Last name" required value={f.lastName} onChange={(e) => setF({ ...f, lastName: e.target.value })} />
      </div>
      <Field label="Email" type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
      <Field label="Mobile" type="tel" placeholder="+27 82 000 0000" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
      <Field label="Password (min 8 chars)" type="password" required value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
      <button disabled={loading} className="h-[52px] w-full rounded-full bg-primary text-sm font-bold uppercase tracking-wide text-primary-foreground transition hover:bg-primary-dark disabled:opacity-60">
        {loading ? "Creating…" : "Create account"}
      </button>
    </form>
  );
}

function ForgotForm({ onBack }: { onBack: () => void }) {
  const reset = useAuth((s) => s.resetPassword);
  type Step = "email" | "sent" | "token" | "password" | "done";
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [demoToken, setDemoToken] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const sendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    await reset(email);
    const t = String(Math.floor(100000 + Math.random() * 900000));
    setDemoToken(t);
    setBusy(false);
    setStep("sent");
    toast.success("Reset email sent", { description: `Demo token: ${t}` });
  };

  const setDigit = (i: number, v: string) => {
    const d = v.replace(/\D/g, "").slice(-1);
    const next = [...code];
    next[i] = d;
    setCode(next);
    if (d && i < 5) {
      const el = document.getElementById(`otp-${i + 1}`) as HTMLInputElement | null;
      el?.focus();
    }
  };

  const verifyToken = (e: React.FormEvent) => {
    e.preventDefault();
    const entered = code.join("");
    if (entered.length !== 6) return toast.error("Enter the 6-digit code");
    if (entered !== demoToken) return toast.error("Invalid token. Try the demo code shown above.");
    setStep("password");
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return toast.error("Password must be at least 8 characters");
    if (password !== confirm) return toast.error("Passwords don't match");
    setBusy(true);
    await new Promise((r) => setTimeout(r, 900));
    setBusy(false);
    setStep("done");
    toast.success("Password updated successfully");
  };

  if (step === "email") {
    return (
      <form onSubmit={sendLink} className="space-y-4">
        <h1 className="text-2xl font-extrabold">Reset your password</h1>
        <p className="-mt-2 text-sm text-muted-foreground">Enter your email and we'll send you a secure 6-digit reset code.</p>
        <Field label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-md bg-primary py-3 text-sm font-bold uppercase tracking-wide text-primary-foreground hover:bg-primary-dark disabled:opacity-60">
          {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</> : "Send reset code"}
        </button>
        <button type="button" onClick={onBack} className="w-full text-sm font-semibold text-primary hover:underline">← Back to sign in</button>
      </form>
    );
  }

  if (step === "sent") {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-success"><Mail className="h-7 w-7" /></div>
        <h2 className="text-xl font-extrabold">Check your email</h2>
        <p className="text-sm text-muted-foreground">We sent a 6-digit reset code to <strong>{email}</strong>.</p>
        <div className="rounded-lg border border-dashed border-primary/40 bg-primary/5 p-4 text-left">
          <div className="text-[10px] font-bold uppercase tracking-widest text-primary">Demo Inbox</div>
          <div className="mt-1 text-sm text-foreground">Your Kings password reset code is:</div>
          <div className="mt-2 font-mono text-3xl font-extrabold tracking-[0.4em] text-primary">{demoToken}</div>
          <div className="mt-2 text-xs text-muted-foreground">Code expires in 10 minutes.</div>
        </div>
        <button onClick={() => setStep("token")} className="w-full rounded-md bg-primary py-3 text-sm font-bold uppercase tracking-wide text-primary-foreground hover:bg-primary-dark">Enter code</button>
        <button onClick={onBack} className="w-full text-sm font-semibold text-primary hover:underline">← Back to sign in</button>
      </div>
    );
  }

  if (step === "token") {
    return (
      <form onSubmit={verifyToken} className="space-y-4 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary"><KeyRound className="h-7 w-7" /></div>
        <h2 className="text-xl font-extrabold">Enter reset code</h2>
        <p className="-mt-2 text-sm text-muted-foreground">6-digit code sent to <strong>{email}</strong></p>
        <div className="flex justify-center gap-2">
          {code.map((d, i) => (
            <input
              key={i}
              id={`otp-${i}`}
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={(e) => setDigit(i, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Backspace" && !code[i] && i > 0) {
                  const el = document.getElementById(`otp-${i - 1}`) as HTMLInputElement | null;
                  el?.focus();
                }
              }}
              className="h-12 w-10 rounded-md border border-input bg-background text-center font-mono text-lg font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          ))}
        </div>
        <button className="w-full rounded-md bg-primary py-3 text-sm font-bold uppercase tracking-wide text-primary-foreground hover:bg-primary-dark">Verify code</button>
        <div className="flex items-center justify-between text-xs">
          <button type="button" onClick={onBack} className="font-semibold text-primary hover:underline">← Cancel</button>
          <button type="button" onClick={() => { setStep("email"); setCode(["","","","","",""]); }} className="font-semibold text-primary hover:underline">Resend code</button>
        </div>
      </form>
    );
  }

  if (step === "password") {
    return (
      <form onSubmit={savePassword} className="space-y-4">
        <h1 className="text-2xl font-extrabold">Set new password</h1>
        <p className="-mt-2 text-sm text-muted-foreground">Pick a strong password you haven't used before.</p>
        <Field label="New password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        <Field label="Confirm password" type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-md bg-primary py-3 text-sm font-bold uppercase tracking-wide text-primary-foreground hover:bg-primary-dark disabled:opacity-60">
          {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> Updating…</> : "Update password"}
        </button>
      </form>
    );
  }

  return (
    <div className="space-y-4 text-center">
      <div className="mx-auto flex h-16 w-16 animate-in zoom-in items-center justify-center rounded-full bg-success/15 text-success">
        <CheckCircle2 className="h-9 w-9" />
      </div>
      <h2 className="text-2xl font-extrabold">Password reset!</h2>
      <p className="text-sm text-muted-foreground">Your password has been updated for <strong>{email}</strong>. You can now sign in with your new password.</p>
      <button onClick={onBack} className="w-full rounded-md bg-primary py-3 text-sm font-bold uppercase tracking-wide text-primary-foreground hover:bg-primary-dark">Back to sign in</button>
    </div>
  );
}