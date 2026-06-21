import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Consultation = {
  id: string;
  fullName: string;
  phone: string;
  branchId: string;
  branchName: string;
  preferredDate: string;
  preferredTime: string;
  reason: string;
  createdAt: string;
};

type State = {
  bookings: Consultation[];
  add: (b: Omit<Consultation, "id" | "createdAt">) => Consultation;
};

export const useConsultations = create<State>()(
  persist(
    (set) => ({
      bookings: [],
      add: (b) => {
        const booking: Consultation = {
          ...b,
          id: "KP-CONS-" + Math.floor(100000 + Math.random() * 900000),
          createdAt: new Date().toLocaleString("en-ZW", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
        };
        set((s) => ({ bookings: [booking, ...s.bookings] }));
        return booking;
      },
    }),
    { name: "kings-consultations" }
  )
);