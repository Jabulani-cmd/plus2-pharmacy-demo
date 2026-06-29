import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { DriverPortal, type DriverRow } from "@/components/driver/DriverPortal";

export const Route = createFileRoute("/driver/")({
  head: () => ({ meta: [{ title: "Driver Portal — Kings Pharmacy" }] }),
  component: DriverRoute,
});

function DriverRoute() {
  const navigate = useNavigate();
  const [driver, setDriver] = useState<DriverRow | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "denied">(
    "loading"
  );

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const { data: sess } = await supabase.auth.getSession();
      if (cancelled) return;
      if (!sess.session) {
        navigate({ to: "/driver/login", replace: true });
        return;
      }
      const uid = sess.session.user.id;

      // role check
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", uid);
      if (cancelled) return;
      const isDriver = (roles ?? []).some((r) => r.role === "driver");
      if (!isDriver) {
        setStatus("denied");
        toast.error("Drivers only");
        navigate({ to: "/", replace: true });
        return;
      }

      const { data: drv, error } = await supabase
        .from("drivers")
        .select("*")
        .eq("auth_user_id", uid)
        .maybeSingle();
      if (cancelled) return;
      if (error || !drv) {
        toast.error("No driver profile found");
        await supabase.auth.signOut();
        navigate({ to: "/driver/login", replace: true });
        return;
      }
      setDriver(drv as DriverRow);
      setStatus("ready");
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

  if (status !== "ready" || !driver) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sky-50">
        <div className="text-sm font-semibold text-slate-500">Loading…</div>
      </div>
    );
  }

  return <DriverPortal driver={driver} />;
}