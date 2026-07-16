// ============================================================
// SHARED OTC ORDER STORE
// Bridges customer checkout → staff dispatch board.
// ============================================================

import { create } from "zustand";
import { pushNotification } from "./notifications";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// localStorage queue of orders awaiting successful Supabase persistence.
const PENDING_KEY = "kings-shared-orders-pending";

function readPending(): SharedOrder[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    return raw ? (JSON.parse(raw) as SharedOrder[]) : [];
  } catch {
    return [];
  }
}
function writePending(list: SharedOrder[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify(list));
  } catch {
    /* ignore quota errors */
  }
}
function queuePending(order: SharedOrder) {
  const list = readPending().filter((o) => o.id !== order.id);
  list.push(order);
  writePending(list);
}
function clearPending(id: string) {
  writePending(readPending().filter((o) => o.id !== id));
}

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
  branchName?: string;
  items: SharedOrderItem[];
  itemCount: number;
  address: string;
  deliveryAddress?: {
    firstName: string;
    lastName: string;
    street: string;
    suburb: string;
    city: string;
    province: string;
    postal: string;
    phone: string;
    email?: string;
  };
  deliveryMethod: string;
  deliverySlot?: string;
  paymentMethod: string;
  paymentRef: string;
  subtotal: number;
  deliveryFee: number;
  discountAmount: number;
  discountCode?: string;
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
  outForDeliveryTs?: number;
  driverId?: string;
  driverAuthId?: string;
  acceptedAt?: string;
  collectedAt?: string;
  driverLat?: number;
  driverLng?: number;
  driverHeading?: number;
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
  cancelOrder: (id: string, reason?: string) => Promise<void>;
};

const stamp = () =>
  new Date().toLocaleString("en-ZW", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

const TABLE = "shared_orders";

type Row = {
  id: string;
  customer_id: string | null;
  customer_email: string | null;
  customer: string;
  phone: string;
  branch_id: string | null;
  branch_name: string | null;
  items: SharedOrderItem[];
  item_count: number;
  address: string;
  delivery_address: SharedOrder["deliveryAddress"] | null;
  delivery_method: string;
  delivery_slot: string | null;
  payment_method: string;
  payment_ref: string;
  subtotal: number;
  delivery_fee: number;
  discount_amount: number;
  discount_code: string | null;
  total: number;
  status: string;
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
  driver_id: string | null;
  driver_auth_id: string | null;
  accepted_at: string | null;
  collected_at: string | null;
  driver_lat: number | null;
  driver_lng: number | null;
  driver_heading: number | null;
};

// ─── Status normalisation ────────────────────────────────────────────────────
// The KP Driver app writes its own status strings which may differ from the
// dispatcher's canonical strings. This map bridges the two so Realtime
// updates from the driver app land in the correct Kanban column.
function normaliseStatus(raw: string): SharedOrderStatus {
  const map: Record<string, SharedOrderStatus> = {
    // Driver app strings → dispatcher strings
    "Confirmed":          "Confirmed",
    "Preparing":          "Confirmed",
    "Driver Assigned":    "Assigned",        // old driver string
    "Assigned":           "Assigned",        // new driver string
    "Out for Delivery":   "Out for delivery", // old driver string (capital D)
    "Out for delivery":   "Out for delivery", // new driver string
    "Delivered":          "Delivered",
    // Dispatcher strings pass through unchanged
    "Ready to dispatch":  "Ready to dispatch",
    "Packed":             "Packed",
  };
  return (map[raw] as SharedOrderStatus) ?? (raw as SharedOrderStatus);
}

// ─── Row → SharedOrder ───────────────────────────────────────────────────────
const rowToOrder = (r: Row): SharedOrder => ({
  id: r.id,
  customerId: r.customer_id ?? undefined,
  customerEmail: r.customer_email ?? undefined,
  customer: r.customer,
  phone: r.phone,
  branchId: r.branch_id ?? undefined,
  branchName: r.branch_name ?? undefined,
  items: r.items ?? [],
  itemCount: r.item_count,
  address: r.address,
  deliveryAddress: r.delivery_address ?? undefined,
  deliveryMethod: r.delivery_method,
  deliverySlot: r.delivery_slot ?? undefined,
  paymentMethod: r.payment_method,
  paymentRef: r.payment_ref,
  subtotal: Number(r.subtotal ?? 0),
  deliveryFee: Number(r.delivery_fee ?? 0),
  discountAmount: Number(r.discount_amount ?? 0),
  discountCode: r.discount_code ?? undefined,
  total: Number(r.total),
  status: normaliseStatus(r.status),   // ← normalise here
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
  driverId: r.driver_id ?? undefined,
  driverAuthId: r.driver_auth_id ?? undefined,
  acceptedAt: r.accepted_at ?? undefined,
  collectedAt: r.collected_at ?? undefined,
  driverLat: r.driver_lat != null ? Number(r.driver_lat) : undefined,
  driverLng: r.driver_lng != null ? Number(r.driver_lng) : undefined,
  driverHeading: r.driver_heading != null ? Number(r.driver_heading) : undefined,
});

const orderToRow = (o: SharedOrder) => ({
  id: o.id,
  customer_id: o.customerId ?? null,
  customer_email: o.customerEmail ?? null,
  customer: o.customer,
  phone: o.phone,
  branch_id: o.branchId ?? null,
  branch_name: o.branchName ?? null,
  items: o.items,
  item_count: o.itemCount,
  address: o.address,
  delivery_address: o.deliveryAddress ?? null,
  delivery_method: o.deliveryMethod,
  delivery_slot: o.deliverySlot ?? null,
  payment_method: o.paymentMethod,
  payment_ref: o.paymentRef,
  subtotal: o.subtotal,
  delivery_fee: o.deliveryFee,
  discount_amount: o.discountAmount,
  discount_code: o.discountCode ?? null,
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
  driver_id: o.driverId ?? null,
  driver_auth_id: o.driverAuthId ?? null,
  accepted_at: o.acceptedAt ?? null,
  collected_at: o.collectedAt ?? null,
  driver_lat: o.driverLat ?? null,
  driver_lng: o.driverLng ?? null,
  driver_heading: o.driverHeading ?? null,
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
    set((s) => ({
      orders: [order, ...s.orders.filter((x) => x.id !== order.id)],
    }));
    queuePending(order);
    void persistOrder(order);

    pushNotification({
      audience: "customer",
      userId: o.customerId ?? o.customerEmail,
      title: "Order confirmed",
      body:
        "Order " +
        o.id +
        " received — staff have been notified to pack it.",
      link: "/track",
      linkSearch: { id: o.id },
      tone: "success",
    });

    // Write to staff_notifications so dispatcher gets
    // real-time toast on their device via Supabase Realtime
    void supabase.from("staff_notifications").insert({
      order_id: order.id,
      title: "🛍️ New OTC Order — Needs Packing",
      body:
        o.customer +
        " placed an order · $" +
        o.total.toFixed(2) +
        " · " +
        o.itemCount +
        " item" +
        (o.itemCount === 1 ? "" : "s") +
        (o.branchName ? " · " + o.branchName : ""),
      kind: "new_order",
    });

    // Write customer notification to Supabase so it
    // appears on their bell on any device they use
    if (o.customerId || o.customerEmail) {
      void supabase.from("notifications").insert({
        audience: "customer",
        user_id: o.customerId ?? o.customerEmail,
        kind: "order_confirmed",
        title: "Order Confirmed",
        message:
          "Your order #" + order.id +
          " has been received and is being packed.",
        link: "/track",
        read: false,
      });
    }
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
    void supabase
      .from(TABLE)
      .update({
        status: "Packed",
        packed_at: packedAt,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .then(({ error }) => {
        if (error)
          console.error("[sharedOrders] markPacked update failed", error);
      });
    pushNotification({
      audience: "customer",
      userId: o.customerId ?? o.customerEmail,
      title: "Order packed",
      body: "Order " + id + " has been packed and is awaiting a driver.",
      link: "/track",
      linkSearch: { id },
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
    void supabase
      .from(TABLE)
      .update({
        status: "Assigned",
        driver_name: driverName,
        driver_phone: driverPhone,
        driver_vehicle: driverVehicle,
        dispatched_at: dispatchedAt,
        eta: "30 min",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .then(({ error }) => {
        if (error)
          console.error("[sharedOrders] assignDriver update failed", error);
      });
    // Look up driver's auth user id and notify the KP Driver app.
    void (async () => {
      try {
        const { data: drv } = await supabase
          .from("drivers")
          .select("id, auth_user_id")
          .eq("name", driverName)
          .maybeSingle();
        const driverAuthId = (drv as { auth_user_id?: string | null } | null)?.auth_user_id ?? null;
        const driverRowId = (drv as { id?: string | null } | null)?.id ?? null;
        if (driverAuthId || driverRowId) {
          await supabase
            .from(TABLE)
            .update({
              driver_auth_id: driverAuthId,
              driver_id: driverRowId,
              updated_at: new Date().toISOString(),
            })
            .eq("id", id);
        }
        if (driverAuthId) {
          const collectionBranch = o.branchName ?? "9th Ave Branch CBD";
          await supabase.from("driver_notifications").insert({
            driver_auth_id: driverAuthId,
            order_id: id,
            title: "🛵 New Delivery Assigned!",
            body:
              "Order " + id + " for " + o.customer +
              " · " + o.itemCount + " item" + (o.itemCount === 1 ? "" : "s") +
              " · $" + o.total.toFixed(2) +
              " · collect from " + collectionBranch +
              (o.address ? " · deliver to " + o.address : ""),
          });
        }
      } catch (e) {
        console.error("[sharedOrders] driver notification failed", e);
      }
    })();
    pushNotification({
      audience: "customer",
      userId: o.customerId ?? o.customerEmail,
      title: "Driver assigned",
      body:
        driverName +
        " has been assigned to order " +
        id +
        " — awaiting dispatch.",
      link: "/track",
      linkSearch: { id },
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
          ? {
              ...x,
              status: "Out for delivery",
              eta: "20 min",
              outForDeliveryTs: ts,
            }
          : x
      ),
    }));
    void supabase
      .from(TABLE)
      .update({
        status: "Out for delivery",
        eta: "20 min",
        out_for_delivery_ts: ts,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .then(({ error }) => {
        if (error)
          console.error("[sharedOrders] startDelivery update failed", error);
      });
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
      linkSearch: { id },
      tone: "success",
    });
  },

  updateStatus: (id, status) => {
    const o = get().orders.find((x) => x.id === id);
    if (!o) return;
    const patch: Partial<SharedOrder> = { status };
    const dbPatch: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };
    if (status === "Delivered") patch.deliveredAt = stamp();
    if (status === "Delivered") dbPatch.delivered_at = patch.deliveredAt;
    set((s) => ({
      orders: s.orders.map((x) =>
        x.id === id ? { ...x, ...patch } : x
      ),
    }));
    void supabase
      .from(TABLE)
      .update(dbPatch as never)
      .eq("id", id)
      .then(({ error }) => {
        if (error)
          console.error("[sharedOrders] updateStatus update failed", error);
      });
    if (status === "Delivered") {
      pushNotification({
        audience: "customer",
        userId: o.customerId ?? o.customerEmail,
        title: "Order delivered",
        body:
          "Order " +
          id +
          " was delivered. Thanks for shopping with Kings Pharmacy.",
        link: "/account",
        tone: "success",
      });
    }
  },

  cancelOrder: async (id, reason) => {
    const o = get().orders.find((x) => x.id === id);
    if (!o) return;
    // Optimistically remove from local state.
    set((s) => ({ orders: s.orders.filter((x) => x.id !== id) }));
    // Use the SECURITY DEFINER RPC so the customer can remove their own row
    // without needing a dedicated delete RLS policy.
    const { error } = await supabase.rpc("delete_order_by_id", { p_id: id });
    if (error) {
      console.error("[sharedOrders] cancelOrder rpc failed", error);
      // Roll back on failure so the UI still shows the order.
      set((s) => ({ orders: [o, ...s.orders.filter((x) => x.id !== id)] }));
      throw error;
    }
    pushNotification({
      audience: "customer",
      userId: o.customerId ?? o.customerEmail,
      title: "Order cancelled",
      body: "Order " + id + " has been cancelled.",
      tone: "warning",
    });
    void supabase.from("staff_notifications").insert({
      order_id: id,
      title: "❌ OTC Order Cancelled",
      body:
        o.customer +
        " cancelled order #" + id +
        (reason ? " — Reason: " + reason : ""),
      kind: "order_cancelled",
    });
  },
}));

// ─── Initial fetch + realtime subscription (browser only) ───────────────────
async function persistOrder(
  order: SharedOrder,
  attempt = 0
): Promise<void> {
  const { error } = await supabase
    .from(TABLE)
    .upsert(orderToRow(order));
  if (!error) {
    clearPending(order.id);
    return;
  }
  console.error(
    "[sharedOrders] insert failed (attempt " + (attempt + 1) + ")",
    error
  );
  if (attempt < 2) {
    await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
    return persistOrder(order, attempt + 1);
  }
  try {
    toast.error(
      "Order " +
        order.id +
        " was placed locally but couldn't sync to the dispatcher. We'll retry automatically."
    );
  } catch {
    /* toast may not be available in this context */
  }
}

async function flushPending() {
  const list = readPending();
  for (const order of list) {
    // eslint-disable-next-line no-await-in-loop
    await persistOrder(order);
  }
}

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
      useSharedOrders.setState({
        orders: (data ?? []).map((r) =>
          rowToOrder(r as unknown as Row)
        ),
      });
      await flushPending();
    } catch (e) {
      console.error("[sharedOrders] bootstrap error", e);
    }
  };
  void bootstrap();

  window.addEventListener("online", () => {
    void flushPending();
  });
  window.addEventListener("focus", () => {
    void flushPending();
  });

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
              ? s.orders.map((o) =>
                  o.id === order.id ? order : o
                )
              : [order, ...s.orders];
            return { orders };
          });
        } else if (evt === "DELETE") {
          const id = (payload.old as { id: string }).id;
          useSharedOrders.setState((s) => ({
            orders: s.orders.filter((o) => o.id !== id),
          }));
        }
      }
    )
    .subscribe();

  try {
    localStorage.removeItem("kings-shared-orders");
  } catch {
    /* ignore */
  }
}
