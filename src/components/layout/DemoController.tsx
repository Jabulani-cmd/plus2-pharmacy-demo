import { useEffect, useRef, useState } from "react";
import { Play, Pause, Square, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useSharedOrders } from "@/store/sharedOrders";

// Walks an existing live order from "Confirmed" through to "Delivered" with
// a 3-second pause at every stage so it can be presented step by step.
// Pause/Resume freezes the timer indefinitely.

type Stage = {
  label: string;
  action: (orderId: string) => void;
};

const DELAY_MS = 3000;

export function DemoController() {
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [stageIdx, setStageIdx] = useState(0);
  const [stageLabel, setStageLabel] = useState("");
  const orderIdRef = useRef<string | null>(null);

  const orders = useSharedOrders((s) => s.orders);
  const markPacked = useSharedOrders((s) => s.markPacked);
  const assignDriver = useSharedOrders((s) => s.assignDriver);
  const startDelivery = useSharedOrders((s) => s.startDelivery);
  const updateStatus = useSharedOrders((s) => s.updateStatus);

  const stages: Stage[] = [
    { label: "Stage 6: Staff packing order", action: (id) => markPacked(id) },
    {
      label: "Stage 7: Assigning driver",
      action: (id) =>
        assignDriver(id, "Tatenda Chirwa", "+263 71 998 4421", "Honda Fit · AFC 1230"),
    },
    { label: "Stage 8: Driver starting delivery", action: (id) => startDelivery(id) },
    { label: "Stage 9: Out for delivery", action: () => {} },
    { label: "Stage 10: Marking delivered", action: (id) => updateStatus(id, "Delivered") },
  ];

  // Driver — the timer loop.
  useEffect(() => {
    if (!running || paused) return;
    const id = orderIdRef.current;
    if (!id) return;

    if (stageIdx >= stages.length) {
      setRunning(false);
      setStageLabel("Demo complete");
      toast.success("Demo complete — order delivered");
      return;
    }

    const current = stages[stageIdx];
    setStageLabel(current.label);
    const t = setTimeout(() => {
      current.action(id);
      setStageIdx((i) => i + 1);
    }, DELAY_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, paused, stageIdx]);

  const start = () => {
    const candidate =
      orders.find((o) => o.status === "Confirmed") ?? orders[0];
    if (!candidate) {
      toast.error("Place an order first, then start the demo.");
      return;
    }
    orderIdRef.current = candidate.id;
    setStageIdx(0);
    setPaused(false);
    setRunning(true);
    toast.info("Demo started on order " + candidate.id);
  };

  const stop = () => {
    setRunning(false);
    setPaused(false);
    setStageIdx(0);
    setStageLabel("");
    orderIdRef.current = null;
  };

  return (
    <>
      {/* Floating control */}
      <div className="fixed bottom-32 right-4 z-40 flex flex-col items-end gap-2">
        {!running ? (
          <button
            onClick={start}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-extrabold text-primary-foreground shadow-lg hover:bg-primary-dark"
          >
            <Sparkles className="h-4 w-4" /> Demo Mode
          </button>
        ) : (
          <div className="flex items-center gap-1 rounded-full bg-white p-1 shadow-lg ring-1 ring-border">
            <button
              onClick={() => setPaused((p) => !p)}
              className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-extrabold text-primary hover:bg-primary/5"
            >
              {paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
              {paused ? "Resume" : "Pause"}
            </button>
            <button
              onClick={stop}
              className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-extrabold text-muted-foreground hover:bg-muted"
            >
              <Square className="h-3.5 w-3.5" /> Stop
            </button>
          </div>
        )}
      </div>

      {/* Top-right stage overlay */}
      {running && stageLabel && (
        <div className="fixed top-20 right-4 z-50 rounded-lg bg-primary px-4 py-2 text-xs font-extrabold uppercase tracking-wider text-white shadow-xl animate-fade-in">
          {paused ? "PAUSED · " : ""}
          {stageLabel}
        </div>
      )}
    </>
  );
}