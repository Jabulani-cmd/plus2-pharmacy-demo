import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useShop, formatUSD } from "@/store/shop";
import { useAuth, type Order } from "@/store/auth";
import { useSharedPrescriptions } from "@/store/sharedPrescriptions";
import { useSharedOrders } from "@/store/sharedOrders";
import PaymentModal from "@/components/checkout/PaymentModal";
import { getProduct } from "@/data/products";
import { ProductCard } from "@/components/product/ProductCard";
import {
  Package, Heart, MapPin, Settings, LayoutDashboard,
  FileText, Truck, LogOut, Phone, Syringe, Store,
  Receipt as ReceiptIcon, CheckCircle2, Bell, X,
  Car, Clock, Navigation,
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

      {/* Progress bar */}
      <div className="mt-4 overflow-x-auto pb-1">
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
          <span>
            {rx.deliveryAddress.firstName} {rx.deliveryAddress.lastName} &middot;{" "}
            {rx.deliveryAddress.streetAddress}, {rx.deliveryAddress.suburb},{" "}
            {rx.deliveryAddress.city}
          </span>
        </div>
      )}
      {rx.delivery === "collect" && (
        <div className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
          <Store className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
          <span>
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
  const allRatings = useOrderExtras((s) => s.ratings);
  const wishlist = useShop((s) => s.wishlist).map(getProduct).filter(Boolean);
  const [tab, setTab] = useState("dash");
  const [activeReceipt, setActiveReceipt] = useState(null as Receipt | null);
  const [payingRx, setPayingRx] = useState(null as (typeof sharedPrescriptions)[0] | null);
  const [dismissedIds, setDismissedIds] = useState([] as string[]);

  useEffect(() => {
    if (!user) navigate({ to: "/auth" });
  }, [user, navigate]);

  if (!user) return null;

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

  const pendingPayment = mySharedPrescriptions.filter(
    (p) =>
      p.status === "Approved — Awaiting Payment" &&
      p.quotation &&
      !dismissedIds.includes(p.id)
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
    navigate({ to: "/track", search: { order: id } });
  };

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
              <button
                onClick={() => setDismissedIds((prev) => [...prev, rx.id])}
                className="absolute right-3 top-3 rounded-full p-1 hover:bg-black/5"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4 text-[#6B7280]" />
              </button>
              <div className="flex items-start gap-4 pr-6">
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
                <button
                  onClick={() => setPayingRx(rx)}
                  className="shrink-0 self-center rounded-lg px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:opacity-90"
                  style={{ background: "#0EA5E9" }}
                >
                  Pay Now
                </button>
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

        <div>
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
                        search={{ order: activeOtc.id }}
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
              {mySharedOrders.length > 0 && (
                <div className="border-b border-border bg-[#F0F9F4] px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#0EA5E9]">
                  Your recent orders
                </div>
              )}
              <table className="w-full text-sm">
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
                          <Link
                            to="/track"
                            search={{ order: o.id }}
                            className="text-sm font-bold text-primary hover:underline"
                          >
                            Track &rarr;
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
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
                          <Link to="/track" search={{ order: o.id }} className="text-sm font-bold text-primary hover:underline">
                            Track &rarr;
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                      </div>
                    ))}
                  </div>
                )}

                <ul className="mt-4 divide-y divide-border">
                  {(mySharedPrescriptions.length > 0 ? mySharedPrescriptions : prescriptions).map((p) => (
                    <li key={p.id} className="flex items-center gap-3 py-3">
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
          onSuccess={(ref, method) => {
            markSharedPaid(payingRx.id, ref, method);
            setDismissedIds((prev) => [...prev, payingRx.id]);
            setPayingRx(null);
            toast.success("Payment confirmed — your medication will be dispatched shortly");
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
