import { create } from "zustand";
import { persist } from "zustand/middleware";
import { findDemoStaff, type DemoStaff } from "@/data/demoAccounts";

type StaffAuthState = {
  staff: DemoStaff | null;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string; staff?: DemoStaff }>;
  logout: () => void;
};

export const useStaffAuth = create<StaffAuthState>()(
  persist(
    (set) => ({
      staff: null,
      login: async (email, password) => {
        await new Promise((r) => setTimeout(r, 400));
        const s = findDemoStaff(email);
        if (!s) return { ok: false, error: "Unknown staff account" };
        if (s.password !== password) return { ok: false, error: "Incorrect password" };
        set({ staff: s });
        return { ok: true, staff: s };
      },
      logout: () => set({ staff: null }),
    }),
    { name: "kings-staff-auth" }
  )
);