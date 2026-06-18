import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth, type Order } from "@/store/auth";
import { useSharedPrescriptions } from "@/store/sharedPrescriptions";
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

  const [q, setQ] = useState(initial || "");

  // Search OTC orders
  const otcMatch = orders.find(
    (o) => o.id.toLowerCase() === q.trim().toLowerCase()
  );

  // Search prescription orders
  const rxMatch = sharedPrescriptions.find(
    (p) => p.id.toLowerCase() === q.trim().toLowerCase()
  );

  const hasMatch = otcMatch || rxMatch;

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
      {otcMatch && <OrderTracker order={otcMatch} />}

      {/* Prescription order result */}
      {rxMatch && <RxTracker rx={rxMatch} />}

      {/* Empty state — show recent orders */}
      {!q && (
        <div className="mt-8 space-y-6">
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
      <div className="relative h-44 w-full bg-[oklch(0.96_0.02_150)]">
        <svg
          viewBox="0 0 300 220"
          className="absolute inset-0 h-full w-full"
          preserveAspectRatio="none"
          aria-hidden
        >
          <defs>
            <pattern
              id="streets-rx"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <rect
                width="40"
                height="40"
                fill="oklch(0.97 0.015 150)"
              />
              <path
                d="M0 20 H40 M20 0 V40"
                stroke="oklch(0.88 0.02 150)"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="300" height="220" fill="url(#streets-rx)" />
          <path
            d="M0 110 H300"
            stroke="oklch(0.82 0.02 150)"
            strokeWidth="6"
          />
          <path
            d="M150 0 V220"
            stroke="oklch(0.82 0.02 150)"
            strokeWidth="6"
          />
          <path
            d={`M${p0.x} ${p0.y} C ${p1.x} ${p1.y}, ${p2.x} ${p2.y}, ${p3.x} ${p3.y}`}
            stroke="var(--primary)"
            strokeWidth="3"
            strokeDasharray="6 4"
            fill="none"
          />
          <circle
            cx={p0.x}
            cy={p0.y}
            r="6"
            fill="white"
            stroke="var(--primary)"
            strokeWidth="2"
          />
          <circle cx={p3.x} cy={p3.y} r="8" fill="var(--accent)" />
          <circle cx={p3.x} cy={p3.y} r="3" fill="white" />
        </svg>
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2 transition-[left,top] duration-700 ease-out"
          style={{
            left: (dx / 300) * 100 + "%",
            top: (dy / 220) * 100 + "%",
          }}
        >
          <span className="absolute inset-0 -z-10 m-auto block h-8 w-8 animate-ping rounded-full bg-primary/40" />
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-2 ring-white">
            <Navigation className="h-4 w-4" />
          </div>
        </div>
        <div className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-foreground shadow">
          Live
        </div>
        <div className="absolute bottom-2 right-2 rounded-md bg-white/90 px-2 py-1 text-[11px] font-bold text-foreground shadow">
          {eta} min away
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 bg-card px-3 py-2 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-primary" />{" "}
          Pharmacy
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-accent" />{" "}
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
      <div className="relative h-44 w-full bg-[oklch(0.96_0.02_150)]">
        <svg
          viewBox="0 0 300 220"
          className="absolute inset-0 h-full w-full"
          preserveAspectRatio="none"
          aria-hidden
        >
          <defs>
            <pattern
              id="streets"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <rect
                width="40"
                height="40"
                fill="oklch(0.97 0.015 150)"
              />
              <path
                d="M0 20 H40 M20 0 V40"
                stroke="oklch(0.88 0.02 150)"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="300" height="220" fill="url(#streets)" />
          <path
            d="M0 110 H300"
            stroke="oklch(0.82 0.02 150)"
            strokeWidth="6"
          />
          <path
            d="M150 0 V220"
            stroke="oklch(0.82 0.02 150)"
            strokeWidth="6"
          />
          <path
            d={`M${p0.x} ${p0.y} C ${p1.x} ${p1.y}, ${p2.x} ${p2.y}, ${p3.x} ${p3.y}`}
            stroke="var(--primary)"
            strokeWidth="3"
            strokeDasharray="6 4"
            fill="none"
          />
          <circle
            cx={p0.x}
            cy={p0.y}
            r="6"
            fill="white"
            stroke="var(--primary)"
            strokeWidth="2"
          />
          <circle cx={p3.x} cy={p3.y} r="8" fill="var(--accent)" />
          <circle cx={p3.x} cy={p3.y} r="3" fill="white" />
        </svg>
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2 transition-[left,top] duration-700 ease-out"
          style={{
            left: (dx / 300) * 100 + "%",
            top: (dy / 220) * 100 + "%",
          }}
        >
          <span className="absolute inset-0 -z-10 m-auto block h-8 w-8 animate-ping rounded-full bg-primary/40" />
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-2 ring-white">
            <Navigation className="h-4 w-4" />
          </div>
        </div>
        <div className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-foreground shadow">
          Live
        </div>
        <div className="absolute bottom-2 right-2 rounded-md bg-white/90 px-2 py-1 text-[11px] font-bold text-foreground shadow">
          {eta}
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 bg-card px-3 py-2 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-primary" />{" "}
          Pharmacy
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-accent" />{" "}
          Your address
        </span>
      </div>
    </div>
  );
}
