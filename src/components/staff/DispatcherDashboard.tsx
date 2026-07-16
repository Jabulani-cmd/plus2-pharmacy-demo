import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  STAFF_DRIVERS,
  type StaffDelivery,
  type StaffDriver,
} from "@/data/staffDemo";
import { useSharedPrescriptions, refreshPrescriptions as refreshRx } from "@/store/sharedPrescriptions";
import type { SharedPrescriptionStatus } from "@/store/sharedPrescriptions";
import { useSharedOrders } from "@/store/sharedOrders";
import type { SharedOrder, SharedOrderStatus } from "@/store/sharedOrders";
import { useStaffAuth } from "@/store/staffAuth";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, KPI, Card, StatusPill, fmtUSD } from "./shared";
import { DriverPortalView } from "./DriverPortalView";
import { DispatcherRxQueue } from "./DispatcherRxQueue";
import {
  Truck, MapPin, Phone, Package, CheckCircle2,
  X, Clock, UserCheck, FileText, User, Search, CalendarDays, Store,
} from "lucide-react";

const PRODUCTION_DOMAIN = "https://www.kingspharmacy-mavingtech.online";

function ShareDriverInstallCard() {
  const [copied, setCopied] = useState(false);
  const installUrl = PRODUCTION_DOMAIN + "/get-driver-app";
  const whatsappText = encodeURIComponent(
    `Hi! Please install the Kings Pharmacy Driver app on your phone:\n\n` +
    `📲 *Install link:*\n` +
    `${installUrl}\n\n` +
    `*Android phone:*\n` +
    `1. Open the link in Chrome\n` +
    `2. Tap the ⋮ menu → "Add to Home screen"\n` +
    `3. Tap Install\n` +
    `4. Open KP Driver from your home screen\n` +
    `5. Sign in with your driver email and password\n\n` +
    `*iPhone:*\n` +
    `1. Open the link in Safari (not Chrome)\n` +
    `2. Tap the Share button (□↑) at the bottom\n` +
    `3. Tap "Add to Home Screen"\n` +
    `4. Tap Add\n` +
    `5. Open KP Driver and sign in\n\n` +
    `— Kings Pharmacy Dispatch Team`
  );
  const onCopy = () => {
    navigator.clipboard.writeText(installUrl).then(() => {
      setCopied(true);
      toast.success("Install link copied");
      setTimeout(() => setCopied(false), 1800);
    });
  };
  return (
    <div className="mb-5 rounded-xl border border-[#1E5BC6]/25 bg-[#EAF3FF] p-4">
      <div className="text-sm font-black text-[#1B3A6B]">
        Share Driver App Install Link
      </div>
      <div className="mt-0.5 text-xs text-slate-600">
        Send this to drivers so they can install the KP Driver app on their
        phones.
      </div>
      <div className="mt-3 break-all rounded-md bg-white p-2.5 font-mono text-[11px] text-[#1B3A6B]">
        {installUrl}
      </div>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={onCopy}
          className="h-10 flex-1 rounded-full border-2 border-[#1E5BC6] bg-white text-xs font-bold text-[#1E5BC6] transition hover:bg-[#1E5BC6]/5"
        >
          {copied ? "✅ Copied" : "📋 Copy Link"}
        </button>
        <a
          href={"https://wa.me/?text=" + whatsappText}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full bg-emerald-500 text-xs font-bold text-white transition hover:bg-emerald-600"
        >
          📲 WhatsApp
        </a>
      </div>
    </div>
  );
}

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

// Kings Pharmacy branches — used for the dispatch branch filter.
const DISPATCH_BRANCHES = [
  "9th Ave Branch CBD",
  "6th Ave Branch CBD",
  "Old Mutual Centre, Jason Moyo Ave",
  "Ascot Shopping Centre",
] as const;

export function DispatcherDashboard({ view }: { view?: string }) {
  const staff = useStaffAuth((s) => s.staff);
  const branchName = staff?.branch ?? "Head Office — Bulawayo";

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
          driverLat: o.driverLat,
          driverLng: o.driverLng,
          driverHeading: o.driverHeading,
            branchName: o.branchName ?? "9th Ave Branch CBD",
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

  const [branchFilter, setBranchFilter] = useState<string>("all");
  const [assignFor, setAssignFor] = useState<StaffDelivery | null>(null);

  const filteredDeliveries = useMemo(
    () =>
      liveDeliveries.filter(
        (d) =>
          branchFilter === "all" ||
          (d.branchName ?? "9th Ave Branch CBD") === branchFilter,
      ),
    [liveDeliveries, branchFilter],
  );

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
        [...data]
          .sort((a, b) => {
            if (a.off_duty && !b.off_duty) return 1;
            if (!a.off_duty && b.off_duty) return -1;
            return String(a.name).localeCompare(String(b.name));
          })
          .map((d) => ({
            id: String(d.id ?? ""),
            name: String(d.name ?? ""),
            phone: String(d.phone ?? ""),
            vehicle:
              String(d.vehicle ?? "") +
              (d.plate ? " · " + String(d.plate) : ""),
            status: (d.off_duty
              ? "Off duty"
              : "Available") as "Available" | "On delivery" | "Off duty",
            zone: String(d.branch ?? "—"),
            activeOrders: 0,
            completedToday: 0,
            currentLat: (d as any).current_lat ?? null,
            currentLng: (d as any).current_lng ?? null,
            locationUpdatedAt:
              (d as any).location_updated_at ?? null,
          }))
      );
    };
    void load();
    const interval = setInterval(() => void load(), 30_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // ── Fetch ALL active OTC orders from Supabase on mount ──────────────
  // This ensures dispatcher sees orders placed on other devices/sessions
  // The Zustand store bootstraps only once — this is a safety refresh
  useEffect(() => {
    const fetchOrders = async () => {
      const { data, error } = await supabase
        .from("shared_orders")
        .select("*")
        .not("status", "in", "(Delivered,Archived)")
        .order("placed_ts", { ascending: false });
      if (error || !data) return;
      if (data.length === 0) return;
      useSharedOrders.setState((s) => {
        const existing = new Set(s.orders.map((o) => o.id));
        const incoming = data
          .filter((r) => !existing.has(r.id as string))
          .map((r) => {
            const g = (k: string) => (r as Record<string, unknown>)[k];
            return {
              id: String(g("id") ?? ""),
              customer: String(g("customer") ?? ""),
              phone: String(g("phone") ?? ""),
              address: String(g("address") ?? ""),
              items: (g("items") as SharedOrder["items"]) ?? [],
              itemCount: Number(g("item_count") ?? 0),
              deliveryMethod: String(g("delivery_method") ?? ""),
              paymentMethod: String(g("payment_method") ?? ""),
              paymentRef: String(g("payment_ref") ?? ""),
              subtotal: Number(g("subtotal") ?? 0),
              deliveryFee: Number(g("delivery_fee") ?? 0),
              discountAmount: Number(g("discount_amount") ?? 0),
              total: Number(g("total") ?? 0),
              status: (g("status") ?? "Confirmed") as SharedOrderStatus,
              placedAt: String(g("placed_at") ?? ""),
              placedTs: Number(g("placed_ts") ?? Date.now()),
              branchName:
                (g("branch_name") as string | null) ?? undefined,
              customerId:
                (g("customer_id") as string | null) ?? undefined,
              customerEmail:
                (g("customer_email") as string | null) ?? undefined,
              driverName:
                (g("driver_name") as string | null) ?? undefined,
              driverPhone:
                (g("driver_phone") as string | null) ?? undefined,
              driverVehicle:
                (g("driver_vehicle") as string | null) ?? undefined,
              driverLat:
                g("driver_lat") != null
                  ? Number(g("driver_lat"))
                  : undefined,
              driverLng:
                g("driver_lng") != null
                  ? Number(g("driver_lng"))
                  : undefined,
            } as SharedOrder;
          });
        if (incoming.length === 0) return s;
        return { orders: [...incoming, ...s.orders] };
      });
    };
    void fetchOrders();
    // Refresh every 30 seconds as safety net
    const interval = setInterval(() => void fetchOrders(), 30_000);
    return () => clearInterval(interval);
  }, []);

  // Prescription notifications subscription
  useEffect(() => {
    const ch = supabase
      .channel("dispatcher_rx_notifs")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "staff_notifications" },
        (payload) => {
          const notif = payload.new as {
            kind?: string;
            order_id?: string;
            title?: string;
            body?: string;
          };
          const kind = notif.kind ?? "";
          const orderId = notif.order_id ?? "";

          // New OTC order — fetch it immediately
          if (kind === "new_order" && orderId) {
            void supabase
              .from("shared_orders")
              .select("*")
              .eq("id", orderId)
              .maybeSingle()
              .then(({ data: row }) => {
                if (!row) return;
                useSharedOrders.setState((s) => {
                  if (s.orders.some((o) => o.id === row.id))
                    return s;
                  const g = (k: string) =>
                    (row as Record<string, unknown>)[k];
                  const newOrder: SharedOrder = {
                    id: String(g("id") ?? ""),
                    customer: String(g("customer") ?? ""),
                    phone: String(g("phone") ?? ""),
                    address: String(g("address") ?? ""),
                    items:
                      (g("items") as SharedOrder["items"]) ?? [],
                    itemCount: Number(g("item_count") ?? 0),
                    deliveryMethod: String(g("delivery_method") ?? ""),
                    paymentMethod: String(g("payment_method") ?? ""),
                    paymentRef: String(g("payment_ref") ?? ""),
                    subtotal: Number(g("subtotal") ?? 0),
                    deliveryFee: Number(g("delivery_fee") ?? 0),
                    discountAmount: Number(g("discount_amount") ?? 0),
                    total: Number(g("total") ?? 0),
                    status: (g("status") ?? "Confirmed") as SharedOrderStatus,
                    placedAt: String(g("placed_at") ?? ""),
                    placedTs: Number(g("placed_ts") ?? Date.now()),
                    branchName:
                      (g("branch_name") as string | null) ?? undefined,
                    customerId:
                      (g("customer_id") as string | null) ?? undefined,
                    customerEmail:
                      (g("customer_email") as string | null) ?? undefined,
                  };
                  return { orders: [newOrder, ...s.orders] };
                });
              });
          }

          // Delivery confirmed — update order status
          if (kind === "delivery_confirmed" && orderId) {
            void supabase
              .from("shared_orders")
              .select("*")
              .eq("id", orderId)
              .maybeSingle()
              .then(({ data: row }) => {
                if (!row) return;
                useSharedOrders.setState((s) => ({
                  orders: s.orders.map((o) =>
                    o.id === orderId
                      ? { ...o, status: "Delivered" as SharedOrderStatus }
                      : o
                  ),
                }));
              });
            void refreshRx();
          }

          if (
            kind === "prescription_paid" ||
            kind === "prescription_approved" ||
            kind === "prescription_uploaded" ||
            kind === "driver_assigned" ||
            kind === "driver_collected"
          ) {
            void refreshRx();
            if (orderId) {
              void supabase
                .from("prescriptions")
                .select("*")
                .eq("id", orderId)
                .maybeSingle()
                .then(({ data }) => {
                  if (!data) return;
                  useSharedPrescriptions.setState((s) => {
                    const exists = s.prescriptions.some(
                      (p) => p.id === data.id
                    );
                    if (!exists) {
                      void refreshRx();
                      return s;
                    }
                    return {
                      prescriptions: s.prescriptions.map((p) =>
                        p.id === data.id
                          ? {
                              ...p,
                              status:
                                (data.status as typeof p.status) ??
                                p.status,
                              driverName:
                                data.driver_name ?? p.driverName,
                              paymentMethod:
                                data.payment_method ??
                                p.paymentMethod,
                              paidAt: data.paid_at
                                ? new Date(
                                    String(data.paid_at)
                                  ).toLocaleString("en-ZW")
                                : p.paidAt,
                            }
                          : p
                      ),
                    };
                  });
                });
            }
          }
        }
      )
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, []);

  useEffect(() => {
    void refreshRx();
    const interval = setInterval(() => void refreshRx(), 15_000);
    return () => clearInterval(interval);
  }, []);

  // Real-time: new prescription uploaded → notify dispatcher
  useEffect(() => {
    const ch = supabase
      .channel("dispatcher_rx_incoming")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "prescriptions" },
        (payload) => {
          const rx = payload.new as { id?: string; customer_name?: string; patient_name?: string };
          toast("💊 New prescription received", {
            description:
              (rx.customer_name ?? rx.patient_name ?? "Customer") +
              " uploaded a prescription — " + (rx.id ?? ""),
            duration: 8000,
          });
          if (typeof navigator !== "undefined" && "vibrate" in navigator) {
            try { navigator.vibrate([300, 100, 300]); } catch { /* ignore */ }
          }
          void refreshRx();
        }
      )
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, []);

  const sharedPrescriptions = useSharedPrescriptions(
    (s) => s.prescriptions
  );
  const assignDriverShared = useSharedPrescriptions(
    (s) => s.assignDriver
  );
  const updateStatusShared = useSharedPrescriptions(
    (s) => s.updateStatus
  );

  const rxOrders = sharedPrescriptions
    .filter(
      (p) =>
        p.status === "Paid" ||
        p.status === "Dispensing" ||
        p.status === "Out for Delivery"
    )
    .filter(
      (p) =>
        branchFilter === "all" ||
        (p.branchName ?? "9th Ave Branch CBD") === branchFilter,
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

  const assignRxDriver = async (
    rxId: string,
    driver: StaffDriver
  ) => {
    await assignDriverShared(
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
  if (view === "prescriptions") return <DispatcherRxQueue />;
  if (view === "branch-overview")
    return (
      <BranchOverview
        deliveries={deliveries}
        drivers={drivers}
      />
    );
  if (view === "driver-map")
    return <DriverMapView drivers={drivers} />;
  if (view === "history")
    return (
      <HistoryView
        drivers={drivers}
      />
    );

  const newCount = filteredDeliveries.filter((d) => d.status === "Confirmed").length;

  return (
    <div>
      {/* Branch indicator — always visible */}
      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border-2 border-[#1E5BC6]/25 bg-[#EAF3FF] px-4 py-3">
        <Store className="h-5 w-5 text-[#1B3A6B]" />
        <span className="rounded-full bg-[#1B3A6B] px-3 py-1 text-[11px] font-black uppercase tracking-wider text-white">
          {branchName.toUpperCase()}
        </span>
        <span className="text-xs font-semibold text-[#1B3A6B]">Dispatch Board</span>
        <span className="ml-auto text-[11px] text-slate-600">
          Viewing orders across all branches — operating from {branchName}
        </span>
      </div>

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

      {/* Branch filter chips */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Branch:</span>
        {["all", ...DISPATCH_BRANCHES].map((b) => (
          <button
            key={b}
            type="button"
            onClick={() => setBranchFilter(b)}
            className={
              "rounded-full px-3 py-1 text-[11px] font-bold transition " +
              (branchFilter === b
                ? "bg-[#1B3A6B] text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:border-[#1B3A6B]")
            }
          >
            {b === "all" ? "All Branches" : b}
          </button>
        ))}
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
                      {rx.branchName && (
                        <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-[#EAF3FF] px-2 py-0.5 text-[10px] font-bold text-[#1B3A6B]">
                          🏪 {rx.branchName}
                        </div>
                      )}
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
            const cards = filteredDeliveries.filter(
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
                        {d.branchName && (
                          <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-[#EAF3FF] px-2 py-0.5 text-[10px] font-bold text-[#1B3A6B]">
                            🏪 {d.branchName}
                          </div>
                        )}
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
                        {d.status === "Out for delivery" && d.driverLat != null && (
                          <div className="mt-2 flex items-center gap-1.5 rounded-full bg-violet-100 px-2 py-1 text-[10px] font-bold text-violet-700">
                            <span className="relative flex h-2 w-2">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-500 opacity-75" />
                              <span className="relative inline-flex h-2 w-2 rounded-full bg-violet-600" />
                            </span>
                            Live GPS · updating
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
  onAssign: (driver: StaffDriver) => Promise<void>;
}) {
  const [assigningDriverId, setAssigningDriverId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const assign = async (driver: StaffDriver) => {
    setAssigningDriverId(driver.id);
    setErrorMsg(null);
    try {
      await onAssign(driver);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not assign this driver";
      console.error("[AssignRxDriverModal] assignment failed", err);
      setErrorMsg("Driver assignment failed: " + msg);
      toast.error("Driver assignment failed", { description: msg });
    } finally {
      setAssigningDriverId(null);
    }
  };

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
              onClick={() => void assign(d)}
              disabled={assigningDriverId !== null}
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
                <AssignDriverLocBadge driver={d} />
              </div>
              <div className="text-right text-[10px]">
                <div className="font-bold text-emerald-600">
                  {assigningDriverId === d.id ? "Assigning…" : "Available"}
                </div>
                <div className="text-muted-foreground">
                  {d.completedToday} today
                </div>
              </div>
            </button>
          ))}
          {errorMsg && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">
              {errorMsg}
            </div>
          )}
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
          <div className="rounded-lg border-2 border-[#1E5BC6]/30 bg-[#EAF3FF] p-2">
            <div className="text-[9px] font-black uppercase tracking-wider text-[#1B3A6B]">
              Collection Branch
            </div>
            <div className="text-sm font-bold text-[#1B3A6B]">
              🏪 {delivery.branchName ?? "9th Ave Branch CBD"}
            </div>
            <div className="text-[10px] text-slate-600">
              Driver must collect from this branch before delivery
            </div>
          </div>
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
                <AssignDriverLocBadge driver={d} />
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
      <ShareDriverInstallCard />
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
              <DriverLiveLocation driver={d} />
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
                  {current.driverLat != null && current.driverLng != null && (
                    <div className="mt-2 rounded-lg border border-violet-200 bg-violet-50 p-2">
                      <div className="mb-1 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-violet-700">
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-500 opacity-75" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-violet-600" />
                        </span>
                        📡 Live Location
                      </div>
                      <div className="text-[11px] text-violet-900 tabular-nums">
                        {Number(current.driverLat).toFixed(5)}, {Number(current.driverLng).toFixed(5)}
                      </div>
                      <a
                        href={`https://www.google.com/maps?q=${current.driverLat},${current.driverLng}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1 inline-block text-[11px] font-bold text-violet-700 hover:underline"
                      >
                        Open in Google Maps ↗
                      </a>
                    </div>
                  )}
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

// ─────────────────────────────────────────────────────────────────────────────
// Branch Overview — orders grouped by branch with status counts
// ─────────────────────────────────────────────────────────────────────────────
const BRANCH_LIST = [
  { id: "9th Ave Branch CBD",                label: "9th Ave CBD",    icon: "🏪" },
  { id: "6th Ave Branch CBD",                label: "6th Ave CBD",    icon: "🏪" },
  { id: "Old Mutual Centre, Jason Moyo Ave", label: "Old Mutual",     icon: "🏪" },
  { id: "Ascot Shopping Centre",             label: "Ascot",          icon: "🏪" },
];

const STATUS_COLORS: Record<string, string> = {
  Confirmed:          "#0EA5E9",
  "Ready to dispatch": "#F59E0B",
  Packed:             "#8B5CF6",
  Assigned:           "#6366F1",
  "Out for delivery": "#7C3AED",
  Delivered:          "#10B981",
};

function BranchOverview({
  deliveries,
  drivers,
}: {
  deliveries: StaffDelivery[];
  drivers: StaffDriver[];
}) {
  const sharedOrders = useSharedOrders((s) => s.orders);
  const prescriptions = useSharedPrescriptions((s) => s.prescriptions);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [assigningOrderId, setAssigningOrderId] = useState<string | null>(null);
  const [assigningKind, setAssigningKind] = useState<"OTC" | "Rx">("OTC");
  const [assigningCustomer, setAssigningCustomer] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const activeOrders = sharedOrders.filter((o) => o.status !== "Delivered");
  const activeRx = prescriptions.filter(
    (p) => p.status !== "Delivered" && p.status !== "Rejected"
  );
  const onlineDrivers = drivers.filter((d) => d.status !== "Off duty");

  // Find the home driver for a branch by matching zone field
  const homeDriverFor = (branchId: string) => {
    const branch = BRANCH_LIST.find((b) => b.id === branchId);
    if (!branch) return null;
    return onlineDrivers.find((d) =>
      d.zone === branchId ||
      d.zone.toLowerCase().includes(branch.label.toLowerCase()) ||
      branch.label.toLowerCase().includes(d.zone.toLowerCase())
    ) ?? null;
  };

  const ordersFor = (branchId: string) =>
    activeOrders.filter(
      (o) => (o.branchName ?? "9th Ave Branch CBD") === branchId
    );

  const rxFor = (branchId: string) =>
    activeRx.filter(
      (p) => (p.branchName ?? "9th Ave Branch CBD") === branchId
    );

  const selected = BRANCH_LIST.find((b) => b.id === selectedBranch);
  const homeDriver = selectedBranch ? homeDriverFor(selectedBranch) : null;
  const otherDrivers = homeDriver
    ? onlineDrivers.filter((d) => d.id !== homeDriver.id)
    : onlineDrivers;

  const assignDriver = async (driverId: string, driverName: string, driverPhone: string, driverVehicle: string) => {
    if (!assigningOrderId) return;
    setBusy(driverId);
    const updateData = {
      status: "Assigned",
      driver_name: driverName,
      driver_phone: driverPhone,
      driver_vehicle: driverVehicle,
      dispatched_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const tbl = assigningKind === "Rx" ? "prescriptions" : "shared_orders";
    const { error } = await supabase
      .from(tbl as "shared_orders")
      .update(updateData as never)
      .eq("id", assigningOrderId);
    if (error) {
      toast.error("Failed: " + error.message);
    } else {
      // Notify driver
      const { data: dr } = await supabase
        .from("drivers")
        .select("auth_user_id")
        .eq("id", driverId)
        .maybeSingle();
      if (dr?.auth_user_id) {
        await supabase.from("driver_notifications").insert({
          driver_auth_id: dr.auth_user_id,
          order_id: assigningOrderId,
          title: "New Delivery Assigned!",
          body: (assigningKind === "Rx" ? "Prescription #" : "Order #") +
            assigningOrderId + " for " + assigningCustomer + " — collect from branch.",
          read: false,
        });
      }
      // Update local store
      if (assigningKind === "OTC") {
        useSharedOrders.setState((s) => ({
          orders: s.orders.map((o) =>
            o.id === assigningOrderId
              ? { ...o, status: "Assigned" as SharedOrderStatus, driverName, driverPhone, driverVehicle }
              : o
          ),
        }));
      } else {
        useSharedPrescriptions.setState((s) => ({
          prescriptions: s.prescriptions.map((p) =>
            p.id === assigningOrderId
              ? { ...p, status: "Assigned" as SharedPrescriptionStatus, driverName, driverPhone, driverVehicle }
              : p
          ),
        }));
      }
      toast.success(driverName + " assigned!");
      setAssigningOrderId(null);
    }
    setBusy(null);
  };

  return (
    <div>
      <PageHeader
        title="Branch Overview"
        subtitle="Live orders and drivers across all Kings Pharmacy branches."
      />

      {/* Branch selector cards */}
      <div className="grid grid-cols-2 gap-3 mb-5 md:grid-cols-4">
        {BRANCH_LIST.map((branch) => {
          const bOrders = ordersFor(branch.id);
          const bRx = rxFor(branch.id);
          const home = homeDriverFor(branch.id);
          const total = bOrders.length + bRx.length;
          const unassigned = bOrders.filter((o) => !o.driverName).length +
            bRx.filter((p) => !p.driverName).length;
          const isSelected = selectedBranch === branch.id;
          return (
            <button
              key={branch.id}
              onClick={() => setSelectedBranch(isSelected ? null : branch.id)}
              className={`rounded-2xl p-4 text-left border-2 transition ${
                isSelected
                  ? "border-[#1E5BC6] bg-[#EAF3FF]"
                  : "border-slate-100 bg-white hover:border-[#1E5BC6]/40"
              }`}
            >
              <div className="text-xl mb-1">{branch.icon}</div>
              <div className="font-black text-[#1B3A6B] text-sm mb-2 leading-tight">
                {branch.label}
              </div>
              {home ? (
                <div className="text-[10px] text-green-600 font-bold mb-1.5">
                  ● {home.name.split(" ")[0]} (home driver)
                </div>
              ) : (
                <div className="text-[10px] text-amber-500 font-bold mb-1.5">
                  ⚠ No home driver online
                </div>
              )}
              <div className="text-xs text-slate-500">
                {total} active
                {unassigned > 0 && (
                  <span className="ml-1.5 text-amber-600 font-bold">
                    · {unassigned} unassigned
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected branch detail */}
      {selected && (
        <div className="space-y-4">

          {/* Home driver + other available drivers */}
          <div className="bg-white rounded-2xl p-4 border border-slate-100">
            <div className="text-xs font-black uppercase tracking-wider
              text-slate-400 mb-3">
              {selected.icon} {selected.label} — Drivers
            </div>

            {/* Home driver */}
            {homeDriver ? (
              <div className="flex items-center gap-3 mb-3 p-2 rounded-xl
                bg-green-50 border border-green-100">
                <div className="h-9 w-9 rounded-full bg-[#1B3A6B] flex
                  items-center justify-center text-white font-black text-xs shrink-0">
                  {homeDriver.name.split(" ").map((n: string) => n[0]).join("").slice(0,2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-[#1B3A6B] text-sm">
                    {homeDriver.name}
                    <span className="ml-2 text-[10px] font-bold text-green-600 bg-green-100
                      px-1.5 py-0.5 rounded-full">
                      Home Driver
                    </span>
                  </div>
                  <div className="text-xs text-slate-400">{homeDriver.vehicle}</div>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <a href={"tel:" + homeDriver.phone}
                    className="h-8 w-8 rounded-full bg-[#1E5BC6]/10 text-[#1E5BC6]
                      flex items-center justify-center hover:bg-[#1E5BC6]
                      hover:text-white transition">
                    <Phone className="h-3.5 w-3.5" />
                  </a>
                  <a
                    href={"https://wa.me/" + homeDriver.phone.replace(/[^0-9]/g, "") +
                      "?text=" + encodeURIComponent("Hi " +
                      homeDriver.name.split(" ")[0] + ", Kings Pharmacy dispatch.")}
                    target="_blank" rel="noreferrer"
                    className="h-8 w-8 rounded-full bg-[#25D366]/10 text-[#25D366]
                      flex items-center justify-center hover:bg-[#25D366]
                      hover:text-white transition text-sm">
                    💬
                  </a>
                </div>
              </div>
            ) : (
              <div className="text-sm text-amber-600 font-semibold mb-3 p-2
                rounded-xl bg-amber-50 border border-amber-100">
                ⚠️ No home driver online — assign from other branches below
              </div>
            )}

            {/* Other available drivers */}
            {otherDrivers.length > 0 && (
              <div>
                <div className="text-[10px] font-bold text-slate-400
                  uppercase tracking-wider mb-2">
                  Available from other branches
                </div>
                <div className="flex flex-wrap gap-2">
                  {otherDrivers.map((d) => (
                    <div key={d.id} className="flex items-center gap-1.5
                      rounded-full bg-slate-50 border border-slate-200
                      px-2.5 py-1">
                      <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                      <span className="text-xs font-bold text-slate-700">
                        {d.name.split(" ")[0]}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        · {d.zone}
                      </span>
                      <a href={"tel:" + d.phone}
                        className="text-[#1E5BC6] hover:opacity-70 ml-1">
                        <Phone className="h-3 w-3" />
                      </a>
                      <a
                        href={"https://wa.me/" + d.phone.replace(/[^0-9]/g, "") +
                          "?text=" + encodeURIComponent("Hi " + d.name.split(" ")[0] +
                          ", Kings Pharmacy dispatch.")}
                        target="_blank" rel="noreferrer"
                        className="text-[#25D366] hover:opacity-70 text-[11px]">
                        💬
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Orders list */}
          {(() => {
            const bOrders = ordersFor(selected.id);
            const bRx = rxFor(selected.id);
            if (bOrders.length === 0 && bRx.length === 0) {
              return (
                <div className="bg-white rounded-2xl p-8 text-center
                  text-slate-400 text-sm">
                  No active orders at this branch
                </div>
              );
            }
            return (
              <div className="space-y-2">
                {/* OTC orders */}
                {bOrders.map((o) => (
                  <div key={o.id} className="bg-white rounded-xl border
                    border-slate-100 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-[#1B3A6B] text-sm truncate">
                          {o.customer}
                        </div>
                        <div className="text-xs text-slate-400">
                          #{String(o.id).slice(-8).toUpperCase()} · OTC
                        </div>
                        {o.address && (
                          <div className="text-xs text-slate-500 truncate">
                            📍 {o.address}
                          </div>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-black text-[#1B3A6B] text-sm">
                          ${Number(o.total).toFixed(2)}
                        </div>
                        <div className="text-[10px] font-bold px-2 py-0.5
                          rounded-full mt-1 inline-block text-white"
                          style={{ background: STATUS_COLORS[o.status] ?? "#64748b" }}>
                          {o.status}
                        </div>
                      </div>
                    </div>
                    {o.driverName ? (
                      <div className="mt-1.5 text-xs text-slate-500">
                        🚗 {o.driverName} · {o.driverVehicle}
                      </div>
                    ) : assigningOrderId === o.id ? (
                      <div className="mt-2 space-y-1">
                        <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">
                          Select driver:
                        </div>
                        {[...(homeDriver ? [homeDriver] : []), ...otherDrivers].map((d) => (
                          <button key={d.id}
                            onClick={() => void assignDriver(d.id, d.name, d.phone, d.vehicle)}
                            disabled={busy !== null}
                            className={`w-full flex items-center justify-between
                              rounded-lg px-3 py-1.5 text-left border transition
                              ${d.id === homeDriver?.id
                                ? "border-[#1E5BC6] bg-[#EAF3FF]"
                                : "border-slate-200 bg-white hover:border-[#1E5BC6]"
                              }`}>
                            <span className="text-xs font-bold text-slate-700">
                              {d.id === homeDriver?.id && "⭐ "}{d.name}
                              {d.id !== homeDriver?.id && (
                                <span className="text-slate-400 font-normal ml-1">
                                  · {d.zone}
                                </span>
                              )}
                            </span>
                            <span className="text-[10px] font-bold text-[#1E5BC6]">
                              {busy === d.id ? "Assigning…" : "Assign →"}
                            </span>
                          </button>
                        ))}
                        <button onClick={() => setAssigningOrderId(null)}
                          className="text-[10px] text-slate-400 hover:text-slate-600 mt-1">
                          Cancel
                        </button>
                      </div>
                    ) : onlineDrivers.length > 0 ? (
                      <button
                        onClick={() => {
                          setAssigningOrderId(o.id);
                          setAssigningKind("OTC");
                          setAssigningCustomer(o.customer);
                        }}
                        className="mt-2 w-full h-8 rounded-full bg-[#1E5BC6] text-white
                          text-xs font-bold hover:bg-[#1B3A6B] transition">
                        🚗 Assign Driver
                      </button>
                    ) : null}
                  </div>
                ))}

                {/* Rx orders */}
                {bRx.map((p) => (
                  <div key={p.id} className="bg-white rounded-xl border
                    border-slate-100 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-[#1B3A6B] text-sm">
                          {p.patientName ?? p.customerName}
                        </div>
                        <div className="text-xs text-slate-400">
                          #{p.id} · Rx
                        </div>
                        {p.quotation?.medicationName && (
                          <div className="text-xs text-slate-500">
                            💊 {p.quotation.medicationName}
                          </div>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-black text-[#1B3A6B] text-sm">
                          ${Number(p.quotation?.total ?? 0).toFixed(2)}
                        </div>
                        <div className="text-[10px] font-bold px-2 py-0.5
                          rounded-full mt-1 inline-block text-white"
                          style={{
                            background:
                              p.status === "Paid" ? "#10B981" :
                              p.status === "Out for Delivery" ? "#7C3AED" :
                              p.status === "Assigned" ? "#6366F1" : "#F59E0B",
                          }}>
                          {p.status}
                        </div>
                      </div>
                    </div>
                    {p.driverName ? (
                      <div className="mt-1.5 text-xs text-slate-500">
                        🚗 {p.driverName} · {p.driverVehicle}
                      </div>
                    ) : p.status === "Paid" && assigningOrderId === p.id ? (
                      <div className="mt-2 space-y-1">
                        <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">
                          Select driver:
                        </div>
                        {[...(homeDriver ? [homeDriver] : []), ...otherDrivers].map((d) => (
                          <button key={d.id}
                            onClick={() => void assignDriver(d.id, d.name, d.phone, d.vehicle)}
                            disabled={busy !== null}
                            className={`w-full flex items-center justify-between
                              rounded-lg px-3 py-1.5 text-left border transition
                              ${d.id === homeDriver?.id
                                ? "border-[#1E5BC6] bg-[#EAF3FF]"
                                : "border-slate-200 bg-white hover:border-[#1E5BC6]"
                              }`}>
                            <span className="text-xs font-bold text-slate-700">
                              {d.id === homeDriver?.id && "⭐ "}{d.name}
                              {d.id !== homeDriver?.id && (
                                <span className="text-slate-400 font-normal ml-1">
                                  · {d.zone}
                                </span>
                              )}
                            </span>
                            <span className="text-[10px] font-bold text-[#1E5BC6]">
                              {busy === d.id ? "Assigning…" : "Assign →"}
                            </span>
                          </button>
                        ))}
                        <button onClick={() => setAssigningOrderId(null)}
                          className="text-[10px] text-slate-400 hover:text-slate-600 mt-1">
                          Cancel
                        </button>
                      </div>
                    ) : p.status === "Paid" && onlineDrivers.length > 0 ? (
                      <button
                        onClick={() => {
                          setAssigningOrderId(p.id);
                          setAssigningKind("Rx");
                          setAssigningCustomer(p.patientName ?? p.customerName);
                        }}
                        className="mt-2 w-full h-8 rounded-full bg-[#1E5BC6] text-white
                          text-xs font-bold hover:bg-[#1B3A6B] transition">
                        🚗 Assign Driver
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {!selected && (
        <div className="bg-white rounded-2xl p-6 text-center text-slate-500 text-sm">
          Tap a branch above to see its live orders and drivers
        </div>
      )}
    </div>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// Driver Map View — all drivers on a single Bulawayo SVG map
// ─────────────────────────────────────────────────────────────────────────────
const MAP_W = 640;
const MAP_H = 420;
const CENTER_LAT = -20.15;
const CENTER_LNG = 28.58;
const MAP_SCALE = 5000;

function projectToMap(lat: number, lng: number) {
  const x = MAP_W / 2 + (lng - CENTER_LNG) * MAP_SCALE;
  const y = MAP_H / 2 - (lat - CENTER_LAT) * MAP_SCALE;
  return {
    x: Math.max(20, Math.min(MAP_W - 20, x)),
    y: Math.max(20, Math.min(MAP_H - 20, y)),
  };
}

const BRANCH_PINS = [
  { id: "9th Ave Branch CBD",                lat: -20.1509, lng: 28.5766, label: "9th Ave" },
  { id: "6th Ave Branch CBD",                lat: -20.1450, lng: 28.5766, label: "6th Ave" },
  { id: "Old Mutual Centre, Jason Moyo Ave", lat: -20.1480, lng: 28.5847, label: "Old Mutual" },
  { id: "Ascot Shopping Centre",             lat: -20.1720, lng: 28.5950, label: "Ascot" },
];

const DRIVER_COLORS = [
  "#1E5BC6", "#7C3AED", "#DC2626", "#059669",
  "#D97706", "#DB2777", "#0891B2",
];

function DriverMapView({ drivers }: { drivers: StaffDriver[] }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 10_000);
    return () => clearInterval(t);
  }, []);
  void tick;

  const activeDrivers = drivers.filter(
    (d) => d.status !== "Off duty" &&
      d.currentLat != null && d.currentLng != null
  );

  const selectedDriver = selected
    ? drivers.find((d) => d.id === selected)
    : null;

  return (
    <div>
      <PageHeader
        title="Driver Map"
        subtitle="Real-time locations of all active drivers across Bulawayo."
      />

      {/* Legend */}
      <div className="flex flex-wrap gap-2 mb-4">
        {activeDrivers.length === 0 ? (
          <div className="text-sm text-slate-500">
            No drivers are currently sharing their location.
            Drivers must be active in the KP Driver app.
          </div>
        ) : (
          activeDrivers.map((d, i) => {
            const color = DRIVER_COLORS[i % DRIVER_COLORS.length];
            const stale =
              d.locationUpdatedAt &&
              Date.now() - Date.parse(d.locationUpdatedAt) > 120_000;
            return (
              <button
                key={d.id}
                onClick={() =>
                  setSelected(selected === d.id ? null : d.id)
                }
                className={`flex items-center gap-2 rounded-full
                  px-3 py-1.5 text-xs font-bold border-2
                  transition ${
                  selected === d.id
                    ? "border-[#1B3A6B] bg-[#1B3A6B] text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:border-[#1E5BC6]"
                }`}
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: stale ? "#F59E0B" : color }}
                />
                {d.name.split(" ")[0]}
                {stale ? " ⚠️" : ""}
              </button>
            );
          })
        )}
      </div>

      {/* Map */}
      <div className="bg-white rounded-2xl overflow-hidden border
        border-slate-100 shadow-sm">
        <div
          className="relative w-full"
          style={{ paddingBottom: "65%" }}
        >
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox={`0 0 ${MAP_W} ${MAP_H}`}
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Background */}
            <rect width={MAP_W} height={MAP_H} fill="#EEF2E8" />

            {/* Road grid */}
            {[80,140,180,240,300,360].map((y) => (
              <line key={`h${y}`} x1={0} y1={y} x2={MAP_W} y2={y}
                stroke="white" strokeWidth="5" />
            ))}
            {[80,150,240,320,400,480,560].map((x) => (
              <line key={`v${x}`} x1={x} y1={0} x2={x} y2={MAP_H}
                stroke="white" strokeWidth="5" />
            ))}

            {/* Road labels */}
            <text x="4" y="238" fontSize="8" fill="#999" fontFamily="sans-serif">9th Ave</text>
            <text x="4" y="178" fontSize="8" fill="#999" fontFamily="sans-serif">6th Ave</text>
            <text x="4" y="138" fontSize="8" fill="#999" fontFamily="sans-serif">Jason Moyo</text>

            {/* Branch pins */}
            {BRANCH_PINS.map((b) => {
              const pos = projectToMap(b.lat, b.lng);
              return (
                <g key={b.id}>
                  <circle cx={pos.x} cy={pos.y} r="14"
                    fill="#1E5BC6" opacity="0.15">
                    <animate attributeName="r"
                      values="12;20;12" dur="3s"
                      repeatCount="indefinite" />
                    <animate attributeName="opacity"
                      values="0.2;0;0.2" dur="3s"
                      repeatCount="indefinite" />
                  </circle>
                  <circle cx={pos.x} cy={pos.y} r="9"
                    fill="#1B3A6B" />
                  <text x={pos.x} y={pos.y + 3} fontSize="8"
                    fill="white" textAnchor="middle"
                    fontFamily="sans-serif" fontWeight="bold">
                    Rx
                  </text>
                  <rect x={pos.x - 20} y={pos.y + 11}
                    width={40} height={12} rx={6}
                    fill="#1B3A6B" />
                  <text x={pos.x} y={pos.y + 20} fontSize="7"
                    fill="white" textAnchor="middle"
                    fontFamily="sans-serif">
                    {b.label}
                  </text>
                </g>
              );
            })}

            {/* Driver pins */}
            {activeDrivers.map((d, i) => {
              const color = DRIVER_COLORS[i % DRIVER_COLORS.length];
              const pos = projectToMap(
                d.currentLat!, d.currentLng!
              );
              const isSelected = selected === d.id;
              const stale =
                d.locationUpdatedAt &&
                Date.now() - Date.parse(d.locationUpdatedAt) > 120_000;
              const initials = d.name
                .split(" ").map((n) => n[0]).join("").slice(0, 2);

              return (
                <g
                  key={d.id}
                  className="cursor-pointer"
                  onClick={() =>
                    setSelected(
                      isSelected ? null : d.id
                    )
                  }
                >
                  {/* Pulse ring */}
                  {!stale && (
                    <circle cx={pos.x} cy={pos.y}
                      r="16" fill={color} opacity="0.2">
                      <animate attributeName="r"
                        values="14;26;14" dur="2s"
                        repeatCount="indefinite" />
                      <animate attributeName="opacity"
                        values="0.3;0;0.3" dur="2s"
                        repeatCount="indefinite" />
                    </circle>
                  )}
                  {/* Driver circle */}
                  <circle cx={pos.x} cy={pos.y}
                    r={isSelected ? "16" : "13"}
                    fill={stale ? "#F59E0B" : color}
                    stroke="white"
                    strokeWidth={isSelected ? "3" : "2"}
                  />
                  <text x={pos.x} y={pos.y + 4}
                    fontSize="9" fill="white"
                    textAnchor="middle"
                    fontFamily="sans-serif"
                    fontWeight="900">
                    {initials}
                  </text>
                  {/* Name label */}
                  <rect
                    x={pos.x - 22}
                    y={pos.y + 16}
                    width={44} height={13}
                    rx={6}
                    fill={stale ? "#F59E0B" : color}
                  />
                  <text
                    x={pos.x} y={pos.y + 25}
                    fontSize="7" fill="white"
                    textAnchor="middle"
                    fontFamily="sans-serif">
                    {d.name.split(" ")[0]}
                  </text>
                </g>
              );
            })}

            {/* No GPS drivers note */}
            {activeDrivers.length === 0 && (
              <text
                x={MAP_W / 2} y={MAP_H / 2}
                fontSize="14" fill="#94a3b8"
                textAnchor="middle"
                fontFamily="sans-serif">
                No live GPS data available
              </text>
            )}

            {/* Compass */}
            <g transform={`translate(${MAP_W - 24}, ${MAP_H - 24})`}>
              <circle r="12" fill="white" opacity="0.9" />
              <text x="0" y="4" fontSize="9" textAnchor="middle"
                fill="#1B3A6B" fontWeight="bold">N</text>
            </g>
          </svg>
        </div>
      </div>

      {/* Selected driver detail panel */}
      {selectedDriver && (
        <div className="mt-4 bg-white rounded-2xl p-4 border
          border-[#1E5BC6]/20">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="h-12 w-12 rounded-full flex items-center
                justify-center text-white font-black text-sm"
              style={{
                background:
                  DRIVER_COLORS[
                    activeDrivers.findIndex(
                      (d) => d.id === selectedDriver.id
                    ) % DRIVER_COLORS.length
                  ],
              }}
            >
              {selectedDriver.name
                .split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </div>
            <div className="flex-1">
              <div className="font-black text-[#1B3A6B]">
                {selectedDriver.name}
              </div>
              <div className="text-xs text-slate-500">
                {selectedDriver.vehicle}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                📡 Last update:{" "}
                {timeAgo(selectedDriver.locationUpdatedAt)}
              </div>
            </div>
          </div>

          {/* GPS coordinates */}
          {selectedDriver.currentLat != null && (
            <div className="bg-[#EAF3FF] rounded-xl px-3 py-2 mb-3">
              <div className="text-[10px] font-bold text-[#1B3A6B]
                uppercase tracking-wide mb-1">
                Live Coordinates
              </div>
              <div className="text-sm font-mono text-[#1B3A6B]">
                {Number(selectedDriver.currentLat).toFixed(6)},{" "}
                {Number(selectedDriver.currentLng).toFixed(6)}
              </div>
              <a
                href={`https://www.google.com/maps?q=${selectedDriver.currentLat},${selectedDriver.currentLng}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-[#1E5BC6] hover:underline mt-1 inline-block"
              >
                Open in Google Maps ↗
              </a>
            </div>
          )}

          {/* Call + WhatsApp buttons */}
          <div className="grid grid-cols-2 gap-2">
            <a
              href={`tel:${selectedDriver.phone}`}
              className="flex items-center justify-center gap-2
                h-10 rounded-full bg-[#1E5BC6] text-white
                font-bold text-sm hover:bg-[#1B3A6B] transition"
            >
              <Phone className="h-4 w-4" />
              Call Driver
            </a>
            <a
              href={`https://wa.me/${
                selectedDriver.phone.replace(/\D/g, "")
              }?text=${encodeURIComponent(
                "Hi " + selectedDriver.name.split(" ")[0] +
                ", this is Kings Pharmacy dispatch. Please advise on your current delivery status."
              )}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2
                h-10 rounded-full bg-[#25D366] text-white
                font-bold text-sm hover:opacity-90 transition"
            >
              <span>💬</span>
              WhatsApp
            </a>
          </div>
        </div>
      )}

      {/* Driver list below map */}
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {drivers.map((d, i) => {
          const color = DRIVER_COLORS[i % DRIVER_COLORS.length];
          const hasGps = d.currentLat != null && d.currentLng != null;
          const stale =
            d.locationUpdatedAt &&
            Date.now() - Date.parse(d.locationUpdatedAt) > 120_000;
          return (
            <div
              key={d.id}
              className={`bg-white rounded-xl border-2 p-3 cursor-pointer
                transition ${
                selected === d.id
                  ? "border-[#1E5BC6]"
                  : "border-slate-100 hover:border-slate-300"
              }`}
              onClick={() =>
                setSelected(selected === d.id ? null : d.id)
              }
            >
              <div className="flex items-center gap-3">
                <div
                  className="h-10 w-10 rounded-full flex items-center
                    justify-center text-white font-black text-xs shrink-0"
                  style={{
                    background:
                      d.status === "Off duty"
                        ? "#94a3b8"
                        : color,
                  }}
                >
                  {d.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-[#1B3A6B] text-sm truncate">
                    {d.name}
                  </div>
                  <div className="text-xs text-slate-400">
                    {d.vehicle}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  {d.status === "Off duty" ? (
                    <span className="text-[10px] font-bold text-slate-400
                      bg-slate-100 px-2 py-0.5 rounded-full">
                      Off Duty
                    </span>
                  ) : hasGps ? (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5
                        rounded-full ${
                        stale
                          ? "bg-amber-100 text-amber-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {stale ? "⚠️ Stale" : "📡 Live"}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-amber-700
                      bg-amber-100 px-2 py-0.5 rounded-full">
                      No GPS
                    </span>
                  )}
                </div>
              </div>
              <div className="mt-2 flex gap-2">
                <a
                  href={`tel:${d.phone}`}
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 flex items-center justify-center
                    gap-1 h-8 rounded-full bg-[#1E5BC6]/10 text-[#1E5BC6]
                    text-xs font-bold hover:bg-[#1E5BC6] hover:text-white
                    transition"
                >
                  <Phone className="h-3 w-3" /> Call
                </a>
                <a
                  href={`https://wa.me/${
                    d.phone.replace(/\D/g, "")
                  }?text=${encodeURIComponent(
                    "Hi " + d.name.split(" ")[0] + ", Kings Pharmacy dispatch here."
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 flex items-center justify-center
                    gap-1 h-8 rounded-full bg-[#25D366]/10 text-[#25D366]
                    text-xs font-bold hover:bg-[#25D366] hover:text-white
                    transition"
                >
                  💬 WhatsApp
                </a>
              </div>
            </div>
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

function timeAgo(iso?: string | null): string {
  if (!iso) return "never";
  const ms = Date.now() - Date.parse(iso);
  if (isNaN(ms)) return "never";
  const s = Math.max(1, Math.floor(ms / 1000));
  if (s < 60) return s + "s ago";
  const m = Math.floor(s / 60);
  if (m < 60) return m + "m ago";
  const h = Math.floor(m / 60);
  if (h < 24) return h + "h ago";
  return Math.floor(h / 24) + "d ago";
}

function DriverLiveLocation({ driver }: { driver: StaffDriver }) {
  const { currentLat, currentLng, locationUpdatedAt, status } = driver;
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 15000);
    return () => clearInterval(t);
  }, []);
  // reference tick to keep timeAgo refreshing
  void tick;

  if (status === "Off duty") {
    return (
      <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-500">
        📴 Driver is offline — location unavailable
      </div>
    );
  }
  if (currentLat == null || currentLng == null) {
    return (
      <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
        📡 Waiting for first location ping…
      </div>
    );
  }
  const stale =
    locationUpdatedAt &&
    Date.now() - Date.parse(locationUpdatedAt) > 2 * 60 * 1000;
  return (
    <div
      className={
        "mt-3 rounded-lg border px-3 py-2 " +
        (stale
          ? "border-amber-200 bg-amber-50"
          : "border-[#1E5BC6]/25 bg-[#EAF3FF]")
      }
    >
      <div className="mb-1 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-[#1B3A6B]">
        <span className="relative flex h-2 w-2">
          {!stale && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
          )}
          <span
            className={
              "relative inline-flex h-2 w-2 rounded-full " +
              (stale ? "bg-amber-500" : "bg-emerald-600")
            }
          />
        </span>
        📡 Live Location · {timeAgo(locationUpdatedAt)}
        {stale && <span className="text-amber-700">(stale)</span>}
      </div>
      <div className="text-[11px] tabular-nums text-[#1B3A6B]">
        {currentLat.toFixed(5)}, {currentLng.toFixed(5)}
      </div>
      <a
        href={`https://www.google.com/maps?q=${currentLat},${currentLng}`}
        target="_blank"
        rel="noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="mt-1 inline-block text-[11px] font-bold text-[#1E5BC6] hover:underline"
      >
        Open in Google Maps ↗
      </a>
    </div>
  );
}

function AssignDriverLocBadge({ driver }: { driver: StaffDriver }) {
  const { currentLat, currentLng, locationUpdatedAt, status } = driver;
  if (status === "Off duty") return null;
  if (currentLat == null || currentLng == null) {
    return (
      <div className="mt-1 text-[10px] font-semibold text-amber-700">
        📡 waiting for location…
      </div>
    );
  }
  const stale =
    locationUpdatedAt &&
    Date.now() - Date.parse(locationUpdatedAt) > 2 * 60 * 1000;
  return (
    <div
      className={
        "mt-1 flex items-center gap-1 text-[10px] font-semibold " +
        (stale ? "text-amber-700" : "text-emerald-700")
      }
    >
      <span className="relative flex h-1.5 w-1.5">
        {!stale && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
        )}
        <span
          className={
            "relative inline-flex h-1.5 w-1.5 rounded-full " +
            (stale ? "bg-amber-500" : "bg-emerald-600")
          }
        />
      </span>
      📡 live · {timeAgo(locationUpdatedAt)}
      <span className="ml-1 tabular-nums text-slate-500">
        {currentLat.toFixed(3)},{currentLng.toFixed(3)}
      </span>
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

function printOrder(r: HistoryRow) {
  const win = window.open("", "_blank", "width=700,height=900");
  if (!win) return;
  win.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Kings Pharmacy — Order ${r.id}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 32px; color: #1B3A6B; max-width: 600px; margin: 0 auto; }
        h1 { font-size: 22px; margin: 0; }
        .sub { color: #666; font-size: 13px; margin-bottom: 24px; }
        .logo { font-size: 26px; font-weight: 900; color: #1B3A6B; }
        table { width: 100%; border-collapse: collapse; margin: 16px 0; }
        td { padding: 6px 0; font-size: 13px; vertical-align: top; }
        td:first-child { font-weight: 700; width: 40%; color: #444; }
        .divider { border-top: 2px solid #1E5BC6; margin: 16px 0; }
        .total { font-size: 18px; font-weight: 900; }
        .badge { display: inline-block; background: #EAF3FF; color: #1E5BC6; padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 700; }
        .footer { margin-top: 32px; font-size: 11px; color: #aaa; text-align: center; border-top: 1px solid #eee; padding-top: 12px; }
        @media print { button { display: none; } }
      </style>
    </head>
    <body>
      <div class="logo">KINGS PHARMACY</div>
      <div class="sub">At Your Service · Bulawayo, Zimbabwe</div>
      <div class="divider"></div>
      <h1>Delivery Receipt</h1>
      <table>
        <tr><td>Order ID:</td><td><strong>#${r.id}</strong></td></tr>
        <tr><td>Type:</td><td>${r.kind}</td></tr>
        <tr><td>Customer:</td><td>${r.customer}</td></tr>
        ${r.phone ? `<tr><td>Phone:</td><td>${r.phone}</td></tr>` : ""}
        <tr><td>Address:</td><td>${r.address}</td></tr>
        ${r.driverName ? `<tr><td>Driver:</td><td>${r.driverName}</td></tr>` : ""}
        <tr><td>Ordered:</td><td>${r.placedAtLabel}</td></tr>
        ${r.deliveredAtLabel ? `<tr><td>Delivered:</td><td>${r.deliveredAtLabel}</td></tr>` : ""}
        <tr><td>Payment:</td><td>${r.payment}</td></tr>
      </table>
      <div class="divider"></div>
      <table>
        <tr><td>Items:</td><td>${r.itemsLabel}</td></tr>
        <tr><td>Status:</td><td><span class="badge">✓ Delivered</span></td></tr>
      </table>
      <div class="divider"></div>
      <div class="total">Total: $${Number(r.total).toFixed(2)}</div>
      <div class="footer">Kings Pharmacy · Printed ${new Date().toLocaleString()}<br/>Thank you for your business.</div>
      <br/>
      <button onclick="window.print()" style="margin-top:16px;padding:8px 20px;background:#1E5BC6;color:white;border:none;border-radius:8px;cursor:pointer;font-size:14px;">🖨️ Print</button>
    </body>
    </html>
  `);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 400);
}

function HistoryView({
  drivers,
}: {
  drivers: StaffDriver[];
}) {
  // Subscribe directly to stores so UI updates
  // immediately when delete removes an order —
  // no stale props, no re-render delay
  const sharedOrders = useSharedOrders((s) => s.orders);
  const allPrescriptions = useSharedPrescriptions(
    (s) => s.prescriptions
  );
  const rxDelivered = allPrescriptions.filter(
    (p) => p.status === "Delivered"
  );

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
                    {/* Print + Delete buttons */}
                    <div className="mt-2 flex gap-1 justify-end">
                      <button
                        onClick={() => printOrder(r)}
                        title="Print receipt"
                        className="inline-flex items-center gap-1 rounded-full border border-[#1E5BC6] px-2.5 py-1 text-[10px] font-bold text-[#1E5BC6] hover:bg-[#EAF3FF] transition"
                      >
                        🖨️ Print
                      </button>
                      <button
                        onClick={async () => {
                          if (!window.confirm(`Delete order #${r.id}? This cannot be undone.`)) return;

                          // Optimistic update — remove from UI immediately
                          // before waiting for Supabase response
                          if (r.kind === "OTC") {
                            useSharedOrders.setState((s) => ({
                              orders: s.orders.filter(
                                (o) => o.id !== r.id
                              ),
                            }));
                          } else {
                            useSharedPrescriptions.setState((s) => ({
                              prescriptions: s.prescriptions.filter(
                                (p) => p.id !== r.id
                              ),
                            }));
                          }

                          // Delete from Supabase in background
                          const { error } = await supabase.rpc(
                            "delete_order_by_id",
                            { p_id: r.id }
                          );
                          if (error) {
                            // RPC failed — try direct delete
                            const tbl = r.kind === "Rx"
                              ? "prescriptions"
                              : "shared_orders";
                            const { error: e2 } = await supabase
                              .from(tbl as "shared_orders")
                              .delete()
                              .eq("id", r.id);
                            if (e2) {
                              // Direct delete also failed — try archive
                              const { error: e3 } = await supabase
                                .from("shared_orders")
                                .update({ status: "Archived" } as never)
                                .eq("id", r.id);
                              if (e3) {
                                toast.error("Delete failed — " + e3.message);
                                // Revert optimistic update
                                if (r.kind === "OTC") {
                                  void useSharedOrders.getState();
                                }
                              } else {
                                toast.success("Order archived");
                              }
                            } else {
                              toast.success("Order #" + r.id + " deleted");
                            }
                          } else {
                            toast.success("Order #" + r.id + " deleted");
                          }
                        }}
                        title="Delete from history"
                        className="inline-flex items-center gap-1 rounded-full border border-red-200 px-2.5 py-1 text-[10px] font-bold text-red-400 hover:bg-red-50 transition"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bulk delete old orders */}
      {filtered.length > 0 && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={async () => {
              const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000; // 7 days
              const oldRows = rows.filter(
                (r) => (r.deliveredAtMs ?? r.placedAtMs) < cutoff
              );
              if (oldRows.length === 0) {
                toast.info("No orders older than 7 days to delete.");
                return;
              }
              if (!window.confirm(
                `Delete ${oldRows.length} orders older than 7 days? This cannot be undone.`
              )) return;
              // Use RPC to bypass RLS
              const { error } = await supabase.rpc(
                "delete_orders_bulk_by_ids",
                { p_ids: oldRows.map((r) => r.id) }
              );
              if (error) {
                // Fallback: archive them instead
                const { error: e2 } = await supabase
                  .from("shared_orders")
                  .update({ status: "Archived" } as never)
                  .in("id", oldRows.map((r) => r.id));
                if (e2) {
                  toast.error("Cannot delete — please run the SQL fix in Supabase.");
                } else {
                  toast.success(`Archived ${oldRows.length} old orders`);
                  useSharedOrders.setState((s) => ({
                    orders: s.orders.filter(
                      (o) => !oldRows.some((r) => r.id === o.id)
                    ),
                  }));
                }
              } else {
                toast.success(`Deleted ${oldRows.length} old orders`);
                // Remove OTC orders from store
                const otcIds = new Set(
                  oldRows.filter(r => r.kind === "OTC").map(r => r.id)
                );
                const rxIds = new Set(
                  oldRows.filter(r => r.kind === "Rx").map(r => r.id)
                );
                if (otcIds.size > 0) {
                  useSharedOrders.setState((s) => ({
                    orders: s.orders.filter(
                      (o) => !otcIds.has(o.id)
                    ),
                  }));
                }
                if (rxIds.size > 0) {
                  useSharedPrescriptions.setState((s) => ({
                    prescriptions: s.prescriptions.filter(
                      (p) => !rxIds.has(p.id)
                    ),
                  }));
                }
              }
            }}
            className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-white px-4 py-2 text-xs font-bold text-red-400 hover:bg-red-50 transition shadow-sm"
          >
            🗑️ Delete orders older than 7 days
          </button>
        </div>
      )}
    </div>
  );
}
