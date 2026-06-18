import { create } from "zustand";
import { persist } from "zustand/middleware";

type CartItem = { id: string; qty: number };

type ShopState = {
  cart: CartItem[];
  wishlist: string[];
  promoCode: string;
  addToCart: (id: string, qty?: number) => void;
  removeFromCart: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  toggleWishlist: (id: string) => void;
  clearCart: () => void;
  setPromoCode: (code: string) => void;
};

export const useShop = create<ShopState>()(
  persist(
    (set) => ({
      cart: [],
      wishlist: [],
      promoCode: "",
      addToCart: (id, qty = 1) =>
        set((s) => {
          const existing = s.cart.find((c) => c.id === id);
          if (existing) {
            return { cart: s.cart.map((c) => (c.id === id ? { ...c, qty: c.qty + qty } : c)) };
          }
          return { cart: [...s.cart, { id, qty }] };
        }),
      removeFromCart: (id) => set((s) => ({ cart: s.cart.filter((c) => c.id !== id) })),
      updateQty: (id, qty) =>
        set((s) => ({
          cart: qty <= 0 ? s.cart.filter((c) => c.id !== id) : s.cart.map((c) => (c.id === id ? { ...c, qty } : c)),
        })),
      toggleWishlist: (id) =>
        set((s) => ({
          wishlist: s.wishlist.includes(id) ? s.wishlist.filter((w) => w !== id) : [...s.wishlist, id],
        })),
      clearCart: () => set({ cart: [], promoCode: "" }),
      setPromoCode: (code) => set({ promoCode: code }),
    }),
    { name: "kings-shop" }
  )
);

// Zimbabwe pricing — USD is the most widely accepted currency.
// ZIG (Zimbabwe Gold) equivalent is shown alongside where useful.
export const formatUSD = (n: number) =>
  "US$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const formatPrice = formatUSD;

// 1 USD ≈ 26 ZIG (illustrative demo rate)
export const ZIG_RATE = 26;
export const formatZIG = (n: number) =>
  "ZIG " + (n * ZIG_RATE).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });