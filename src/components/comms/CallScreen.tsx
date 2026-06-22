import { useEffect, useState } from "react";
import { Phone, PhoneOff, Mic, MicOff, Volume2 } from "lucide-react";

type Props = {
  partnerName: string;
  partnerSubtitle?: string;
  onEnd: () => void;
};

/** Mock phone-call screen — 3s ringing then auto-connect with a counting timer. */
export function CallScreen({ partnerName, partnerSubtitle, onEnd }: Props) {
  const [phase, setPhase] = useState<"ringing" | "connected">("ringing");
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setPhase("connected"), 3000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (phase !== "connected") return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  const initials = partnerName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-between bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 px-6 py-10 text-white">
      <div className="mt-10 flex flex-col items-center">
        <div className="text-xs font-bold uppercase tracking-[0.3em] text-white/60">
          {phase === "ringing" ? "Calling…" : "Connected"}
        </div>
        <div className="mt-8 relative">
          {phase === "ringing" && (
            <>
              <span className="absolute inset-0 animate-ping rounded-full bg-primary/30" />
              <span className="absolute inset-0 animate-pulse rounded-full bg-primary/20" style={{ animationDelay: "0.4s" }} />
            </>
          )}
          <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-primary to-blue-700 text-3xl font-extrabold shadow-2xl ring-4 ring-white/10">
            {initials}
          </div>
        </div>
        <div className="mt-6 text-2xl font-extrabold">{partnerName}</div>
        {partnerSubtitle && (
          <div className="mt-1 text-sm text-white/70">{partnerSubtitle}</div>
        )}
        <div className="mt-4 font-mono text-base tabular-nums text-white/80">
          {phase === "ringing" ? "Ringing…" : `${mm}:${ss}`}
        </div>
      </div>

      <div className="mb-6 flex items-center gap-5">
        <button
          onClick={() => setMuted((m) => !m)}
          className={"flex h-14 w-14 items-center justify-center rounded-full text-white transition " + (muted ? "bg-white/30" : "bg-white/10 hover:bg-white/20")}
          aria-label="Mute"
        >
          {muted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
        </button>
        <button
          onClick={onEnd}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600 text-white shadow-xl transition hover:bg-red-700"
          aria-label="End call"
        >
          <PhoneOff className="h-7 w-7" />
        </button>
        <button
          className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          aria-label="Speaker"
        >
          <Volume2 className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}

/** Button that opens a CallScreen for the given partner. */
export function CallButton({
  partnerName,
  partnerSubtitle,
  label,
  className,
}: {
  partnerName: string;
  partnerSubtitle?: string;
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={
          className ??
          "inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-xs font-extrabold text-white shadow-sm transition hover:bg-emerald-700"
        }
      >
        <Phone className="h-4 w-4" /> {label ?? "Call " + partnerName.split(" ")[0]}
      </button>
      {open && (
        <CallScreen partnerName={partnerName} partnerSubtitle={partnerSubtitle} onEnd={() => setOpen(false)} />
      )}
    </>
  );
}