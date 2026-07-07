import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEMO_STAFF_PASSWORDS, findDemoStaff, type DemoStaff } from "@/data/demoAccounts";

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
        const normalizedEmail = email.trim().toLowerCase();
        const s = findDemoStaff(normalizedEmail);
        if (!s) return { ok: false, error: "Unknown staff account" };
        if (DEMO_STAFF_PASSWORDS[normalizedEmail] !== password) {
          return { ok: false, error: "Incorrect password" };
        }
        set({ staff: s });
        return { ok: true, staff: s };
      },
      logout: () => set({ staff: null }),
    }),
    { name: "kings-staff-auth" }
  )
);