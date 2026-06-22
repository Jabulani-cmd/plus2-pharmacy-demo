// ============================================================
// Extras layered on top of orders/prescriptions for the demo:
// chat messages between customer & driver, post-delivery ratings,
// loyalty points and applied coupon codes.
// ============================================================

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ChatMessage = {
  id: string;
  orderId: string;
  from: "customer" | "driver";
  text: string;
  ts: number;
};

export type OrderRating = {
  orderId: string;
  stars: number;
  comment?: string;
  ratedAt: number;
};

type State = {
  messages: ChatMessage[];
  ratings: OrderRating[];
  points: number;
  // chat
  sendMessage: (orderId: string, from: ChatMessage["from"], text: string) => void;
  seedDemoChat: (orderId: string) => void;
  messagesFor: (orderId: string) => ChatMessage[];
  // ratings
  rate: (orderId: string, stars: number, comment?: string) => void;
  ratingFor: (orderId: string) => OrderRating | undefined;
  // loyalty
  addPoints: (n: number) => void;
};

const DEMO_SEED: Record<string, ChatMessage[]> = {};

export const useOrderExtras = create<State>()(
  persist(
    (set, get) => ({
      messages: [],
      ratings: [],
      points: 150,

      sendMessage: (orderId, from, text) => {
        if (!text.trim()) return;
        set((s) => ({
          messages: [
            ...s.messages,
            {
              id: "m_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
              orderId,
              from,
              text: text.trim(),
              ts: Date.now(),
            },
          ],
        }));
      },

      seedDemoChat: (orderId) => {
        const existing = get().messages.some((m) => m.orderId === orderId);
        if (existing) return;
        const base = Date.now() - 5 * 60 * 1000;
        const seed: ChatMessage[] = [
          {
            id: "seed1_" + orderId,
            orderId,
            from: "customer",
            text: "Hi, I'm at the gate — please call when you arrive.",
            ts: base,
          },
          {
            id: "seed2_" + orderId,
            orderId,
            from: "driver",
            text: "On my way, about 10 minutes away!",
            ts: base + 60_000,
          },
          {
            id: "seed3_" + orderId,
            orderId,
            from: "driver",
            text: "I have arrived at the entrance.",
            ts: base + 4 * 60_000,
          },
        ];
        set((s) => ({ messages: [...s.messages, ...seed] }));
        DEMO_SEED[orderId] = seed;
      },

      messagesFor: (orderId) =>
        get().messages.filter((m) => m.orderId === orderId).sort((a, b) => a.ts - b.ts),

      rate: (orderId, stars, comment) => {
        set((s) => ({
          ratings: [
            ...s.ratings.filter((r) => r.orderId !== orderId),
            { orderId, stars, comment, ratedAt: Date.now() },
          ],
        }));
      },

      ratingFor: (orderId) => get().ratings.find((r) => r.orderId === orderId),

      addPoints: (n) => set((s) => ({ points: s.points + n })),
    }),
    { name: "kings-order-extras" }
  )
);

/** Apply Kings Pharmacy coupon code. Returns discount fraction (0-1) or null. */
export function applyCoupon(code: string): { discount: number; label: string } | null {
  const c = code.trim().toUpperCase();
  if (c === "KINGS10") return { discount: 0.1, label: "10% off — KINGS10" };
  if (c === "WELCOME5") return { discount: 0.05, label: "5% welcome discount" };
  return null;
}