import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  STAFF_DRIVERS,
  type StaffDelivery,
  type StaffDriver,
} from "@/data/staffDemo";
import { useSharedPrescriptions } from "@/store/sharedPrescriptions";
import { useSharedOrders } from "@/store/sharedOrders";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, KPI, Card, StatusPill, fmtUSD } from "./shared";
import { DriverPortalView } from "./DriverPortalView";
import {
  Truck, MapPin, Phone, Package, CheckCircle2,
  X, Clock, UserCheck, FileText, User, Search, CalendarDays,
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
          phone: o.phone,
          deliveryAddress: o.deliveryAddress,
        };
      }),
    [sharedOrders]
  );

  // Demo seed data removed — dispatch board only shows real customer orders.
  const deliveries = liveDeliveries;
  const isLiveOrder = (_id: string) => true;
  const setDeliveries: (
    updater: (prev: StaffDelivery[]) => StaffDelivery[]
  ) => void = () => {};

  const [drivers, setDrivers] = useState<StaffDriver[]>(STAFF_DRIVERS);

  // Live drivers from Supabase — replaces the hardcoded list when available.
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data, error } = await supabase
        .from("drivers")
        .select("*")
        .order("name");
      if (cancelled || error || !data || data.length === 0) return;
      setDrivers(
        data.map((d) => ({
          id: d.id,
          name: d.name,
          phone: d.phone,
          vehicle: d.vehicle + " · " + d.plate,
          status: d.off_duty ? "Off duty" : "Available",
          zone: d.branch ?? "—",
          activeOrders: 0,
          completedToday: 0,
        }))
      );
    };
    load();
    const ch = supabase
      .channel("dispatch_drivers")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "drivers" },
        () => load()
      )
      .subscribe();
    return () => {
      cancelled = true;
      void supabase.removeChannel(ch);
    };
  }, []);

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
    return <DriversView drivers={drivers} />;
  if (view === "driver-portal") return <DriverPortalView />;
  if (view === "history")
    return (
      <HistoryView
        sharedOrders={sharedOrders}
        rxDelivered={sharedPrescriptions.filter((p) => p.status === "Delivered")}
        drivers={drivers}
      />
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
                        {(() => {
                          const da = d.deliveryAddress;
                          const recipient = da
                            ? [da.firstName, da.lastName].filter(Boolean).join(" ").trim()
                            : "";
                          const line1 = da?.street || d.address;
                          const line2 = da
                            ? [da.suburb, da.city, da.province].filter(Boolean).join(", ")
                            : "";
                          return (
                            <div className="mt-1 flex items-start gap-1 text-[11px] text-muted-foreground">
                              <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
                              <div className="min-w-0 break-words">
                                {recipient && recipient !== d.customer && (
                                  <div className="font-semibold text-foreground">{recipient}</div>
                                )}
                                <div>{line1}</div>
                                {line2 && <div>{line2}</div>}
                                {da?.postal && <div>{da.postal}</div>}
                                {(da?.phone || d.phone) && (
                                  <div className="flex items-center gap-1 pt-0.5">
                                    <Phone className="h-3 w-3" />
                                    <a
                                      href={"tel:" + (da?.phone || d.phone)}
                                      className="text-primary hover:underline"
                                    >
                                      {da?.phone || d.phone}
                                    </a>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })()}
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
}: {
  drivers: StaffDriver[];
}) {
  const sharedOrders = useSharedOrders((s) => s.orders);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const extractZone = (address?: string) => {
    if (!address) return "—";
    const parts = address.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2) return parts[parts.length - 2];
    return parts[0] ?? "—";
  };

  const startOfToday = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, []);

  const statsByDriver = useMemo(() => {
    const map = new Map<
      string,
      { active: typeof sharedOrders; deliveredToday: number }
    >();
    for (const d of drivers) {
      map.set(d.name, { active: [], deliveredToday: 0 });
    }
    for (const o of sharedOrders) {
      if (!o.driverName) continue;
      const entry = map.get(o.driverName);
      if (!entry) continue;
      if (o.status === "Assigned" || o.status === "Out for delivery") {
        entry.active.push(o);
      } else if (
        o.status === "Delivered" &&
        Number(o.placedTs ?? 0) >= startOfToday
      ) {
        entry.deliveredToday += 1;
      }
    }
    return map;
  }, [drivers, sharedOrders, startOfToday]);

  const getStats = (name: string) =>
    statsByDriver.get(name) ?? { active: [], deliveredToday: 0 };

  const totals = useMemo(() => {
    let onDelivery = 0;
    let available = 0;
    let offDuty = 0;
    for (const d of drivers) {
      if (d.status === "Off duty") {
        offDuty += 1;
        continue;
      }
      const s = getStats(d.name);
      if (s.active.length > 0) onDelivery += 1;
      else available += 1;
    }
    return { total: drivers.length, onDelivery, available, offDuty };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drivers, statsByDriver]);

  return (
    <div>
      <PageHeader
        title="Drivers"
        subtitle="Fleet status, performance, and current loads."
      />
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "Total Drivers", value: totals.total, color: "#1B3A6B" },
          { label: "On Delivery", value: totals.onDelivery, color: "#1E5BC6" },
          { label: "Available", value: totals.available, color: "#16a34a" },
          { label: "Off Duty", value: totals.offDuty, color: "#94a3b8" },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-border bg-card p-4 text-center"
          >
            <div
              className="text-2xl font-black"
              style={{ color: s.color }}
            >
              {s.value}
            </div>
            <div className="mt-0.5 text-[11px] text-muted-foreground">
              {s.label}
            </div>
          </div>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {drivers.map((d) => {
          const s = getStats(d.name);
          const current = s.active[0];
          const isOffDuty = d.status === "Off duty";
          const liveStatus: "On delivery" | "Available" | "Off duty" =
            isOffDuty
              ? "Off duty"
              : s.active.length > 0
                ? "On delivery"
                : "Available";
          const zone = current ? extractZone(current.address) : "—";
          const expanded = expandedId === d.id;
          return (
            <Card
              key={d.id}
              className={
                current
                  ? "cursor-pointer transition hover:shadow-md"
                  : undefined
              }
              onClick={
                current
                  ? () => setExpandedId(expanded ? null : d.id)
                  : undefined
              }
            >
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
                    <StatusPill status={liveStatus} />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {d.vehicle}
                  </div>
                </div>
                <a
                  href={"tel:" + d.phone}
                  onClick={(e) => e.stopPropagation()}
                  className="rounded-md border border-border p-2 hover:bg-muted"
                >
                  <Phone className="h-4 w-4" />
                </a>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded bg-muted/50 p-2">
                  <div className="font-bold text-foreground">
                    {s.deliveredToday}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    Delivered Today
                  </div>
                </div>
                <div className="rounded bg-muted/50 p-2">
                  <div
                    className={
                      "font-bold " +
                      (s.active.length > 0
                        ? "text-primary"
                        : "text-muted-foreground")
                    }
                  >
                    {s.active.length}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    Active Now
                  </div>
                </div>
                <div className="rounded bg-muted/50 p-2">
                  <div
                    className="truncate font-bold text-foreground"
                    title={zone}
                  >
                    {zone}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    Current Zone
                  </div>
                </div>
              </div>
              {s.active.length > 0 && !expanded && (
                <div className="mt-3 space-y-1">
                  {s.active.map((a) => (
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
                  <div className="text-center text-[10px] font-semibold text-primary">
                    Tap card to see delivery details ▾
                  </div>
                </div>
              )}
              {expanded && current && (
                <div className="mt-3 space-y-1.5 border-t border-border pt-3 text-[11px]">
                  <div className="mb-1 text-[10px] font-black uppercase tracking-wider text-primary">
                    Current Delivery
                  </div>
                  <Row label="Order" value={"#" + current.id} />
                  <Row label="Customer" value={current.customer} />
                  <Row
                    label="Phone"
                    value={
                      <a
                        href={"tel:" + current.phone}
                        onClick={(e) => e.stopPropagation()}
                        className="font-semibold text-primary hover:underline"
                      >
                        {current.phone}
                      </a>
                    }
                  />
                  <Row
                    label="Address"
                    value={(() => {
                      const da = current.deliveryAddress;
                      if (!da) return current.address;
                      const recipient = [da.firstName, da.lastName].filter(Boolean).join(" ").trim();
                      const parts = [
                        recipient,
                        da.street,
                        [da.suburb, da.city].filter(Boolean).join(", "),
                        [da.province, da.postal].filter(Boolean).join(" "),
                      ].filter(Boolean);
                      return (
                        <span className="whitespace-pre-line">{parts.join("\n")}</span>
                      );
                    })()}
                  />
                  <Row
                    label="Items"
                    value={
                      Array.isArray(current.items)
                        ? current.items
                            .map((i) => i.name + " ×" + i.qty)
                            .join(", ")
                        : "—"
                    }
                  />
                  <Row label="Total" value={fmtUSD(Number(current.total))} />
                  <Row label="Payment" value={current.paymentMethod} />
                  <Row label="Status" value={current.status} />
                  <div className="mt-3 flex gap-2 border-t border-border pt-3">
                    <a
                      href={"tel:" + current.phone}
                      onClick={(e) => e.stopPropagation()}
                      className="flex h-9 flex-1 items-center justify-center gap-1 rounded-full bg-primary/10 text-xs font-bold text-primary transition hover:bg-primary hover:text-primary-foreground"
                    >
                      <Phone className="h-3 w-3" /> Call Customer
                    </a>
                    <a
                      href={"tel:" + d.phone}
                      onClick={(e) => e.stopPropagation()}
                      className="flex h-9 flex-1 items-center justify-center gap-1 rounded-full bg-[#1B3A6B] text-xs font-bold text-white transition hover:bg-primary"
                    >
                      <Phone className="h-3 w-3" /> Call Driver
                    </a>
                  </div>
                  <div className="pt-1 text-center text-[10px] font-semibold text-muted-foreground">
                    Tap card to collapse ▴
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="shrink-0 font-bold text-muted-foreground">{label}</span>
      <span className="text-right text-foreground">{value}</span>
    </div>
  );
}

type HistoryRow = {
  id: string;
  kind: "OTC" | "Rx";
  customer: string;
  phone?: string;
  address: string;
  itemsLabel: string;
  total: number;
  payment: string;
  driverName?: string;
  placedAtMs: number;
  placedAtLabel: string;
  deliveredAtMs?: number;
  deliveredAtLabel?: string;
};

function toMs(v: unknown): number {
  if (!v) return 0;
  if (typeof v === "number") return v;
  const n = Date.parse(String(v));
  return isNaN(n) ? 0 : n;
}

function HistoryView({
  sharedOrders,
  rxDelivered,
  drivers,
}: {
  sharedOrders: ReturnType<typeof useSharedOrders.getState>["orders"];
  rxDelivered: ReturnType<typeof useSharedPrescriptions.getState>["prescriptions"];
  drivers: StaffDriver[];
}) {
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<"today" | "week" | "all">("all");

  const driverById = (id?: string) => drivers.find((d) => d.id === id);

  const rows: HistoryRow[] = useMemo(() => {
    const otcLive: HistoryRow[] = sharedOrders
      .filter((o) => o.status === "Delivered")
      .map((o) => {
        const placedMs = toMs(o.placedAt);
        const delMs = toMs(o.deliveredAt);
        return {
          id: o.id,
          kind: "OTC",
          customer: o.customer,
          phone: o.phone,
          address: o.address,
          itemsLabel: (o.items ?? [])
            .map((it: { name: string; qty: number }) => it.name + " ×" + it.qty)
            .join(", "),
          total: o.total,
          payment: o.paymentMethod,
          driverName: o.driverName,
          placedAtMs: placedMs,
          placedAtLabel: placedMs ? new Date(placedMs).toLocaleString() : o.placedAt,
          deliveredAtMs: delMs || undefined,
          deliveredAtLabel: delMs ? new Date(delMs).toLocaleString() : undefined,
        };
      });

    const rx: HistoryRow[] = rxDelivered.map((p) => {
      const placedMs = toMs(p.paidAt ?? p.uploadedAt);
      const addr = p.deliveryAddress
        ? p.deliveryAddress.streetAddress + ", " + p.deliveryAddress.suburb + ", " + p.deliveryAddress.city
        : "Collection at branch";
      return {
        id: p.id,
        kind: "Rx",
        customer: p.patientName,
        phone: p.customerPhone,
        address: addr,
        itemsLabel: p.quotation
          ? p.quotation.medicationName + " · " + p.quotation.quantity
          : "Prescription",
        total: p.quotation?.total ?? 0,
        payment: p.paymentMethod ?? "Paid",
        driverName: p.driverName,
        placedAtMs: placedMs,
        placedAtLabel: placedMs ? new Date(placedMs).toLocaleString() : (p.paidAt ?? p.uploadedAt ?? ""),
      };
    });

    return [...otcLive, ...rx].sort(
      (a, b) => (b.deliveredAtMs ?? b.placedAtMs) - (a.deliveredAtMs ?? a.placedAtMs)
    );
  }, [sharedOrders, rxDelivered, drivers]);

  const now = Date.now();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const filtered = rows.filter((r) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      r.id.toLowerCase().includes(q) ||
      r.customer.toLowerCase().includes(q);
    const matchesDate =
      dateFilter === "all" ||
      (dateFilter === "today" && r.placedAtMs >= startOfToday.getTime()) ||
      (dateFilter === "week" && now - r.placedAtMs < 7 * 24 * 60 * 60 * 1000);
    return matchesSearch && matchesDate;
  });

  const todayRows = rows.filter((r) => r.placedAtMs >= startOfToday.getTime());
  const todayRevenue = todayRows.reduce((s, r) => s + (r.total ?? 0), 0);
  const avgMin =
    todayRows.length > 0
      ? Math.round(
          todayRows.reduce((s, r) => {
            const d = r.deliveredAtMs ?? r.placedAtMs;
            return s + (d - r.placedAtMs) / 60000;
          }, 0) / todayRows.length
        )
      : 0;

  return (
    <div>
      <PageHeader
        title="Delivery History"
        subtitle="Completed OTC and prescription deliveries"
      />

      <div className="mb-4 grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-white p-3 text-center shadow-sm ring-1 ring-border">
          <div className="text-2xl font-black text-[#1B3A6B]">{todayRows.length}</div>
          <div className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
            Delivered today
          </div>
        </div>
        <div className="rounded-xl bg-white p-3 text-center shadow-sm ring-1 ring-border">
          <div className="text-2xl font-black text-[#1B3A6B]">{fmtUSD(todayRevenue)}</div>
          <div className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
            Revenue today
          </div>
        </div>
        <div className="rounded-xl bg-white p-3 text-center shadow-sm ring-1 ring-border">
          <div className="text-2xl font-black text-[#1B3A6B]">{avgMin}m</div>
          <div className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
            Avg delivery time
          </div>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order ID or customer..."
            className="h-9 w-full rounded-full border border-slate-200 bg-white pl-9 pr-4 text-sm outline-none focus:border-[#1E5BC6]"
          />
        </div>
        {(["today", "week", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setDateFilter(f)}
            className={
              "inline-flex items-center gap-1 h-9 rounded-full px-4 text-xs font-bold capitalize transition " +
              (dateFilter === f
                ? "bg-[#1E5BC6] text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:border-[#1E5BC6]")
            }
          >
            <CalendarDays className="h-3.5 w-3.5" />
            {f === "today" ? "Today" : f === "week" ? "This week" : "All time"}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl bg-white py-16 text-center shadow-sm ring-1 ring-border">
          <div className="mb-3 text-5xl">📋</div>
          <div className="text-lg font-bold text-[#1B3A6B]">
            No delivered orders yet
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            Delivered orders will appear here
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => {
            const minutes =
              r.deliveredAtMs && r.placedAtMs
                ? Math.max(1, Math.round((r.deliveredAtMs - r.placedAtMs) / 60000))
                : null;
            return (
              <div
                key={r.kind + "-" + r.id}
                className="rounded-2xl border-l-4 border-[#1E5BC6] bg-white p-4 shadow-sm transition hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-black text-[#1B3A6B]">
                        #{r.id}
                      </span>
                      <span className="rounded-full bg-[#EAF3FF] px-2 py-0.5 text-[10px] font-bold text-[#1E5BC6]">
                        ✓ Delivered
                      </span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                        {r.kind}
                      </span>
                      {minutes && (
                        <span className="text-[11px] text-slate-400">
                          in {minutes} min
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-700">
                      {r.customer}
                    </div>
                    <div className="text-xs text-slate-400">
                      {r.phone ? r.phone + " · " : ""}
                      {r.address}
                    </div>
                    {r.itemsLabel && (
                      <div className="mt-2 text-[11px] text-slate-500">
                        {r.itemsLabel}
                      </div>
                    )}
                    <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                      <div>
                        <span className="font-semibold">Ordered:</span>{" "}
                        {r.placedAtLabel}
                      </div>
                      {r.deliveredAtLabel && (
                        <div>
                          <span className="font-semibold">Delivered:</span>{" "}
                          {r.deliveredAtLabel}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-black text-[#1B3A6B]">
                      {fmtUSD(r.total)}
                    </div>
                    <div className="mt-0.5 text-xs text-slate-400">
                      {r.payment}
                    </div>
                    {r.driverName && (
                      <div className="mt-0.5 text-xs text-slate-400">
                        🚗 {r.driverName}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
