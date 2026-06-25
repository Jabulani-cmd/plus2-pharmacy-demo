// ============================================================
// SHARED OTC ORDER STORE
// Bridges customer checkout → staff dispatch board.
// ============================================================

import { create } from "zustand";
import { pushNotification } from "./notifications";
import { supabase } from "@/integrations/supabase/client";

export type SharedOrderStatus =
  | "Confirmed"
  | "Ready to dispatch"
  | "Packed"
  | "Assigned"
  | "Out for delivery"
  | "Delivered";

export type SharedOrderItem = {
  id: string;
  name: string;
  qty: number;
  price: number;
};

export type SharedOrder = {
  id: string;
  customerId?: string;
  customerEmail?: string;
  customer: string;
  phone: string;
  branchId?: string;
  items: SharedOrderItem[];
  itemCount: number;
  address: string;
  deliveryMethod: string;
  paymentMethod: string;
  paymentRef: string;
  total: number;
  status: SharedOrderStatus;
  placedAt: string;
  placedTs: number;
  driverName?: string;
  driverPhone?: string;
  driverVehicle?: string;
  packedAt?: string;
  dispatchedAt?: string;
  deliveredAt?: string;
  eta?: string;
  /** Numeric timestamp when status became "Out for delivery" — used by countdown timer. */
  outForDeliveryTs?: number;
};

type State = {
  orders: SharedOrder[];
  addOrder: (o: Omit<SharedOrder, "status" | "placedAt" | "placedTs">) => void;
  markPacked: (id: string) => void;
  assignDriver: (
    id: string,
    driverName: string,
    driverPhone: string,
    driverVehicle: string
  ) => void;
  startDelivery: (id: string) => void;
  updateStatus: (id: string, status: SharedOrderStatus) => void;
};

const stamp = () =>
  new Date().toLocaleString("en-ZW", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

// --- Supabase <-> SharedOrder mapping ---
const TABLE = "shared_orders";

type Row = {
  id: string;
  customer_id: string | null;
  customer_email: string | null;
  customer: string;
  phone: string;
  branch_id: string | null;
  items: SharedOrderItem[];
  item_count: number;
  address: string;
  delivery_method: string;
  payment_method: string;
  payment_ref: string;
  total: number;
  status: SharedOrderStatus;
  placed_at: string;
  placed_ts: number;
  driver_name: string | null;
  driver_phone: string | null;
  driver_vehicle: string | null;
  packed_at: string | null;
  dispatched_at: string | null;
  delivered_at: string | null;
  eta: string | null;
  out_for_delivery_ts: number | null;
};

const rowToOrder = (r: Row): SharedOrder => ({
  id: r.id,
  customerId: r.customer_id ?? undefined,
  customerEmail: r.customer_email ?? undefined,
  customer: r.customer,
  phone: r.phone,
  branchId: r.branch_id ?? undefined,
  items: r.items ?? [],
  itemCount: r.item_count,
  address: r.address,
  deliveryMethod: r.delivery_method,
  paymentMethod: r.payment_method,
  paymentRef: r.payment_ref,
  total: Number(r.total),
  status: r.status,
  placedAt: r.placed_at,
  placedTs: Number(r.placed_ts),
  driverName: r.driver_name ?? undefined,
  driverPhone: r.driver_phone ?? undefined,
  driverVehicle: r.driver_vehicle ?? undefined,
  packedAt: r.packed_at ?? undefined,
  dispatchedAt: r.dispatched_at ?? undefined,
  deliveredAt: r.delivered_at ?? undefined,
  eta: r.eta ?? undefined,
  outForDeliveryTs: r.out_for_delivery_ts ?? undefined,
});

const orderToRow = (o: SharedOrder) => ({
  id: o.id,
  customer_id: o.customerId ?? null,
  customer_email: o.customerEmail ?? null,
  customer: o.customer,
  phone: o.phone,
  branch_id: o.branchId ?? null,
  items: o.items,
  item_count: o.itemCount,
  address: o.address,
  delivery_method: o.deliveryMethod,
  payment_method: o.paymentMethod,
  payment_ref: o.paymentRef,
  total: o.total,
  status: o.status,
  placed_at: o.placedAt,
  placed_ts: o.placedTs,
  driver_name: o.driverName ?? null,
  driver_phone: o.driverPhone ?? null,
  driver_vehicle: o.driverVehicle ?? null,
  packed_at: o.packedAt ?? null,
  dispatched_at: o.dispatchedAt ?? null,
  delivered_at: o.deliveredAt ?? null,
  eta: o.eta ?? null,
  out_for_delivery_ts: o.outForDeliveryTs ?? null,
});

export const useSharedOrders = create<State>()((set, get) => ({
      orders: [],

      addOrder: (o) => {
        const placedAt = stamp();
        const order: SharedOrder = {
          ...o,
          status: "Confirmed",
          placedAt,
          placedTs: Date.now(),
        };
        // Optimistic local insert
        set((s) => ({ orders: [order, ...s.orders.filter((x) => x.id !== order.id)] }));
        // Persist to Supabase so every device sees it
        void supabase.from(TABLE).insert(orderToRow(order)).then(({ error }) => {
          if (error) console.error("[sharedOrders] insert failed", error);
        });

        // Customer confirmation
        pushNotification({
          audience: "customer",
          userId: o.customerId ?? o.customerEmail,
          title: "Order confirmed",
          body:
            "Order " + o.id + " received — staff have been notified to pack it.",
          link: "/track",
          linkSearch: { order: o.id },
          tone: "success",
        });

        // Staff alert
        pushNotification({
          audience: "staff",
          title: "NEW OTC order — needs packing",
          body:
            o.customer + " · $" + o.total.toFixed(2) + " · " + o.itemCount + " item" + (o.itemCount === 1 ? "" : "s"),
          link: "/staff/dashboard",
          tone: "info",
        });
      },

      markPacked: (id) => {
        const o = get().orders.find((x) => x.id === id);
        if (!o) return;
        const packedAt = stamp();
        set((s) => ({
          orders: s.orders.map((x) =>
            x.id === id ? { ...x, status: "Packed", packedAt } : x
          ),
        }));
        void supabase.from(TABLE).update({ status: "Packed", packed_at: packedAt, updated_at: new Date().toISOString() }).eq("id", id);
        pushNotification({
          audience: "customer",
          userId: o.customerId ?? o.customerEmail,
          title: "Order packed",
          body: "Order " + id + " has been packed and is awaiting a driver.",
          link: "/track",
          linkSearch: { order: id },
          tone: "info",
        });
      },

      assignDriver: (id, driverName, driverPhone, driverVehicle) => {
        const o = get().orders.find((x) => x.id === id);
        if (!o) return;
        const dispatchedAt = stamp();
        set((s) => ({
          orders: s.orders.map((x) =>
            x.id === id
              ? {
                  ...x,
                  status: "Assigned",
                  driverName,
                  driverPhone,
                  driverVehicle,
                  dispatchedAt,
                  eta: "30 min",
                }
              : x
          ),
        }));
        void supabase.from(TABLE).update({
          status: "Assigned",
          driver_name: driverName,
          driver_phone: driverPhone,
          driver_vehicle: driverVehicle,
          dispatched_at: dispatchedAt,
          eta: "30 min",
          updated_at: new Date().toISOString(),
        }).eq("id", id);
        pushNotification({
          audience: "customer",
          userId: o.customerId ?? o.customerEmail,
          title: "Driver assigned",
          body:
            driverName + " has been assigned to order " + id + " — awaiting dispatch.",
          link: "/track",
          linkSearch: { order: id },
          tone: "info",
        });
      },

      startDelivery: (id) => {
        const o = get().orders.find((x) => x.id === id);
        if (!o) return;
        const ts = Date.now();
        set((s) => ({
          orders: s.orders.map((x) =>
            x.id === id
              ? { ...x, status: "Out for delivery", eta: "20 min", outForDeliveryTs: ts }
              : x
          ),
        }));
        void supabase.from(TABLE).update({
          status: "Out for delivery",
          eta: "20 min",
          out_for_delivery_ts: ts,
          updated_at: new Date().toISOString(),
        }).eq("id", id);
        pushNotification({
          audience: "customer",
          userId: o.customerId ?? o.customerEmail,
          title: "Driver is on the way",
          body:
            (o.driverName ?? "Your driver") +
            " has started delivery of order " +
            id +
            " — ETA 20 minutes.",
          link: "/track",
          linkSearch: { order: id },
          tone: "success",
        });
      },

      updateStatus: (id, status) => {
        const o = get().orders.find((x) => x.id === id);
        if (!o) return;
        const patch: Partial<SharedOrder> = { status };
        const dbPatch: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
        if (status === "Delivered") patch.deliveredAt = stamp();
        if (status === "Delivered") dbPatch.delivered_at = patch.deliveredAt;
        set((s) => ({
          orders: s.orders.map((x) => (x.id === id ? { ...x, ...patch } : x)),
        }));
        void supabase.from(TABLE).update(dbPatch as never).eq("id", id);
        if (status === "Delivered") {
          pushNotification({
            audience: "customer",
            userId: o.customerId ?? o.customerEmail,
            title: "Order delivered",
            body: "Order " + id + " was delivered. Thanks for shopping with Kings Pharmacy.",
            link: "/account",
            tone: "success",
          });
        }
      },
}));

// --- Initial fetch + realtime subscription (browser only) ---
if (typeof window !== "undefined") {
  const bootstrap = async () => {
    try {
      const { data, error } = await supabase
        .from(TABLE)
        .select("*")
        .order("placed_ts", { ascending: false });
      if (error) {
        console.error("[sharedOrders] initial fetch failed", error);
        return;
      }
          useSharedOrders.setState({ orders: (data ?? []).map((r) => rowToOrder(r as unknown as Row)) });
    } catch (e) {
      console.error("[sharedOrders] bootstrap error", e);
    }
  };
  void bootstrap();

  supabase
    .channel("shared_orders_changes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: TABLE },
      (payload) => {
        const evt = payload.eventType;
        if (evt === "INSERT" || evt === "UPDATE") {
          const order = rowToOrder(payload.new as unknown as Row);
          useSharedOrders.setState((s) => {
            const exists = s.orders.some((o) => o.id === order.id);
            const orders = exists
              ? s.orders.map((o) => (o.id === order.id ? order : o))
              : [order, ...s.orders];
            return { orders };
          });
        } else if (evt === "DELETE") {
          const id = (payload.old as { id: string }).id;
          useSharedOrders.setState((s) => ({ orders: s.orders.filter((o) => o.id !== id) }));
        }
      }
    )
    .subscribe();

  // Clear any stale localStorage cache from the previous persisted store
  try { localStorage.removeItem("kings-shared-orders"); } catch { /* ignore */ }
}