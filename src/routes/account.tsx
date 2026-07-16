import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useShop, formatUSD } from "@/store/shop";
import { useAuth, type Order, type PrescriptionStatus } from "@/store/auth";
import { useSharedPrescriptions } from "@/store/sharedPrescriptions";
import type { SharedPrescription, SharedPrescriptionStatus } from "@/store/sharedPrescriptions";
import { supabase } from "@/integrations/supabase/client";
import { useSharedOrders } from "@/store/sharedOrders";
import { useNotifications } from "@/store/notifications";
import PaymentModal from "@/components/checkout/PaymentModal";
import { getProduct } from "@/data/products";
import { ProductCard } from "@/components/product/ProductCard";
import {
  Package, Heart, MapPin, Settings, LayoutDashboard,
  FileText, Truck, LogOut, Phone, Syringe, Store,
  Receipt as ReceiptIcon, CheckCircle2, Bell, X,
  Car, Clock, Navigation, LogIn, Users, User,
} from "lucide-react";
import { ReceiptModal } from "@/components/receipt/ReceiptModal";
import { buildReceipt, type Receipt } from "@/lib/receipts";
import { ActiveOrderBanner } from "@/components/dashboard/ActiveOrderBanner";
import { LoyaltyCard } from "@/components/dashboard/LoyaltyCard";
import { RatingPrompt } from "@/components/tracking/RatingPrompt";
import { useOrderExtras } from "@/store/orderExtras";

export const Route = createFileRoute("/account")({
  head: () => ({ meta: [{ title: "My Account — Kings Pharmacy" }] }),
  component: AccountPage,
});

const RX_STAGES = [
  { key: "Pending", label: "Submitted" },
  { key: "Under Review", label: "Under Review" },
  { key: "Approved — Awaiting Payment", label: "Approved" },
  { key: "Paid", label: "Payment Confirmed" },
  { key: "Dispensing", label: "Being Prepared" },
  { key: "Out for Delivery", label: "Out for Delivery" },
  { key: "Delivered", label: "Delivered" },
];

function getRxStageIndex(status: string) {
  const idx = RX_STAGES.findIndex((s) => s.key === status);
  return idx === -1 ? 0 : idx;
}

function PrescriptionTracker({
  rx,
  onTrack,
}: {
  rx: {
    id: string;
    status: string;
    quotation?: { medicationName: string; total: number; medicationCost: number; deliveryFee: number } | null;
    driverName?: string;
    driverPhone?: string;
    driverVehicle?: string;
    dispatchedAt?: string;
    paidAt?: string;
    delivery?: string;
    deliveryAddress?: {
      firstName: string;
      lastName: string;
      streetAddress: string;
      suburb: string;
      city: string;
      phone: string;
    } | null;
    collectionBranchId?: string;
  };
  onTrack: (id: string) => void;
}) {
  const stageIdx = getRxStageIndex(rx.status);
  const isOutForDelivery = rx.status === "Out for Delivery";
  const isDelivered = rx.status === "Delivered";

  return (
    <div
      className="rounded-xl border p-4 shadow-sm"
      style={{
        borderColor: isDelivered ? "#0EA5E9" : isOutForDelivery ? "#7C3AED" : "#E5E7EB",
        background: isOutForDelivery ? "#F5F3FF" : "white",
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-foreground">{rx.id}</span>
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
              style={{ background: isDelivered ? "#0EA5E9" : isOutForDelivery ? "#7C3AED" : "#F59E0B" }}
            >
              {rx.status}
            </span>
          </div>
          {rx.quotation && (
            <p className="mt-0.5 text-sm font-semibold text-[#111827]">
              {rx.quotation.medicationName}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          {rx.quotation && (
            <div className="text-base font-black" style={{ color: "#0EA5E9" }}>
              ${rx.quotation.total.toFixed(2)}
            </div>
          )}
          <button
            onClick={() => onTrack(rx.id)}
            className="flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-bold text-white transition hover:opacity-90"
            style={{ background: isOutForDelivery ? "#7C3AED" : "#0EA5E9" }}
          >
            <Navigation className="h-3 w-3" />
            {isOutForDelivery ? "Track Live" : "Track Order"}
          </button>
        </div>
      </div>

      {/* Mobile: vertical timeline */}
      <div className="mt-4 sm:hidden">
        <div className="space-y-0">
          {RX_STAGES.map((stage, i) => {
            const done = i <= stageIdx;
            const active = i === stageIdx;
            const last = i === RX_STAGES.length - 1;
            return (
              <div key={stage.key} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                    style={{
                      background: done ? "#0EA5E9" : "#E5E7EB",
                      color: done ? "white" : "#9CA3AF",
                      boxShadow: active ? "0 0 0 3px #BBF7D0" : "none",
                    }}
                  >
                    {done && !active ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                  </div>
                  {!last && (
                    <div
                      className="my-1 w-0.5 flex-1 min-h-[16px]"
                      style={{ background: i < stageIdx ? "#0EA5E9" : "#E5E7EB" }}
                    />
                  )}
                </div>
                <div className="pb-3">
                  <span
                    className="text-xs font-semibold"
                    style={{ color: active ? "#0EA5E9" : done ? "#374151" : "#9CA3AF" }}
                  >
                    {stage.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Desktop: horizontal progress bar */}
      <div className="mt-4 hidden overflow-x-auto pb-1 sm:block">
        <div className="flex min-w-[480px] items-center">
          {RX_STAGES.map((stage, i) => {
            const done = i <= stageIdx;
            const active = i === stageIdx;
            return (
              <div key={stage.key} className="flex flex-1 items-center">
                <div className="flex flex-col items-center">
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                    style={{
                      background: done ? "#0EA5E9" : "#E5E7EB",
                      color: done ? "white" : "#9CA3AF",
                      boxShadow: active ? "0 0 0 3px #BBF7D0" : "none",
                    }}
                  >
                    {done && !active ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                  </div>
                  <span
                    className="mt-1 whitespace-nowrap text-[9px] font-semibold"
                    style={{ color: active ? "#0EA5E9" : done ? "#374151" : "#9CA3AF" }}
                  >
                    {stage.label}
                  </span>
                </div>
                {i < RX_STAGES.length - 1 && (
                  <div
                    className="mx-1 h-0.5 flex-1"
                    style={{ background: i < stageIdx ? "#0EA5E9" : "#E5E7EB" }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>


      {/* Driver info */}
      {(isOutForDelivery || isDelivered) && rx.driverName && (
        <div
          className="mt-4 rounded-lg p-3"
          style={{
            background: isDelivered ? "#F0F9F4" : "#EDE9FE",
            border: isDelivered ? "1px solid #BBF7D0" : "1px solid #DDD6FE",
          }}
        >
          <p
            className="mb-2 text-[10px] font-bold uppercase tracking-wide"
            style={{ color: isDelivered ? "#0EA5E9" : "#7C3AED" }}
          >
            {isDelivered ? "Delivered By" : "Your Driver — On the way"}
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <div className="flex items-center gap-2">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ background: isDelivered ? "#0EA5E9" : "#7C3AED" }}
              >
                {rx.driverName.split(" ").map((n: string) => n[0]).slice(0, 2).join("")}
              </div>
              <div>
                <p className="text-sm font-bold text-[#111827]">{rx.driverName}</p>
                <p className="text-[10px] text-muted-foreground">Driver</p>
              </div>
            </div>
            {rx.driverVehicle && (
              <div className="flex items-center gap-2">
                <Car className="h-4 w-4 shrink-0" style={{ color: isDelivered ? "#0EA5E9" : "#7C3AED" }} />
                <div>
                  <p className="text-sm font-semibold text-[#111827]">{rx.driverVehicle}</p>
                  <p className="text-[10px] text-muted-foreground">Vehicle</p>
                </div>
              </div>
            )}
            {rx.driverPhone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0" style={{ color: isDelivered ? "#0EA5E9" : "#7C3AED" }} />
                <div>
                  {/* ✅ Fixed: missing <a tag */}
                  <a
                    href={"tel:" + rx.driverPhone}
                    className="text-sm font-semibold"
                    style={{ color: isDelivered ? "#0EA5E9" : "#7C3AED" }}
                  >
                    {rx.driverPhone}
                  </a>
                  <p className="text-[10px] text-muted-foreground">Tap to call</p>
                </div>
              </div>
            )}
          </div>
          {rx.dispatchedAt && (
            <p className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
              <Clock className="h-3 w-3" />
              {isDelivered ? "Delivered" : "Dispatched"}: {rx.dispatchedAt}
            </p>
          )}
          {isOutForDelivery && (
            <button
              onClick={() => onTrack(rx.id)}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold text-white"
              style={{ background: "#7C3AED" }}
            >
              <Navigation className="h-4 w-4" />
              View Live Map &rarr;
            </button>
          )}
        </div>
      )}

      {/* Delivery address */}
      {rx.delivery === "delivery" && rx.deliveryAddress && (
        <div className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
          <span className="min-w-0 break-words">
            {rx.deliveryAddress.firstName} {rx.deliveryAddress.lastName} &middot;{" "}
            {rx.deliveryAddress.streetAddress}, {rx.deliveryAddress.suburb},{" "}
            {rx.deliveryAddress.city}
          </span>
        </div>
      )}
      {rx.delivery === "collect" && (
        <div className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
          <Store className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
          <span className="min-w-0 break-words">
            Collection:{" "}
            {rx.collectionBranchId
              ? rx.collectionBranchId.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())
              : "Your chosen branch"}
          </span>
        </div>
      )}

    </div>
  );
}

function AccountPage() {
  const user = useAuth((s) => s.user);
  const orders = useAuth((s) => s.orders);
  const prescriptions = useAuth((s) => s.prescriptions);
  const logout = useAuth((s) => s.logout);
  const navigate = useNavigate();
  const sharedPrescriptions = useSharedPrescriptions((s) => s.prescriptions);
  const markSharedPaid = useSharedPrescriptions((s) => s.markPaid);
  const allSharedOrders = useSharedOrders((s) => s.orders);
  const cancelSharedOrder = useSharedOrders((s) => s.cancelOrder);
  const allRatings = useOrderExtras((s) => s.ratings);
  const wishlist = useShop((s) => s.wishlist).map(getProduct).filter(Boolean);
  const [tab, setTab] = useState("dash");
  const [activeReceipt, setActiveReceipt] = useState(null as Receipt | null);
  const [payingRx, setPayingRx] = useState(null as (typeof sharedPrescriptions)[0] | null);
  const [cancellingRx, setCancellingRx] = useState(null as SharedPrescription | null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancellingOrder, setCancellingOrder] = useState(
    null as (typeof allSharedOrders)[number] | null,
  );
  const [cancelOrderReason, setCancelOrderReason] = useState("");
  const [cancellingOrderBusy, setCancellingOrderBusy] = useState(false);

  // Sync the auth-store prescriptions with the pharmacist's quotation from
  // Supabase, and toast when a fresh "Approved — Awaiting Payment" arrives.
  useEffect(() => {
    if (!user?.id) return;

    type QuotationRow = {
      medicationName?: string;
      medication_name?: string;
      dosage?: string;
      quantity?: string;
      medicationCost?: number | string;
      medication_cost?: number | string;
      deliveryFee?: number | string;
      delivery_fee?: number | string;
      total?: number | string;
      notes?: string;
      pharmacistName?: string;
      pharmacist_name?: string;
      approvedAt?: string;
      approved_at?: string;
    };

    type RxRow = {
      id: string;
      status: string;
      quotation: QuotationRow | null;
      pharmacist_notes?: string | null;
      paid_at?: string | null;
      payment_method?: string | null;
    };

    type LocalQuotation = NonNullable<
      ReturnType<typeof useAuth.getState>["prescriptions"][number]["quotation"]
    >;
    const mapQuotation = (
      q: QuotationRow | null | undefined,
      prev: LocalQuotation | undefined,
    ): LocalQuotation | undefined => {
      if (!q) return prev;
      return {
        medicationName: q.medicationName ?? q.medication_name ?? prev?.medicationName ?? "Medication",
        dosage: q.dosage ?? prev?.dosage ?? "",
        quantity: q.quantity ?? prev?.quantity ?? "",
        medicationCost: Number(q.medicationCost ?? q.medication_cost ?? prev?.medicationCost ?? 0),
        deliveryFee: Number(q.deliveryFee ?? q.delivery_fee ?? prev?.deliveryFee ?? 0),
        total: Number(q.total ?? prev?.total ?? 0),
        notes: q.notes ?? prev?.notes,
        pharmacistName: q.pharmacistName ?? q.pharmacist_name ?? prev?.pharmacistName ?? "Pharmacist",
        approvedAt: q.approvedAt ?? q.approved_at ?? prev?.approvedAt ?? "",
      };
    };

    const mergeRow = (fresh: RxRow) => {
      useAuth.setState((s) => ({
        prescriptions: s.prescriptions.map((p) =>
          p.id !== fresh.id
            ? p
            : {
                ...p,
                status: fresh.status as PrescriptionStatus,
                quotation: mapQuotation(fresh.quotation, p.quotation as LocalQuotation | undefined),
                paidAt: fresh.paid_at ?? p.paidAt,
                paymentMethod: fresh.payment_method ?? p.paymentMethod,
              },
        ),
      }));
    };

    // Initial fetch — sync any pharmacist quotation into the auth store.
    void supabase
      .from("prescriptions")
      .select("*")
      .eq("customer_id", user.id)
      .order("uploaded_at", { ascending: false })
      .then(({ data, error }) => {
        if (error || !data) return;
        (data as unknown as RxRow[]).forEach(mergeRow);
      });

    // Realtime — fires when the pharmacist approves / dispatcher updates.
    // Track already-toasted prescription ids so repeated UPDATE events on the
    // same "Approved — Awaiting Payment" row don't spam another toast.
    const toastedAwaitingPayment = new Set<string>();
    const ch = supabase
      .channel("customer_rx_sync_" + user.id)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "prescriptions",
          filter: "customer_id=eq." + user.id,
        },
        (payload) => {
          const fresh = payload.new as unknown as RxRow;
          mergeRow(fresh);
          if (
            fresh.status === "Approved — Awaiting Payment" &&
            !toastedAwaitingPayment.has(fresh.id)
          ) {
            toastedAwaitingPayment.add(fresh.id);
            toast.success("Quotation ready from your pharmacist", {
              description: "Check your prescriptions to pay.",
              duration: 5000,
            });
          } else if (fresh.status !== "Approved — Awaiting Payment") {
            toastedAwaitingPayment.delete(fresh.id);
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(ch);
    };
  }, [user?.id]);

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-8 md:py-12">
        <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-sm sm:p-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <User className="h-8 w-8" />
          </div>
          <h1 className="text-xl font-black text-[#111827] sm:text-2xl">Sign in to your account</h1>
          <p className="mt-2 text-sm text-[#6B7280]">
            Track orders, manage prescriptions, view loyalty points and shop faster across all Kings Pharmacy branches.
          </p>
          <div className="mt-6 grid gap-3">
            <Link
              to="/auth"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:opacity-90"
            >
              <LogIn className="h-4 w-4" /> Sign In
            </Link>
            <Link
              to="/auth"
              search={{ mode: "register" }}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-primary bg-white px-4 py-3 text-sm font-bold text-primary transition hover:bg-primary/5"
            >
              <Users className="h-4 w-4" /> Create Account
            </Link>
          </div>
          <div className="mt-6 space-y-2 rounded-xl bg-[#F9FAFB] p-4 text-left text-xs text-[#6B7280]">
            <div className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-primary" /> Upload prescriptions and get pharmacist quotations</div>
            <div className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-primary" /> Re-order favourites and track deliveries live</div>
            <div className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-primary" /> Earn loyalty points on every purchase</div>
          </div>
        </div>
      </div>
    );
  }


  const mySharedOrders = allSharedOrders.filter(
    (o) => o.customerId === user.id || o.customerEmail === user.email
  );

  // Latest in-progress OTC order to surface in the dashboard banner.
  const activeSharedOrder = mySharedOrders.find((o) => o.status !== "Delivered");

  // Delivered OTC orders awaiting a rating.
  const unratedDelivered = mySharedOrders.filter(
    (o) => o.status === "Delivered" && !allRatings.some((r) => r.orderId === o.id)
  );

  const mySharedPrescriptions = sharedPrescriptions.filter(
    (p) => p.customerId === user.id || p.customerEmail === user.email
  );

  // Merge local (auth store) prescriptions with shared-store status as source of truth.
  // The shared store is updated by the pharmacist/dispatcher flow; the local auth list
  // can lag with a stale "Pending" status after upload. Always prefer the live shared
  // status when an entry exists in both, and surface any shared-only entries too.
  const mergedPrescriptions = (() => {
    const sharedById = new Map(mySharedPrescriptions.map((s) => [s.id, s] as const));
    type LocalRx = (typeof prescriptions)[number];
    const merged: LocalRx[] = prescriptions.map((p) => {
      const s = sharedById.get(p.id);
      if (!s) return p;
      sharedById.delete(p.id);
      return {
        ...p,
        status: s.status as unknown as typeof p.status,
        quotation: (s.quotation as unknown as typeof p.quotation) ?? p.quotation,
        uploadedAt: s.uploadedAt || p.uploadedAt,
      };
    });
    // Prepend shared-only entries (uploads not yet in local auth store).
    const extras: LocalRx[] = Array.from(sharedById.values()).map((s) => ({
      id: s.id,
      fileName: s.fileName,
      doctorName: s.doctorName,
      uploadedAt: s.uploadedAt,
      status: s.status as unknown as LocalRx["status"],
      patientName: s.patientName,
      notes: s.notes,
      quotation: s.quotation as unknown as LocalRx["quotation"],
    } as unknown as LocalRx));
    return [...extras, ...merged];
  })();

  const pendingPayment = mySharedPrescriptions.filter(
    (p) =>
      p.status === "Approved — Awaiting Payment" &&
      p.quotation
  );

  const activeRxOrders = mySharedPrescriptions.filter(
    (p) =>
      p.status === "Paid" ||
      p.status === "Dispensing" ||
      p.status === "Out for Delivery"
  );

  const deliveredRxOrders = mySharedPrescriptions.filter(
    (p) => p.status === "Delivered"
  );

  const handleTrackRx = (id: string) => {
    navigate({ to: "/track", search: { id } });
  };

  // Sweep stale "Quotation Ready — Pay Now" notifications for prescriptions
  // that are no longer awaiting payment (paid, dispensing, delivered, etc.).
  // This cleans up duplicate rows in the DB and stops them from re-appearing
  // in the bell after the customer has already paid.
  useEffect(() => {
    if (!user?.id) return;
    const paidOrLater = mySharedPrescriptions.filter(
      (p) =>
        p.status !== "Approved — Awaiting Payment" &&
        p.status !== "Pending" &&
        p.status !== "Under Review",
    );
    if (paidOrLater.length === 0) return;
    // Remove matching items from the local notification store.
    useNotifications.getState().removeWhere((n) =>
      n.audience === "customer" &&
      paidOrLater.some(
        (p) =>
          (n.title.toLowerCase().includes("quotation") ||
            n.title.toLowerCase().includes("pay")) &&
          n.body.includes(p.id),
      ),
    );
    // Remove matching rows from the DB so they don't rehydrate on next load.
    paidOrLater.forEach((p) => {
      void supabase
        .from("notifications")
        .delete()
        .eq("audience", "customer")
        .eq("user_id", user.id)
        .ilike("message", "%" + p.id + "%");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, mySharedPrescriptions.map((p) => p.id + ":" + p.status).join("|")]);

  const openReceiptFor = (orderId: string) => {
    const o = orders.find((x) => x.id === orderId);
    if (!o || !user) return;
    const r = buildReceipt({
      orderNumber: o.id,
      items: o.items.map((it, i) => ({
        name: it.name,
        sku: "SKU-" + (1000 + i),
        qty: it.qty,
        unitPrice: it.price,
        lineTotal: +(it.price * it.qty).toFixed(2),
      })),
      customer: {
        name: user.firstName + " " + user.lastName,
        email: user.email,
        phone: user.phone ?? "+263 78 200 0100",
        address: o.address,
      },
      paymentMethod: "USD Card",
      cardLast4: "4242",
      cardType: "Visa",
      deliveryMethod: "Standard Delivery",
      deliveryFee: 0,
    });
    setActiveReceipt(r);
  };

  const tabs = [
    { id: "dash", label: "Dashboard", icon: LayoutDashboard },
    { id: "orders", label: "Orders", icon: Package },
    { id: "scripts", label: "Prescriptions", icon: FileText },
    { id: "wishlist", label: "Wishlist", icon: Heart },
    { id: "address", label: "Addresses", icon: MapPin },
    { id: "settings", label: "Settings", icon: Settings },
  ] as const;

  const onLogout = () => {
    logout();
    toast.success("Signed out");
    navigate({ to: "/" });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* Payment notification banners */}
      {pendingPayment.length > 0 && (
        <div className="mb-6 space-y-3">
          {pendingPayment.map((rx) => (
            <div
              key={rx.id}
              className="relative rounded-xl p-4 shadow-sm"
              style={{
                background: "linear-gradient(135deg, #F0F9F4 0%, #DCFCE7 100%)",
                border: "2px solid #0EA5E9",
              }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full shadow-sm"
                  style={{ background: "#0EA5E9" }}
                >
                  <Bell className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white" style={{ background: "#0EA5E9" }}>
                      ACTION REQUIRED
                    </span>
                    <span className="text-[10px] text-[#6B7280]">Ref: {rx.id}</span>
                  </div>
                  <h3 className="mt-1 text-base font-bold text-[#111827]">
                    Your prescription has been approved
                  </h3>
                  <p className="mt-0.5 text-sm text-[#374151]">
                    <strong>{rx.quotation?.medicationName}</strong> approved by {rx.quotation?.pharmacistName}
                    {rx.quotation?.approvedAt ? " at " + rx.quotation.approvedAt : ""}
                  </p>
                  {rx.quotation?.notes && (
                    <p className="mt-1 text-xs text-[#6B7280] italic">
                      Pharmacist note: "{rx.quotation.notes}"
                    </p>
                  )}
                  {rx.quotation && (
                    <div
                      className="mt-3 inline-flex flex-wrap gap-4 rounded-lg px-4 py-2 text-sm"
                      style={{ background: "rgba(255,255,255,0.7)", border: "1px solid #BBF7D0" }}
                    >
                      <div className="text-center">
                        <div className="text-[10px] font-semibold uppercase tracking-wide text-[#6B7280]">Medication</div>
                        <div className="font-bold text-[#111827]">${rx.quotation.medicationCost.toFixed(2)}</div>
                      </div>
                      {rx.quotation.deliveryFee > 0 && (
                        <>
                          <div className="self-center text-[#D1D5DB]">+</div>
                          <div className="text-center">
                            <div className="text-[10px] font-semibold uppercase tracking-wide text-[#6B7280]">Delivery</div>
                            <div className="font-bold text-[#111827]">${rx.quotation.deliveryFee.toFixed(2)}</div>
                          </div>
                        </>
                      )}
                      <div className="self-center text-[#D1D5DB]">=</div>
                      <div className="text-center">
                        <div className="text-[10px] font-semibold uppercase tracking-wide text-[#6B7280]">Total Due</div>
                        <div className="text-lg font-black" style={{ color: "#0EA5E9" }}>${rx.quotation.total.toFixed(2)}</div>
                      </div>
                    </div>
                  )}
                  <p className="mt-2 text-xs text-[#6B7280]">
                    {rx.delivery === "collect" ? "Collection in-store — FREE" : "Home delivery included"}
                    {" · "}Pay via EcoCash, OneMoney, ZimSwitch or Bank Transfer
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-stretch gap-2 self-center">
                  <button
                    onClick={() => setPayingRx(rx)}
                    className="rounded-lg px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:opacity-90"
                    style={{ background: "#0EA5E9" }}
                  >
                    Pay Now
                  </button>
                  <button
                    onClick={() => { setCancellingRx(rx); setCancelReason(""); }}
                    className="rounded-lg border-2 border-red-300 px-4 py-2 text-xs font-bold text-red-500 transition hover:bg-red-50"
                  >
                    Cancel Order
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Active prescription tracking banners */}
      {activeRxOrders.length > 0 && (
        <div className="mb-6 space-y-3">
          {activeRxOrders.map((rx) => (
            <PrescriptionTracker key={rx.id} rx={rx} onTrack={handleTrackRx} />
          ))}
        </div>
      )}

      {/* Account header */}
      <div className="rounded-lg border border-[#E5E7EB] bg-[#F0F9F4] p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-primary">My Account</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#111827] md:text-3xl">
              Welcome back, {user.firstName}
            </h1>
            <p className="mt-1 text-sm text-[#374151]">
              {orders.length} order{orders.length !== 1 ? "s" : ""} &middot;{" "}
              {prescriptions.length} prescription{prescriptions.length !== 1 ? "s" : ""} on file
              {pendingPayment.length > 0 && (
                <span
                  className="ml-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                  style={{ background: "#DC2626" }}
                >
                  <Bell className="h-2.5 w-2.5" />
                  {pendingPayment.length} payment{pendingPayment.length !== 1 ? "s" : ""} pending
                </span>
              )}
              {activeRxOrders.length > 0 && (
                <span
                  className="ml-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                  style={{ background: "#7C3AED" }}
                >
                  <Truck className="h-2.5 w-2.5" />
                  {activeRxOrders.length} order{activeRxOrders.length !== 1 ? "s" : ""} in transit
                </span>
              )}
            </p>
          </div>
          <button
            onClick={onLogout}
            className="inline-flex items-center gap-2 rounded-md border border-[#E5E7EB] bg-white px-3 py-2 text-xs font-semibold text-[#374151] hover:bg-[#F9FAFB]"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[220px_1fr]">
        <aside className="overflow-x-auto rounded-xl border border-border bg-card p-2 lg:p-3">
          <nav className="flex gap-1 lg:flex-col">
            {tabs.map((t) => {
              const Icon = t.icon;
              const isPrescriptions = t.id === "scripts";
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={
                    "relative flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition " +
                    (tab === t.id ? "bg-primary text-primary-foreground" : "hover:bg-muted")
                  }
                >
                  <Icon className="h-4 w-4" /> {t.label}
                  {isPrescriptions && pendingPayment.length + activeRxOrders.length > 0 && (
                    <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white">
                      {pendingPayment.length + activeRxOrders.length}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        <div className="min-w-0">

          {tab === "dash" && (
            <div className="grid gap-4 sm:grid-cols-2">
              {activeSharedOrder && (
                <div className="sm:col-span-2">
                  <ActiveOrderBanner order={activeSharedOrder} />
                </div>
              )}
              {unratedDelivered.length > 0 && (
                <div className="sm:col-span-2">
                  <RatingPrompt orderId={unratedDelivered[0].id} />
                </div>
              )}
              <div className="sm:col-span-2">
                <LoyaltyCard />
              </div>
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="font-extrabold">Profile</h3>
                <div className="mt-3 space-y-1 text-sm">
                  <div>
                    <span className="text-muted-foreground">Name:</span>{" "}
                    <strong>{user.firstName} {user.lastName}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Email:</span>{" "}
                    <strong>{user.email}</strong>
                  </div>
                  {user.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      <strong>{user.phone}</strong>
                    </div>
                  )}
                </div>
                <Link
                  to="/prescriptions"
                  className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-bold uppercase text-primary-foreground hover:bg-primary-dark"
                >
                  <FileText className="h-3.5 w-3.5" /> Upload a new prescription
                </Link>
              </div>

              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="font-extrabold">Active delivery</h3>
                {(() => {
                  const activeRx = activeRxOrders[0];
                  const activeOtc = orders.find((o) => o.status !== "Delivered");
                  if (activeRx) {
                    return (
                      <div className="mt-3 text-sm">
                        <div className="font-bold">{activeRx.id}</div>
                        <div className="text-muted-foreground">{activeRx.quotation?.medicationName}</div>
                        <span
                          className="mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-bold text-white"
                          style={{ background: activeRx.status === "Out for Delivery" ? "#7C3AED" : "#F59E0B" }}
                        >
                          {activeRx.status}
                        </span>
                        {activeRx.driverName && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            Driver: {activeRx.driverName} &middot; {activeRx.driverVehicle}
                          </div>
                        )}
                        <button
                          onClick={() => handleTrackRx(activeRx.id)}
                          className="mt-3 flex items-center gap-1 text-sm font-bold text-primary hover:underline"
                        >
                          <Truck className="h-4 w-4" /> Track prescription &rarr;
                        </button>
                      </div>
                    );
                  }
                  if (!activeOtc)
                    return <p className="mt-3 text-sm text-muted-foreground">No active deliveries.</p>;
                  return (
                    <div className="mt-3 text-sm">
                      <div className="font-bold">{activeOtc.id}</div>
                      <div className="text-muted-foreground">{activeOtc.date} &middot; {formatUSD(activeOtc.total)}</div>
                      <span className="mt-2 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                        {activeOtc.status}
                      </span>
                      <Link
                        to="/track"
                        search={{ id: activeOtc.id }}
                        className="mt-3 flex items-center gap-1 text-sm font-bold text-primary hover:underline"
                      >
                        <Truck className="h-4 w-4" /> Track delivery &rarr;
                      </Link>
                    </div>
                  );
                })()}
              </div>

              <div className="rounded-xl border border-border bg-card p-5 sm:col-span-2">
                <h3 className="font-extrabold">Quick Links</h3>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <Link to="/prescriptions" className="flex items-center justify-center gap-2 rounded-md border border-[#E5E7EB] bg-white p-3 text-sm font-semibold text-[#374151] hover:border-primary hover:text-primary">
                    <FileText className="h-4 w-4" /> Upload Script
                  </Link>
                  <Link to="/track" className="flex items-center justify-center gap-2 rounded-md border border-[#E5E7EB] bg-white p-3 text-sm font-semibold text-[#374151] hover:border-primary hover:text-primary">
                    <Truck className="h-4 w-4" /> Track Order
                  </Link>
                  <Link to="/services" className="flex items-center justify-center gap-2 rounded-md border border-[#E5E7EB] bg-white p-3 text-sm font-semibold text-[#374151] hover:border-primary hover:text-primary">
                    <Syringe className="h-4 w-4" /> Vaccinations
                  </Link>
                  <Link to="/services" className="flex items-center justify-center gap-2 rounded-md border border-[#E5E7EB] bg-white p-3 text-sm font-semibold text-[#374151] hover:border-primary hover:text-primary">
                    <Store className="h-4 w-4" /> Find Store
                  </Link>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3 border-t border-border pt-4 text-center">
                  <Stat label="Orders" value={orders.length} />
                  <Stat label="Pending scripts" value={mySharedPrescriptions.filter((p) => p.status === "Pending").length} />
                  <Stat label="Wishlist" value={wishlist.length} />
                </div>
              </div>
            </div>
          )}

          {tab === "orders" && (
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              {mySharedOrders.length === 0 && orders.length === 0 && (
                <div className="px-6 py-12 text-center">
                  <Package className="mx-auto h-10 w-10 text-muted-foreground/40" />
                  <h3 className="mt-3 text-base font-bold">No orders yet</h3>
                  <p className="mt-1 text-sm text-muted-foreground">When you place your first order it'll show up here in real time.</p>
                  <Link to="/" className="mt-4 inline-block rounded-md bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground">Start Shopping</Link>
                </div>
              )}
              {mySharedOrders.length > 0 && (
                <div className="border-b border-border bg-[#F0F9F4] px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#0EA5E9]">
                  Your recent orders
                </div>
              )}
              {(mySharedOrders.length > 0 || orders.length > 0) && (
              <>
              {/* Mobile: card layout */}
              <ul className="divide-y divide-border sm:hidden">
                {mySharedOrders.map((o) => {
                  const isDelivered = o.status === "Delivered";
                  const canCancel =
                    o.status === "Confirmed" ||
                    o.status === "Ready to dispatch" ||
                    o.status === "Packed";
                  return (
                    <li key={o.id} className={`p-4 ${isDelivered ? "bg-[#F0F9F4]/40" : ""}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-bold text-foreground">{o.id}</div>
                          <div className="mt-0.5 text-xs text-muted-foreground">{o.placedAt}</div>
                        </div>
                        <div className="shrink-0 text-right text-sm font-bold">{formatUSD(o.total)}</div>
                      </div>
                      <div className="mt-2">
                        {isDelivered ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">
                            <CheckCircle2 className="h-3 w-3" />
                            Delivered{o.deliveredAt ? " · " + o.deliveredAt : ""}
                          </span>
                        ) : (
                          <span className="inline-block rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700">
                            {o.status}
                          </span>
                        )}
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Link
                          to="/receipt"
                          search={{ id: o.id }}
                          className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-bold text-foreground hover:border-primary hover:text-primary"
                        >
                          <ReceiptIcon className="h-3.5 w-3.5" /> Receipt
                        </Link>
                        {canCancel && (
                          <button
                            onClick={() => {
                              setCancellingOrder(o);
                              setCancelOrderReason("");
                            }}
                            className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs font-bold text-red-700 hover:bg-red-100"
                          >
                            <X className="h-3.5 w-3.5" /> Cancel
                          </button>
                        )}
                        <Link
                          to="/track"
                          search={{ id: o.id }}
                          className="ml-auto text-sm font-bold text-primary hover:underline"
                        >
                          Track &rarr;
                        </Link>
                      </div>
                    </li>
                  );
                })}
                {orders.map((o) => (
                  <li key={o.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-bold text-foreground">{o.id}</div>
                        <div className="mt-0.5 text-xs text-muted-foreground">{o.date}</div>
                      </div>
                      <div className="shrink-0 text-right text-sm font-bold">{formatUSD(o.total)}</div>
                    </div>
                    <div className="mt-2">
                      {o.status === "Delivered" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">
                          <CheckCircle2 className="h-3 w-3" /> Delivered
                        </span>
                      ) : (
                        <StatusPill status={o.status} />
                      )}
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => openReceiptFor(o.id)}
                        className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-bold text-foreground hover:border-primary hover:text-primary"
                      >
                        <ReceiptIcon className="h-3.5 w-3.5" /> Receipt
                      </button>
                      <Link to="/track" search={{ id: o.id }} className="ml-auto text-sm font-bold text-primary hover:underline">
                        Track &rarr;
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Desktop: table layout */}
              <table className="hidden w-full text-sm sm:table">
                <thead className="bg-surface text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Order</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {mySharedOrders.map((o) => {
                    const isDelivered = o.status === "Delivered";
                    // Customers can cancel while the order is still with the
                    // pharmacy — once a driver is assigned or on the way,
                    // cancellation goes through support instead.
                    const canCancel =
                      o.status === "Confirmed" ||
                      o.status === "Ready to dispatch" ||
                      o.status === "Packed";
                    return (
                      <tr key={o.id} className={isDelivered ? "bg-[#F0F9F4]/40" : ""}>
                        <td className="px-4 py-3 font-bold">{o.id}</td>
                        <td className="px-4 py-3 text-muted-foreground">{o.placedAt}</td>
                        <td className="px-4 py-3">
                          {isDelivered ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">
                              <CheckCircle2 className="h-3 w-3" />
                              Delivered{o.deliveredAt ? " · " + o.deliveredAt : ""}
                            </span>
                          ) : (
                            <span className="inline-block rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700">
                              {o.status}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-bold">{formatUSD(o.total)}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            <Link
                              to="/receipt"
                              search={{ id: o.id }}
                              className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-bold text-foreground hover:border-primary hover:text-primary"
                            >
                              <ReceiptIcon className="h-3.5 w-3.5" /> Receipt
                            </Link>
                            {canCancel && (
                              <button
                                onClick={() => {
                                  setCancellingOrder(o);
                                  setCancelOrderReason("");
                                }}
                                className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs font-bold text-red-700 hover:bg-red-100"
                              >
                                <X className="h-3.5 w-3.5" /> Cancel
                              </button>
                            )}
                            <Link
                              to="/track"
                              search={{ id: o.id }}
                              className="text-sm font-bold text-primary hover:underline"
                            >
                              Track &rarr;
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {/* Demo orders only — real users have an empty `orders` array */}
                  {orders.map((o) => (
                    <tr key={o.id}>
                      <td className="px-4 py-3 font-bold">{o.id}</td>
                      <td className="px-4 py-3 text-muted-foreground">{o.date}</td>
                      <td className="px-4 py-3">
                        {o.status === "Delivered" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">
                            <CheckCircle2 className="h-3 w-3" /> Delivered
                          </span>
                        ) : (
                          <StatusPill status={o.status} />
                        )}
                      </td>
                      <td className="px-4 py-3 font-bold">{formatUSD(o.total)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openReceiptFor(o.id)}
                            className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-bold text-foreground hover:border-primary hover:text-primary"
                          >
                            <ReceiptIcon className="h-3.5 w-3.5" /> Receipt
                          </button>
                          <Link to="/track" search={{ id: o.id }} className="text-sm font-bold text-primary hover:underline">
                            Track &rarr;
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </>
              )}
            </div>
          )}

          {tab === "scripts" && (
            <div className="space-y-4">
              {(activeRxOrders.length > 0 || deliveredRxOrders.length > 0) && (
                <div>
                  <h3 className="mb-3 font-extrabold text-foreground">Prescription Order Tracking</h3>
                  <div className="space-y-3">
                    {activeRxOrders.map((rx) => (
                      <PrescriptionTracker key={rx.id} rx={rx} onTrack={handleTrackRx} />
                    ))}
                    {deliveredRxOrders.map((rx) => (
                      <PrescriptionTracker key={rx.id} rx={rx} onTrack={handleTrackRx} />
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold">My Prescriptions</h3>
                  <Link
                    to="/prescriptions"
                    className="rounded-md bg-primary px-3 py-1.5 text-xs font-bold uppercase text-primary-foreground hover:bg-primary-dark"
                  >
                    + Upload
                  </Link>
                </div>

                {pendingPayment.length > 0 && (
                  <div className="mt-4 space-y-3">
                    {pendingPayment.map((rx) => (
                      <div
                        key={rx.id}
                        className="flex items-center gap-3 rounded-lg p-3"
                        style={{ background: "#F0F9F4", border: "1.5px solid #0EA5E9" }}
                      >
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-[#111827]">{rx.quotation?.medicationName}</p>
                          <p className="text-xs text-[#6B7280]">
                            Approved &middot; Total due:{" "}
                            <strong className="text-[#0EA5E9]">${rx.quotation?.total.toFixed(2)}</strong>
                          </p>
                        </div>
                        <button
                          onClick={() => setPayingRx(rx)}
                          className="shrink-0 rounded-md px-3 py-1.5 text-xs font-bold text-white"
                          style={{ background: "#0EA5E9" }}
                        >
                          Pay Now
                        </button>
                        <button
                          onClick={() => { setCancellingRx(rx); setCancelReason(""); }}
                          className="shrink-0 rounded-md border border-red-300 px-3 py-1.5 text-xs font-bold text-red-500 hover:bg-red-50"
                        >
                          Cancel
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <ul className="mt-4 divide-y divide-border">
                  {(mergedPrescriptions.length > 0 ? mergedPrescriptions : prescriptions).map((p) => (
                    <li key={p.id} className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold">{p.id} &middot; {p.fileName}</div>
                          <div className="text-xs text-muted-foreground">{p.doctorName} &middot; {p.uploadedAt}</div>
                        </div>
                        <span className={"shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold " + scriptStatusColor(p.status)}>
                          {p.status}
                        </span>
                      </div>
                      {p.status === "Rejected" && (
                        <div className="mt-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                          <div className="text-sm font-bold text-red-600">❌ Order Cancelled</div>
                          {("rejectionReason" in p && (p as { rejectionReason?: string }).rejectionReason) && (
                            <div className="mt-1 text-xs text-red-500">
                              {(p as { rejectionReason?: string }).rejectionReason}
                            </div>
                          )}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {tab === "wishlist" && (
            wishlist.length === 0
              ? <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">Nothing wishlisted yet.</div>
              : <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{wishlist.map((p) => <ProductCard key={p!.id} product={p!} />)}</div>
          )}

          {tab === "address" && (
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-extrabold">Default Address</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {user.firstName} {user.lastName}<br />
                18 Sam Nujoma Street, Avondale<br />
                Bulawayo, Zimbabwe
              </p>
              <button className="mt-4 rounded-md border border-border px-4 py-2 text-sm font-bold hover:bg-muted">Edit</button>
            </div>
          )}

          {tab === "settings" && (
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-extrabold">Account</h3>
              <div className="mt-3 grid gap-2 text-sm">
                <div><span className="text-muted-foreground">Email:</span> <strong>{user.email}</strong></div>
                {user.phone && (
                  <div><span className="text-muted-foreground">Mobile:</span> <strong>{user.phone}</strong></div>
                )}
              </div>
              <h3 className="mt-6 font-extrabold">Notifications</h3>
              <div className="mt-3 space-y-2 text-sm">
                <label className="flex items-center gap-2"><input type="checkbox" defaultChecked /> Order updates</label>
                <label className="flex items-center gap-2"><input type="checkbox" defaultChecked /> Promotions &amp; deals</label>
                <label className="flex items-center gap-2"><input type="checkbox" /> Health tips newsletter</label>
              </div>
              <button
                onClick={onLogout}
                className="mt-6 inline-flex items-center gap-2 rounded-md border border-destructive/40 px-4 py-2 text-sm font-bold text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>

      {payingRx && payingRx.quotation && (
        <PaymentModal
          isOpen={true}
          onClose={() => setPayingRx(null)}
          onSuccess={async (ref, method) => {
            try {
              await markSharedPaid(payingRx.id, ref, method);
              setPayingRx(null);
              toast.success("Payment confirmed — your medication will be dispatched shortly");
            } catch (err) {
              console.error("[account] markPaid failed", err);
              toast.error("Couldn't confirm payment. Please try again.");
            }
          }}
          amount={payingRx.quotation.total}
          orderId={payingRx.id}
          rxRef={payingRx.id}
          orderType="Prescription"
          itemSummary={
            payingRx.quotation.medicationName + " · " +
            payingRx.quotation.quantity + " · Approved by " +
            payingRx.quotation.pharmacistName
          }
        />
      )}

      {activeReceipt && (
        <ReceiptModal
          open={!!activeReceipt}
          receipt={activeReceipt}
          onClose={() => setActiveReceipt(null)}
        />
      )}

      {cancellingOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => {
            if (!cancellingOrderBusy) {
              setCancellingOrder(null);
              setCancelOrderReason("");
            }
          }}
        >
          <div
            className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-red-100 bg-red-50 px-5 py-4">
              <div className="text-base font-black text-red-700">Cancel Order?</div>
              <div className="mt-1 text-sm text-red-500">
                #{cancellingOrder.id} · {formatUSD(cancellingOrder.total)}
              </div>
            </div>
            <div className="space-y-4 p-5">
              <div className="text-sm leading-relaxed text-slate-600">
                Are you sure you want to cancel this order? The pharmacy team
                will be notified and this order will be removed from your list.
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Reason for cancelling (optional)
                </label>
                <textarea
                  value={cancelOrderReason}
                  onChange={(e) => setCancelOrderReason(e.target.value)}
                  placeholder="e.g. Ordered by mistake, changed my mind..."
                  rows={3}
                  className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-red-300"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => {
                    if (!cancellingOrderBusy) {
                      setCancellingOrder(null);
                      setCancelOrderReason("");
                    }
                  }}
                  disabled={cancellingOrderBusy}
                  className="h-11 flex-1 rounded-full border-2 border-slate-200 text-sm font-bold text-slate-500 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Keep Order
                </button>
                <button
                  onClick={async () => {
                    if (!cancellingOrder) return;
                    setCancellingOrderBusy(true);
                    try {
                      await cancelSharedOrder(
                        cancellingOrder.id,
                        cancelOrderReason.trim() || undefined,
                      );
                      toast.success("Order cancelled.");
                      setCancellingOrder(null);
                      setCancelOrderReason("");
                    } catch {
                      toast.error("Couldn't cancel order. Please try again.");
                    } finally {
                      setCancellingOrderBusy(false);
                    }
                  }}
                  disabled={cancellingOrderBusy}
                  className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-red-600 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-50"
                >
                  {cancellingOrderBusy ? "Cancelling..." : "Yes, Cancel"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {cancellingRx && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => {
            if (!cancelling) { setCancellingRx(null); setCancelReason(""); }
          }}
        >
          <div
            className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-red-100 bg-red-50 px-5 py-4">
              <div className="text-base font-black text-red-700">Cancel Prescription Order?</div>
              <div className="mt-1 text-sm text-red-500">
                #{cancellingRx.id}
                {cancellingRx.quotation?.medicationName ? " · " + cancellingRx.quotation.medicationName : ""}
              </div>
            </div>
            <div className="space-y-4 p-5">
              <div className="text-sm leading-relaxed text-slate-600">
                Are you sure you want to cancel this prescription order? The pharmacist will be notified and your prescription will be marked as cancelled.
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Reason for cancelling (optional)
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. No longer needed, found medication elsewhere..."
                  rows={3}
                  className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-red-300"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => { if (!cancelling) { setCancellingRx(null); setCancelReason(""); } }}
                  disabled={cancelling}
                  className="h-11 flex-1 rounded-full border-2 border-slate-200 text-sm font-bold text-slate-500 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Keep Order
                </button>
                <button
                  onClick={async () => {
                    if (!cancellingRx) return;
                    setCancelling(true);
                    const reason = cancelReason.trim() || "Cancelled by customer";
                    const { error } = await supabase
                      .from("prescriptions")
                      .update({
                        status: "Rejected",
                        rejection_reason: reason,
                      } as never)
                      .eq("id", cancellingRx.id);
                    if (error) {
                      toast.error("Failed to cancel order. Please try again.");
                      setCancelling(false);
                      return;
                    }
                    useSharedPrescriptions.setState((s) => ({
                      prescriptions: s.prescriptions.map((p) =>
                        p.id === cancellingRx.id
                          ? { ...p, status: "Rejected" as SharedPrescriptionStatus, rejectionReason: reason }
                          : p
                      ),
                    }));
                    await supabase.from("staff_notifications").insert({
                      order_id: cancellingRx.id,
                      title: "Prescription Order Cancelled",
                      body:
                        cancellingRx.customerName +
                        " cancelled prescription #" + cancellingRx.id +
                        (cancelReason.trim() ? " — Reason: " + cancelReason.trim() : ""),
                      kind: "prescription_cancelled",
                    } as never);
                    setCancelling(false);
                    setCancellingRx(null);
                    setCancelReason("");
                    toast.success("Prescription order cancelled.", {
                      description: "The pharmacy has been notified.",
                    });
                  }}
                  disabled={cancelling}
                  className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-red-500 text-sm font-black text-white transition hover:bg-red-600 disabled:opacity-50"
                >
                  {cancelling && (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  )}
                  {cancelling ? "Cancelling..." : "Yes, Cancel"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function scriptStatusColor(status: string) {
  if (status === "Approved — Awaiting Payment") return "bg-amber-50 text-amber-700";
  if (status === "Paid") return "bg-blue-50 text-blue-700";
  if (status === "Dispensed" || status === "Delivered") return "bg-[#F0F9F4] text-primary";
  if (status === "Rejected") return "bg-red-50 text-red-700";
  if (status === "Out for Delivery") return "bg-sky-50 text-sky-700";
  if (status === "Dispensing") return "bg-violet-50 text-violet-700";
  return "bg-[#F0F9F4] text-primary";
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-surface p-3">
      <div className="text-2xl font-extrabold text-primary">{value}</div>
      <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}

function StatusPill({ status }: { status: Order["status"] }) {
  const cls =
    status === "Delivered" ? "bg-success/15 text-success" :
    status === "Out for delivery" ? "bg-accent/15 text-accent-foreground" :
    status === "Packed" ? "bg-primary/10 text-primary" :
    "bg-warning/20 text-foreground";
  return <span className={"rounded-full px-2 py-0.5 text-xs font-bold " + cls}>{status}</span>;
}
