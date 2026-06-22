import { Award } from "lucide-react";
import { useOrderExtras } from "@/store/orderExtras";

/**
 * Kings Rewards loyalty points card with progress to next reward tier.
 */
export function LoyaltyCard() {
  const points = useOrderExtras((s) => s.points);
  const nextThreshold = Math.ceil((points + 1) / 200) * 200;
  const remaining = nextThreshold - points;
  const pct = Math.min(100, Math.round(((points % 200) / 200) * 100));

  return (
    <div className="overflow-hidden rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 via-amber-100/40 to-yellow-50 p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-amber-700">
            <Award className="h-3.5 w-3.5" /> Kings Rewards
          </div>
          <div className="mt-2 text-3xl font-black text-amber-900">{points.toLocaleString()}</div>
          <div className="text-xs font-semibold text-amber-700">points</div>
        </div>
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/20 text-amber-700 shadow-inner">
          <Award className="h-7 w-7" />
        </div>
      </div>
      <div className="mt-4">
        <div className="flex items-center justify-between text-[11px] font-semibold text-amber-800">
          <span>{remaining} points to your next reward</span>
          <span>{pct}%</span>
        </div>
        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-amber-200/60">
          <div
            className="h-full rounded-full bg-amber-500 transition-all"
            style={{ width: pct + "%" }}
          />
        </div>
      </div>
      <p className="mt-3 text-[11px] text-amber-800/80">
        Earn 10 points per OTC order, 20 points per prescription delivery.
      </p>
    </div>
  );
}