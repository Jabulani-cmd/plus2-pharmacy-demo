import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useStaffAuth } from "@/store/staffAuth";
import {
  useSharedPrescriptions,
  refreshPrescriptions,
  type SharedPrescription,
  type SharedPrescriptionStatus,
  type SharedQuotation,
} from "@/store/sharedPrescriptions";
import { STAFF_DRIVERS, type StaffDriver } from "@/data/staffDemo";
import { PageHeader } from "./shared";
import {
  FileText, User, Phone, MapPin, Clock, Printer,
  CheckCircle2, DollarSign, Truck, Store, X, Image as ImageIcon,
} from "lucide-react";

const BRAND = "#1B3A6B";
const BRAND_LIGHT = "#1E5BC6";

type ColDef = {
  key: SharedPrescriptionStatus;
  label: string;
  color: string;
};

const COLUMNS: ColDef[] = [
  { key: "Pending", label: "NEW", color: "#0EA5E9" },
  { key: "Printing", label: "PRINTING", color: "#F59E0B" },
  { key: "Ready to Quote", label: "READY TO QUOTE", color: "#8B5CF6" },
  { key: "Approved — Awaiting Payment", label: "QUOTED", color: "#F97316" },
  { key: "Paid", label: "PAID", color: "#10B981" },
  { key: "Out for Delivery", label: "OUT FOR DELIVERY", color: "#7C3AED" },
  { key: "Delivered", label: "DELIVERED", color: "#059669" },
];

export function DispatcherRxQueue() {
  const prescriptions = useSharedPrescriptions((s) => s.prescriptions);
  const updateStatus = useSharedPrescriptions((s) => s.updateStatus);
  const assignDriver = useSharedPrescriptions((s) => s.assignDriver);

  useEffect(() => {
    void refreshPrescriptions();
  }, []);

  const grouped = useMemo(() => {
    const g: Record<string, SharedPrescription[]> = {};
    COLUMNS.forEach((c) => (g[c.key] = []));
    prescriptions.forEach((p) => {
      if (g[p.status]) g[p.status].push(p);
    });
    return g;
  }, [prescriptions]);

  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);
  const [assignFor, setAssignFor] = useState<SharedPrescription | null>(null);

  const totalActive = COLUMNS.filter((c) => c.key !== "Delivered")
    .reduce((a, c) => a + grouped[c.key].length, 0);

  return (
    <div>
      <PageHeader
        title="Prescription Dispatch Queue"
        subtitle="Print scripts, hand to pharmacist, enter quotation, and dispatch — all from here."
      />

      <div className="mb-4 flex items-center gap-2 text-xs font-semibold text-slate-600">
        <FileText className="h-4 w-4" style={{ color: BRAND_LIGHT }} />
        {totalActive} active prescription{totalActive === 1 ? "" : "s"}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {COLUMNS.map((col) => (
          <div key={col.key} className="flex flex-col rounded-xl border bg-white shadow-sm">
            <header className="flex items-center justify-between border-b px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: col.color }} />
                <h3 className="text-xs font-black uppercase tracking-wider" style={{ color: BRAND }}>
                  {col.label}
                </h3>
              </div>
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                style={{ background: col.color }}
              >
                {grouped[col.key].length}
              </span>
            </header>
            <div className="flex-1 space-y-3 p-3">
              {grouped[col.key].length === 0 && (
                <p className="py-6 text-center text-[11px] text-slate-400">
                  Nothing here
                </p>
              )}
              {grouped[col.key].map((rx) => (
                <RxCard
                  key={rx.id}
                  rx={rx}
                  onEnlargeImage={setEnlargedImage}
                  onAssignDriver={() => setAssignFor(rx)}
                  onUpdateStatus={updateStatus}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {enlargedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setEnlargedImage(null)}
        >
          <button
            onClick={() => setEnlargedImage(null)}
            className="absolute right-4 top-4 rounded-full bg-white p-2 shadow"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={enlargedImage}
            alt="Prescription"
            className="max-h-[90vh] max-w-full rounded-lg bg-white object-contain"
          />
        </div>
      )}

      {assignFor && (
        <AssignDriverModal
          rx={assignFor}
          onClose={() => setAssignFor(null)}
          onAssign={(driver) => {
            assignDriver(assignFor.id, driver.name, driver.phone, driver.vehicle);
            toast.success("Driver assigned", {
              description: driver.name + " → " + assignFor.patientName,
            });
            setAssignFor(null);
          }}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Card
// ─────────────────────────────────────────────────────────
function RxCard({
  rx,
  onEnlargeImage,
  onAssignDriver,
  onUpdateStatus,
}: {
  rx: SharedPrescription;
  onEnlargeImage: (url: string) => void;
  onAssignDriver: () => void;
  onUpdateStatus: (
    id: string,
    status: SharedPrescriptionStatus,
    extra?: Partial<SharedPrescription>,
  ) => void;
}) {
  const imageUrl = rx.files?.[0]?.dataUrl ?? null;

  return (
    <article className="rounded-lg border bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-mono text-[11px] font-black" style={{ color: BRAND }}>
            #{rx.id}
          </div>
          <div className="mt-0.5 flex items-center gap-1 text-xs font-bold text-slate-800">
            <User className="h-3 w-3 text-slate-400" />
            {rx.patientName}
          </div>
          {rx.customerName && rx.customerName !== rx.patientName && (
            <div className="text-[10px] text-slate-500">for {rx.customerName}</div>
          )}
        </div>
        {rx.quotation && (
          <div className="text-right">
            <div className="text-sm font-black" style={{ color: BRAND_LIGHT }}>
              ${rx.quotation.total.toFixed(2)}
            </div>
          </div>
        )}
      </div>

      {rx.customerPhone && (
        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-600">
          <Phone className="h-3 w-3" />
          <a href={"tel:" + rx.customerPhone} className="hover:underline">
            {rx.customerPhone}
          </a>
        </div>
      )}

      <div className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-500">
        <Clock className="h-3 w-3" />
        {rx.uploadedAt}
      </div>

      {imageUrl && (
        <button
          type="button"
          onClick={() => onEnlargeImage(imageUrl)}
          className="mt-2 block w-full overflow-hidden rounded border"
        >
          <img
            src={imageUrl}
            alt="Prescription"
            className="h-24 w-full object-cover transition hover:opacity-90"
          />
        </button>
      )}
      {!imageUrl && rx.fileName && (
        <div className="mt-2 flex items-center gap-1 rounded border border-dashed border-slate-200 bg-slate-50 px-2 py-1.5 text-[10px] text-slate-500">
          <ImageIcon className="h-3 w-3" />
          {rx.fileName}
        </div>
      )}

      {rx.notes && (
        <div className="mt-2 rounded border border-amber-100 bg-amber-50 p-1.5 text-[10px] text-amber-800">
          <span className="font-bold">Notes: </span>
          {rx.notes}
        </div>
      )}

      <div className="mt-2 space-y-1 text-[10px] text-slate-500">
        {rx.branchName && (
          <div className="flex items-center gap-1">
            <Store className="h-3 w-3" />
            {rx.branchName}
          </div>
        )}
        {rx.delivery === "collect" ? (
          <div className="flex items-center gap-1">
            <Store className="h-3 w-3" />
            Collection from branch
          </div>
        ) : rx.deliveryAddress ? (
          <div className="flex items-start gap-1">
            <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
            <span>
              {rx.deliveryAddress.streetAddress}, {rx.deliveryAddress.suburb},{" "}
              {rx.deliveryAddress.city}
            </span>
          </div>
        ) : null}
      </div>

      <div className="mt-3">
        <ActionButtons rx={rx} onAssignDriver={onAssignDriver} onUpdateStatus={onUpdateStatus} />
      </div>
    </article>
  );
}

// ─────────────────────────────────────────────────────────
// Action buttons per status
// ─────────────────────────────────────────────────────────
function ActionButtons({
  rx,
  onAssignDriver,
  onUpdateStatus,
}: {
  rx: SharedPrescription;
  onAssignDriver: () => void;
  onUpdateStatus: (
    id: string,
    status: SharedPrescriptionStatus,
    extra?: Partial<SharedPrescription>,
  ) => void;
}) {
  const status = rx.status;

  if (status === "Pending" || status === "Under Review") {
    return (
      <div className="space-y-2">
        <button
          onClick={() => printPrescription(rx)}
          className="flex w-full items-center justify-center gap-1.5 rounded-full py-2 text-[11px] font-black text-white transition"
          style={{ background: BRAND_LIGHT }}
        >
          <Printer className="h-3.5 w-3.5" />
          Print & Give to Pharmacist
        </button>
        <button
          onClick={() => {
            onUpdateStatus(rx.id, "Printing");
            void supabase
              .from("prescriptions")
              .update({ status: "Printing", printed_at: new Date().toISOString() })
              .eq("id", rx.id)
              .then(({ error }) => {
                if (error) console.error("[RxQueue] set Printing failed:", error);
              });
            toast.success("Sent to pharmacist");
          }}
          className="w-full rounded-full border-2 py-2 text-[11px] font-bold transition"
          style={{ borderColor: BRAND_LIGHT, color: BRAND_LIGHT }}
        >
          ✓ Mark as Sent to Pharmacist
        </button>
      </div>
    );
  }

  if (status === "Printing") {
    return (
      <button
        onClick={() => {
          onUpdateStatus(rx.id, "Ready to Quote");
          void supabase
            .from("prescriptions")
            .update({ status: "Ready to Quote", ready_at: new Date().toISOString() })
            .eq("id", rx.id)
            .then(({ error }) => {
              if (error) console.error("[RxQueue] set Ready to Quote failed:", error);
            });
          toast.success("Ready to quote");
        }}
        className="flex w-full items-center justify-center gap-1.5 rounded-full bg-green-600 py-2 text-[11px] font-black text-white hover:bg-green-700"
      >
        <CheckCircle2 className="h-3.5 w-3.5" />
        Medication Ready — Enter Quotation
      </button>
    );
  }

  if (status === "Ready to Quote") {
    return <QuotationForm rx={rx} />;
  }

  if (status === "Approved — Awaiting Payment") {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-2 text-[11px]">
        <div className="font-bold text-amber-800">⏳ Awaiting customer payment</div>
        {rx.quotation && (
          <div className="mt-0.5 text-[10px] text-amber-600">
            Quotation sent: ${rx.quotation.total.toFixed(2)}
          </div>
        )}
      </div>
    );
  }

  if (status === "Paid" || status === "Dispensing") {
    return (
      <div className="space-y-2">
        <div className="rounded-lg border border-green-200 bg-green-50 p-2 text-[11px]">
          <div className="font-bold text-green-700">
            ✅ Paid ${rx.quotation?.total?.toFixed(2) ?? ""}
          </div>
          {rx.paymentMethod && (
            <div className="text-[10px] text-green-600">via {rx.paymentMethod}</div>
          )}
        </div>
        {!rx.driverName ? (
          <button
            onClick={onAssignDriver}
            className="flex w-full items-center justify-center gap-1.5 rounded-full py-2 text-[11px] font-black text-white transition"
            style={{ background: BRAND_LIGHT }}
          >
            <Truck className="h-3.5 w-3.5" />
            Assign Driver & Dispatch
          </button>
        ) : (
          <div className="rounded border bg-violet-50 p-2 text-[10px] text-violet-800">
            <div className="font-bold">{rx.driverName}</div>
            <div>{rx.driverVehicle}</div>
          </div>
        )}
      </div>
    );
  }

  if (status === "Assigned" || status === "Out for Delivery") {
    return (
      <div className="space-y-2">
        {rx.driverName && (
          <div className="rounded border bg-violet-50 p-2 text-[10px] text-violet-800">
            <div className="font-bold">{rx.driverName}</div>
            <div>{rx.driverVehicle}</div>
          </div>
        )}
        <button
          onClick={() => {
            onUpdateStatus(rx.id, "Delivered");
            toast.success("Marked delivered");
          }}
          className="w-full rounded-full bg-emerald-600 py-2 text-[11px] font-black text-white hover:bg-emerald-700"
        >
          Mark Delivered
        </button>
      </div>
    );
  }

  if (status === "Delivered") {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-[11px] font-bold text-emerald-700">
        ✅ Delivered
      </div>
    );
  }

  if (status === "Rejected") {
    return (
      <div className="rounded-lg border border-rose-200 bg-rose-50 p-2 text-[11px] font-bold text-rose-700">
        Cancelled
        {rx.rejectionReason && (
          <div className="mt-0.5 text-[10px] font-normal">{rx.rejectionReason}</div>
        )}
      </div>
    );
  }

  return null;
}

// ─────────────────────────────────────────────────────────
// Quotation form (inline)
// ─────────────────────────────────────────────────────────
function QuotationForm({ rx }: { rx: SharedPrescription }) {
  const staff = useStaffAuth((s) => s.staff);
  const [medicationName, setMedicationName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [medicationCost, setMedicationCost] = useState("");
  const [deliveryFee, setDeliveryFee] = useState(
    rx.delivery === "collect" ? "0" : "2.50",
  );
  const [notes, setNotes] = useState("");
  const [sending, setSending] = useState(false);

  const total =
    (Number(medicationCost) || 0) + (Number(deliveryFee) || 0);
  const canSend =
    medicationName.trim() && medicationCost && !sending;

  const send = async () => {
    if (!canSend) return;
    setSending(true);

    const quotation: SharedQuotation = {
      medicationName: medicationName.trim(),
      dosage: "",
      quantity: quantity.trim() || "—",
      medicationCost: Number(medicationCost),
      deliveryFee: Number(deliveryFee) || 0,
      total,
      pharmacistName: staff?.name ?? "Dispatcher",
      approvedAt: new Date().toLocaleString("en-ZW", {
        day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
      }),
      notes: notes.trim() || undefined,
    };

    try {
      // Step 1: Write to Supabase and AWAIT the result before showing success.
      const { error: dbError } = await supabase
        .from("prescriptions")
        .update({
          status: "Approved — Awaiting Payment",
          quotation: quotation as unknown as never,
          pharmacist_notes: notes.trim() || null,
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", rx.id);

      if (dbError) {
        console.error("[QuotationForm] DB update failed:", dbError);
        toast.error("Failed to save quotation: " + dbError.message);
        return;
      }

      // Step 2: Update local store so the dispatcher UI moves the card immediately.
      useSharedPrescriptions.setState((s) => ({
        prescriptions: s.prescriptions.map((p) =>
          p.id === rx.id
            ? {
                ...p,
                status: "Approved — Awaiting Payment" as SharedPrescriptionStatus,
                quotation,
                pharmacistNotes: notes.trim() || undefined,
              }
            : p
        ),
      }));

      // Step 3: Customer notification (uses this project's actual notifications schema:
      // audience/body/tone are required columns, user_id is uuid FK — insert only when
      // we have a real uuid customerId; otherwise skip silently rather than 500).
      const isUuid = (v: string | undefined | null): v is string =>
        !!v && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
      if (isUuid(rx.customerId)) {
        const { error: notifError } = await supabase
          .from("notifications")
          .insert({
            audience: "customer",
            user_id: rx.customerId,
            title: "Quotation Ready — Pay Now",
            message:
              "Your prescription #" + rx.id +
              " has been approved. " + quotation.medicationName +
              " — Total: $" + total.toFixed(2) + ". Tap to pay now.",
            link: "/account",
            kind: "success",
            read: false,
          } as never);
        if (notifError) {
          console.error("[QuotationForm] Customer notification failed:", notifError);
        }
      }

      // Step 4: Staff confirmation.
      await supabase.from("staff_notifications").insert({
        order_id: rx.id,
        title: "✅ Quotation Sent",
        body:
          "Quotation $" + total.toFixed(2) +
          " sent to " + (rx.customerName ?? "customer") +
          " for prescription #" + rx.id,
        kind: "prescription_approved",
      } as never);

      // Step 5: Show success ONLY after the DB write is confirmed.
      toast.success("Quotation sent to customer!", {
        description: "Customer will be notified to pay $" + total.toFixed(2),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.error("[QuotationForm] Unexpected error:", err);
      toast.error("Something went wrong: " + msg);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-2.5">
      <div className="text-[11px] font-black" style={{ color: BRAND }}>
        Enter Quotation
      </div>

      <div>
        <label className="text-[10px] font-bold text-slate-600">Medication name</label>
        <input
          value={medicationName}
          onChange={(e) => setMedicationName(e.target.value)}
          placeholder="e.g. Amoxicillin 500mg"
          className="mt-0.5 w-full rounded border px-2 py-1.5 text-[11px]"
        />
      </div>
      <div>
        <label className="text-[10px] font-bold text-slate-600">Quantity</label>
        <input
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="e.g. 21 tablets"
          className="mt-0.5 w-full rounded border px-2 py-1.5 text-[11px]"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] font-bold text-slate-600">Medication ($)</label>
          <input
            type="number"
            step="0.01"
            value={medicationCost}
            onChange={(e) => setMedicationCost(e.target.value)}
            placeholder="0.00"
            className="mt-0.5 w-full rounded border px-2 py-1.5 text-[11px]"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-600">Delivery ($)</label>
          <input
            type="number"
            step="0.01"
            value={deliveryFee}
            onChange={(e) => setDeliveryFee(e.target.value)}
            disabled={rx.delivery === "collect"}
            className="mt-0.5 w-full rounded border px-2 py-1.5 text-[11px] disabled:bg-slate-100"
          />
        </div>
      </div>

      <div>
        <label className="text-[10px] font-bold text-slate-600">Notes (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Instructions for the customer"
          className="mt-0.5 w-full rounded border px-2 py-1.5 text-[11px]"
        />
      </div>

      {medicationCost && (
        <div className="flex items-center justify-between rounded border bg-white px-2 py-1.5">
          <span className="text-[10px] font-bold text-slate-500">Total Due</span>
          <span className="text-sm font-black" style={{ color: BRAND_LIGHT }}>
            ${total.toFixed(2)}
          </span>
        </div>
      )}

      <button
        onClick={send}
        disabled={!canSend}
        className="flex w-full items-center justify-center gap-1.5 rounded-full py-2 text-[11px] font-black text-white transition disabled:opacity-40"
        style={{ background: BRAND }}
      >
        <DollarSign className="h-3.5 w-3.5" />
        {sending ? "Sending…" : "Send Quotation to Customer"}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Assign driver modal
// ─────────────────────────────────────────────────────────
function AssignDriverModal({
  rx,
  onClose,
  onAssign,
}: {
  rx: SharedPrescription;
  onClose: () => void;
  onAssign: (driver: StaffDriver) => void;
}) {
  const available = STAFF_DRIVERS.filter((d) => d.status === "Available");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black" style={{ color: BRAND }}>
            Assign driver
          </h3>
          <button onClick={onClose} aria-label="Close"><X className="h-4 w-4" /></button>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          #{rx.id} · {rx.patientName}
        </p>
        <div className="mt-4 space-y-2">
          {available.length === 0 && (
            <p className="rounded bg-slate-50 p-3 text-center text-xs text-slate-500">
              No drivers available right now.
            </p>
          )}
          {available.map((d) => (
            <button
              key={d.id}
              onClick={() => onAssign(d)}
              className="flex w-full items-center justify-between rounded-lg border p-3 text-left transition hover:border-[color:var(--brand)]"
              style={{ ["--brand" as string]: BRAND_LIGHT }}
            >
              <div>
                <div className="text-sm font-bold text-slate-800">{d.name}</div>
                <div className="text-[11px] text-slate-500">{d.vehicle}</div>
              </div>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                Available
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Print prescription (A4)
// ─────────────────────────────────────────────────────────
export function printPrescription(rx: SharedPrescription) {
  const win = window.open("", "_blank", "width=800,height=1000");
  if (!win) {
    toast.error("Please allow pop-ups to print prescriptions");
    return;
  }
  const imageUrl = rx.files?.[0]?.dataUrl ?? null;
  const addressLine =
    rx.delivery === "collect"
      ? "Collection from " + (rx.branchName ?? "branch")
      : rx.deliveryAddress
      ? `${rx.deliveryAddress.streetAddress}, ${rx.deliveryAddress.suburb}, ${rx.deliveryAddress.city}`
      : "—";

  const html = `<!DOCTYPE html>
<html><head><title>Prescription ${rx.id}</title>
<style>
  body { font-family: Arial, sans-serif; padding: 32px; color: #1B3A6B; max-width: 700px; margin: 0 auto; }
  .logo { font-size: 24px; font-weight: 900; }
  .sub { color: #666; font-size: 12px; margin-bottom: 16px; }
  .divider { border-top: 2px solid #1E5BC6; margin: 14px 0; }
  .section { font-weight: bold; font-size: 13px; color: #1B3A6B; margin: 16px 0 8px; text-transform: uppercase; letter-spacing: 0.5px; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 4px 0; font-size: 13px; vertical-align: top; }
  td:first-child { font-weight: bold; width: 40%; color: #444; }
  img { width: 100%; max-height: 340px; object-fit: contain; border: 1px solid #ddd; border-radius: 8px; margin: 12px 0; background: #fafafa; }
  .sign-line { border-bottom: 1px solid #999; height: 28px; margin-bottom: 6px; }
  .footer { text-align: center; color: #999; font-size: 11px; margin-top: 24px; }
  .print-btn { display: block; margin: 20px auto 0; padding: 10px 24px; background: #1E5BC6; color: white; border: none; border-radius: 999px; font-weight: bold; cursor: pointer; }
  @media print { .print-btn { display: none; } body { padding: 20px; } }
</style></head><body>
  <div class="logo">KINGS PHARMACY</div>
  <div class="sub">At Your Service · Bulawayo, Zimbabwe</div>
  <div class="divider"></div>
  <div class="section">Prescription for Dispensing</div>
  <div class="sub">Ref: ${escapeHtml(rx.id)} · Printed: ${new Date().toLocaleString()}</div>

  <table>
    <tr><td>Patient Name:</td><td>${escapeHtml(rx.patientName)}</td></tr>
    <tr><td>Customer:</td><td>${escapeHtml(rx.customerName)}</td></tr>
    <tr><td>Phone:</td><td>${escapeHtml(rx.customerPhone ?? "—")}</td></tr>
    <tr><td>Doctor:</td><td>${escapeHtml(rx.doctorName ?? "—")}</td></tr>
    <tr><td>Branch:</td><td>${escapeHtml(rx.branchName ?? "—")}</td></tr>
    <tr><td>Submitted:</td><td>${escapeHtml(rx.uploadedAt)}</td></tr>
    <tr><td>Delivery:</td><td>${escapeHtml(addressLine)}</td></tr>
    ${rx.notes ? `<tr><td>Customer Notes:</td><td>${escapeHtml(rx.notes)}</td></tr>` : ""}
  </table>

  ${
    imageUrl
      ? `<div class="section">Prescription Image</div><img src="${imageUrl}" alt="Prescription" />`
      : `<div class="section">Prescription Image</div><p style="color:#999; text-align:center; padding: 20px; border:1px dashed #ddd; border-radius:8px;">No image attached</p>`
  }

  <div class="section">Pharmacist — Dispensing Record</div>
  <table>
    <tr><td>Medication dispensed:</td><td><div class="sign-line"></div></td></tr>
    <tr><td>Quantity:</td><td><div class="sign-line"></div></td></tr>
    <tr><td>Batch number:</td><td><div class="sign-line"></div></td></tr>
    <tr><td>Dispensed by:</td><td><div class="sign-line"></div></td></tr>
    <tr><td>Date dispensed:</td><td><div class="sign-line"></div></td></tr>
    <tr><td>Pharmacist signature:</td><td><div class="sign-line"></div></td></tr>
  </table>

  <div class="divider"></div>
  <div class="footer">Kings Pharmacy · Confidential · Ref: ${escapeHtml(rx.id)}</div>

  <button class="print-btn" onclick="window.print()">🖨️ Print Now</button>
</body></html>`;

  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => { try { win.print(); } catch { /* ignore */ } }, 500);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}