import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bell, X, CheckCircle2, AlertCircle, Info } from "lucide-react";
import {
  useNotifications,
  formatRelative,
  type AppNotification,
  type NotificationAudience,
} from "@/store/notifications";

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
          <div className="absolute right-0 top-11 z-50 w-[min(92vw,360px)] overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-2xl">
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
              <ul className="max-h-[60vh] divide-y divide-[#F3F4F6] overflow-y-auto">
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