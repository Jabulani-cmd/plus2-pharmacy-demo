import { create } from "zustand";
import { persist } from "zustand/middleware";
import { findDemoCustomer } from "@/data/demoAccounts";
import { pushNotification } from "@/store/notifications";
import { supabase } from "@/integrations/supabase/client";
import { useShop } from "@/store/shop";

export type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  points: number;
  tier: "Silver" | "Gold" | "Platinum";
  /** Preferred Kings Pharmacy branch id (e.g. "9th-ave"). */
  branchId?: string;
  /** Last delivery address used — pre-filled into checkout. */
  lastAddress?: SavedAddress | null;
  /** True when the user came from Supabase auth (not demo). */
  isReal?: boolean;
};

export type SavedAddress = {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  street: string;
  suburb: string;
  city: string;
  province: string;
  postal: string;
};

export type PrescriptionStatus =
  | "Pending"
  | "Under Review"
  | "Approved — Awaiting Payment"
  | "Paid"
  | "Dispensing"
  | "Out for Delivery"
  | "Delivered"
  | "Rejected"
  | "Dispensed";

export type Quotation = {
  medicationCost: number;
  deliveryFee: number;
  total: number;
  medicationName: string;
  dosage: string;
  quantity: string;
  pharmacistName: string;
  approvedAt: string;
  notes?: string;
};

export type DeliveryAddress = {
  firstName: string;
  lastName: string;
  phone: string;
  streetAddress: string;
  suburb: string;
  city: string;
  province: string;
  postalCode: string;
  specialInstructions: string;
};

export type Prescription = {
  id: string;
  fileName: string;
  patientName: string;
  doctorName: string;
  notes?: string;
  status: PrescriptionStatus;
  uploadedAt: string;
  files?: {
    name: string;
    size: number;
    type: string;
    dataUrl?: string;
  }[];
  forSelf?: boolean;
  relationship?: string;
  scriptDate?: string;
  isRepeat?: boolean;
  repeatsLeft?: number;
  delivery?: "delivery" | "collect";
  deliveryAddress?: DeliveryAddress;
  collectionBranchId?: string;
  quotation?: Quotation;
  paymentRef?: string;
  paymentMethod?: string;
  paidAt?: string;
  driverName?: string;
  driverPhone?: string;
  driverVehicle?: string;
  dispatchedAt?: string;
};

export type TrackingEvent = {
  label: string;
  at: string;
  done: boolean;
};

export type Order = {
  id: string;
  date: string;
  total: number;
  status: "Processing" | "Packed" | "Out for delivery" | "Delivered";
  items: { name: string; qty: number; price: number }[];
  address: string;
  tracking: TrackingEvent[];
  driver?: { name: string; phone: string; vehicle: string };
};

type AuthState = {
  user: User | null;
  prescriptions: Prescription[];
  orders: Order[];
  login: (
    email: string,
    password: string
  ) => Promise<{ ok: boolean; error?: string }>;
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    branchId?: string;
  }) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  resetPassword: (email: string) => Promise<{ ok: boolean }>;
  saveAddress: (address: SavedAddress) => Promise<void>;
  setPreferredBranch: (branchId: string) => Promise<void>;
  addPrescription: (
    p: Omit<Prescription, "id" | "status" | "uploadedAt">
  ) => string;
  applyQuotationAndPay: (
    prescriptionId: string,
    paymentRef: string,
    paymentMethod: string
  ) => void;
  updatePrescriptionStatus: (
    prescriptionId: string,
    status: PrescriptionStatus,
    extra?: Partial<Prescription>
  ) => void;
};

const DEMO_ORDERS: Order[] = [];

const DEMO_PRESCRIPTIONS: Prescription[] = [
  {
    id: "RX-90211",
    fileName: "script-may-2026.pdf",
    patientName: "Thandi Nkosi",
    doctorName: "Dr A. Mokoena",
    status: "Dispensed",
    uploadedAt: "10 May 2026",
  },
  {
    id: "RX-90415",
    fileName: "chronic-bp.jpg",
    patientName: "Thandi Nkosi",
    doctorName: "Dr S. Patel",
    status: "Approved — Awaiting Payment",
    uploadedAt: "02 Jun 2026",
    notes: "Repeat for 3 months",
    delivery: "delivery",
    deliveryAddress: {
      firstName: "Thandi",
      lastName: "Nkosi",
      phone: "+263 77 123 4567",
      streetAddress: "14 Samora Machel Ave",
      suburb: "Bulawayo CBD",
      city: "Bulawayo",
      province: "Bulawayo Metropolitan",
      postalCode: "263",
      specialInstructions: "",
    },
    quotation: {
      medicationCost: 45.00,
      deliveryFee: 15.00,
      total: 60.00,
      medicationName: "Amlodipine 10mg — 30 tablets",
      dosage: "1 tablet once daily",
      quantity: "30 tablets",
      pharmacistName: "Dr. Rumbidzai Ncube (BPharm)",
      approvedAt: "Today 09:32",
      notes: "Take with or without food. Monitor blood pressure weekly.",
    },
  },
  {
    id: "RX-90510",
    fileName: "antibiotic.pdf",
    patientName: "Thandi Nkosi",
    doctorName: "Dr R. Naidoo",
    status: "Pending",
    uploadedAt: "06 Jun 2026",
  },
];

const DEMO_USER: User = {
  id: "u_demo",
  email: "demo@kingspharmacy.co.za",
  firstName: "Thandi",
  lastName: "Nkosi",
  phone: "+27 82 123 4567",
  points: 2450,
  tier: "Gold",
};

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      prescriptions: DEMO_PRESCRIPTIONS,
      orders: DEMO_ORDERS,

      login: async (email, password) => {
        if (!email || !password)
          return { ok: false, error: "Email and password are required" };

        // Single clean Supabase auth call — no demo bypass
        const { data, error } =
          await supabase.auth.signInWithPassword({
            email: email.trim().toLowerCase(),
            password,
          });

        if (error || !data?.user) {
          return {
            ok: false,
            error:
              error?.message ?? "Invalid email or password",
          };
        }

        // Build user from profile — 5s timeout prevents hanging
        const uid = data.user.id;
        const userEmail = data.user.email ?? email;

        const fallbackUser: User = {
          id: uid,
          email: userEmail,
          firstName:
            userEmail.split("@")[0].split(".")[0]
              .replace(/^./, (c) => c.toUpperCase()),
          lastName:
            (userEmail.split("@")[0].split(".")[1] ?? "")
              .replace(/^./, (c) => c.toUpperCase()),
          phone: undefined,
          branchId: undefined,
          lastAddress: null,
          points: 0,
          tier: "Silver",
          isReal: true,
        };

        let user: User = fallbackUser;

        try {
          const profileResult = await Promise.race([
            supabase
              .from("profiles")
              .select(
                "first_name,last_name,full_name," +
                "phone,branch_id,last_address"
              )
              .eq("id", uid)
              .maybeSingle(),
            new Promise<{ data: null; error: null }>(
              (resolve) =>
                setTimeout(
                  () => resolve({ data: null, error: null }),
                  5000
                )
            ),
          ]);

          const profile = profileResult.data;
          if (profile) {
            user = {
              id: uid,
              email: userEmail,
              firstName:
                profile.first_name ??
                fallbackUser.firstName,
              lastName:
                profile.last_name ?? fallbackUser.lastName,
              phone: profile.phone ?? undefined,
              branchId: profile.branch_id ?? undefined,
              lastAddress:
                (profile.last_address as SavedAddress | null) ??
                null,
              points: 0,
              tier: "Silver",
              isReal: true,
            };
          } else {
            // Auto-create profile for new customers
            void supabase.from("profiles").upsert({
              id: uid,
              email: userEmail,
              first_name: fallbackUser.firstName,
              last_name: fallbackUser.lastName,
              role: "customer",
            });
          }
        } catch (err) {
          console.error("[auth] profile lookup failed:", err);
          // Use fallback user — login still succeeds
        }

        set({ user, orders: [], prescriptions: [] });
        return { ok: true };
      },

      register: async ({
        email,
        password,
        firstName,
        lastName,
        phone,
        branchId,
      }) => {
        if (!email.includes("@"))
          return { ok: false, error: "Enter a valid email" };
        if (password.length < 8)
          return {
            ok: false,
            error: "Password must be at least 8 characters",
          };
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
            data: {
              full_name: (firstName + " " + lastName).trim(),
              first_name: firstName,
              last_name: lastName,
              phone,
              branch_id: branchId,
            },
          },
        });
        if (error || !data.user)
          return { ok: false, error: error?.message ?? "Could not create account" };
        const userId = data.user.id;
        // Ensure the profiles row carries first/last/branch (trigger only sets full_name).
        await supabase
          .from("profiles")
          .upsert({
            id: userId,
            full_name: (firstName + " " + lastName).trim(),
            first_name: firstName,
            last_name: lastName,
            phone: phone ?? null,
            email,
            branch_id: branchId ?? null,
          });
        const user: User = {
          id: userId,
          email,
          firstName,
          lastName,
          phone,
          branchId,
          points: 0,
          tier: "Silver",
          isReal: true,
        };
        set({ user, orders: [], prescriptions: [] });
        // Welcome notification on the bell + dashboard
        pushNotification({
          audience: "customer",
          userId,
          title: "Welcome to Kings Pharmacy, " + firstName + "!",
          body: "Start shopping or upload your first prescription to get going.",
          link: "/account",
          tone: "success",
        });
        return { ok: true };
      },

      logout: () => {
        void supabase.auth.signOut().catch(() => {});
        // Wipe the previous user's cart so a guest / next user never sees ghost items.
        try { useShop.getState().clearCart(); } catch { /* noop */ }
        set({ user: null });
      },

      resetPassword: async () => {
        await new Promise((r) => setTimeout(r, 400));
        return { ok: true };
      },

      saveAddress: async (address) => {
        const u = get().user;
        if (!u) return;
        set({ user: { ...u, lastAddress: address } });
        if (u.isReal) {
          await supabase
            .from("profiles")
            .update({ last_address: address as unknown as never })
            .eq("id", u.id);
        }
      },

      setPreferredBranch: async (branchId) => {
        const u = get().user;
        if (!u) return;
        set({ user: { ...u, branchId } });
        if (u.isReal) {
          await supabase.from("profiles").update({ branch_id: branchId }).eq("id", u.id);
        }
      },

      addPrescription: (p) => {
        const id =
          "RX-2025-" + Math.floor(100000 + Math.random() * 899999);
        set({
          prescriptions: [
            {
              id,
              status: "Pending",
              uploadedAt: new Date().toLocaleDateString("en-ZW", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              }),
              ...p,
            },
            ...get().prescriptions,
          ],
        });
        return id;
      },

      applyQuotationAndPay: (prescriptionId, paymentRef, paymentMethod) => {
        const paidAt = new Date().toLocaleString("en-ZW", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
        set({
          prescriptions: get().prescriptions.map((p) =>
            p.id === prescriptionId
              ? {
                  ...p,
                  status: "Paid" as PrescriptionStatus,
                  paymentRef,
                  paymentMethod,
                  paidAt,
                }
              : p
          ),
        });
      },

      updatePrescriptionStatus: (prescriptionId, status, extra = {}) => {
        set({
          prescriptions: get().prescriptions.map((p) =>
            p.id === prescriptionId
              ? { ...p, status, ...extra }
              : p
          ),
        });
      },
    }),
    {
      name: "kings-auth",
      partialize: (s) => ({
        user: s.user,
        prescriptions: s.prescriptions,
      }),
    }
  )
);

// ---- Supabase session hydration ----
async function buildUserFromSupabase(
  id: string,
  email: string
): Promise<User> {
  try {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select(
        "first_name,last_name,full_name,phone,branch_id,last_address"
      )
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("[auth] profile fetch error:", error);
    }

    // If no profile exists yet, create one automatically
    if (!profile) {
      const nameParts = email.split("@")[0].split(".");
      const firstName =
        nameParts[0]?.charAt(0).toUpperCase() +
        nameParts[0]?.slice(1) ?? "";
      const lastName =
        nameParts[1]?.charAt(0).toUpperCase() +
        nameParts[1]?.slice(1) ?? "";
      void supabase.from("profiles").upsert({
        id,
        email,
        first_name: firstName,
        last_name: lastName,
        full_name: (firstName + " " + lastName).trim(),
        role: "customer",
        created_at: new Date().toISOString(),
      });
      return {
        id,
        email,
        firstName,
        lastName,
        phone: undefined,
        branchId: undefined,
        lastAddress: null,
        points: 0,
        tier: "Silver",
        isReal: true,
      };
    }

    const fullName = profile.full_name ?? "";
    const parts = fullName.split(" ");
    return {
      id,
      email,
      firstName:
        profile.first_name ?? parts[0] ?? email.split("@")[0],
      lastName:
        profile.last_name ?? parts.slice(1).join(" ") ?? "",
      phone: profile.phone ?? undefined,
      branchId: profile.branch_id ?? undefined,
      lastAddress:
        (profile.last_address as SavedAddress | null) ?? null,
      points: 0,
      tier: "Silver",
      isReal: true,
    };
  } catch (err) {
    console.error("[auth] buildUserFromSupabase error:", err);
    // Return minimal user so login doesn't hang
    const nameParts = email.split("@")[0].split(".");
    return {
      id,
      email,
      firstName:
        nameParts[0]?.charAt(0).toUpperCase() +
        (nameParts[0]?.slice(1) ?? ""),
      lastName:
        nameParts[1]?.charAt(0).toUpperCase() +
        (nameParts[1]?.slice(1) ?? ""),
      phone: undefined,
      branchId: undefined,
      lastAddress: null,
      points: 0,
      tier: "Silver",
      isReal: true,
    };
  }
}

if (typeof window !== "undefined") {
  // Hydrate session on load so a refreshed tab keeps the real user signed in.
  void supabase.auth.getSession().then(async ({ data }) => {
    const session = data.session;
    if (!session?.user) return;
    const existing = useAuth.getState().user;
    // Don't overwrite a demo session.
    if (existing && !existing.isReal) return;
    const user = await buildUserFromSupabase(session.user.id, session.user.email ?? "");
    useAuth.setState({ user });
  });

  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === "SIGNED_OUT") {
      const u = useAuth.getState().user;
      if (u?.isReal) useAuth.setState({ user: null });
      // Always clear any persisted cart on sign-out so it can't bleed into a guest/next session.
      try { useShop.getState().clearCart(); } catch { /* noop */ }
      return;
    }
    if (event === "SIGNED_IN" && session?.user) {
      const existing = useAuth.getState().user;
      if (existing && !existing.isReal) return; // keep demo session
      const user = await buildUserFromSupabase(session.user.id, session.user.email ?? "");
      useAuth.setState({ user });
    }
  });
}
