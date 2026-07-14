import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Bell, X, CheckCircle2, AlertCircle, Info } from "lucide-react";
import {
  useNotifications,
  pushNotification,
  formatRelative,
  type AppNotification,
  type NotificationAudience,
} from "@/store/notifications";
import { supabase } from "@/integrations/supabase/client";

type Props = {
  audience: NotificationAudience;
  userId?: string;
  variant?: "light" | "dark";
};

const toneIcon = (tone?: string) => {
  if (tone === "success") return <CheckCircle2 className="h-4 w-4 text-[#10B981]" />;
  if (tone === "warning") return <AlertCircle className="h-4 w-4 text-[#F59E0B]" />;
  if (tone === "danger") return <AlertCircle className="h-4 w-4 text-[#DC2626]" />;
  return <Info className="h-4 w-4 text-[#0EA5E9]" />;
};

export function NotificationsBell({
  audience,
  userId,
  variant = "light",
}: Props) {
  const [open, setOpen] = useState(false);
  const items = useNotifications((s) => s.items);
  const markAllRead = useNotifications((s) => s.markAllRead);
  const markRead = useNotifications((s) => s.markRead);

  // Cross-device realtime notifications for the signed-in customer.
  // Bridges Supabase `notifications` rows (written by pharmacist/dispatcher on
  // other devices) into the local bell store + toast + browser Notification.
  useEffect(() => {
    if (audience !== "customer") return;
    const isUuid = typeof userId === "string" &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
    if (!isUuid) return;

    if (typeof window !== "undefined" && "Notification" in window &&
        Notification.permission === "default") {
      try { void Notification.requestPermission(); } catch { /* ignore */ }
    }

    const seen = new Set<string>();

    // Hydrate: pull recent unread notifications for this customer.
    void supabase
      .from("notifications")
      .select("*")
      .eq("audience", "customer")
      .eq("user_id", userId!)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        (data ?? []).forEach((row) => {
          const r = row as {
            id: string; title: string; body: string | null;
            link: string | null; tone: string | null;
          };
          if (seen.has(r.id)) return;
          seen.add(r.id);
          pushNotification({
            audience: "customer",
            userId,
            title: r.title,
            body: r.body ?? "",
            link: r.link ?? undefined,
            tone: (r.tone as AppNotification["tone"]) ?? "info",
          });
        });
      });

    const ch = supabase
      .channel("customer_notifications_" + userId)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: "user_id=eq." + userId,
        },
        (payload) => {
          const r = payload.new as {
            id: string; audience?: string; title: string; body: string | null;
            link: string | null; tone: string | null;
          };
          if (r.audience && r.audience !== "customer") return;
          if (seen.has(r.id)) return;
          seen.add(r.id);
          pushNotification({
            audience: "customer",
            userId,
            title: r.title,
            body: r.body ?? "",
            link: r.link ?? undefined,
            tone: (r.tone as AppNotification["tone"]) ?? "info",
          });
          toast.success(r.title, { description: r.body ?? "", duration: 8000 });
          if (typeof window !== "undefined" && "Notification" in window &&
              Notification.permission === "granted") {
            try {
              new Notification(r.title, {
                body: r.body ?? "",
                icon: "/icons/icon-192.png",
              });
            } catch { /* ignore */ }
          }
        }
      )
      .subscribe();

    return () => { void supabase.removeChannel(ch); };
  }, [audience, userId]);

  const filtered = useMemo(
    () =>
      items
        .filter((n) => n.audience === audience)
        .filter((n) => !userId || !n.userId || n.userId === userId)
        .slice(0, 30),
    [items, audience, userId]
  );

  const unread = filtered.filter((n) => !n.read).length;

  const toggle = () => {
    setOpen((o) => {
      const next = !o;
      if (next && unread > 0) {
        // Clear unread count when the panel opens.
        setTimeout(() => markAllRead(audience, userId), 200);
      }
      return next;
    });
  };

  const renderItem = (n: AppNotification) => {
    const inner = (
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5">{toneIcon(n.tone)}</div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold leading-snug text-[#111827]">
            {n.title}
          </p>
          <p className="mt-0.5 text-[12px] leading-snug text-[#374151]">
            {n.body}
          </p>
          <p className="mt-0.5 text-[10px] text-[#9CA3AF]">{formatRelative(n.ts)}</p>
        </div>
        {!n.read && (
          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#0EA5E9]" />
        )}
      </div>
    );
    const handleClick = () => {
      markRead(n.id);
      setOpen(false);
    };
    if (n.link) {
      return (
        <Link
          key={n.id}
          to={n.link}
          search={n.linkSearch as never}
          onClick={handleClick}
          className="block w-full px-4 py-3 text-left hover:bg-[#F9FAFB]"
        >
          {inner}
        </Link>
      );
    }
    return (
      <button
        key={n.id}
        onClick={handleClick}
        className="block w-full px-4 py-3 text-left hover:bg-[#F9FAFB]"
      >
        {inner}
      </button>
    );
  };

  const btnClass =
    variant === "dark"
      ? "relative rounded-md p-2 hover:bg-white/10 text-white"
      : "relative rounded-md p-2 hover:bg-[#F0F9F4] text-[#374151]";

  return (
    <div className="relative">
      <button onClick={toggle} className={btnClass} aria-label="Notifications">
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#DC2626] px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="fixed right-4 top-16 z-50 w-[calc(100vw-32px)] max-w-sm overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-2xl sm:absolute sm:right-0 sm:top-11 sm:w-[360px]">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] px-4 py-3">
              <span className="text-sm font-extrabold text-[#111827]">
                Notifications
              </span>
              <button
                onClick={() => setOpen(false)}
                className="rounded p-1 hover:bg-[#F3F4F6]"
                aria-label="Close"
              >
                <X className="h-4 w-4 text-[#6B7280]" />
              </button>
            </div>
            {filtered.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-[#6B7280]">
                You're all caught up.
              </div>
            ) : (
              <ul className="max-h-[70vh] divide-y divide-[#F3F4F6] overflow-y-auto overscroll-contain">
                {filtered.map((n) => (
                  <li key={n.id}>{renderItem(n)}</li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}