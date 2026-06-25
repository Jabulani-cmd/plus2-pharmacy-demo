import { useRealtimeStatus } from "@/lib/realtime";

export function LiveStatusBadge({ className = "" }: { className?: string }) {
  const status = useRealtimeStatus();
  const live = status === "live";
  return (
    <span
      className={
        "inline-flex items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-semibold ring-1 ring-border backdrop-blur-sm " +
        className
      }
      title={live ? "Realtime connection active" : "Reconnecting…"}
    >
      <span
        className={
          "h-1.5 w-1.5 rounded-full " +
          (live ? "bg-emerald-500 animate-pulse" : "bg-amber-500")
        }
      />
      <span className={live ? "text-emerald-700" : "text-amber-700"}>
        {live ? "Live" : "Reconnecting…"}
      </span>
    </span>
  );
}