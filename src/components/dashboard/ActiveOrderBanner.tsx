import { Link } from "@tanstack/react-router";
import { Navigation } from "lucide-react";
import type { SharedOrder } from "@/store/sharedOrders";

/**
 * Live, pulsing status banner that appears on the customer dashboard when an
 * order is in progress.
 */
export function ActiveOrderBanner({ order }: { order: SharedOrder }) {
  const messages: Record<SharedOrder["status"], string> = {
    Confirmed: "is being prepared by our team",
    "Ready to dispatch": "is ready for dispatch",
    Packed: "has been packed and is awaiting a driver",
    Assigned: "has been assigned to a driver",
    "Out for delivery": "is on the way to you right now",
    Delivered: "has been delivered",
  };
  const isLive = order.status !== "Delivered";
  return (
    <div className="mb-4 flex flex-col gap-3 rounded-xl border-2 border-primary/40 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4 shadow-sm sm:flex-row sm:items-center">
      <div className="flex flex-1 items-center gap-3">
        {isLive && (
          <span className="relative flex h-3 w-3 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-primary" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-primary">
            {isLive ? "Live order" : "Order complete"}
          </div>
          <div className="mt-0.5 text-sm font-extrabold text-foreground sm:text-base">
            Your order <span className="font-mono">{order.id}</span> {messages[order.status]}.
          </div>
          <div className="text-xs text-muted-foreground">
            {order.itemCount} item{order.itemCount === 1 ? "" : "s"} · ${order.total.toFixed(2)}
            {order.driverName ? ` · Driver: ${order.driverName}` : ""}
          </div>
        </div>
      </div>
      <Link
        to="/track"
        search={{ order: order.id }}
        className="inline-flex shrink-0 items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-extrabold uppercase tracking-wide text-primary-foreground shadow-sm transition hover:bg-primary-dark"
      >
        <Navigation className="h-4 w-4" /> Track Now
      </Link>
    </div>
  );
}