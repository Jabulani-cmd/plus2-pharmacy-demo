// ============================================================
// SHARED PRESCRIPTION STORE
// src/store/sharedPrescriptions.ts
//
// This store bridges the customer portal and staff portal.
// Both portals read from and write to this same localStorage key.
// ============================================================

import { create } from "zustand";
import { pushNotification } from "./notifications";
import { supabase } from "@/integrations/supabase/client";

export type SharedPrescriptionStatus =
  | "Pending"
  | "Printing"
  | "Ready to Quote"
  | "Under Review"
  | "Approved — Awaiting Payment"
  | "Paid"
  | "Assigned"
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
  customerId?: string;
  customerName: string;
  customerEmail?: string;
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
  branchId?: string;
  branchName?: string;
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
    ((set) => ({
      prescriptions: [],

      addPrescription: (p) => {
        const uploadedAt = new Date().toLocaleString("en-ZW", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
        const record: SharedPrescription = { ...p, status: "Pending", uploadedAt };
        set((state) => ({
          prescriptions: [record, ...state.prescriptions.filter((x) => x.id !== record.id)],
        }));
        void supabase.from("prescriptions").insert(rxToRow(record) as never).then(({ error }) => {
          if (error) console.error("[sharedPrescriptions] insert failed", error);
        });
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
        void (async () => {
          const { data, error } = await supabase
            .from("prescriptions")
            .update({
              status: "Approved — Awaiting Payment",
              quotation: quotation as unknown as never,
              pharmacist_notes: pharmacistNotes ?? null,
              approved_at: new Date().toISOString(),
            })
            .eq("id", id)
            .select();
          if (error) {
            console.error("[sharedPrescriptions] approve update failed", error);
            return;
          }
          // If the row didn't exist yet (e.g. customer uploaded but DB insert lagged),
          // upsert it so the customer's account page picks it up via realtime.
          if (!data || data.length === 0) {
            const rx = useSharedPrescriptions
              .getState()
              .prescriptions.find((p) => p.id === id);
            if (rx) {
              const { error: upErr } = await supabase
                .from("prescriptions")
                .upsert(rxToRow({
                  ...rx,
                  status: "Approved — Awaiting Payment",
                  quotation,
                  pharmacistNotes,
                  approvedAt,
                }) as never);
              if (upErr) console.error("[sharedPrescriptions] approve upsert failed", upErr);
            } else {
              console.warn(
                "[sharedPrescriptions] approve: no DB row for " + id +
                " — likely a demo queue item, not a customer upload.",
              );
            }
          }
        })();
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
        void supabase.from("staff_notifications").insert({
          order_id: id,
          title: "✅ Prescription Approved",
          body:
            "Prescription #" + id +
            " approved. Quotation $" + quotation.total.toFixed(2) +
            " sent to customer — awaiting payment.",
          kind: "prescription_approved",
        } as never);
        // Cross-device customer notification (bell + toast on any signed-in device)
        if (rx && isUuid(rx.customerId)) {
          void supabase.from("notifications").insert({
            audience: "customer",
            user_id: rx.customerId,
            title: "Quotation Ready — Action Required",
            body:
              "Your prescription #" + id +
              " has been approved. Total $" +
              quotation.total.toFixed(2) + ". Tap to pay now.",
            link: "/account",
            tone: "success",
          } as never);
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
        void supabase.from("prescriptions").update({
          status: "Rejected",
          rejection_reason: reason,
        }).eq("id", id);
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
        void supabase.from("prescriptions").update({ status: "Dispensing" }).eq("id", id);
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
        void supabase.from("prescriptions").update({
          status: "Paid",
          payment_ref: paymentRef,
          payment_method: paymentMethod,
          paid_at: new Date().toISOString(),
        }).eq("id", id);
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
        void supabase.from("staff_notifications").insert({
          order_id: id,
          title: "💊 Prescription Payment Received",
          body:
            "Prescription #" + id +
            " · $" + (rx?.quotation?.total.toFixed(2) ?? paymentRef) +
            " via " + paymentMethod +
            " — ready to dispense and dispatch.",
          kind: "prescription_paid",
        } as never);
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
        void supabase.from("prescriptions").update({
          status: "Out for Delivery",
          driver_name: driverName,
          driver_phone: driverPhone,
          driver_vehicle: driverVehicle,
          dispatched_at: new Date().toISOString(),
        }).eq("id", id);
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
        void supabase.from("prescriptions").update({ status }).eq("id", id);
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
    }))
);

// ---- Row mapping ----
type RxRow = Record<string, unknown>;
const rxToRow = (p: SharedPrescription): Record<string, unknown> => ({
  id: p.id,
  customer_id: isUuid(p.customerId) ? p.customerId : null,
  customer_name: p.customerName,
  customer_email: p.customerEmail ?? null,
  customer_phone: p.customerPhone ?? null,
  file_name: p.fileName,
  patient_name: p.patientName,
  doctor_name: p.doctorName ?? null,
  notes: p.notes ?? null,
  status: p.status,
  files: (p.files ?? null) as unknown,
  for_self: p.forSelf ?? null,
  relationship: p.relationship ?? null,
  script_date: p.scriptDate ?? null,
  is_repeat: p.isRepeat ?? null,
  repeats_left: p.repeatsLeft ?? null,
  delivery: p.delivery ?? null,
  delivery_address: (p.deliveryAddress ?? null) as unknown,
  collection_branch_id: p.collectionBranchId ?? null,
  branch_id: p.branchId ?? null,
  branch_name: p.branchName ?? null,
  quotation: (p.quotation ?? null) as unknown,
  pharmacist_notes: p.pharmacistNotes ?? null,
});

const rowToRx = (r: RxRow): SharedPrescription => ({
  id: String(r.id),
  customerId: (r.customer_id as string | null) ?? undefined,
  customerName: String(r.customer_name ?? ""),
  customerEmail: (r.customer_email as string | null) ?? undefined,
  customerPhone: String(r.customer_phone ?? ""),
  fileName: String(r.file_name ?? ""),
  patientName: String(r.patient_name ?? ""),
  doctorName: String(r.doctor_name ?? ""),
  notes: (r.notes as string | null) ?? undefined,
  status: (r.status as SharedPrescriptionStatus) ?? "Pending",
  uploadedAt: r.uploaded_at ? new Date(String(r.uploaded_at)).toLocaleString("en-ZW", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  }) : "",
  files: (r.files as SharedPrescription["files"]) ?? undefined,
  forSelf: (r.for_self as boolean | null) ?? undefined,
  relationship: (r.relationship as string | null) ?? undefined,
  scriptDate: (r.script_date as string | null) ?? undefined,
  isRepeat: (r.is_repeat as boolean | null) ?? undefined,
  repeatsLeft: (r.repeats_left as number | null) ?? undefined,
  delivery: (r.delivery as "delivery" | "collect" | null) ?? undefined,
  deliveryAddress: (r.delivery_address as SharedDeliveryAddress | null) ?? undefined,
  collectionBranchId: (r.collection_branch_id as string | null) ?? undefined,
  branchId: (r.branch_id as string | null) ?? undefined,
  branchName: (r.branch_name as string | null) ?? undefined,
  quotation: (r.quotation as SharedQuotation | null) ?? undefined,
  paymentRef: (r.payment_ref as string | null) ?? undefined,
  paymentMethod: (r.payment_method as string | null) ?? undefined,
  paidAt: r.paid_at ? new Date(String(r.paid_at)).toLocaleString("en-ZW") : undefined,
  pharmacistNotes: (r.pharmacist_notes as string | null) ?? undefined,
  approvedAt: r.approved_at ? new Date(String(r.approved_at)).toLocaleString("en-ZW") : undefined,
  rejectionReason: (r.rejection_reason as string | null) ?? undefined,
  driverName: (r.driver_name as string | null) ?? undefined,
  driverPhone: (r.driver_phone as string | null) ?? undefined,
  driverVehicle: (r.driver_vehicle as string | null) ?? undefined,
  dispatchedAt: r.dispatched_at ? new Date(String(r.dispatched_at)).toLocaleString("en-ZW") : undefined,
});

function isUuid(v: string | undefined | null): v is string {
  return !!v && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

export async function refreshPrescriptions() {
  const { data, error } = await supabase
    .from("prescriptions")
    .select("*")
    .order("uploaded_at", { ascending: false });
  if (error) {
    console.error("[rx] refresh failed", error);
    return;
  }
  useSharedPrescriptions.setState({
    prescriptions: ((data ?? []) as RxRow[]).map(rowToRx),
  });
}

if (typeof window !== "undefined") {
  window.addEventListener("focus", () => void refreshPrescriptions());
  setInterval(() => void refreshPrescriptions(), 15_000);

  (async () => {
    const { data, error } = await supabase
      .from("prescriptions")
      .select("*")
      .order("uploaded_at", { ascending: false });
    if (error) {
      console.error("[sharedPrescriptions] bootstrap failed", error);
      return;
    }
    useSharedPrescriptions.setState({
      prescriptions: ((data ?? []) as RxRow[]).map(rowToRx),
    });
  })();

  supabase
    .channel("prescriptions_changes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "prescriptions" },
      (payload) => {
        const evt = payload.eventType;
        if (evt === "INSERT" || evt === "UPDATE") {
          const rx = rowToRx(payload.new as RxRow);
          useSharedPrescriptions.setState((s) => {
            const exists = s.prescriptions.some((p) => p.id === rx.id);
            return {
              prescriptions: exists
                ? s.prescriptions.map((p) => (p.id === rx.id ? rx : p))
                : [rx, ...s.prescriptions],
            };
          });
        } else if (evt === "DELETE") {
          const id = (payload.old as { id: string }).id;
          useSharedPrescriptions.setState((s) => ({
            prescriptions: s.prescriptions.filter((p) => p.id !== id),
          }));
        }
      },
    )
    .subscribe();

  try { localStorage.removeItem("kings-shared-prescriptions"); } catch { /* noop */ }
}
