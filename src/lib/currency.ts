import { create } from "zustand";
import { persist } from "zustand/middleware";

export const CURRENCIES = {
  USD: { symbol: "US$", code: "USD", name: "US Dollar" },
  ZIG: { symbol: "ZiG", code: "ZIG", name: "Zimbabwe Gold" },
} as const;

export type Currency = keyof typeof CURRENCIES;

// 1 USD = X ZiG — update when the official rate changes
export const USD_TO_ZIG_RATE = 26.5;

export function convertToZIG(usdAmount: number): number {
  return usdAmount * USD_TO_ZIG_RATE;
}

export function formatPrice(usdAmount: number, currency: Currency): string {
  if (currency === "ZIG") {
    const zig = convertToZIG(usdAmount);
    return `ZiG ${zig.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `US$${usdAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

interface CurrencyStore {
  currency: Currency;
  setCurrency: (c: Currency) => void;
}

export const useCurrencyStore = create<CurrencyStore>()(
  persist(
    (set) => ({
      currency: "USD",
      setCurrency: (currency) => set({ currency }),
    }),
    { name: "kp-currency" }
  )
);

/** Hook returning a currency-aware formatter that re-renders when the user toggles currency. */
export function useMoney(): (usdAmount: number) => string {
  const currency = useCurrencyStore((s) => s.currency);
  return (n: number) => formatPrice(n, currency);
}