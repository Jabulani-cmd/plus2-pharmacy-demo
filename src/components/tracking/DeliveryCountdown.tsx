import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

/**
 * Live countdown from `startTs` for `durationMinutes`. When zero, switches
 * to an "arriving now" message.
 */
export function DeliveryCountdown({
  startTs,
  durationMinutes = 20,
}: {
  startTs: number;
  durationMinutes?: number;
}) {
  const targetTs = startTs + durationMinutes * 60_000;
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const remaining = Math.max(0, Math.floor((targetTs - now) / 1000));
  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  return (
    <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary">
        <Clock className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <div className="text-[11px] font-bold uppercase tracking-wide text-primary">
          Estimated arrival
        </div>
        {remaining === 0 ? (
          <div className="text-sm font-extrabold text-foreground">
            Your order should be arriving now!
          </div>
        ) : (
          <div className="font-mono text-2xl font-black tabular-nums text-foreground">
            {mm}:{ss}
          </div>
        )}
      </div>
    </div>
  );
}