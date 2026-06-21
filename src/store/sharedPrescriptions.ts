// ============================================================
// SHARED PRESCRIPTION STORE
// src/store/sharedPrescriptions.ts
//
// This store bridges the customer portal and staff portal.
// Both portals read from and write to this same localStorage key.
// ============================================================

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { pushNotification } from "./notifications";

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
        pushNotification({
          audience: "customer",
          userId: p.customerId ?? p.customerEmail,
          title: "Prescription submitted",
          body: "Script " + p.id + " is awaiting pharmacist review.",
          link: "/account",
          tone: "info",
        });
        pushNotification({
          audience: "staff",
          title: "New prescription to review",
          body: p.patientName + " uploaded " + p.fileName,
          link: "/staff/dashboard",
          tone: "warning",
        });
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
        const rx = useSharedPrescriptions.getState().prescriptions.find((p) => p.id === id);
        if (rx) {
          pushNotification({
            audience: "customer",
            userId: rx.customerId ?? rx.customerEmail,
            title: "Quotation ready — action required",
            body:
              "Your script " + id + " has been approved. Total $" + quotation.total.toFixed(2) + ".",
            link: "/account",
            tone: "success",
          });
        }
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
        const rx = useSharedPrescriptions.getState().prescriptions.find((p) => p.id === id);
        if (rx) {
          pushNotification({
            audience: "customer",
            userId: rx.customerId ?? rx.customerEmail,
            title: "Prescription declined",
            body: "Script " + id + ": " + reason,
            link: "/account",
            tone: "danger",
          });
        }
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
        const rx = useSharedPrescriptions.getState().prescriptions.find((p) => p.id === id);
        pushNotification({
          audience: "staff",
          title: "Payment received — ready to pack",
          body:
            "Prescription " + id + " · $" +
            (rx?.quotation?.total.toFixed(2) ?? paymentRef) +
            " via " + paymentMethod,
          link: "/staff/dashboard",
          tone: "success",
        });
        if (rx) {
          pushNotification({
            audience: "customer",
            userId: rx.customerId ?? rx.customerEmail,
            title: "Payment confirmed",
            body: "We've received your payment for " + id + ". Dispensing has started.",
            link: "/track",
            linkSearch: { order: id },
            tone: "success",
          });
        }
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
        const rx = useSharedPrescriptions.getState().prescriptions.find((p) => p.id === id);
        if (rx) {
          pushNotification({
            audience: "customer",
            userId: rx.customerId ?? rx.customerEmail,
            title: "Your order has been dispatched",
            body: driverName + " is on the way with " + id + " — track your delivery.",
            link: "/track",
            linkSearch: { order: id },
            tone: "success",
          });
        }
      },

      updateStatus: (id, status, extra = {}) => {
        set((state) => ({
          prescriptions: state.prescriptions.map((p) =>
            p.id === id ? { ...p, status, ...extra } : p
          ),
        }));
        if (status === "Delivered") {
          const rx = useSharedPrescriptions.getState().prescriptions.find((p) => p.id === id);
          if (rx) {
            pushNotification({
              audience: "customer",
              userId: rx.customerId ?? rx.customerEmail,
              title: "Prescription delivered",
              body: "Your script " + id + " has been delivered. Stay well!",
              link: "/account",
              tone: "success",
            });
          }
        }
      },
    }),
    { name: "kings-shared-prescriptions" }
  )
);
