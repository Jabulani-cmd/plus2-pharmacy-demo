import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  STAFF_DELIVERIES,
  STAFF_DRIVERS,
  type StaffDelivery,
  type StaffDriver,
} from "@/data/staffDemo";
import { useSharedPrescriptions } from "@/store/sharedPrescriptions";
import { useSharedOrders } from "@/store/sharedOrders";
import { PageHeader, KPI, Card, StatusPill, fmtUSD } from "./shared";
import {
  Truck, MapPin, Phone, Package, CheckCircle2,
  X, Clock, UserCheck, FileText, User,
} from "lucide-react";

const COLUMNS: {
  key: StaffDelivery["status"];
  label: string;
  color: string;
}[] = [
  { key: "Confirmed", label: "New Orders", color: "#0EA5E9" },
  { key: "Ready to dispatch", label: "Ready to dispatch", color: "#F59E0B" },
  { key: "Assigned", label: "Assigned to driver", color: "#3B82F6" },
  { key: "Out for delivery", label: "Out for delivery", color: "#7C3AED" },
  { key: "Delivered", label: "Delivered", color: "#059669" },
];

export function DispatcherDashboard({ view }: { view?: string }) {
  const sharedOrders = useSharedOrders((s) => s.orders);
  const markPackedShared = useSharedOrders((s) => s.markPacked);
  const assignDriverSharedOrder = useSharedOrders((s) => s.assignDriver);
  const startDeliveryShared = useSharedOrders((s) => s.startDelivery);
  const updateOrderStatus = useSharedOrders((s) => s.updateStatus);

  // Merge demo deliveries with live orders from checkout.
  const liveDeliveries: StaffDelivery[] = useMemo(
    () =>
      sharedOrders.map((o) => {
        // Map live order status → dispatch column bucket.
        const status: StaffDelivery["status"] =
          o.status === "Confirmed"
            ? "Confirmed"
            : o.status === "Packed"
            ? "Ready to dispatch"
            : (o.status as StaffDelivery["status"]);
        return {
          id: o.id,
          customer: o.customer,
          address: o.address,
          items: o.itemCount,
          total: o.total,
          status,
          paymentMethod: o.paymentMethod,
          placedAt: o.placedAt,
          driverId: o.driverName ? "live-" + o.id : undefined,
          eta: o.eta,
        };
      }),
    [sharedOrders]
  );

  const [demoDeliveries, setDemoDeliveries] =
    useState<StaffDelivery[]>(STAFF_DELIVERIES);
  const deliveries = [...liveDeliveries, ...demoDeliveries];
  const setDeliveries = setDemoDeliveries;
  const isLiveOrder = (id: string) => sharedOrders.some((o) => o.id === id);

  const [drivers] = useState<StaffDriver[]>(STAFF_DRIVERS);
  const [assignFor, setAssignFor] =
    useState<StaffDelivery | null>(null);

  const sharedPrescriptions = useSharedPrescriptions(
    (s) => s.prescriptions
  );
  const assignDriverShared = useSharedPrescriptions(
    (s) => s.assignDriver
  );
  const updateStatusShared = useSharedPrescriptions(
    (s) => s.updateStatus
  );

  const rxOrders = sharedPrescriptions.filter(
    (p) =>
      p.status === "Paid" ||
      p.status === "Dispensing" ||
      p.status === "Out for Delivery"
  );

  const [assignRxFor, setAssignRxFor] = useState(
    null as (typeof sharedPrescriptions)[0] | null
  );

  const counts = useMemo(
    () => ({
      ready:
        deliveries.filter(
          (d) =>
            d.status === "Confirmed" || d.status === "Ready to dispatch"
        ).length +
        rxOrders.filter(
          (p) => p.status === "Paid" || p.status === "Dispensing"
        ).length,
      inFlight:
        deliveries.filter(
          (d) =>
            d.status === "Assigned" || d.status === "Out for delivery"
        ).length +
        rxOrders.filter((p) => p.status === "Out for Delivery").length,
      delivered: deliveries.filter((d) => d.status === "Delivered")
        .length,
      available: drivers.filter((d) => d.status === "Available").length,
    }),
    [deliveries, drivers, rxOrders]
  );

  const driverById = (id?: string) =>
    drivers.find((d) => d.id === id);

  const assign = (deliveryId: string, driverId: string) => {
    if (isLiveOrder(deliveryId)) {
      const drv = driverById(driverId);
      if (drv) {
        assignDriverSharedOrder(deliveryId, drv.name, drv.phone, drv.vehicle);
        setAssignFor(null);
        toast.success(
          "Order " + deliveryId + " → assigned to " + drv.name.split(" ")[0] + ". Driver must Start Delivery."
        );
        return;
      }
    }
    setDeliveries((prev) =>
      prev.map((d) =>
        d.id === deliveryId
          ? { ...d, status: "Assigned", driverId, eta: "30 min" }
          : d
      )
    );
    setAssignFor(null);
    toast.success(
      "Order " +
        deliveryId +
        " assigned to " +
        driverById(driverId)?.name.split(" ")[0]
    );
  };

  const assignRxDriver = (
    rxId: string,
    driver: StaffDriver
  ) => {
    assignDriverShared(
      rxId,
      driver.name,
      driver.phone,
      driver.vehicle
    );
    setAssignRxFor(null);
    toast.success(
      "Prescription order " +
        rxId +
        " assigned to " +
        driver.name.split(" ")[0] +
        " — out for delivery"
    );
  };

  const advance = (
    deliveryId: string,
    next: StaffDelivery["status"]
  ) => {
    if (isLiveOrder(deliveryId)) {
      if (next === "Ready to dispatch") {
        // staff marked a NEW order as packed → ready for driver assignment
        markPackedShared(deliveryId);
      } else if (next === "Out for delivery") {
        startDeliveryShared(deliveryId);
      } else if (next === "Delivered") {
        updateOrderStatus(deliveryId, "Delivered");
      }
      toast.success("Order " + deliveryId + " → " + next);
      return;
    }
    setDeliveries((prev) =>
      prev.map((d) =>
        d.id === deliveryId ? { ...d, status: next } : d
      )
    );
    toast.success("Order " + deliveryId + " → " + next);
  };

  if (view === "drivers")
    return <DriversView drivers={drivers} deliveries={deliveries} />;
  if (view === "history")
    return (
      <HistoryView deliveries={deliveries} drivers={drivers} />
    );

  const newCount = deliveries.filter((d) => d.status === "Confirmed").length;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <PageHeader
          title="Dispatch Board"
          subtitle="Manage OTC orders and prescription deliveries."
        />
        {newCount > 0 && (
          <a
            href="#new-orders-col"
            className="group inline-flex items-center gap-2 rounded-full bg-[#0EA5E9] px-4 py-2 text-xs font-extrabold uppercase tracking-wide text-white shadow-lg ring-4 ring-[#0EA5E9]/20 transition hover:bg-[#0284C7]"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
            </span>
            {newCount} New Order{newCount === 1 ? "" : "s"}
          </a>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KPI
          label="Ready to dispatch"
          value={String(counts.ready)}
          accent="#F59E0B"
          icon={<Package className="h-5 w-5" />}
        />
        <KPI
          label="In flight"
          value={String(counts.inFlight)}
          accent="#7C3AED"
          icon={<Truck className="h-5 w-5" />}
        />
        <KPI
          label="Delivered today"
          value={String(counts.delivered)}
          accent="#059669"
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
        <KPI
          label="Available drivers"
          value={counts.available + " / " + drivers.length}
          accent="#0EA5E9"
          icon={<UserCheck className="h-5 w-5" />}
        />
      </div>

      {rxOrders.length > 0 && (
        <div className="mt-6">
          <div className="mb-3 flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="text-base font-bold text-foreground">
              Prescription Orders
            </h2>
            <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white">
              {rxOrders.length}
            </span>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {rxOrders.map((rx) => {
              const isPaid =
                rx.status === "Paid" || rx.status === "Dispensing";
              const isOutForDelivery =
                rx.status === "Out for Delivery";

              return (
                <div
                  key={rx.id}
                  className="rounded-xl border bg-white p-4 shadow-sm"
                  style={{
                    borderColor: isPaid ? "#F59E0B" : "#7C3AED",
                    borderWidth: isPaid ? "2px" : "1px",
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-foreground">
                          {rx.id}
                        </span>
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                          style={{
                            background: isPaid
                              ? "#F59E0B"
                              : "#7C3AED",
                          }}
                        >
                          {rx.status}
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-foreground">
                        <User className="h-3 w-3 text-muted-foreground" />
                        {rx.patientName}
                      </div>
                    </div>
                    {rx.quotation && (
                      <div className="text-right">
                        <div
                          className="text-base font-black"
                          style={{ color: "#0EA5E9" }}
                        >
                          ${rx.quotation.total.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {rx.paymentMethod ?? "Paid"}
                        </div>
                      </div>
                    )}
                  </div>

                  {rx.quotation && (
                    <div
                      className="mt-2 rounded-md px-2 py-1.5 text-xs"
                      style={{
                        background: "#F0F9F4",
                        border: "1px solid #BBF7D0",
                      }}
                    >
                      <span className="font-semibold text-[#111827]">
                        {rx.quotation.medicationName}
                      </span>
                      <span className="text-[#6B7280]">
                        {" "}
                        · {rx.quotation.quantity}
                      </span>
                    </div>
                  )}

                  <div className="mt-2 flex items-start gap-1.5 text-[11px] text-muted-foreground">
                    <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                    {rx.delivery === "collect" ? (
                      <span>
                        Collection —{" "}
                        {rx.collectionBranchId
                          ? rx.collectionBranchId
                              .replace(/_/g, " ")
                              .replace(/\b\w/g, (c) =>
                                c.toUpperCase()
                              )
                          : "Branch"}
                      </span>
                    ) : rx.deliveryAddress ? (
                      <span>
                        {rx.deliveryAddress.streetAddress},{" "}
                        {rx.deliveryAddress.suburb},{" "}
                        {rx.deliveryAddress.city}
                      </span>
                    ) : (
                      <span>Address on file</span>
                    )}
                  </div>

                  {rx.customerPhone && (
                    <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <Phone className="h-3 w-3 text-primary" />
                      {rx.customerPhone}
                    </div>
                  )}

                  {rx.paidAt && (
                    <div className="mt-1 text-[10px] text-muted-foreground">
                      Paid: {rx.paidAt}
                    </div>
                  )}

                  {rx.driverName && (
                    <div
                      className="mt-2 rounded-md p-2 text-[11px]"
                      style={{
                        background: "#F5F3FF",
                        border: "1px solid #DDD6FE",
                      }}
                    >
                      <div className="font-bold text-[#5B21B6]">
                        {rx.driverName}
                      </div>
                      <div className="text-[#7C3AED]">
                        {rx.driverVehicle}
                      </div>
                      {rx.dispatchedAt && (
                        <div className="text-[#6B7280]">
                          Dispatched: {rx.dispatchedAt}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-3 flex gap-2">
                    {isPaid && !rx.driverName && (
                      <button
                        onClick={() => setAssignRxFor(rx)}
                        className="flex-1 rounded-md bg-primary py-2 text-[11px] font-bold text-white hover:bg-primary-dark"
                      >
                        Assign Driver
                      </button>
                    )}
                    {isPaid && rx.driverName && (
                      <button
                        onClick={() =>
                          updateStatusShared(
                            rx.id,
                            "Out for Delivery"
                          )
                        }
                        className="flex-1 rounded-md bg-violet-600 py-2 text-[11px] font-bold text-white hover:bg-violet-700"
                      >
                        Mark Out for Delivery
                      </button>
                    )}
                    {isOutForDelivery && (
                      <button
                        onClick={() => {
                          updateStatusShared(rx.id, "Delivered");
                          toast.success(
                            rx.patientName +
                              "'s medication delivered"
                          );
                        }}
                        className="flex-1 rounded-md bg-emerald-600 py-2 text-[11px] font-bold text-white hover:bg-emerald-700"
                      >
                        Mark Delivered
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-6">
        <div className="mb-3 flex items-center gap-2">
          <Package className="h-5 w-5 text-foreground" />
          <h2 className="text-base font-bold text-foreground">
            OTC Orders
          </h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-4">
          {COLUMNS.map((col) => {
            const cards = deliveries.filter(
              (d) => d.status === col.key
            );
            return (
              <div
                key={col.key}
                id={col.key === "Confirmed" ? "new-orders-col" : undefined}
                className="flex flex-col rounded-xl border border-border bg-white shadow-sm"
              >
                <header className="flex items-center justify-between border-b border-border px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: col.color }}
                    />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                      {col.label}
                    </h3>
                  </div>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                    {cards.length}
                  </span>
                </header>
                <div className="flex-1 space-y-2 p-3">
                  {cards.length === 0 && (
                    <p className="py-4 text-center text-[11px] text-muted-foreground">
                      Empty
                    </p>
                  )}
                  {cards.map((d) => {
                    const drv = driverById(d.driverId);
                    return (
                      <article
                        key={d.id}
                        className="rounded-lg border border-border bg-card p-3 shadow-sm"
                      >
                        <div className="flex items-start justify-between">
                          <div className="text-xs font-bold text-foreground">
                            {d.id}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                            {d.status === "Confirmed" && (
                              <span className="rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-white">
                                NEW
                              </span>
                            )}
                            {fmtUSD(d.total)}
                          </div>
                        </div>
                        <div className="mt-1 text-xs font-semibold text-foreground">
                          {d.customer}
                        </div>
                        <div className="mt-1 flex items-start gap-1 text-[11px] text-muted-foreground">
                          <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
                          <span className="line-clamp-2">
                            {d.address}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
                          <span>
                            {d.items} item{d.items > 1 ? "s" : ""}{" "}
                            · {d.placedAt}
                          </span>
                          <span>{d.paymentMethod}</span>
                        </div>
                        {drv && (
                          <div className="mt-2 rounded bg-muted/50 p-1.5 text-[11px]">
                            <div className="font-bold text-foreground">
                              {drv.name}
                            </div>
                            <div className="text-muted-foreground">
                              {drv.vehicle}
                              {d.eta ? " · ETA " + d.eta : ""}
                            </div>
                          </div>
                        )}
                        <div className="mt-2 flex gap-1">
                          {d.status === "Confirmed" && (
                            <button
                              onClick={() =>
                                advance(d.id, "Ready to dispatch")
                              }
                              className="flex-1 rounded bg-primary px-2 py-1.5 text-[11px] font-bold text-primary-foreground hover:bg-primary-dark"
                            >
                              Mark as Packed
                            </button>
                          )}
                          {d.status === "Ready to dispatch" && (
                            <button
                              onClick={() => setAssignFor(d)}
                              className="flex-1 rounded bg-primary px-2 py-1.5 text-[11px] font-bold text-primary-foreground hover:bg-primary-dark"
                            >
                              Assign Driver &amp; Dispatch
                            </button>
                          )}
                          {d.status === "Assigned" && (
                            <button
                              onClick={() =>
                                advance(d.id, "Out for delivery")
                              }
                              className="flex-1 rounded bg-violet-600 px-2 py-1.5 text-[11px] font-bold text-white hover:bg-violet-700"
                            >
                              Start Delivery
                            </button>
                          )}
                          {d.status === "Out for delivery" && (
                            <button
                              onClick={() =>
                                advance(d.id, "Delivered")
                              }
                              className="flex-1 rounded bg-emerald-600 px-2 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-700"
                            >
                              Mark as Delivered
                            </button>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {assignFor && (
        <AssignDriverModal
          delivery={assignFor}
          drivers={drivers.filter((d) => d.status === "Available")}
          onCancel={() => setAssignFor(null)}
          onAssign={(driverId) => assign(assignFor.id, driverId)}
        />
      )}

      {assignRxFor && (
        <AssignRxDriverModal
          rxId={assignRxFor.id}
          patientName={assignRxFor.patientName}
          drivers={drivers.filter((d) => d.status === "Available")}
          onCancel={() => setAssignRxFor(null)}
          onAssign={(driver) => assignRxDriver(assignRxFor.id, driver)}
        />
      )}
    </div>
  );
}

function AssignRxDriverModal({
  rxId,
  patientName,
  drivers,
  onCancel,
  onAssign,
}: {
  rxId: string;
  patientName: string;
  drivers: StaffDriver[];
  onCancel: () => void;
  onAssign: (driver: StaffDriver) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-border px-5 py-3">
          <div>
            <h2 className="text-sm font-extrabold">
              Assign driver — Prescription Order
            </h2>
            <p className="text-xs text-muted-foreground">
              {rxId} · {patientName}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="rounded-md p-1.5 hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="space-y-2 p-5">
          {drivers.length === 0 && (
            <p className="text-center text-sm text-muted-foreground">
              No drivers available right now.
            </p>
          )}
          {drivers.map((d) => (
            <button
              key={d.id}
              onClick={() => onAssign(d)}
              className="flex w-full items-center gap-3 rounded-lg border border-border p-3 text-left hover:border-primary hover:bg-primary/5"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {d.name
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-foreground">
                  {d.name}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {d.vehicle} · {d.zone}
                </div>
              </div>
              <div className="text-right text-[10px]">
                <div className="font-bold text-emerald-600">
                  Available
                </div>
                <div className="text-muted-foreground">
                  {d.completedToday} today
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function AssignDriverModal({
  delivery,
  drivers,
  onCancel,
  onAssign,
}: {
  delivery: StaffDelivery;
  drivers: StaffDriver[];
  onCancel: () => void;
  onAssign: (id: string) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-border px-5 py-3">
          <div>
            <h2 className="text-sm font-extrabold">Assign driver</h2>
            <p className="text-xs text-muted-foreground">
              {delivery.id} · {delivery.customer}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="rounded-md p-1.5 hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="space-y-2 p-5">
          {drivers.length === 0 && (
            <p className="text-center text-sm text-muted-foreground">
              No drivers available right now.
            </p>
          )}
          {drivers.map((d) => (
            <button
              key={d.id}
              onClick={() => onAssign(d.id)}
              className="flex w-full items-center gap-3 rounded-lg border border-border p-3 text-left hover:border-primary hover:bg-primary/5"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {d.name
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-foreground">
                  {d.name}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {d.vehicle} · {d.zone}
                </div>
              </div>
              <div className="text-right text-[10px]">
                <div className="font-bold text-emerald-600">Free</div>
                <div className="text-muted-foreground">
                  {d.completedToday} today
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function DriversView({
  drivers,
  deliveries,
}: {
  drivers: StaffDriver[];
  deliveries: StaffDelivery[];
}) {
  return (
    <div>
      <PageHeader
        title="Drivers"
        subtitle="Fleet status, performance, and current loads."
      />
      <div className="grid gap-4 md:grid-cols-2">
        {drivers.map((d) => {
          const active = deliveries.filter(
            (x) =>
              x.driverId === d.id &&
              (x.status === "Assigned" ||
                x.status === "Out for delivery")
          );
          return (
            <Card key={d.id}>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {d.name
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold">{d.name}</h4>
                    <StatusPill status={d.status} />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {d.vehicle}
                  </div>
                </div>
                <a
                  href={"tel:" + d.phone}
                  className="rounded-md border border-border p-2 hover:bg-muted"
                >
                  <Phone className="h-4 w-4" />
                </a>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded bg-muted/50 p-2">
                  <div className="font-bold text-foreground">
                    {d.completedToday}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    Today
                  </div>
                </div>
                <div className="rounded bg-muted/50 p-2">
                  <div className="font-bold text-foreground">
                    {active.length}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    Active
                  </div>
                </div>
                <div className="rounded bg-muted/50 p-2">
                  <div
                    className="truncate font-bold text-foreground"
                    title={d.zone}
                  >
                    {d.zone.split(" / ")[0]}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    Zone
                  </div>
                </div>
              </div>
              {active.length > 0 && (
                <div className="mt-3 space-y-1">
                  {active.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center justify-between rounded bg-amber-50 px-2 py-1.5 text-[11px]"
                    >
                      <span className="font-semibold">
                        {a.id} &rarr; {a.customer}
                      </span>
                      <span className="flex items-center gap-1 text-amber-700">
                        <Clock className="h-3 w-3" />{" "}
                        {a.eta ?? "—"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function HistoryView({
  deliveries,
  drivers,
}: {
  deliveries: StaffDelivery[];
  drivers: StaffDriver[];
}) {
  const done = deliveries.filter((d) => d.status === "Delivered");
  const driverById = (id?: string) =>
    drivers.find((d) => d.id === id);
  return (
    <div>
      <PageHeader
        title="Delivery History"
        subtitle="Completed deliveries — today"
      />
      <Card>
        <table className="w-full text-sm">
          <thead className="text-left text-[10px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="py-2">Order</th>
              <th>Customer</th>
              <th>Driver</th>
              <th>Placed</th>
              <th className="text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {done.map((d) => (
              <tr key={d.id}>
                <td className="py-2 font-mono text-xs">{d.id}</td>
                <td>{d.customer}</td>
                <td className="text-xs">
                  {driverById(d.driverId)?.name ?? "—"}
                </td>
                <td className="text-xs text-muted-foreground">
                  {d.placedAt}
                </td>
                <td className="text-right font-bold">
                  {fmtUSD(d.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
