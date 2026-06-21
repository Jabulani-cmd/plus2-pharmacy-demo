import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth, type Order } from "@/store/auth";
import { useSharedPrescriptions } from "@/store/sharedPrescriptions";
import { useSharedOrders, type SharedOrder } from "@/store/sharedOrders";
import { formatUSD } from "@/store/shop";
import {
  Search, MapPin, Phone, Truck, CheckCircle2,
  Circle, Navigation, FileText, Car, Clock,
  Package, Store,
} from "lucide-react";

export const Route = createFileRoute("/track")({
  validateSearch: (s: Record<string, unknown>) => ({
    order: typeof s.order === "string" ? s.order : "",
  }),
  head: () => ({ meta: [{ title: "Track Order — Kings Pharmacy" }] }),
  component: TrackPage,
});

// Prescription tracking stages
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

function TrackPage() {
  const { order: initial } = Route.useSearch();
  const orders = useAuth((s) => s.orders);
  const user = useAuth((s) => s.user);
  const sharedPrescriptions = useSharedPrescriptions(
    (s) => s.prescriptions
  );
  const sharedOrders = useSharedOrders((s) => s.orders);

  const [q, setQ] = useState(initial || "");

  // Match a live (checkout-placed) order first, then fall back to the demo orders list.
  const sharedOtcMatch = sharedOrders.find(
    (o) => o.id.toLowerCase() === q.trim().toLowerCase()
  );
  const otcMatch = orders.find(
    (o) => o.id.toLowerCase() === q.trim().toLowerCase()
  );

  // Search prescription orders
  const rxMatch = sharedPrescriptions.find(
    (p) => p.id.toLowerCase() === q.trim().toLowerCase()
  );

  const hasMatch = sharedOtcMatch || otcMatch || rxMatch;

  // Customer's own prescription orders for quick links
  const myRxOrders = user
    ? sharedPrescriptions.filter(
        (p) =>
          p.customerId === user.id ||
          p.customerEmail === user.email
      )
    : [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="text-2xl font-extrabold md:text-3xl">
        Track your order
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Enter your Kings order number (e.g. P2-183904 or
        RX-2025-562411) to see live delivery progress.
      </p>

      <div className="mt-4 flex gap-2 rounded-md border-2 border-primary bg-background p-1">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
          placeholder="P2-183904 or RX-2025-562411"
          className="w-full bg-background px-3 py-2 text-sm outline-none"
        />
        <button className="flex items-center gap-2 rounded-sm bg-primary px-4 py-2 text-sm font-bold uppercase text-primary-foreground hover:bg-primary-dark">
          <Search className="h-4 w-4" /> Track
        </button>
      </div>

      {/* No match found */}
      {q && !hasMatch && (
        <div className="mt-6 rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
          <p className="font-semibold">
            No order found for "{q}".
          </p>
          <p className="mt-2">Try one of your recent orders:</p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {orders.map((o) => (
              <button
                key={o.id}
                onClick={() => setQ(o.id)}
                className="rounded-md border border-primary/30 bg-primary/5 px-3 py-1 font-mono text-xs font-bold text-primary hover:bg-primary/10"
              >
                {o.id}
              </button>
            ))}
            {myRxOrders.map((p) => (
              <button
                key={p.id}
                onClick={() => setQ(p.id)}
                className="rounded-md border border-violet-200 bg-violet-50 px-3 py-1 font-mono text-xs font-bold text-violet-700 hover:bg-violet-100"
              >
                {p.id}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* OTC order result */}
      {sharedOtcMatch && <SharedOrderTracker order={sharedOtcMatch} />}
      {!sharedOtcMatch && otcMatch && <OrderTracker order={otcMatch} />}

      {/* Prescription order result */}
      {rxMatch && <RxTracker rx={rxMatch} />}

      {/* Empty state — show recent orders */}
      {!q && (
        <div className="mt-8 space-y-6">
          {/* Live orders placed via checkout */}
          {sharedOrders.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted-foreground">
                Your Recent Orders
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {sharedOrders.slice(0, 6).map((o) => (
                  <button
                    key={o.id}
                    onClick={() => setQ(o.id)}
                    className="rounded-xl border border-border bg-card p-4 text-left shadow-sm transition hover:border-primary hover:shadow-md"
                  >
                    <div className="text-xs font-bold uppercase text-muted-foreground">
                      {o.placedAt}
                    </div>
                    <div className="mt-1 text-lg font-extrabold">{o.id}</div>
                    <div className="text-sm text-muted-foreground">
                      {o.itemCount} item{o.itemCount !== 1 ? "s" : ""} · ${o.total.toFixed(2)}
                    </div>
                    <SharedStatusPill status={o.status} className="mt-2" />
                  </button>
                ))}
              </div>
            </div>
          )}
          {/* OTC orders */}
          {orders.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted-foreground">
                Recent OTC Orders
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {orders.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => setQ(o.id)}
                    className="rounded-xl border border-border bg-card p-4 text-left shadow-sm transition hover:border-primary hover:shadow-md"
                  >
                    <div className="text-xs font-bold uppercase text-muted-foreground">
                      {o.date}
                    </div>
                    <div className="mt-1 text-lg font-extrabold">
                      {o.id}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {o.items.length} item
                      {o.items.length !== 1 ? "s" : ""} &middot;{" "}
                      {formatUSD(o.total)}
                    </div>
                    <OtcStatusPill status={o.status} className="mt-2" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Prescription orders */}
          {myRxOrders.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted-foreground">
                My Prescription Orders
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {myRxOrders.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setQ(p.id)}
                    className="rounded-xl border border-border bg-card p-4 text-left shadow-sm transition hover:border-violet-400 hover:shadow-md"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <div className="text-xs font-bold uppercase text-muted-foreground">
                        Prescription
                      </div>
                    </div>
                    <div className="mt-1 font-mono text-base font-extrabold">
                      {p.id}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {p.quotation?.medicationName ?? p.fileName}
                    </div>
                    {p.quotation && (
                      <div className="text-sm font-bold text-primary">
                        ${p.quotation.total.toFixed(2)}
                      </div>
                    )}
                    <RxStatusPill status={p.status} className="mt-2" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Prescription order tracker ──
function RxTracker({
  rx,
}: {
  rx: ReturnType<
    typeof useSharedPrescriptions.getState
  >["prescriptions"][0];
}) {
  const stageIdx = getRxStageIndex(rx.status);
  const isOutForDelivery = rx.status === "Out for Delivery";
  const isDelivered = rx.status === "Delivered";

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
      {/* Left — stages + medication */}
      <div className="space-y-4">
        {/* Status card */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="text-xs font-bold uppercase text-muted-foreground">
                Prescription Order
              </div>
              <div className="mt-0.5 font-mono text-xl font-extrabold">
                {rx.id}
              </div>
              {rx.quotation && (
                <div className="mt-0.5 text-sm text-muted-foreground">
                  {rx.quotation.medicationName} &middot;{" "}
                  {rx.quotation.quantity}
                </div>
              )}
            </div>
            <div className="text-right">
              <RxStatusPill status={rx.status} />
              {rx.quotation && (
                <div
                  className="mt-1 text-lg font-black"
                  style={{ color: "#0EA5E9" }}
                >
                  ${rx.quotation.total.toFixed(2)}
                </div>
              )}
            </div>
          </div>

          {/* Stage progress */}
          <div className="mt-6 overflow-x-auto pb-2">
            <ol className="flex min-w-[520px] items-start">
              {RX_STAGES.map((stage, i) => {
                const done = i <= stageIdx;
                const active = i === stageIdx;
                return (
                  <li
                    key={stage.key}
                    className="flex flex-1 flex-col items-center"
                  >
                    <div className="flex w-full items-center">
                      {/* Left line */}
                      {i > 0 && (
                        <div
                          className="h-0.5 flex-1 transition-colors"
                          style={{
                            background:
                              i <= stageIdx ? "#0EA5E9" : "#E5E7EB",
                          }}
                        />
                      )}
                      {/* Circle */}
                      <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-colors"
                        style={{
                          background: done ? "#0EA5E9" : "#E5E7EB",
                          color: done ? "white" : "#9CA3AF",
                          boxShadow: active
                            ? "0 0 0 3px #BBF7D0"
                            : "none",
                        }}
                      >
                        {done && !active ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          i + 1
                        )}
                      </div>
                      {/* Right line */}
                      {i < RX_STAGES.length - 1 && (
                        <div
                          className="h-0.5 flex-1 transition-colors"
                          style={{
                            background:
                              i < stageIdx ? "#0EA5E9" : "#E5E7EB",
                          }}
                        />
                      )}
                    </div>
                    <span
                      className="mt-1.5 text-center text-[9px] font-semibold leading-tight"
                      style={{
                        color: active
                          ? "#0EA5E9"
                          : done
                          ? "#374151"
                          : "#9CA3AF",
                      }}
                    >
                      {stage.label}
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>

          {/* Paid timestamp */}
          {rx.paidAt && (
            <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              Payment confirmed: {rx.paidAt}
            </div>
          )}
          {rx.dispatchedAt && (
            <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Truck className="h-3.5 w-3.5" />
              Dispatched: {rx.dispatchedAt}
            </div>
          )}
        </div>

        {/* Medication details */}
        {rx.quotation && (
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h3 className="font-extrabold">Medication</h3>
            <ul className="mt-3 divide-y divide-border">
              <li className="flex items-center gap-3 py-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-md border border-border bg-surface">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold">
                    {rx.quotation.medicationName}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {rx.quotation.dosage} &middot;{" "}
                    {rx.quotation.quantity}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Approved by {rx.quotation.pharmacistName}
                  </div>
                </div>
                <div className="text-sm font-bold">
                  ${rx.quotation.medicationCost.toFixed(2)}
                </div>
              </li>
            </ul>
            <div className="mt-4 space-y-1 border-t border-border pt-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Medication</span>
                <span className="font-semibold">
                  ${rx.quotation.medicationCost.toFixed(2)}
                </span>
              </div>
              {rx.quotation.deliveryFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Delivery fee
                  </span>
                  <span className="font-semibold">
                    ${rx.quotation.deliveryFee.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between border-t border-border pt-2 font-extrabold">
                <span>Total paid</span>
                <span style={{ color: "#0EA5E9" }}>
                  ${rx.quotation.total.toFixed(2)}
                </span>
              </div>
              {rx.paymentMethod && (
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Payment method</span>
                  <span>{rx.paymentMethod}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right sidebar */}
      <aside className="space-y-4">
        {/* Delivery address */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="flex items-center gap-2 font-extrabold">
            {rx.delivery === "collect" ? (
              <Store className="h-4 w-4 text-primary" />
            ) : (
              <MapPin className="h-4 w-4 text-primary" />
            )}
            {rx.delivery === "collect"
              ? "Collection Branch"
              : "Delivering to"}
          </h3>
          {rx.delivery === "collect" ? (
            <p className="mt-2 text-sm text-muted-foreground">
              {rx.collectionBranchId
                ? rx.collectionBranchId
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, (c) => c.toUpperCase())
                : "Your chosen branch"}
              <br />
              Bring your National ID and order reference.
            </p>
          ) : rx.deliveryAddress ? (
            <div className="mt-2 text-sm text-muted-foreground space-y-0.5">
              <p className="font-semibold text-foreground">
                {rx.deliveryAddress.firstName}{" "}
                {rx.deliveryAddress.lastName}
              </p>
              <p>{rx.deliveryAddress.streetAddress}</p>
              <p>
                {rx.deliveryAddress.suburb},{" "}
                {rx.deliveryAddress.city}, Zimbabwe
              </p>
              <p>{rx.deliveryAddress.phone}</p>
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              Address on file
            </p>
          )}
        </div>

        {/* Driver info */}
        {rx.driverName && (
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h3 className="flex items-center gap-2 font-extrabold">
              <Truck className="h-4 w-4 text-primary" /> Your driver
            </h3>
            <div className="mt-3 flex items-center gap-3">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-extrabold text-white"
                style={{ background: "#0EA5E9" }}
              >
                {rx.driverName
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")}
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold">
                  {rx.driverName}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Car className="h-3 w-3" />
                  {rx.driverVehicle}
                </div>
              </div>
              {rx.driverPhone && (
                <a
                  href={"tel:" + rx.driverPhone}
                  className="rounded-md bg-primary p-2 text-primary-foreground hover:bg-primary-dark"
                  aria-label="Call driver"
                >
                  <Phone className="h-4 w-4" />
                </a>
              )}
            </div>
            {rx.dispatchedAt && (
              <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {isDelivered ? "Delivered" : "Dispatched"}:{" "}
                {rx.dispatchedAt}
              </p>
            )}
            {/* Live map for out-for-delivery */}
            {isOutForDelivery && <RxLiveMap />}
          </div>
        )}

        {/* Patient info */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="flex items-center gap-2 font-extrabold">
            <Package className="h-4 w-4 text-primary" /> Order details
          </h3>
          <div className="mt-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Patient</span>
              <span className="font-semibold">{rx.patientName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Doctor</span>
              <span className="font-semibold">{rx.doctorName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Submitted</span>
              <span className="font-semibold">{rx.uploadedAt}</span>
            </div>
          </div>
        </div>

        <Link
          to="/account"
          className="block rounded-xl border border-border bg-card p-4 text-center text-sm font-bold text-primary hover:bg-muted"
        >
          View all orders &rarr;
        </Link>
      </aside>
    </div>
  );
}

function RxLiveMap() {
  const baseProgress = 0.55;
  const [t, setT] = useState(baseProgress);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const loop = (now: number) => {
      const elapsed = (now - start) / 1000;
      const wig = Math.sin(elapsed * 0.8) * 0.04;
      setT(Math.max(0.02, Math.min(0.98, baseProgress + wig)));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const p0 = { x: 20, y: 170 };
  const p1 = { x: 110, y: 30 };
  const p2 = { x: 200, y: 200 };
  const p3 = { x: 280, y: 40 };
  const bezier = (
    a: number,
    b: number,
    c: number,
    d: number
  ) =>
    (1 - t) ** 3 * a +
    3 * (1 - t) ** 2 * t * b +
    3 * (1 - t) * t ** 2 * c +
    t ** 3 * d;
  const dx = bezier(p0.x, p1.x, p2.x, p3.x);
  const dy = bezier(p0.y, p1.y, p2.y, p3.y);
  const eta = Math.max(1, Math.round((1 - t) * 18));

  return (
    <div className="mt-4 overflow-hidden rounded-md border border-border">
      <div className="relative h-48 w-full">
        <GoogleStyleMap p0={p0} p1={p1} p2={p2} p3={p3} idSuffix="rx" />
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2 transition-[left,top] duration-700 ease-out"
          style={{
            left: (dx / 300) * 100 + "%",
            top: (dy / 220) * 100 + "%",
          }}
        >
          <span className="absolute inset-0 -z-10 m-auto block h-8 w-8 animate-ping rounded-full bg-[#1A73E8]/40" />
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1A73E8] text-white shadow-lg ring-2 ring-white">
            <Navigation className="h-4 w-4" />
          </div>
        </div>
        <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-foreground shadow">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" /> Live
        </div>
        <div className="absolute bottom-2 right-2 rounded-md bg-white px-2 py-1 text-[11px] font-bold text-foreground shadow">
          {eta} min away
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 bg-card px-3 py-2 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-[#1A73E8]" />{" "}
          Pharmacy
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-[#EA4335]" />{" "}
          Your address
        </span>
      </div>
    </div>
  );
}

// ── OTC order tracker (original) ──
function OtcStatusPill({
  status,
  className = "",
}: {
  status: Order["status"];
  className?: string;
}) {
  const map: Record<Order["status"], string> = {
    Processing: "bg-warning/20 text-foreground",
    Packed: "bg-primary/10 text-primary",
    "Out for delivery": "bg-accent/15 text-accent-foreground",
    Delivered: "bg-success/15 text-success",
  };
  return (
    <span
      className={
        "inline-block rounded-full px-2 py-0.5 text-[11px] font-bold " +
        map[status] +
        " " +
        className
      }
    >
      {status}
    </span>
  );
}

function RxStatusPill({
  status,
  className = "",
}: {
  status: string;
  className?: string;
}) {
  const color =
    status === "Delivered"
      ? "bg-[#F0F9F4] text-[#0EA5E9]"
      : status === "Out for Delivery"
      ? "bg-violet-50 text-violet-700"
      : status === "Dispensing" || status === "Paid"
      ? "bg-blue-50 text-blue-700"
      : status === "Approved — Awaiting Payment"
      ? "bg-amber-50 text-amber-700"
      : status === "Rejected"
      ? "bg-red-50 text-red-700"
      : "bg-[#F0F9F4] text-primary";
  return (
    <span
      className={
        "inline-block rounded-full px-2 py-0.5 text-[11px] font-bold " +
        color +
        " " +
        className
      }
    >
      {status}
    </span>
  );
}

function OrderTracker({ order }: { order: Order }) {
  const currentIdx = Math.max(
    0,
    order.tracking.findIndex((t) => !t.done) - 1
  );
  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-xs font-bold uppercase text-muted-foreground">
                Order
              </div>
              <div className="text-xl font-extrabold">{order.id}</div>
            </div>
            <OtcStatusPill status={order.status} />
          </div>

          <ol className="mt-6 space-y-4">
            {order.tracking.map((t, i) => {
              const active =
                i === currentIdx && !order.tracking[i].done;
              const Icon = t.done
                ? CheckCircle2
                : active
                ? Truck
                : Circle;
              return (
                <li key={i} className="flex gap-3">
                  <div
                    className={
                      "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full " +
                      (t.done
                        ? "bg-success text-white"
                        : active
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground")
                    }
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 border-b border-dashed border-border pb-4 last:border-0">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span
                        className={
                          "font-bold " +
                          (t.done || active
                            ? ""
                            : "text-muted-foreground")
                        }
                      >
                        {t.label}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {t.at}
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="font-extrabold">Items</h3>
          <ul className="mt-3 divide-y divide-border">
            {order.items.map((it, i) => (
              <li key={i} className="flex items-center gap-3 py-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-md border border-border bg-surface text-xs font-bold text-muted-foreground">
                  x{it.qty}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold">{it.name}</div>
                  <div className="text-xs text-muted-foreground">
                    Qty {it.qty}
                  </div>
                </div>
                <div className="text-sm font-bold">
                  {formatUSD(it.price * it.qty)}
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-between border-t border-border pt-3 text-sm font-extrabold">
            <span>Total paid</span>
            <span>{formatUSD(order.total)}</span>
          </div>
        </div>
      </div>

      <aside className="space-y-4">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="flex items-center gap-2 font-extrabold">
            <MapPin className="h-4 w-4 text-primary" /> Delivering to
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {order.address}
          </p>
        </div>
        {order.driver && (
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h3 className="flex items-center gap-2 font-extrabold">
              <Truck className="h-4 w-4 text-primary" /> Your driver
            </h3>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary text-lg font-extrabold">
                {order.driver.name.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold">
                  {order.driver.name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {order.driver.vehicle}
                </div>
              </div>
              <a
                href={"tel:" + order.driver.phone}
                className="rounded-md bg-primary p-2 text-primary-foreground hover:bg-primary-dark"
                aria-label="Call driver"
              >
                <Phone className="h-4 w-4" />
              </a>
            </div>
            <LiveMap status={order.status} />
          </div>
        )}
        <Link
          to="/account"
          className="block rounded-xl border border-border bg-card p-4 text-center text-sm font-bold text-primary hover:bg-muted"
        >
          View all orders &rarr;
        </Link>
      </aside>
    </div>
  );
}

function LiveMap({ status }: { status: Order["status"] }) {
  const baseProgress =
    status === "Delivered"
      ? 1
      : status === "Out for delivery"
      ? 0.65
      : status === "Packed"
      ? 0.25
      : 0.05;

  const [t, setT] = useState(baseProgress);
  useEffect(() => {
    if (status === "Delivered") {
      setT(1);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const loop = (now: number) => {
      const elapsed = (now - start) / 1000;
      const wig = Math.sin(elapsed * 0.8) * 0.04;
      setT(Math.max(0.02, Math.min(0.98, baseProgress + wig)));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [baseProgress, status]);

  const p0 = { x: 20, y: 170 };
  const p1 = { x: 110, y: 30 };
  const p2 = { x: 200, y: 200 };
  const p3 = { x: 280, y: 40 };
  const bezier = (
    a: number,
    b: number,
    c: number,
    d: number
  ) =>
    (1 - t) ** 3 * a +
    3 * (1 - t) ** 2 * t * b +
    3 * (1 - t) * t ** 2 * c +
    t ** 3 * d;
  const dx = bezier(p0.x, p1.x, p2.x, p3.x);
  const dy = bezier(p0.y, p1.y, p2.y, p3.y);

  const eta =
    status === "Delivered"
      ? "Delivered"
      : status === "Out for delivery"
      ? Math.max(1, Math.round((1 - t) * 18)) + " min away"
      : status === "Packed"
      ? "Preparing dispatch"
      : "Awaiting handover";

  return (
    <div className="mt-4 overflow-hidden rounded-md border border-border">
      <div className="relative h-48 w-full">
        <GoogleStyleMap p0={p0} p1={p1} p2={p2} p3={p3} idSuffix="otc" />
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2 transition-[left,top] duration-700 ease-out"
          style={{
            left: (dx / 300) * 100 + "%",
            top: (dy / 220) * 100 + "%",
          }}
        >
          <span className="absolute inset-0 -z-10 m-auto block h-8 w-8 animate-ping rounded-full bg-[#1A73E8]/40" />
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1A73E8] text-white shadow-lg ring-2 ring-white">
            <Navigation className="h-4 w-4" />
          </div>
        </div>
        <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-foreground shadow">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" /> Live
        </div>
        <div className="absolute bottom-2 right-2 rounded-md bg-white px-2 py-1 text-[11px] font-bold text-foreground shadow">
          {eta}
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 bg-card px-3 py-2 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-[#1A73E8]" />{" "}
          Pharmacy
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-[#EA4335]" />{" "}
          Your address
        </span>
      </div>
    </div>
  );
}

// ── Google Maps–style background ──
function GoogleStyleMap({
  p0,
  p1,
  p2,
  p3,
  idSuffix,
}: {
  p0: { x: number; y: number };
  p1: { x: number; y: number };
  p2: { x: number; y: number };
  p3: { x: number; y: number };
  idSuffix: string;
}) {
  return (
    <svg
      viewBox="0 0 300 220"
      className="absolute inset-0 h-full w-full"
      preserveAspectRatio="none"
      aria-hidden
    >
      {/* Land base — Google-Maps cream */}
      <rect width="300" height="220" fill="#F5F1E8" />

      {/* Parks */}
      <path d="M0 0 L70 0 L90 35 L40 70 L0 55 Z" fill="#C8E6C9" />
      <ellipse cx="240" cy="180" rx="55" ry="32" fill="#C8E6C9" />
      <path d="M180 0 L220 0 L210 25 L185 28 Z" fill="#C8E6C9" />

      {/* River / water */}
      <path
        d="M0 145 Q 70 130 130 155 T 300 140 L 300 165 Q 220 175 130 175 T 0 170 Z"
        fill="#AADAFF"
      />

      {/* Building blocks (subtle) */}
      <g fill="#EDE7DB">
        <rect x="105" y="50" width="30" height="22" />
        <rect x="140" y="50" width="22" height="22" />
        <rect x="170" y="50" width="30" height="22" />
        <rect x="105" y="78" width="55" height="18" />
        <rect x="170" y="78" width="30" height="18" />
        <rect x="105" y="180" width="40" height="22" />
        <rect x="150" y="180" width="20" height="22" />
      </g>

      {/* Minor street grid */}
      <g stroke="#FFFFFF" strokeWidth="2">
        <path d="M0 45 H300" />
        <path d="M0 75 H300" />
        <path d="M0 105 H300" />
        <path d="M0 195 H300" />
        <path d="M60 0 V220" />
        <path d="M105 0 V220" />
        <path d="M205 0 V220" />
        <path d="M255 0 V220" />
      </g>

      {/* Major arterials */}
      <path d="M0 110 H300" stroke="#FFFFFF" strokeWidth="9" />
      <path d="M0 110 H300" stroke="#FCD34D" strokeWidth="5" />
      <path d="M160 0 V220" stroke="#FFFFFF" strokeWidth="9" />
      <path d="M160 0 V220" stroke="#FCD34D" strokeWidth="5" />

      {/* Highway diagonal */}
      <path d="M-10 -10 L 310 230" stroke="#FFFFFF" strokeWidth="11" />
      <path d="M-10 -10 L 310 230" stroke="#F59E0B" strokeWidth="6" />

      {/* Route — driving path */}
      <path
        d={`M${p0.x} ${p0.y} C ${p1.x} ${p1.y}, ${p2.x} ${p2.y}, ${p3.x} ${p3.y}`}
        stroke="#FFFFFF"
        strokeWidth="7"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d={`M${p0.x} ${p0.y} C ${p1.x} ${p1.y}, ${p2.x} ${p2.y}, ${p3.x} ${p3.y}`}
        stroke="#1A73E8"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      />

      {/* Origin pin (pharmacy) */}
      <g>
        <circle cx={p0.x} cy={p0.y} r="7" fill="#FFFFFF" />
        <circle cx={p0.x} cy={p0.y} r="4.5" fill="#1A73E8" />
      </g>

      {/* Destination pin (home) */}
      <g transform={`translate(${p3.x} ${p3.y})`}>
        <path
          d="M0 -14 C -7 -14 -11 -8 -11 -3 C -11 5 0 12 0 12 C 0 12 11 5 11 -3 C 11 -8 7 -14 0 -14 Z"
          fill="#EA4335"
          stroke="#B31412"
          strokeWidth="0.7"
        />
        <circle cx="0" cy="-4" r="3.5" fill="#FFFFFF" />
      </g>

      {/* Labels */}
      <text
        x="6"
        y="14"
        fontSize="8"
        fontFamily="system-ui, sans-serif"
        fill="#5F6368"
        fontWeight="600"
      >
        Bulawayo
      </text>
      <text
        x="172"
        y="158"
        fontSize="7"
        fontFamily="system-ui, sans-serif"
        fill="#1976D2"
        fontStyle="italic"
      >
        Umguza R.
      </text>
      {/* idSuffix is reserved for future unique <defs> ids */}
      <desc>{idSuffix}</desc>
    </svg>
  );
}

// ── Shared OTC order tracker (from live checkout) ──
function SharedStatusPill({
  status,
  className = "",
}: {
  status: SharedOrder["status"];
  className?: string;
}) {
  const map: Record<SharedOrder["status"], string> = {
    "Ready to dispatch": "bg-amber-50 text-amber-700",
    Packed: "bg-blue-50 text-blue-700",
    Assigned: "bg-blue-50 text-blue-700",
    "Out for delivery": "bg-violet-50 text-violet-700",
    Delivered: "bg-primary/10 text-primary",
  };
  return (
    <span
      className={
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold " +
        map[status] +
        " " +
        className
      }
    >
      {status === "Delivered" && <CheckCircle2 className="h-3 w-3" />}
      {status}
    </span>
  );
}

const SHARED_STAGES: { key: SharedOrder["status"]; label: string }[] = [
  { key: "Ready to dispatch", label: "Confirmed" },
  { key: "Packed", label: "Packed" },
  { key: "Out for delivery", label: "Out for Delivery" },
  { key: "Delivered", label: "Delivered" },
];

function SharedOrderTracker({ order }: { order: SharedOrder }) {
  const stageIdx = Math.max(
    0,
    SHARED_STAGES.findIndex(
      (s) =>
        s.key === order.status ||
        (order.status === "Assigned" && s.key === "Packed")
    )
  );
  const isDelivered = order.status === "Delivered";

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="text-xs font-bold uppercase text-muted-foreground">
                Order
              </div>
              <div className="text-xl font-extrabold">{order.id}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                Placed {order.placedAt}
              </div>
            </div>
            <div className="text-right">
              <SharedStatusPill status={order.status} />
              <div className="mt-1 text-lg font-extrabold text-primary">
                ${order.total.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto pb-1">
            <ol className="flex min-w-[420px] items-start">
              {SHARED_STAGES.map((stage, i) => {
                const done = i <= stageIdx;
                const active = i === stageIdx && !isDelivered;
                return (
                  <li
                    key={stage.key}
                    className="flex flex-1 flex-col items-center"
                  >
                    <div className="flex w-full items-center">
                      {i > 0 && (
                        <div
                          className="h-0.5 flex-1"
                          style={{
                            background: done ? "#0EA5E9" : "#E5E7EB",
                          }}
                        />
                      )}
                      <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                        style={{
                          background: done ? "#0EA5E9" : "#E5E7EB",
                          color: done ? "white" : "#9CA3AF",
                          boxShadow: active ? "0 0 0 3px #BBF7D0" : "none",
                        }}
                      >
                        {done && !active ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          i + 1
                        )}
                      </div>
                      {i < SHARED_STAGES.length - 1 && (
                        <div
                          className="h-0.5 flex-1"
                          style={{
                            background: i < stageIdx ? "#0EA5E9" : "#E5E7EB",
                          }}
                        />
                      )}
                    </div>
                    <span
                      className="mt-1.5 text-center text-[10px] font-semibold"
                      style={{
                        color: active
                          ? "#0EA5E9"
                          : done
                          ? "#374151"
                          : "#9CA3AF",
                      }}
                    >
                      {stage.label}
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>

          {order.deliveredAt && (
            <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
              Delivered: {order.deliveredAt}
            </div>
          )}
          {order.dispatchedAt && !isDelivered && (
            <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Truck className="h-3.5 w-3.5" />
              Dispatched: {order.dispatchedAt}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="font-extrabold">Items</h3>
          <ul className="mt-3 divide-y divide-border">
            {order.items.map((it) => (
              <li key={it.id} className="flex items-center gap-3 py-3 text-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-surface text-xs font-bold text-muted-foreground">
                  ×{it.qty}
                </div>
                <div className="flex-1 font-semibold">{it.name}</div>
                <div className="font-bold">
                  ${(it.price * it.qty).toFixed(2)}
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex justify-between border-t border-border pt-3 text-sm font-extrabold">
            <span>Total paid</span>
            <span className="text-primary">${order.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <aside className="space-y-4">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="flex items-center gap-2 font-extrabold">
            <MapPin className="h-4 w-4 text-primary" /> Delivering to
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">{order.address}</p>
          <p className="mt-1 text-xs text-muted-foreground">{order.phone}</p>
        </div>
        {order.driverName && (
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h3 className="flex items-center gap-2 font-extrabold">
              <Truck className="h-4 w-4 text-primary" /> Your driver
            </h3>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary text-lg font-extrabold">
                {order.driverName.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold">{order.driverName}</div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Car className="h-3 w-3" />
                  {order.driverVehicle}
                </div>
              </div>
              {order.driverPhone && (
                <a
                  href={"tel:" + order.driverPhone}
                  className="rounded-md bg-primary p-2 text-primary-foreground hover:bg-primary-dark"
                  aria-label="Call driver"
                >
                  <Phone className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>
        )}
        <Link
          to="/account"
          className="block rounded-xl border border-border bg-card p-4 text-center text-sm font-bold text-primary hover:bg-muted"
        >
          View all orders &rarr;
        </Link>
      </aside>
    </div>
  );
}
