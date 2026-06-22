import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Receipt as ReceiptIcon, Download, Mail, MessageSquare, Check, MapPin, Phone, Bell, Clock, Loader2 } from "lucide-react";
import { ReceiptModal } from "@/components/receipt/ReceiptModal";
import { type Receipt } from "@/lib/receipts";
import { formatUSD } from "@/store/shop";
import { useSharedOrders } from "@/store/sharedOrders";

type Props = {
  receipt: Receipt;
  isCollect?: boolean;
  hasRx?: boolean;
};

type StepState = "done" | "current" | "upcoming";
type Step = { key: string; title: string; desc: string; ts: string; state: StepState };

const STAGE_ORDER = ["Confirmed", "Packed", "Assigned", "Out for delivery", "Delivered"] as const;

const stagesFromStatus = (status: string | undefined, isCollect: boolean): Step[] => {
  const idx = Math.max(0, STAGE_ORDER.indexOf((status ?? "Confirmed") as typeof STAGE_ORDER[number]));
  const labels: { key: string; title: string; desc: string }[] = isCollect
    ? [
        { key: "confirm",   title: "Order Confirmed",      desc: "Your order has been placed and payment confirmed" },
        { key: "prep",      title: "Being Prepared",       desc: "Our pharmacy team is packing your items" },
        { key: "ready",     title: "Ready for Collection", desc: "Pick up at branch — bring your ID and order number" },
        { key: "ready2",    title: "Ready for Collection", desc: "Awaiting your visit" },
        { key: "collected", title: "Collected",            desc: "Order collected — thank you" },
      ]
    : [
        { key: "confirm",   title: "Order Confirmed",            desc: "Your order has been placed and payment confirmed" },
        { key: "prep",      title: "Packed",                     desc: "Our pharmacy team has packed your items" },
        { key: "assigned",  title: "Driver Assigned",            desc: "A driver has been assigned to your order" },
        { key: "out",       title: "Out for Delivery",           desc: "Driver is on the way to your address" },
        { key: "delivered", title: "Delivered",                  desc: "Your order has arrived" },
      ];
  return labels.map((l, i) => ({
    ...l,
    ts: i < idx ? "Done" : i === idx ? "In progress" : "Waiting",
    state: i < idx ? "done" : i === idx ? "current" : "upcoming",
  }));
};

export function OrderConfirmation({ receipt, isCollect = false, hasRx = false }: Props) {
  const [receiptOpen, setReceiptOpen] = useState(false);
  // Live order from shared store — drives the timeline as staff/driver advance it.
  const liveOrder = useSharedOrders((s) =>
    s.orders.find((o) => o.id === receipt.orderNumber)
  );
  const steps = stagesFromStatus(liveOrder?.status, isCollect);
  const showDriver = !!liveOrder?.driverName;

  return (
    <div className="-mx-6 -my-6">
      {/* SECTION 1 — Animated Success Header */}
      <div className="rounded-t-xl bg-gradient-to-br from-[#0EA5E9] to-[#0284C7] px-6 py-12 text-center text-white">
        <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-full border-[3px] border-white animate-scale-in">
          <Check className="h-9 w-9 animate-fade-in" strokeWidth={3} />
          <span className="absolute inset-0 rounded-full bg-white/30 animate-ping" />
        </div>
        <Confetti />
        <h2 className="mt-5 text-2xl font-extrabold animate-fade-in md:text-3xl">Payment Successful!</h2>
        <p className="mt-1 text-base opacity-90">{formatUSD(receipt.pricing.total)} paid successfully</p>
        <p className="mt-1 text-xs font-mono opacity-70">Ref: {receipt.payment.authorisationCode}</p>
      </div>

      {/* SECTION 2 — Receipt Quick Actions */}
      <div className="border-b border-border bg-card px-6 py-5">
        <h3 className="mb-3 text-sm font-bold">Your Receipt</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <ActionBtn icon={<ReceiptIcon className="h-6 w-6" />} label="View" onClick={() => setReceiptOpen(true)} />
          <ActionBtn icon={<Download className="h-6 w-6" />} label="Download" onClick={() => setReceiptOpen(true)} />
          <ActionBtn icon={<Mail className="h-6 w-6" />} label="Email" onClick={() => setReceiptOpen(true)} />
          <ActionBtn icon={<MessageSquare className="h-6 w-6" />} label="SMS" onClick={() => setReceiptOpen(true)} />
        </div>
        <p className="mt-3 text-center text-[11px] text-muted-foreground">Receipt #{receipt.receiptNumber}</p>
      </div>

      {/* SECTION 3 — Order Summary */}
      <div className="m-4 rounded-lg border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <span className="font-bold">Order #{receipt.orderNumber}</span>
          <span className="text-xs text-muted-foreground">{new Date(receipt.timestamp).toLocaleString("en-ZW", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
        </div>
        <div className="my-3 border-t border-border" />
        <ul className="divide-y divide-border">
          {receipt.items.map((it, i) => (
            <li key={i} className="flex items-center gap-3 py-2 text-sm">
              <span className="flex-1 truncate text-[#374151]">{it.name}</span>
              <span className="text-xs text-muted-foreground">×{it.qty}</span>
              <span className="font-semibold">{formatUSD(it.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 space-y-1 border-t border-border pt-3 text-sm">
          <Row label="Subtotal" value={formatUSD(receipt.pricing.subtotal)} />
          <Row label="Delivery" value={receipt.pricing.deliveryFee === 0 ? "FREE" : formatUSD(receipt.pricing.deliveryFee)} />
          <Row label="VAT (15%)" value={formatUSD(receipt.pricing.vatAmount)} />
          <div className="mt-1 flex justify-between border-t border-border pt-2 text-base font-extrabold"><span>Total</span><span className="text-primary">{formatUSD(receipt.pricing.total)}</span></div>
        </div>
        <div className="mt-3 rounded-md bg-surface px-3 py-2 text-xs text-muted-foreground">
          Paid via {receipt.payment.cardLast4 ? `${receipt.payment.cardType ?? "Card"} ending ${receipt.payment.cardLast4}` : receipt.payment.method} · <span className="font-mono">{receipt.payment.authorisationCode}</span>
        </div>
      </div>

      {/* SECTION 4 — Delivery Status */}
      <div className="m-4 rounded-lg border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold">{isCollect ? "Collection Status" : "Delivery Status"}</h3>
          <span className="text-xs font-semibold text-primary">{receipt.delivery.trackingRef}</span>
        </div>
        <ol className="mt-4">
          {steps.map((s, i) => (
            <li key={s.key} className="relative flex gap-3 pb-5 last:pb-0">
              {i < steps.length - 1 && <span className={`absolute left-[11px] top-6 h-full w-0.5 ${s.state === "done" ? "bg-primary" : "bg-border"}`} />}
              <span className={`relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${s.state === "done" ? "bg-primary text-white" : s.state === "current" ? "bg-primary text-white" : "border-2 border-border bg-card"}`}>
                {s.state === "done" && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                {s.state === "current" && <><span className="absolute inset-0 animate-ping rounded-full bg-primary/60" /><span className="relative h-2 w-2 rounded-full bg-white" /></>}
                {s.state === "upcoming" && <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />}
              </span>
              <div className="flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className={`text-sm font-semibold ${s.state === "upcoming" ? "text-muted-foreground" : "text-foreground"}`}>{s.title}</span>
                  <span className="text-[11px] text-muted-foreground">{s.ts}</span>
                </div>
                <p className="text-xs text-muted-foreground">{s.desc}</p>
              </div>
            </li>
          ))}
        </ol>
        {showDriver && (
          <div className="mt-2 flex items-center gap-3 rounded-md bg-[#F0F9F4] p-3 animate-fade-in">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">SD</div>
            <div className="flex-1">
              <div className="text-sm font-bold">{liveOrder?.driverName ?? "Driver"}</div>
              <div className="text-[11px] text-muted-foreground">{liveOrder?.driverVehicle ?? "Vehicle"}</div>
            </div>
            <button onClick={() => toast.info("📞 Calling " + (liveOrder?.driverName ?? "driver") + "... (demo)")} className="inline-flex items-center gap-1 rounded-md border border-primary px-2.5 py-1.5 text-xs font-bold text-primary hover:bg-primary/5">
              <Phone className="h-3 w-3" /> Call
            </button>
          </div>
        )}
      </div>

      {/* SECTION 5 — What Happens Next */}
      <div className="m-4 rounded-lg bg-[#F0F9F4] p-5">
        <h3 className="mb-3 text-sm font-bold">What Happens Next</h3>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2 text-[#374151]"><Bell className="mt-0.5 h-4 w-4 text-primary" /> SMS &amp; email updates at every delivery stage</li>
          <li className="flex items-start gap-2 text-[#374151]"><MapPin className="mt-0.5 h-4 w-4 text-primary" /> Track at kingspharmacy.co.zw/track/{receipt.delivery.trackingRef}</li>
          <li className="flex items-start gap-2 text-[#374151]"><Clock className="mt-0.5 h-4 w-4 text-primary" /> Estimated delivery: {receipt.delivery.estimatedDate}</li>
        </ul>
      </div>

      {/* SECTION 6 — Bottom buttons */}
      <div className="flex flex-col gap-2 border-t border-border bg-card p-4 sm:flex-row sm:justify-center">
        <Link to="/track" search={{ order: receipt.orderNumber }} className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:bg-primary-dark">
          <MapPin className="h-4 w-4" /> Track My Order
        </Link>
        <Link to="/" className="inline-flex items-center justify-center rounded-md border-2 border-primary px-6 py-3 text-sm font-bold text-primary hover:bg-primary/5">
          Continue Shopping
        </Link>
      </div>

      <ReceiptModal open={receiptOpen} receipt={receipt} onClose={() => setReceiptOpen(false)} />
    </div>
  );
}

function advance(steps: Step[]): Step[] {
  const idx = steps.findIndex((s) => s.state === "current");
  if (idx < 0 || idx === steps.length - 1) return steps;
  return steps.map((s, i) => {
    if (i === idx) return { ...s, state: "done", ts: "Just now" };
    if (i === idx + 1) return { ...s, state: "current", ts: "In progress" };
    return s;
  });
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between"><span className="text-muted-foreground">{label}</span><span className="font-medium">{value}</span></div>;
}

function ActionBtn({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center justify-center gap-1.5 rounded-lg border border-[#BBF7D0] bg-[#F0F9F4] py-4 text-[#0EA5E9] transition hover:bg-[#E0F2E9]">
      {icon}
      <span className="text-xs font-bold">{label}</span>
    </button>
  );
}

function Confetti() {
  const colors = ["#0EA5E9", "#FFD600", "#FF6B35", "#FFFFFF", "#E0F2E9"];
  return (
    <div className="pointer-events-none relative h-0">
      {Array.from({ length: 18 }).map((_, i) => (
        <span key={i}
          className="absolute left-1/2 top-0 inline-block h-1.5 w-1.5 rounded-sm"
          style={{
            background: colors[i % colors.length],
            animation: `confetti 1.6s ease-out ${0.6 + (i % 6) * 0.05}s forwards`,
            transform: `translate(-50%, 0) rotate(${(i / 18) * 360}deg) translateY(-10px)`,
          }}
        />
      ))}
      <style>{`@keyframes confetti { 0%{opacity:0;transform:translate(-50%,0) scale(0.5);} 30%{opacity:1;} 100%{opacity:0;transform:translate(calc(-50% + ${"var(--dx,0)"}px),120px) rotate(360deg) scale(1.1);} }`}</style>
    </div>
  );
}

// Stable plate per mount
let _platCache: string | null = null;
function randomZwPlateMemo() {
  if (_platCache) return _platCache;
  const letters = "ABCDEFGHJKLMNPRSTUVWXYZ";
  const L = () => letters[Math.floor(Math.random() * letters.length)];
  const d = () => Math.floor(Math.random() * 10);
  _platCache = `${L()}${L()}${L()} ${d()}${d()}${d()}${d()}`;
  return _platCache;
}