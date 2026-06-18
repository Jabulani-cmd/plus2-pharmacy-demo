// ============================================================
// SHARED PRESCRIPTION STORE
// src/store/sharedPrescriptions.ts
//
// This store bridges the customer portal and staff portal.
// Both portals read from and write to this same localStorage key.
// ============================================================

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SharedPrescriptionStatus =
  | "Pending"
  | "Under Review"
  | "Approved — Awaiting Payment"
  | "Paid"
  | "Dispensing"
  | "Out for Delivery"
  | "Delivered"
  | "Rejected"
  | "Dispensed";

export type SharedQuotation = {
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

export type SharedDeliveryAddress = {
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

export type SharedPrescription = {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  fileName: string;
  patientName: string;
  doctorName: string;
  notes?: string;
  status: SharedPrescriptionStatus;
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
  deliveryAddress?: SharedDeliveryAddress;
  collectionBranchId?: string;
  quotation?: SharedQuotation;
  paymentRef?: string;
  paymentMethod?: string;
  paidAt?: string;
  pharmacistNotes?: string;
  approvedAt?: string;
  rejectionReason?: string;
  driverName?: string;
  driverPhone?: string;
  driverVehicle?: string;
  dispatchedAt?: string;
};

type SharedState = {
  prescriptions: SharedPrescription[];
  addPrescription: (
    p: Omit<SharedPrescription, "status" | "uploadedAt">
  ) => void;
  approvePrescription: (
    id: string,
    quotation: SharedQuotation,
    pharmacistNotes?: string
  ) => void;
  rejectPrescription: (id: string, reason: string) => void;
  dispensePrescription: (id: string) => void;
  markPaid: (
    id: string,
    paymentRef: string,
    paymentMethod: string
  ) => void;
  assignDriver: (
    id: string,
    driverName: string,
    driverPhone: string,
    driverVehicle: string
  ) => void;
  updateStatus: (
    id: string,
    status: SharedPrescriptionStatus,
    extra?: Partial<SharedPrescription>
  ) => void;
};

export const useSharedPrescriptions = create<SharedState>()(
  persist(
    (set) => ({
      prescriptions: [],

      addPrescription: (p) => {
        const uploadedAt = new Date().toLocaleString("en-ZW", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
        set((state) => ({
          prescriptions: [
            { ...p, status: "Pending", uploadedAt },
            ...state.prescriptions,
          ],
        }));
      },

      approvePrescription: (id, quotation, pharmacistNotes) => {
        const approvedAt = new Date().toLocaleString("en-ZW", {
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        });
        set((state) => ({
          prescriptions: state.prescriptions.map((p) =>
            p.id === id
              ? {
                  ...p,
                  status:
                    "Approved — Awaiting Payment" as SharedPrescriptionStatus,
                  quotation,
                  pharmacistNotes,
                  approvedAt,
                }
              : p
          ),
        }));
      },

      rejectPrescription: (id, reason) => {
        set((state) => ({
          prescriptions: state.prescriptions.map((p) =>
            p.id === id
              ? {
                  ...p,
                  status: "Rejected" as SharedPrescriptionStatus,
                  rejectionReason: reason,
                }
              : p
          ),
        }));
      },

      dispensePrescription: (id) => {
        set((state) => ({
          prescriptions: state.prescriptions.map((p) =>
            p.id === id
              ? {
                  ...p,
                  status: "Dispensing" as SharedPrescriptionStatus,
                }
              : p
          ),
        }));
      },

      markPaid: (id, paymentRef, paymentMethod) => {
        const paidAt = new Date().toLocaleString("en-ZW", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
        set((state) => ({
          prescriptions: state.prescriptions.map((p) =>
            p.id === id
              ? {
                  ...p,
                  status: "Paid" as SharedPrescriptionStatus,
                  paymentRef,
                  paymentMethod,
                  paidAt,
                }
              : p
          ),
        }));
      },

      assignDriver: (
        id,
        driverName,
        driverPhone,
        driverVehicle
      ) => {
        const dispatchedAt = new Date().toLocaleString(
          "en-ZW",
          {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          }
        );
        set((state) => ({
          prescriptions: state.prescriptions.map((p) =>
            p.id === id
              ? {
                  ...p,
                  status:
                    "Out for Delivery" as SharedPrescriptionStatus,
                  driverName,
                  driverPhone,
                  driverVehicle,
                  dispatchedAt,
                }
              : p
          ),
        }));
      },

      updateStatus: (id, status, extra = {}) => {
        set((state) => ({
          prescriptions: state.prescriptions.map((p) =>
            p.id === id ? { ...p, status, ...extra } : p
          ),
        }));
      },
    }),
    { name: "kings-shared-prescriptions" }
  )
);
