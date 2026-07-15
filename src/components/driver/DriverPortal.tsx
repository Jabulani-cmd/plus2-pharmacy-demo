import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Phone,
  MapPin,
  Package,
  CheckCircle2,
  LogOut,
  Truck,
  User as UserIcon,
  Loader2,
  Wallet,
  Camera,
  X as XIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSharedOrders, type SharedOrder } from "@/store/sharedOrders";
import {
  useSharedPrescriptions,
  type SharedPrescription,
} from "@/store/sharedPrescriptions";
import {
  useDeliveryProofs,
  fileToCompressedDataUrl,
} from "@/store/deliveryProofs";
import { InstallDriverApp } from "./InstallDriverApp";
import kingsLogo from "@/assets/kings-logo.png";

export type DriverRow = {
  id: string;
  auth_user_id: string;
  name: string;
  phone: string;
  vehicle: string;
  plate: string;
  branch: string;
  off_duty: boolean;
};

type Tab = "deliveries" | "completed" | "profile";

const SKY = "#0EA5E9";
const SKY_DARK = "#0369A1";

export function DriverPortal({ driver }: { driver: DriverRow }) {
  const [tab, setTab] = useState<Tab>("deliveries");
  const [driverState, setDriverState] = useState<DriverRow>(driver);

  useEffect(() => setDriverState(driver), [driver]);

  // realtime: driver's own row (online/offline updated elsewhere)
  useEffect(() => {
    const ch = supabase
      .channel("driver_self_" + driver.id)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "drivers",
          filter: "id=eq." + driver.id,
        },
        (p) => {
          if (p.new) setDriverState(p.new as DriverRow);
        }
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(ch);
    };
  }, [driver.id]);

  // Browser push notifications — ask once per session
  useEffect(() => {
    if (typeof Notification === "undefined") return;
    if (Notification.permission !== "default") return;
    const askedKey = "driver-notif-asked";
    if (sessionStorage.getItem(askedKey)) return;
    sessionStorage.setItem(askedKey, "1");
    // Slight delay so it doesn't compete with the install banner
    const t = setTimeout(() => {
      Notification.requestPermission().then((p) => {
        if (p === "granted") {
          toast.success(
            "Notifications enabled — you'll be alerted when new orders are assigned"
          );
        }
      });
    }, 3500);
    return () => clearTimeout(t);
  }, []);

  // Push notification on new assignment
  useEffect(() => {
    const ch = supabase
      .channel("driver_assign_" + driver.id)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "shared_orders" },
        (p: any) => {
          const row = p.new;
          if (!row) return;
          const assignedToMe = row.driver_name === driverState.name;
          const justAssigned =
            row.status === "Assigned" || row.status === "Driver Assigned";
          if (!assignedToMe || !justAssigned) return;
          if (p.eventType === "UPDATE") {
            const prevAssigned =
              p.old?.driver_name === driverState.name &&
              (p.old?.status === "Assigned" || p.old?.status === "Driver Assigned");
            if (prevAssigned) return; // already counted
          }
          try {
            if (typeof Notification !== "undefined" && Notification.permission === "granted") {
              new Notification("New Delivery Assigned", {
                body: `Deliver to ${row.customer ?? "customer"} at ${row.address ?? ""}`,
                icon: "/icons/driver-icon-192.png",
                badge: "/icons/driver-icon-192.png",
                tag: row.id,
              });
            }
          } catch {}
          if ("vibrate" in navigator) {
            try { (navigator as any).vibrate([200, 100, 200]); } catch {}
          }
          toast("🛵 New delivery assigned!", {
            description: `${row.customer ?? "Customer"} — ${row.address ?? ""}`,
            duration: 8000,
          });
        }
      )
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [driver.id, driverState.name]);

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <InstallDriverApp variant="banner" />
      <DriverHeader driver={driverState} />
      <main className="mx-auto w-full max-w-2xl px-4 py-5">
        {tab === "deliveries" && <ActiveDeliveries driver={driverState} />}
        {tab === "completed" && <CompletedDeliveries driver={driverState} />}
        {tab === "profile" && <DriverProfile driver={driverState} />}
      </main>
      <DriverBottomNav tab={tab} setTab={setTab} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Header
// ─────────────────────────────────────────────────────────────
function DriverHeader({ driver }: { driver: DriverRow }) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const online = !driver.off_duty;

  const toggle = async () => {
    setBusy(true);
    const { error } = await supabase
      .from("drivers")
      .update({ off_duty: online })
      .eq("id", driver.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(online ? "You are now Offline" : "You are now Online");
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/driver/login", replace: true });
  };

  const initials = driver.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");

  return (
    <header
      className="bg-gradient-to-r px-4 py-4 text-white shadow-sm"
      style={{ backgroundImage: `linear-gradient(to right, ${SKY_DARK}, ${SKY})` }}
    >
      <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <img
            src={kingsLogo}
            alt="Kings"
            className="h-10 w-10 shrink-0 rounded-lg bg-white/95 p-1"
          />
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 text-sm font-black">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-black">{driver.name}</div>
              <div className="truncate text-[11px] text-sky-100">
                {driver.vehicle} · {driver.plate}
              </div>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={toggle}
            disabled={busy}
            className={
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-black transition disabled:opacity-60 " +
              (online
                ? "bg-emerald-400 text-emerald-950 hover:bg-emerald-300"
                : "bg-slate-200 text-slate-700 hover:bg-slate-100")
            }
          >
            <span
              className={
                "h-1.5 w-1.5 rounded-full " +
                (online ? "bg-emerald-700" : "bg-slate-500")
              }
            />
            {online ? "ONLINE" : "OFFLINE"}
          </button>
          <button
            type="button"
            onClick={signOut}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

// ─────────────────────────────────────────────────────────────
// Active deliveries
// ─────────────────────────────────────────────────────────────
function ActiveDeliveries({ driver }: { driver: DriverRow }) {
  const orders = useSharedOrders((s) => s.orders);
  const active = useMemo(
    () =>
      orders
        .filter(
          (o) =>
            o.driverName === driver.name &&
            (o.status === "Assigned" || o.status === "Out for delivery")
        )
        .sort((a, b) => a.placedTs - b.placedTs),
    [orders, driver.name]
  );
  const prescriptions = useSharedPrescriptions((s) => s.prescriptions);
  const activeRx = useMemo(
    () =>
      prescriptions.filter(
        (p) =>
          p.driverName === driver.name && p.status === "Out for Delivery",
      ),
    [prescriptions, driver.name],
  );

  const totalCount = active.length + activeRx.length;

  if (totalCount === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center">
        <div className="mb-3 text-5xl">🛵</div>
        <div className="text-base font-black text-slate-700">
          No active deliveries
        </div>
        <div className="mt-1 text-xs text-slate-500">
          The dispatcher will assign orders to you shortly.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-xs font-bold text-slate-500">
        {totalCount} active deliver{totalCount === 1 ? "y" : "ies"}
      </div>
      {activeRx.map((p) => (
        <ActivePrescriptionCard key={p.id} rx={p} driver={driver} />
      ))}
      {active.map((o) => (
        <ActiveDeliveryCard key={o.id} order={o} driver={driver} />
      ))}
    </div>
  );
}

function ActiveDeliveryCard({
  order,
  driver,
}: {
  order: SharedOrder;
  driver: DriverRow;
}) {
  const startDelivery = useSharedOrders((s) => s.startDelivery);
  const updateStatus = useSharedOrders((s) => s.updateStatus);

  const [starting, setStarting] = useState(false);
  const [marking, setMarking] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [proofPhoto, setProofPhoto] = useState<string | null>(null);
  const [processingPhoto, setProcessingPhoto] = useState(false);
  const setProof = useDeliveryProofs((s) => s.setProof);

  const outForDelivery = order.status === "Out for delivery";

  // Payment method classification — drivers MUST be told accurately
  // whether the customer has already paid online vs owes cash on arrival.
  const PREPAID_METHODS = [
    "ecocash", "onemoney", "telecash",
    "zimswitch", "zipit",
    "card", "visa", "mastercard", "international",
    "online",
  ];
  const paymentLc = (order.paymentMethod ?? "").toLowerCase().trim();
  // Check prepaid FIRST so "EcoCash" isn't mis-flagged as cash on delivery
  // (the substring "cash" otherwise matches inside "ecocash").
  const isAlreadyPaid = PREPAID_METHODS.some((m) => paymentLc.includes(m));
  const isCOD =
    !isAlreadyPaid &&
    (/\bcash\b/.test(paymentLc) ||
      paymentLc.includes("cash on delivery") ||
      paymentLc === "cod" ||
      paymentLc.includes("on delivery"));
  const isZigCOD = /zig/i.test(order.paymentMethod ?? "");
  const codAmount = isZigCOD
    ? `ZiG ${(Number(order.total) * 26.5).toFixed(2)}`
    : `US$${Number(order.total).toFixed(2)}`;

  const onStart = async () => {
    setStarting(true);
    startDelivery(order.id);
    setTimeout(() => setStarting(false), 400);
    toast.success("Delivery started — customer notified");
  };

  const onDelivered = async () => {
    if (!proofPhoto) {
      toast.error("Take a proof-of-delivery photo first");
      return;
    }
    setMarking(true);
    setProof(order.id, proofPhoto);
    updateStatus(order.id, "Delivered");
    setTimeout(() => {
      setMarking(false);
      setConfirm(false);
      setProofPhoto(null);
    }, 400);
    toast.success("Order marked as delivered");
  };

  const onPickPhoto = async (file: File | undefined) => {
    if (!file) return;
    try {
      setProcessingPhoto(true);
      const dataUrl = await fileToCompressedDataUrl(file);
      setProofPhoto(dataUrl);
    } catch (err) {
      console.error("[proof] photo processing failed", err);
      toast.error("Could not read that photo — please try again");
    } finally {
      setProcessingPhoto(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* status banner */}
      <div
        className={
          "flex items-center justify-between px-4 py-2 text-[11px] font-black uppercase tracking-wider " +
          (outForDelivery
            ? "bg-sky-100 text-sky-800"
            : "bg-amber-100 text-amber-800")
        }
      >
        <span className="flex items-center gap-1.5">
          {outForDelivery ? (
            <>
              <Truck className="h-3.5 w-3.5" /> Out for delivery
            </>
          ) : (
            <>
              <Package className="h-3.5 w-3.5" /> Collected · ready to deliver
            </>
          )}
        </span>
        <span className="text-[10px] text-slate-600">#{order.id}</span>
      </div>

      <div className="space-y-3 p-4">
        {/* customer */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-base font-black text-slate-800">
              {order.customer}
            </div>
            <div className="text-xs text-slate-500">
              {order.items?.length ?? 0} item
              {order.items?.length === 1 ? "" : "s"} · US$
              {Number(order.total).toFixed(2)} · {order.paymentMethod}
            </div>
          </div>
          <a
            href={"tel:" + order.phone}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-700 transition hover:bg-sky-600 hover:text-white"
            aria-label="Call customer"
          >
            <Phone className="h-4 w-4" />
          </a>
        </div>

        {/* address */}
        <div className="rounded-xl bg-slate-50 p-3">
          <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            <MapPin className="h-3 w-3" /> Deliver to
          </div>
          {order.deliveryAddress ? (
            <div className="text-xs font-semibold text-slate-700 space-y-0.5">
              <div>
                {order.deliveryAddress.firstName} {order.deliveryAddress.lastName}
              </div>
              <div>{order.deliveryAddress.street}</div>
              <div>
                {[order.deliveryAddress.suburb, order.deliveryAddress.city]
                  .filter(Boolean)
                  .join(", ")}
              </div>
              {(order.deliveryAddress.province || order.deliveryAddress.postal) && (
                <div className="text-slate-500">
                  {[order.deliveryAddress.province, order.deliveryAddress.postal]
                    .filter(Boolean)
                    .join(" · ")}
                </div>
              )}
              <div className="pt-1 text-slate-500">
                📞 {order.deliveryAddress.phone || order.phone}
              </div>
            </div>
          ) : (
            <div className="text-xs font-semibold text-slate-700">
              {order.address}
            </div>
          )}
        </div>

        {/* items */}
        <div>
          <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Items
          </div>
          <div className="space-y-1">
            {(order.items ?? []).map((it, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-xs text-slate-700"
              >
                <span className="truncate pr-2">
                  {it.name}{" "}
                  <span className="text-slate-400">×{it.qty}</span>
                </span>
                <span className="shrink-0 font-semibold">
                  US${(it.price * it.qty).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {isAlreadyPaid && (
          <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-bold text-emerald-800">
            <span className="text-base leading-none">✅</span>
            <span>
              <span className="block text-[11px] font-black uppercase tracking-wider">
                Payment already received
              </span>
              <span className="block font-semibold normal-case">
                Paid via {order.paymentMethod} — do NOT collect payment
              </span>
            </span>
          </div>
        )}
        {isCOD && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-bold text-amber-900">
            <Wallet className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              <span className="block text-[11px] font-black uppercase tracking-wider">
                Collect cash on delivery
              </span>
              <span className="block font-semibold normal-case">
                Collect {codAmount} from customer on arrival
              </span>
            </span>
          </div>
        )}

        {/* primary action */}
        {!outForDelivery && !confirm && (
          <button
            type="button"
            onClick={onStart}
            disabled={starting}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-sky-600 text-sm font-black text-white shadow transition hover:bg-sky-700 disabled:opacity-60"
          >
            {starting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Truck className="h-4 w-4" />
            )}
            {starting ? "Starting…" : "Start delivery"}
          </button>
        )}

        {outForDelivery && !confirm && (
          <button
            type="button"
            onClick={() => setConfirm(true)}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#1B3A6B] text-sm font-black text-white transition hover:bg-sky-700"
          >
            <CheckCircle2 className="h-4 w-4" /> Mark as delivered
          </button>
        )}

        {confirm && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-xs font-black text-slate-800">
              Confirm delivery to {order.customer}?
            </div>
            <div className="mt-1 text-[11px] text-slate-500">
              A proof-of-delivery photo is required before marking as delivered.
            </div>

            {/* Proof-of-delivery photo capture */}
            <div className="mt-3">
              {proofPhoto ? (
                <div className="relative">
                  <img
                    src={proofPhoto}
                    alt="Proof of delivery"
                    className="h-40 w-full rounded-lg border border-slate-200 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setProofPhoto(null)}
                    disabled={marking}
                    aria-label="Remove photo"
                    className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                  >
                    <XIcon className="h-4 w-4" />
                  </button>
                  <div className="mt-1 text-[10px] font-bold text-emerald-700">
                    ✓ Photo captured
                  </div>
                </div>
              ) : (
                <label
                  className={
                    "flex h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-full border-2 border-dashed border-sky-400 bg-white text-xs font-black text-sky-700 transition hover:bg-sky-50 " +
                    (processingPhoto ? "pointer-events-none opacity-60" : "")
                  }
                >
                  {processingPhoto ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                  {processingPhoto ? "Processing…" : "Take proof-of-delivery photo"}
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => {
                      void onPickPhoto(e.target.files?.[0]);
                      e.currentTarget.value = "";
                    }}
                  />
                </label>
              )}
            </div>

            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setConfirm(false);
                  setProofPhoto(null);
                }}
                disabled={marking}
                className="h-10 flex-1 rounded-full border-2 border-slate-300 text-xs font-bold text-slate-600 transition hover:bg-white disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onDelivered}
                disabled={marking || !proofPhoto}
                className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full bg-emerald-600 text-xs font-black text-white transition hover:bg-emerald-700 disabled:opacity-60"
              >
                {marking ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                )}
                Confirm
              </button>
            </div>
          </div>
        )}

        {/* maps */}
        <a
          href={
            "https://maps.google.com/?q=" + encodeURIComponent(order.address)
          }
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-11 w-full items-center justify-center gap-2 rounded-full border-2 border-sky-500 text-xs font-bold text-sky-700 transition hover:bg-sky-50"
        >
          <MapPin className="h-4 w-4" /> Open in Maps
        </a>

        <div className="text-center text-[10px] text-slate-400">
          Driver: {driver.name}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Completed
// ─────────────────────────────────────────────────────────────
function CompletedDeliveries({ driver }: { driver: DriverRow }) {
  const orders = useSharedOrders((s) => s.orders);
  const prescriptions = useSharedPrescriptions((s) => s.prescriptions);
  const proofs = useDeliveryProofs((s) => s.proofs);
  const [filter, setFilter] = useState<"today" | "all">("today");

  const startOfToday = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, []);

  const list = useMemo(
    () =>
      orders
        .filter(
          (o) =>
            o.driverName === driver.name &&
            o.status === "Delivered" &&
            (filter === "all" || o.placedTs >= startOfToday)
        )
        .sort((a, b) => b.placedTs - a.placedTs),
    [orders, driver.name, filter, startOfToday]
  );

  const rxList = useMemo(
    () =>
      prescriptions.filter(
        (p) => p.driverName === driver.name && p.status === "Delivered",
      ),
    [prescriptions, driver.name],
  );

  const total = list.reduce((s, o) => s + (Number(o.total) || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(["today", "all"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={
              "rounded-full px-4 py-2 text-[11px] font-black transition " +
              (filter === f
                ? "bg-sky-600 text-white shadow"
                : "border border-slate-200 bg-white text-slate-600")
            }
          >
            {f === "today" ? "Today" : "All time"}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center">
          <div className="text-2xl font-black text-slate-800">
            {list.length}
          </div>
          <div className="text-[10px] text-slate-500">Deliveries</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center">
          <div className="text-2xl font-black text-sky-700">
            US${total.toFixed(0)}
          </div>
          <div className="text-[10px] text-slate-500">Total value</div>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center text-xs text-slate-500">
          {rxList.length === 0
            ? `No completed deliveries${filter === "today" ? " today" : ""}`
            : "No completed OTC orders — see prescriptions below"}
        </div>
      ) : (
        <div className="space-y-2">
          {list.map((o) => {
            const deliveredAt = o.deliveredAt;
            return (
              <div
                key={o.id}
                className="rounded-xl border border-slate-200 bg-white p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-black text-slate-800">
                      {o.customer}
                    </div>
                    <div className="truncate text-[11px] text-slate-500">
                      #{o.id}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black text-slate-800">
                      US${Number(o.total).toFixed(2)}
                    </div>
                    <div className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                      <CheckCircle2 className="h-3 w-3" /> Delivered
                    </div>
                  </div>
                </div>
                <div className="mt-1 truncate text-[11px] text-slate-500">
                  📍 {o.address}
                </div>
                {deliveredAt && (
                  <div className="mt-1 text-[10px] text-slate-400">
                    Delivered at {deliveredAt}
                  </div>
                )}
                {proofs[o.id]?.photoDataUrl && (
                  <div className="mt-2">
                    <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Proof of delivery
                    </div>
                    <img
                      src={proofs[o.id].photoDataUrl}
                      alt={"Proof of delivery for " + o.id}
                      className="h-24 w-full rounded-lg border border-slate-200 object-cover"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {rxList.length > 0 && (
        <div className="space-y-2">
          <div className="pt-2 text-[10px] font-black uppercase tracking-wider text-slate-500">
            Prescription deliveries
          </div>
          {rxList.map((p) => (
            <div
              key={p.id}
              className="rounded-xl border border-slate-200 bg-white p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-black text-slate-800">
                    {p.patientName}
                  </div>
                  <div className="truncate text-[11px] text-slate-500">
                    #{p.id}
                  </div>
                </div>
                <div className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                  <CheckCircle2 className="h-3 w-3" /> Delivered
                </div>
              </div>
              {p.deliveryAddress && (
                <div className="mt-1 truncate text-[11px] text-slate-500">
                  📍 {p.deliveryAddress.streetAddress},{" "}
                  {p.deliveryAddress.suburb}
                </div>
              )}
              {proofs[p.id]?.photoDataUrl && (
                <img
                  src={proofs[p.id].photoDataUrl}
                  alt={"Proof for " + p.id}
                  className="mt-2 h-24 w-full rounded-lg border border-slate-200 object-cover"
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Active prescription delivery card
// ─────────────────────────────────────────────────────────────
function ActivePrescriptionCard({
  rx,
  driver,
}: {
  rx: SharedPrescription;
  driver: DriverRow;
}) {
  const updateStatus = useSharedPrescriptions((s) => s.updateStatus);
  const setProof = useDeliveryProofs((s) => s.setProof);

  const [confirm, setConfirm] = useState(false);
  const [proofPhoto, setProofPhoto] = useState<string | null>(null);
  const [processingPhoto, setProcessingPhoto] = useState(false);
  const [marking, setMarking] = useState(false);

  const address = rx.deliveryAddress
    ? `${rx.deliveryAddress.streetAddress}, ${rx.deliveryAddress.suburb}, ${rx.deliveryAddress.city}`
    : "—";

  const total = rx.quotation?.total;
  const paymentLabel = rx.paymentMethod ?? "Paid online";

  const onPickPhoto = async (file: File | undefined) => {
    if (!file) return;
    try {
      setProcessingPhoto(true);
      const dataUrl = await fileToCompressedDataUrl(file);
      setProofPhoto(dataUrl);
    } catch (err) {
      console.error("[proof] photo processing failed", err);
      toast.error("Could not read that photo — please try again");
    } finally {
      setProcessingPhoto(false);
    }
  };

  const onDelivered = async () => {
    if (!proofPhoto) {
      toast.error("Take a proof-of-delivery photo first");
      return;
    }
    setMarking(true);
    setProof(rx.id, proofPhoto);
    updateStatus(rx.id, "Delivered");
    setTimeout(() => {
      setMarking(false);
      setConfirm(false);
      setProofPhoto(null);
    }, 400);
    toast.success("Prescription marked as delivered");
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between bg-purple-100 px-4 py-2 text-[11px] font-black uppercase tracking-wider text-purple-800">
        <span className="flex items-center gap-1.5">
          <Package className="h-3.5 w-3.5" /> Prescription · Out for delivery
        </span>
        <span className="text-[10px] text-slate-600">#{rx.id}</span>
      </div>

      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-base font-black text-slate-800">
              {rx.patientName}
            </div>
            <div className="text-xs text-slate-500">
              {typeof total === "number" ? `US$${total.toFixed(2)} · ` : ""}
              {paymentLabel}
            </div>
          </div>
          <a
            href={"tel:" + rx.customerPhone}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-700 transition hover:bg-sky-600 hover:text-white"
            aria-label="Call customer"
          >
            <Phone className="h-4 w-4" />
          </a>
        </div>

        <div className="rounded-xl bg-slate-50 p-3">
          <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            <MapPin className="h-3 w-3" /> Deliver to
          </div>
          <div className="text-xs font-semibold text-slate-700">{address}</div>
          <div className="pt-1 text-[11px] text-slate-500">
            📞 {rx.customerPhone}
          </div>
        </div>

        <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-bold text-emerald-800">
          <span className="text-base leading-none">✅</span>
          <span>
            <span className="block text-[11px] font-black uppercase tracking-wider">
              Payment already received
            </span>
            <span className="block font-semibold normal-case">
              Paid via {paymentLabel} — do NOT collect payment
            </span>
          </span>
        </div>

        {!confirm && (
          <button
            type="button"
            onClick={() => setConfirm(true)}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#1B3A6B] text-sm font-black text-white transition hover:bg-sky-700"
          >
            <CheckCircle2 className="h-4 w-4" /> Mark as delivered
          </button>
        )}

        {confirm && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-xs font-black text-slate-800">
              Confirm delivery to {rx.patientName}?
            </div>
            <div className="mt-1 text-[11px] text-slate-500">
              A proof-of-delivery photo is required.
            </div>
            <div className="mt-3">
              {proofPhoto ? (
                <div className="relative">
                  <img
                    src={proofPhoto}
                    alt="Proof of delivery"
                    className="h-40 w-full rounded-lg border border-slate-200 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setProofPhoto(null)}
                    disabled={marking}
                    aria-label="Remove photo"
                    className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                  >
                    <XIcon className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label
                  className={
                    "flex h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-full border-2 border-dashed border-sky-400 bg-white text-xs font-black text-sky-700 transition hover:bg-sky-50 " +
                    (processingPhoto ? "pointer-events-none opacity-60" : "")
                  }
                >
                  {processingPhoto ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                  {processingPhoto ? "Processing…" : "Take proof-of-delivery photo"}
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => {
                      void onPickPhoto(e.target.files?.[0]);
                      e.currentTarget.value = "";
                    }}
                  />
                </label>
              )}
            </div>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setConfirm(false);
                  setProofPhoto(null);
                }}
                disabled={marking}
                className="h-10 flex-1 rounded-full border-2 border-slate-300 text-xs font-bold text-slate-600 transition hover:bg-white disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onDelivered}
                disabled={marking || !proofPhoto}
                className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full bg-emerald-600 text-xs font-black text-white transition hover:bg-emerald-700 disabled:opacity-60"
              >
                {marking ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                )}
                Confirm
              </button>
            </div>
          </div>
        )}

        <a
          href={"https://maps.google.com/?q=" + encodeURIComponent(address)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-11 w-full items-center justify-center gap-2 rounded-full border-2 border-sky-500 text-xs font-bold text-sky-700 transition hover:bg-sky-50"
        >
          <MapPin className="h-4 w-4" /> Open in Maps
        </a>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Profile
// ─────────────────────────────────────────────────────────────
function DriverProfile({ driver }: { driver: DriverRow }) {
  const navigate = useNavigate();
  const initials = driver.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/driver/login", replace: true });
  };

  return (
    <div className="space-y-4">
      <InstallDriverApp variant="card" />

      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-sky-600 text-2xl font-black text-white">
          {initials}
        </div>
        <div className="mt-3 text-lg font-black text-slate-800">
          {driver.name}
        </div>
        <div className="text-xs text-slate-500">Kings Pharmacy Driver</div>
        <div className="mt-1 inline-block rounded-full bg-sky-100 px-3 py-0.5 text-[11px] font-bold text-sky-700">
          {driver.branch}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-4 py-3 text-[11px] font-black uppercase tracking-wider text-slate-500">
          Vehicle & contact
        </div>
        <div className="divide-y divide-slate-100">
          {[
            { label: "Vehicle", value: driver.vehicle },
            { label: "Plate", value: driver.plate },
            { label: "Phone", value: driver.phone },
            { label: "Branch", value: driver.branch },
          ].map((r) => (
            <div
              key={r.label}
              className="flex items-center justify-between px-4 py-3 text-xs"
            >
              <span className="font-bold text-slate-500">{r.label}</span>
              <span className="text-slate-800">{r.value}</span>
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={signOut}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-full border-2 border-red-300 text-sm font-black text-red-600 transition hover:bg-red-50"
      >
        <LogOut className="h-4 w-4" /> Sign out
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Bottom nav
// ─────────────────────────────────────────────────────────────
function DriverBottomNav({
  tab,
  setTab,
}: {
  tab: Tab;
  setTab: (t: Tab) => void;
}) {
  const tabs: { id: Tab; icon: React.ReactNode; label: string }[] = [
    { id: "deliveries", icon: <Truck className="h-5 w-5" />, label: "Deliveries" },
    {
      id: "completed",
      icon: <CheckCircle2 className="h-5 w-5" />,
      label: "Completed",
    },
    { id: "profile", icon: <UserIcon className="h-5 w-5" />, label: "Profile" },
  ];
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex w-full max-w-2xl">
        {tabs.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={
                "relative flex flex-1 flex-col items-center gap-0.5 py-3 transition " +
                (active ? "text-sky-600" : "text-slate-400 hover:text-slate-600")
              }
            >
              {t.icon}
              <span className="text-[10px] font-bold">{t.label}</span>
              {active && (
                <span className="absolute inset-x-6 top-0 h-0.5 rounded-b bg-sky-600" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}