// ============================================================
// SHARED OTC ORDER STORE
// Bridges customer checkout → staff dispatch board.
// ============================================================

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { pushNotification } from "./notifications";

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

export const useSharedOrders = create<State>()(
  persist(
    (set, get) => ({
      orders: [],

      addOrder: (o) => {
        const placedAt = stamp();
        const order: SharedOrder = {
          ...o,
          status: "Confirmed",
          placedAt,
          placedTs: Date.now(),
        };
        set((s) => ({ orders: [order, ...s.orders] }));

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
        set((s) => ({
          orders: s.orders.map((x) =>
            x.id === id
              ? { ...x, status: "Out for delivery", eta: "20 min", outForDeliveryTs: Date.now() }
              : x
          ),
        }));
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
        if (status === "Delivered") patch.deliveredAt = stamp();
        set((s) => ({
          orders: s.orders.map((x) => (x.id === id ? { ...x, ...patch } : x)),
        }));
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
    }),
    { name: "kings-shared-orders" }
  )
);