import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { DriverPortal, type DriverRow } from "@/components/driver/DriverPortal";

export const Route = createFileRoute("/driver/")({
  head: () => ({ meta: [{ title: "Driver Portal — Kings Pharmacy" }] }),
  component: DriverRoute,
});

function withTimeout<T>(p: PromiseLike<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(label + " timed out")), ms);
    Promise.resolve(p).then(
      (v) => { clearTimeout(t); resolve(v); },
      (e) => { clearTimeout(t); reject(e); },
    );
  });
}

function DriverRoute() {
  const navigate = useNavigate();
  const [driver, setDriver] = useState<DriverRow | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errMsg, setErrMsg] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const { data: sess } = await withTimeout(
          supabase.auth.getSession(),
          6000,
          "Session check",
        );
        if (cancelled) return;
        if (!sess.session) {
          navigate({ to: "/driver/login", replace: true });
          return;
        }
        const uid = sess.session.user.id;
        const email = sess.session.user.email ?? "";

        // Try driver record by auth_user_id first; fall back gracefully.
        let drv: DriverRow | null = null;
        const byAuth = await withTimeout(
          supabase.from("drivers").select("*").eq("auth_user_id", uid).maybeSingle(),
          6000,
          "Driver lookup",
        );
        if (cancelled) return;
        if (byAuth.data) drv = byAuth.data as DriverRow;

        if (!drv) {
          // Synthesise a minimal driver so the portal still opens — staff
          // can link the auth user to a drivers row later.
          drv = {
            id: "temp-" + uid,
            auth_user_id: uid,
            name: email.split("@")[0] || "Driver",
            phone: "—",
            vehicle: "Not set",
            plate: "Not set",
            branch: "9th Ave CBD",
            off_duty: false,
          };
          toast.message("Driver profile not linked yet — showing limited view.");
        }
        setDriver(drv);
        setStatus("ready");
      } catch (e: any) {
        if (cancelled) return;
        console.error("[driver] load failed", e);
        setErrMsg(e?.message ?? "Failed to load driver portal");
        setStatus("error");
      }
    };

    load();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        navigate({ to: "/driver/login", replace: true });
      }
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [navigate]);

  if (status === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sky-50 p-6">
        <div className="w-full max-w-sm rounded-2xl border border-sky-100 bg-white p-6 text-center shadow">
          <div className="text-3xl">⚠️</div>
          <div className="mt-2 text-base font-black text-slate-800">Driver Portal Error</div>
          <div className="mt-1 text-xs text-slate-500 break-words">{errMsg}</div>
          <div className="mt-4 flex flex-col gap-2">
            <button
              onClick={() => window.location.reload()}
              className="h-10 w-full rounded-xl bg-sky-600 text-sm font-bold text-white hover:bg-sky-700"
            >
              Reload
            </button>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                navigate({ to: "/driver/login", replace: true });
              }}
              className="h-10 w-full rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50"
            >
              Sign out & retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status !== "ready" || !driver) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-sky-50 p-6">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-sky-200 border-t-sky-600" />
        <div className="mt-3 text-sm font-semibold text-slate-500">Loading driver portal…</div>
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            navigate({ to: "/driver/login", replace: true });
          }}
          className="mt-6 text-xs font-semibold text-sky-600 underline"
        >
          Stuck? Sign out & retry
        </button>
      </div>
    );
  }

  return <DriverPortal driver={driver} />;
}