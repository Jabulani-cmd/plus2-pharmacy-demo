import { create } from "zustand";
import { persist } from "zustand/middleware";

export type NotificationAudience = "customer" | "staff" | "driver";

export type AppNotification = {
  id: string;
  audience: NotificationAudience;
  /** Optional: when set, only this customer (by id or email) sees it. */
  userId?: string;
  title: string;
  body: string;
  /** Tanstack-router URL path to navigate to when clicked. */
  link?: string;
  /** Optional search params for the linked route, e.g. { order: "P2-..." } */
  linkSearch?: Record<string, string>;
  ts: number;
  read: boolean;
  /** Visual hint */
  tone?: "info" | "success" | "warning" | "danger";
};

type State = {
  items: AppNotification[];
  add: (n: Omit<AppNotification, "id" | "ts" | "read">) => void;
  markRead: (id: string) => void;
  markAllRead: (audience?: NotificationAudience, userId?: string) => void;
  clearAll: () => void;
};

export const useNotifications = create<State>()(
  persist(
    (set) => ({
      items: [],
      add: (n) =>
        set((s) => ({
          items: [
            {
              ...n,
              id: "ntf_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
              ts: Date.now(),
              read: false,
            },
            ...s.items,
          ].slice(0, 200),
        })),
      markRead: (id) =>
        set((s) => ({
          items: s.items.map((i) => (i.id === id ? { ...i, read: true } : i)),
        })),
      markAllRead: (audience, userId) =>
        set((s) => ({
          items: s.items.map((i) =>
            (!audience || i.audience === audience) &&
            (!userId || !i.userId || i.userId === userId)
              ? { ...i, read: true }
              : i
          ),
        })),
      clearAll: () => set({ items: [] }),
    }),
    { name: "kings-notifications" }
  )
);

/**
 * Tiny helper so callers don't have to subscribe to the store —
 * just call `pushNotification(...)` from any zustand action.
 */
export const pushNotification = (
  n: Omit<AppNotification, "id" | "ts" | "read">
) => useNotifications.getState().add(n);

export function formatRelative(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.round(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return m + "m ago";
  const h = Math.round(m / 60);
  if (h < 24) return h + "h ago";
  const d = Math.round(h / 24);
  return d + "d ago";
}