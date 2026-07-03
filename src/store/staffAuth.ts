import { create } from "zustand";
import { persist } from "zustand/middleware";
import { findDemoStaff, type DemoStaff } from "@/data/demoAccounts";
import { verifyStaffLogin } from "@/lib/staffAuth.functions";

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
        const s = findDemoStaff(email);
        if (!s) return { ok: false, error: "Unknown staff account" };
        try {
          const res = await verifyStaffLogin({ data: { email, password } });
          if (!res.ok) return { ok: false, error: "Incorrect password" };
        } catch {
          return { ok: false, error: "Sign-in service unavailable" };
        }
        set({ staff: s });
        return { ok: true, staff: s };
      },
      logout: () => set({ staff: null }),
    }),
    { name: "kings-staff-auth" }
  )
);