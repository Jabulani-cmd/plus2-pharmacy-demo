// ============================================================
// Local orders store used by /track route.
// TEMPORARY SHIM — will be replaced by the Supabase-backed
// realtime store in the next migration step.
// ============================================================
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const ORDER_FLOW = [
  "Order Confirmed",
  "Pharmacist Reviewing",
  "Preparing Order",
  "Driver Assigned",
  "Out for Delivery",
  "Delivered",
] as const;

export type LiveStatus = (typeof ORDER_FLOW)[number];

export type LiveOrderItem = { name: string; qty: number; price: number };
export type LiveOrderHistory = { status: LiveStatus; at: number };
export type LiveRating = { stars: number; text: string };

export type LiveOrder = {
  id: string;
  status: LiveStatus;
  driverName?: string;
  items: LiveOrderItem[];
  total: number;
  history: LiveOrderHistory[];
  rating?: LiveRating;
  deliveryRating?: LiveRating;
};

type State = {
  orders: LiveOrder[];
  advance: (id: string) => void;
  rate: (id: string, stars: number, text: string) => void;
  rateDelivery: (id: string, stars: number, text: string) => void;
  seedIfEmpty: () => void;
};

const seedOrder = (): LiveOrder => ({
  id: "KP-" + Math.random().toString(36).slice(2, 7).toUpperCase(),
  status: "Preparing Order",
  driverName: "Tendai Moyo",
  items: [
    { name: "Paracetamol 500mg", qty: 2, price: 3.5 },
    { name: "Vitamin C 1000mg", qty: 1, price: 8.0 },
  ],
  total: 15.0,
  history: [
    { status: "Order Confirmed", at: Date.now() - 1000 * 60 * 15 },
    { status: "Pharmacist Reviewing", at: Date.now() - 1000 * 60 * 10 },
    { status: "Preparing Order", at: Date.now() - 1000 * 60 * 4 },
  ],
});

export const useOrders = create<State>()(
  persist(
    (set, get) => ({
      orders: [],
      advance: (id) =>
        set((s) => ({
          orders: s.orders.map((o) => {
            if (o.id !== id) return o;
            const idx = ORDER_FLOW.indexOf(o.status);
            const next = ORDER_FLOW[Math.min(idx + 1, ORDER_FLOW.length - 1)];
            if (next === o.status) return o;
            return {
              ...o,
              status: next,
              history: [...o.history, { status: next, at: Date.now() }],
            };
          }),
        })),
      rate: (id, stars, text) =>
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === id ? { ...o, rating: { stars, text } } : o
          ),
        })),
      rateDelivery: (id, stars, text) =>
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === id ? { ...o, deliveryRating: { stars, text } } : o
          ),
        })),
      seedIfEmpty: () => {
        if (get().orders.length === 0) {
          set({ orders: [seedOrder()] });
        }
      },
    }),
    { name: "kings-live-orders" }
  )
);

// Auto-seed once on first import in the browser
if (typeof window !== "undefined") {
  setTimeout(() => useOrders.getState().seedIfEmpty(), 0);
}