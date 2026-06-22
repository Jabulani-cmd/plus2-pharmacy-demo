import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Play, Pause, RotateCcw, ChevronRight, Sparkles, X } from "lucide-react";
import { useSharedOrders } from "@/store/sharedOrders";
import { useSharedPrescriptions } from "@/store/sharedPrescriptions";

type DemoFlow = "otc" | "rx";

type Stage = {
  number: number;
  label: string;
  description: string;
  /** Optional automatic side-effect on entering the stage. */
  apply?: (orderId: string) => void;
};

/**
 * Picture-in-picture demo narrator. Drives an existing live order through the
 * full workflow at the presenter's own pace. Lives only on /demo.
 */
export function DemoController({ flow: initialFlow = "otc", onClose }: { flow?: DemoFlow; onClose?: () => void }) {
  const [flow, setFlow] = useState<DemoFlow>(initialFlow);
  const [running, setRunning] = useState(false);
  const [stageIdx, setStageIdx] = useState(0);
  const orderIdRef = useRef<string | null>(null);

  // Stores
  const orders = useSharedOrders((s) => s.orders);
  const markPacked = useSharedOrders((s) => s.markPacked);
  const assignDriver = useSharedOrders((s) => s.assignDriver);
  const startDelivery = useSharedOrders((s) => s.startDelivery);
  const updateOrderStatus = useSharedOrders((s) => s.updateStatus);

  const prescriptions = useSharedPrescriptions((s) => s.prescriptions);
  const assignRxDriver = useSharedPrescriptions((s) => s.assignDriver);
  const updateRxStatus = useSharedPrescriptions((s) => s.updateStatus);

  // Stage definitions
  const otcStages: Stage[] = [
    { number: 1, label: "Customer browsing", description: "Customer browses Kings Pharmacy products on the homepage." },
    { number: 2, label: "Add to cart", description: "Customer adds OTC items to the cart and proceeds to checkout." },
    { number: 3, label: "Delivery details", description: "Customer enters delivery address and chooses a method." },
    { number: 4, label: "Customer payment", description: "Customer pays via EcoCash, OneMoney, ZimSwitch or Bank Transfer." },
    { number: 5, label: "Order confirmed", description: "Order has been received. Staff have been notified." },
    { number: 6, label: "Staff packing order", description: "Pharmacy staff pack the order and mark it ready for dispatch.", apply: (id) => markPacked(id) },
    { number: 7, label: "Driver assigned", description: "Dispatcher assigns Blessing Ncube (Honda CB125 — Red).",
      apply: (id) => assignDriver(id, "Blessing Ncube", "+263 77 987 6543", "Honda CB125 · Red") },
    { number: 8, label: "Driver starts delivery", description: "Driver collects the order and starts the delivery run.", apply: (id) => startDelivery(id) },
    { number: 9, label: "Out for delivery", description: "Customer sees live map, countdown, chat and call options." },
    { number: 10, label: "Delivered", description: "Customer confirms receipt and rates the delivery.", apply: (id) => updateOrderStatus(id, "Delivered") },
  ];

  const rxStages: Stage[] = [
    { number: 1, label: "Customer uploads prescription", description: "Customer photographs or uploads a prescription file." },
    { number: 2, label: "Pharmacist review", description: "Pharmacist reviews the script and prepares a quotation." },
    { number: 3, label: "Quotation sent", description: "Itemised quotation is sent to the customer for approval." },
    { number: 4, label: "Customer pays", description: "Customer pays for the prescription." },
    { number: 5, label: "Dispensing", description: "Pharmacist dispenses the medication and packs it." },
    { number: 6, label: "Driver assigned", description: "Driver is assigned to deliver the prescription.",
      apply: (id) => assignRxDriver(id, "Blessing Ncube", "+263 77 987 6543", "Honda CB125 · Red") },
    { number: 7, label: "Out for delivery", description: "Driver is on the way to the customer.",
      apply: (id) => updateRxStatus(id, "Out for Delivery") },
    { number: 8, label: "Delivered", description: "Customer receives the medication and signs for it.",
      apply: (id) => updateRxStatus(id, "Delivered") },
  ];

  const stages = flow === "otc" ? otcStages : rxStages;
  const stage = stages[stageIdx];

  const start = () => {
    if (flow === "otc") {
      const candidate = orders.find((o) => o.status !== "Delivered") ?? orders[0];
      if (!candidate) {
        toast.error("Place an OTC order first, then start the demo.");
        return;
      }
      orderIdRef.current = candidate.id;
    } else {
      const candidate =
        prescriptions.find((p) => p.status !== "Delivered" && p.status !== "Rejected") ?? prescriptions[0];
      if (!candidate) {
        toast.error("Upload a prescription first, then start the demo.");
        return;
      }
      orderIdRef.current = candidate.id;
    }
    setStageIdx(0);
    setRunning(true);
    toast.info("Demo started — " + (flow === "otc" ? "OTC Shopping" : "Prescription") + " flow");
  };

  const advance = () => {
    if (stageIdx >= stages.length - 1) {
      toast.success("Demo complete");
      setRunning(false);
      return;
    }
    const next = stages[stageIdx + 1];
    if (next.apply && orderIdRef.current) next.apply(orderIdRef.current);
    setStageIdx((i) => i + 1);
  };

  const restart = () => {
    setStageIdx(0);
    setRunning(false);
    orderIdRef.current = null;
  };

  return (
    <div className="fixed bottom-4 left-4 z-50 w-[340px] max-w-[calc(100vw-2rem)] rounded-2xl border-2 border-primary bg-card shadow-2xl">
      <header className="flex items-center justify-between gap-2 rounded-t-2xl bg-primary px-4 py-2.5 text-primary-foreground">
        <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider">
          <Sparkles className="h-4 w-4" />
          Stage Narrator
        </div>
        {onClose && (
          <button onClick={onClose} className="rounded p-1 hover:bg-white/15" aria-label="Close demo controller">
            <X className="h-4 w-4" />
          </button>
        )}
      </header>
      <div className="p-4">
        {!running ? (
          <>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setFlow("otc")}
                className={
                  "rounded-md border-2 px-2 py-2 text-[11px] font-extrabold uppercase tracking-wider " +
                  (flow === "otc" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground")
                }
              >
                OTC Demo
              </button>
              <button
                onClick={() => setFlow("rx")}
                className={
                  "rounded-md border-2 px-2 py-2 text-[11px] font-extrabold uppercase tracking-wider " +
                  (flow === "rx" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground")
                }
              >
                Prescription Demo
              </button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              {flow === "otc"
                ? "Walks through the full 10-stage OTC shopping workflow."
                : "Walks through the full upload-to-delivery prescription workflow."}
            </p>
            <button
              onClick={start}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-2.5 text-xs font-extrabold uppercase text-primary-foreground transition hover:bg-primary-dark"
            >
              <Play className="h-4 w-4" /> Start Demo
            </button>
          </>
        ) : (
          <>
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
              Stage {stage.number} of {stages.length}
            </div>
            <div className="mt-1 text-base font-extrabold text-foreground">{stage.label}</div>
            <p className="mt-1 text-xs text-muted-foreground">{stage.description}</p>
            {orderIdRef.current && (
              <p className="mt-2 font-mono text-[10px] text-muted-foreground">
                Order: {orderIdRef.current}
              </p>
            )}
            <div className="mt-3 flex gap-2">
              <button
                onClick={advance}
                disabled={stageIdx >= stages.length - 1}
                className="flex flex-1 items-center justify-center gap-1 rounded-full bg-primary py-2 text-xs font-extrabold uppercase text-primary-foreground transition hover:bg-primary-dark disabled:opacity-50"
              >
                Next Stage <ChevronRight className="h-4 w-4" />
              </button>
              <button
                onClick={restart}
                className="flex items-center justify-center gap-1 rounded-full border border-border bg-card px-3 py-2 text-xs font-extrabold uppercase text-muted-foreground hover:bg-muted"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Restart
              </button>
            </div>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: ((stageIdx + 1) / stages.length) * 100 + "%" }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}