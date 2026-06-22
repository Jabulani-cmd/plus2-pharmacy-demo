import { create } from "zustand";
import { persist } from "zustand/middleware";
import { findDemoCustomer } from "@/data/demoAccounts";
import { pushNotification } from "@/store/notifications";

export type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  points: number;
  tier: "Silver" | "Gold" | "Platinum";
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
  }) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  resetPassword: (email: string) => Promise<{ ok: boolean }>;
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

const DEMO_ORDERS: Order[] = [
  {
    id: "P2-184221",
    date: "12 May 2026",
    total: 489.97,
    status: "Delivered",
    items: [
      { name: "Panado 500mg 24s", qty: 2, price: 39.99 },
      { name: "Centrum Multivitamin 30s", qty: 1, price: 209.99 },
      { name: "Nivea Body Lotion 400ml", qty: 1, price: 99.99 },
    ],
    address: "14 Samora Machel Ave, Bulawayo",
    tracking: [
      { label: "Order placed", at: "12 May, 09:14", done: true },
      { label: "Packed at pharmacy", at: "12 May, 10:42", done: true },
      { label: "Out for delivery", at: "12 May, 12:08", done: true },
      { label: "Delivered", at: "12 May, 14:23", done: true },
    ],
  },
  {
    id: "P2-183904",
    date: "28 Apr 2026",
    total: 234.5,
    status: "Out for delivery",
    items: [
      { name: "Allergex 30s", qty: 1, price: 64.99 },
      { name: "Vicks VapoRub 50g", qty: 1, price: 79.99 },
    ],
    address: "14 Samora Machel Ave, Bulawayo",
    tracking: [
      { label: "Order placed", at: "07 Jun, 08:02", done: true },
      { label: "Packed at pharmacy", at: "07 Jun, 09:31", done: true },
      { label: "Out for delivery", at: "07 Jun, 11:15", done: true },
      { label: "Delivered", at: "Est. today, 15:00", done: false },
    ],
    driver: {
      name: "Sipho M.",
      phone: "+263 78 555 0119",
      vehicle: "Toyota Hilux · ACJ 4821",
    },
  },
  {
    id: "P2-182117",
    date: "06 Jun 2026",
    total: 1289.0,
    status: "Packed",
    items: [{ name: "Omron Blood Pressure Monitor", qty: 1, price: 1289.0 }],
    address: "14 Samora Machel Ave, Bulawayo",
    tracking: [
      { label: "Order placed", at: "06 Jun, 19:47", done: true },
      { label: "Packed at pharmacy", at: "07 Jun, 07:21", done: true },
      { label: "Out for delivery", at: "Pending", done: false },
      { label: "Delivered", at: "Pending", done: false },
    ],
  },
];

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
        await new Promise((r) => setTimeout(r, 500));
        if (!email || !password)
          return { ok: false, error: "Email and password are required" };
        if (password.length < 6)
          return { ok: false, error: "Invalid email or password" };
        const demo = findDemoCustomer(email);
        if (demo) {
          set({
            user: demo.user,
            orders: demo.orders,
            prescriptions: demo.prescriptions,
          });
          return { ok: true };
        }
        const user: User =
          email.toLowerCase() === DEMO_USER.email
            ? DEMO_USER
            : {
                ...DEMO_USER,
                id: "u_" + Date.now(),
                email,
                firstName: email.split("@")[0],
              };
        set({ user });
        return { ok: true };
      },

      register: async ({
        email,
        password,
        firstName,
        lastName,
        phone,
      }) => {
        await new Promise((r) => setTimeout(r, 600));
        if (!email.includes("@"))
          return { ok: false, error: "Enter a valid email" };
        if (password.length < 8)
          return {
            ok: false,
            error: "Password must be at least 8 characters",
          };
        const id = "u_" + Date.now();
        set({
          user: {
            id,
            email,
            firstName,
            lastName,
            phone,
            points: 250,
            tier: "Silver",
          },
        });
        // Welcome notification on the bell + dashboard
        pushNotification({
          audience: "customer",
          userId: id,
          title: "Welcome to Kings Pharmacy, " + firstName + "!",
          body: "Start shopping or upload your first prescription to get going.",
          link: "/account",
          tone: "success",
        });
        return { ok: true };
      },

      logout: () => set({ user: null }),

      resetPassword: async () => {
        await new Promise((r) => setTimeout(r, 400));
        return { ok: true };
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
