import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { KeyRound, Eye, EyeOff, CheckCircle2, Loader2, Home, ArrowLeft } from "lucide-react";
import kingsLogo from "@/assets/kings-logo.png";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [{ title: "Reset Password — Kings Pharmacy" }],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);
  const [valid, setValid] = useState(false);

  useEffect(() => {
    let mounted = true;
    const checkRecovery = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (mounted) {
          setValid(!!data.session);
          setChecking(false);
        }
      } catch {
        if (mounted) {
          setValid(false);
          setChecking(false);
        }
      }
    };
    checkRecovery();
    return () => {
      mounted = false;
    };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return toast.error("Password must be at least 8 characters");
    if (password !== confirm) return toast.error("Passwords don't match");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated successfully");
    setTimeout(() => navigate({ to: "/auth", search: { mode: "login" } }), 1200);
  };

  return (
    <div className="mx-auto grid min-h-screen w-full max-w-6xl gap-6 overflow-x-hidden px-4 py-6 sm:py-8 lg:grid-cols-2 lg:gap-8 lg:py-14" style={{ maxWidth: "100vw" }}>
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
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white p-2 shadow-2xl ring-1 ring-black/5">
            <img src={kingsLogo} alt="Kings Pharmacy" className="h-full w-full object-contain" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-black tracking-tight text-white text-5xl">Kings</span>
            <span className="mt-1.5 font-bold tracking-[0.25em] text-white/80 text-xs">PHARMACY</span>
            <span className="mt-1 tracking-[0.2em] text-white/60 text-[10px]">AT YOUR SERVICE</span>
          </div>
        </div>
        <h2 className="mt-10 text-3xl font-extrabold leading-tight">Secure your account.</h2>
        <p className="mt-3 text-white/90">Choose a strong password to keep your prescriptions, orders, and loyalty points safe.</p>
      </div>

      <div className="mx-auto w-full min-w-0 max-w-[420px] rounded-xl border border-border bg-card p-4 shadow-sm sm:rounded-2xl sm:p-7 lg:max-w-none lg:p-8">
        <div className="mb-6 flex flex-col items-center lg:hidden">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white p-2 shadow-2xl ring-1 ring-black/5">
            <img src={kingsLogo} alt="Kings Pharmacy" className="h-full w-full object-contain" />
          </div>
        </div>
        <div className="mb-6 hidden justify-center lg:flex">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white p-1.5 shadow-sm ring-1 ring-black/5">
            <img src={kingsLogo} alt="Kings Pharmacy" className="h-full w-full object-contain" />
          </div>
        </div>

        {checking ? (
          <div className="space-y-4 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Verifying your reset link…</p>
          </div>
        ) : !valid ? (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <KeyRound className="h-7 w-7" />
            </div>
            <h2 className="text-xl font-extrabold">Reset link expired</h2>
            <p className="text-sm text-muted-foreground">
              This password reset link is invalid or has expired. Please request a new one.
            </p>
            <Link
              to="/auth"
              search={{ mode: "forgot" }}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-bold uppercase tracking-wide text-primary-foreground transition hover:bg-primary-dark"
            >
              Request new link
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <Link
              to="/auth"
              search={{ mode: "forgot" }}
              className="-ml-1 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
            </Link>
            <h1 className="text-2xl font-extrabold">Create new password</h1>
            <p className="-mt-2 text-sm text-muted-foreground">Enter a new password for your Kings Pharmacy account.</p>

            <label className="block min-w-0">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted-foreground">New password</span>
              <span className="relative block">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-xl border border-input bg-background px-3 pr-11 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 h-12"
                  style={{ boxSizing: "border-box", maxWidth: "100%" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </span>
            </label>

            <label className="block min-w-0">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted-foreground">Confirm password</span>
              <span className="relative block">
                <input
                  type={showConfirm ? "text" : "password"}
                  required
                  minLength={8}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="block w-full rounded-xl border border-input bg-background px-3 pr-11 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 h-12"
                  style={{ boxSizing: "border-box", maxWidth: "100%" }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground hover:text-foreground"
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </span>
            </label>

            <button
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-sm font-bold uppercase tracking-wide text-primary-foreground transition hover:bg-primary-dark disabled:opacity-60"
            >
              {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> Updating…</> : "Update password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
