import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Truck,
  Package,
  Phone,
  MapPin,
  CheckCircle2,
  Play,
  Navigation,
  User as UserIcon,
} from "lucide-react";
import { STAFF_DRIVERS } from "@/data/staffDemo";
import { useSharedOrders, type SharedOrder } from "@/store/sharedOrders";
import { useSharedPrescriptions, type SharedPrescription } from "@/store/sharedPrescriptions";
import { PageHeader, KPI, Card, StatusPill } from "./shared";

/**
 * Driver-perspective tab embedded inside the staff dashboard.
 * Lets a driver see their assigned orders + scripts and progress them
 * (Start delivery → Delivered). Updates flow through the same shared
 * stores, so the customer track page updates within ~1s.
 */
export function DriverPortalView() {
  const [driverId, setDriverId] = useState(STAFF_DRIVERS[0]?.id ?? "");
  const driver = STAFF_DRIVERS.find((d) => d.id === driverId) ?? STAFF_DRIVERS[0];

  const orders = useSharedOrders((s) => s.orders);
  const startDelivery = useSharedOrders((s) => s.startDelivery);
  const updateOrderStatus = useSharedOrders((s) => s.updateStatus);

  const prescriptions = useSharedPrescriptions((s) => s.prescriptions);
  const updateRxStatus = useSharedPrescriptions((s) => s.updateStatus);

  // Match a driver to live orders/rx by name (driverName field).
  const myOrders: SharedOrder[] = useMemo(
    () =>
      orders.filter(
        (o) =>
          o.driverName === driver?.name &&
          (o.status === "Assigned" || o.status === "Out for delivery"),
      ),
    [orders, driver],
  );
  const myRx: SharedPrescription[] = useMemo(
    () =>
      prescriptions.filter(
        (p) => p.driverName === driver?.name && p.status === "Out for Delivery",
      ),
    [prescriptions, driver],
  );

  const deliveredToday =
    orders.filter((o) => o.driverName === driver?.name && o.status === "Delivered").length +
    prescriptions.filter((p) => p.driverName === driver?.name && p.status === "Delivered").length;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <PageHeader
          title="Driver Portal"
          subtitle="Drivers see only their assigned orders. Mark deliveries as customers wait."
        />
        <select
          value={driverId}
          onChange={(e) => setDriverId(e.target.value)}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground"
        >
          {STAFF_DRIVERS.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name} · {d.vehicle}
            </option>
          ))}
        </select>
      </div>

      {driver && (
        <div className="mb-4 flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <UserIcon className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-bold text-foreground">{driver.name}</div>
            <div className="text-xs text-muted-foreground">
              {driver.vehicle} · {driver.phone}
            </div>
          </div>
          <StatusPill tone="success" label={driver.status} />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <KPI label="My active orders" value={String(myOrders.length + myRx.length)} accent="#0EA5E9" icon={<Truck className="h-5 w-5" />} />
        <KPI label="Out for delivery" value={String(myOrders.filter((o) => o.status === "Out for delivery").length + myRx.length)} accent="#7C3AED" icon={<Navigation className="h-5 w-5" />} />
        <KPI label="Delivered today" value={String(deliveredToday)} accent="#059669" icon={<CheckCircle2 className="h-5 w-5" />} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card title={`OTC orders (${myOrders.length})`}>
          {myOrders.length === 0 ? (
            <EmptyHint text="No OTC orders assigned to you right now." />
          ) : (
            <div className="space-y-3">
              {myOrders.map((o) => (
                <OrderRow key={o.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-foreground">{o.id}</div>
                      <div className="text-xs text-muted-foreground">{o.customer} · {o.phone}</div>
                    </div>
                    <StatusPill tone={o.status === "Out for delivery" ? "info" : "warn"} label={o.status} />
                  </div>
                  <div className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span className="break-words">{o.address}</span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    <Package className="mr-1 inline h-3.5 w-3.5" />
                    {o.itemCount} item{o.itemCount === 1 ? "" : "s"} · ${o.total.toFixed(2)}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <a
                      href={`tel:${o.phone}`}
                      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
                    >
                      <Phone className="h-3.5 w-3.5" /> Call
                    </a>
                    {o.status === "Assigned" ? (
                      <button
                        onClick={() => {
                          startDelivery(o.id);
                          toast.success("Started delivery for " + o.id);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-md bg-[#7C3AED] px-2.5 py-1.5 text-xs font-bold text-white hover:bg-[#6D28D9]"
                      >
                        <Play className="h-3.5 w-3.5" /> Start delivery
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          updateOrderStatus(o.id, "Delivered");
                          toast.success("Order " + o.id + " marked delivered");
                        }}
                        className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Mark delivered
                      </button>
                    )}
                  </div>
                </OrderRow>
              ))}
            </div>
          )}
        </Card>

        <Card title={`Prescription deliveries (${myRx.length})`}>
          {myRx.length === 0 ? (
            <EmptyHint text="No prescription deliveries assigned to you." />
          ) : (
            <div className="space-y-3">
              {myRx.map((p) => (
                <OrderRow key={p.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-foreground">{p.id}</div>
                      <div className="text-xs text-muted-foreground">{p.patientName} · {p.customerPhone}</div>
                    </div>
                    <StatusPill tone="info" label={p.status} />
                  </div>
                  {p.deliveryAddress && (
                    <div className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span className="break-words">
                        {p.deliveryAddress.streetAddress}, {p.deliveryAddress.suburb}, {p.deliveryAddress.city}
                      </span>
                    </div>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <a
                      href={`tel:${p.customerPhone}`}
                      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
                    >
                      <Phone className="h-3.5 w-3.5" /> Call
                    </a>
                    <button
                      onClick={() => {
                        updateRxStatus(p.id, "Delivered");
                        toast.success("Prescription " + p.id + " delivered");
                      }}
                      className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> Mark delivered
                    </button>
                  </div>
                </OrderRow>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function OrderRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-background p-3 transition hover:border-primary/40">
      {children}
    </div>
  );
}

function EmptyHint({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center text-xs text-muted-foreground">
      {text}
    </div>
  );
}