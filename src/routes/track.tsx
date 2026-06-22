import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import {
  Check,
  Phone,
  MessageCircle,
  X,
  Star,
  Navigation,
  MapPin,
  Clock,
  Package,
} from "lucide-react";
import { useOrders, ORDER_FLOW, type LiveStatus } from "@/lib/orders";
import { toast } from "sonner";

export const Route = createFileRoute("/track")({
  validateSearch: (s: Record<string, unknown>) => ({
    id: typeof s.id === "string" ? s.id : undefined,
  }),
  component: Track,
});

const STEP_META: Record<string, { e: string; label: string }> = {
  "Order Confirmed": { e: "✅", label: "Order received and confirmed" },
  "Pharmacist Reviewing": { e: "👨‍⚕️", label: "Pharmacist verifying items" },
  "Preparing Order": { e: "📦", label: "Order being packed at branch" },
  "Driver Assigned": { e: "🚗", label: "Driver assigned and collecting" },
  "Out for Delivery": { e: "🛵", label: "Driver on the way to you" },
  "Delivered": { e: "🏠", label: "Order delivered successfully" },
};

// ─── Bulawayo map data (SVG viewport 520×340) ────────────────────────────────
const MAP_W = 520;
const MAP_H = 340;

const BRANCHES: Record<string, { x: number; y: number; label: string; color: string }> = {
  "9th Ave CBD": { x: 80, y: 240, label: "9th Ave", color: "#1E5BC6" },
  "6th Ave CBD": { x: 150, y: 180, label: "6th Ave", color: "#1E5BC6" },
  "Old Mutual Centre Jason Moyo": { x: 240, y: 140, label: "Old Mutual", color: "#1E5BC6" },
  "Ascot Shopping Centre": { x: 390, y: 80, label: "Ascot", color: "#1E5BC6" },
};

const CUSTOMER = { x: 440, y: 260, label: "Your location" };

const ROADS = [
  { x1: 0, y1: 80, x2: 520, y2: 80 },
  { x1: 0, y1: 140, x2: 520, y2: 140 },
  { x1: 0, y1: 180, x2: 520, y2: 180 },
  { x1: 0, y1: 240, x2: 520, y2: 240 },
  { x1: 0, y1: 300, x2: 520, y2: 300 },
  { x1: 80, y1: 0, x2: 80, y2: 340 },
  { x1: 150, y1: 0, x2: 150, y2: 340 },
  { x1: 240, y1: 0, x2: 240, y2: 340 },
  { x1: 320, y1: 0, x2: 320, y2: 340 },
  { x1: 390, y1: 0, x2: 390, y2: 340 },
  { x1: 460, y1: 0, x2: 460, y2: 340 },
];

const MINOR_ROADS = [
  { x1: 0, y1: 110, x2: 520, y2: 110 },
  { x1: 0, y1: 210, x2: 520, y2: 210 },
  { x1: 0, y1: 270, x2: 520, y2: 270 },
  { x1: 115, y1: 0, x2: 115, y2: 340 },
  { x1: 195, y1: 0, x2: 195, y2: 340 },
  { x1: 280, y1: 0, x2: 280, y2: 340 },
  { x1: 355, y1: 0, x2: 355, y2: 340 },
  { x1: 425, y1: 0, x2: 425, y2: 340 },
];

const ROUTE_WAYPOINTS = [
  { x: 80, y: 240 },
  { x: 150, y: 240 },
  { x: 240, y: 240 },
  { x: 240, y: 180 },
  { x: 320, y: 180 },
  { x: 390, y: 180 },
  { x: 390, y: 260 },
  { x: 440, y: 260 },
];

function waypointsToPath(pts: { x: number; y: number }[]) {
  return pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
}

function interpolateRoute(pts: { x: number; y: number }[], progress: number) {
  if (progress <= 0) return pts[0];
  if (progress >= 1) return pts[pts.length - 1];
  const totalSegments = pts.length - 1;
  const scaled = progress * totalSegments;
  const seg = Math.floor(scaled);
  const t = scaled - seg;
  const from = pts[Math.min(seg, totalSegments - 1)];
  const to = pts[Math.min(seg + 1, totalSegments)];
  return {
    x: from.x + (to.x - from.x) * t,
    y: from.y + (to.y - from.y) * t,
  };
}

// ─── Delivery Map Component ───────────────────────────────────────────────────

function DeliveryMap({
  progress,
  driverName,
  isActive,
  branchName,
}: {
  progress: number;
  driverName: string;
  isActive: boolean;
  branchName: string;
}) {
  const driverPos = interpolateRoute(ROUTE_WAYPOINTS, progress);
  const branch = BRANCHES[branchName] ?? BRANCHES["9th Ave CBD"];
  const routePath = waypointsToPath(ROUTE_WAYPOINTS);

  const [bounce, setBounce] = useState(0);
  useEffect(() => {
    if (!isActive) return;
    const id = setInterval(() => setBounce((b) => (b === 0 ? -3 : 0)), 600);
    return () => clearInterval(id);
  }, [isActive]);

  return (
    <div className="relative w-full rounded-xl overflow-hidden bg-[#E8F0E8]" style={{ paddingBottom: "65%" }}>
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox={`0 0 ${MAP_W} ${MAP_H}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <rect width={MAP_W} height={MAP_H} fill="#EEF2E8" />

        {[0, 2, 4].map((row) =>
          [0, 2, 4, 6].map((col) => (
            <rect
              key={`block-${row}-${col}`}
              x={col * 65 + 2}
              y={row * 55 + 2}
              width={63}
              height={53}
              fill="#E8EDE4"
              rx={2}
            />
          ))
        )}
        {[1, 3].map((row) =>
          [1, 3, 5].map((col) => (
            <rect
              key={`block2-${row}-${col}`}
              x={col * 65 + 2}
              y={row * 55 + 2}
              width={63}
              height={53}
              fill="#E4E9E0"
              rx={2}
            />
          ))
        )}

        {MINOR_ROADS.map((r, i) => (
          <line
            key={`minor-${i}`}
            x1={r.x1}
            y1={r.y1}
            x2={r.x2}
            y2={r.y2}
            stroke="#D4DAD0"
            strokeWidth="1.5"
          />
        ))}

        {ROADS.map((r, i) => (
          <line
            key={`road-${i}`}
            x1={r.x1}
            y1={r.y1}
            x2={r.x2}
            y2={r.y2}
            stroke="#FFFFFF"
            strokeWidth="5"
          />
        ))}
        {ROADS.map((r, i) => (
          <line
            key={`roadline-${i}`}
            x1={r.x1}
            y1={r.y1}
            x2={r.x2}
            y2={r.y2}
            stroke="#E8E0C8"
            strokeWidth="1"
            strokeDasharray="8 6"
          />
        ))}

        <path
          d={routePath}
          stroke="#B0BEC5"
          strokeWidth="4"
          fill="none"
          strokeDasharray="8 5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {isActive && (
          <motion.path
            d={routePath}
            stroke="#1E5BC6"
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
            initial={false}
            animate={{ strokeDasharray: `${progress} ${1 - progress}` }}
            style={{ strokeDashoffset: 0 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
          />
        )}

        <text x="4" y="238" fontSize="7" fill="#999" fontFamily="sans-serif">
          9th Ave
        </text>
        <text x="4" y="178" fontSize="7" fill="#999" fontFamily="sans-serif">
          6th Ave
        </text>
        <text x="4" y="138" fontSize="7" fill="#999" fontFamily="sans-serif">
          Jason Moyo Ave
        </text>
        <text
          x="78"
          y="12"
          fontSize="7"
          fill="#999"
          fontFamily="sans-serif"
          transform="rotate(90, 78, 12)"
        >
          Fife St
        </text>
        <text
          x="148"
          y="12"
          fontSize="7"
          fill="#999"
          fontFamily="sans-serif"
          transform="rotate(90, 148, 12)"
        >
          R.Mugabe
        </text>
        <text
          x="238"
          y="12"
          fontSize="7"
          fill="#999"
          fontFamily="sans-serif"
          transform="rotate(90, 238, 12)"
        >
          Main St
        </text>

        <circle cx={branch.x} cy={branch.y} r="14" fill="#1E5BC6" opacity="0.15">
          <animate attributeName="r" values="12;20;12" dur="2.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.2;0;0.2" dur="2.5s" repeatCount="indefinite" />
        </circle>
        <circle cx={branch.x} cy={branch.y} r="10" fill="#1E5BC6" />
        <text x={branch.x} y={branch.y + 4} fontSize="8" fill="white" textAnchor="middle" fontFamily="sans-serif" fontWeight="bold">
          Rx
        </text>
        <rect x={branch.x - 22} y={branch.y + 13} width={44} height={13} rx={6} fill="#1B3A6B" />
        <text x={branch.x} y={branch.y + 22} fontSize="7.5" fill="white" textAnchor="middle" fontFamily="sans-serif" fontWeight="bold">
          {branch.label}
        </text>

        <circle cx={CUSTOMER.x} cy={CUSTOMER.y} r="12" fill="#E53935" opacity="0.15">
          <animate attributeName="r" values="10;18;10" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.3;0;0.3" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx={CUSTOMER.x} cy={CUSTOMER.y} r="9" fill="#E53935" />
        <text x={CUSTOMER.x} y={CUSTOMER.y + 3} fontSize="9" fill="white" textAnchor="middle">
          📍
        </text>
        <rect x={CUSTOMER.x - 20} y={CUSTOMER.y + 12} width={40} height={13} rx={6} fill="#C62828" />
        <text x={CUSTOMER.x} y={CUSTOMER.y + 21} fontSize="7.5" fill="white" textAnchor="middle" fontFamily="sans-serif" fontWeight="bold">
          You
        </text>

        {isActive && (
          <g transform={`translate(${driverPos.x}, ${driverPos.y + bounce})`}>
            <ellipse cx={0} cy={14} rx={10} ry={4} fill="rgba(0,0,0,0.15)" />
            <circle r="13" fill="white" stroke="#1E5BC6" strokeWidth="2.5" />
            <text x="0" y="5" fontSize="14" textAnchor="middle">
              🚗
            </text>
            <rect x={-28} y={16} width={56} height={14} rx={7} fill="#1E5BC6" />
            <text x={0} y={26} fontSize="7" fill="white" textAnchor="middle" fontFamily="sans-serif" fontWeight="bold">
              {driverName.split(" ")[0] || "Driver"}
            </text>
          </g>
        )}

        <rect x={8} y={8} width={84} height={20} rx={10} fill="rgba(255,255,255,0.92)" />
        <text x={50} y={21} fontSize="9" fill="#1B3A6B" textAnchor="middle" fontFamily="sans-serif" fontWeight="bold">
          {isActive ? `${Math.round(progress * 100)}% to destination` : "Awaiting dispatch"}
        </text>

        {isActive && (
          <>
            <rect x={MAP_W - 92} y={8} width={84} height={20} rx={10} fill="rgba(255,255,255,0.92)" />
            <text x={MAP_W - 50} y={21} fontSize="9" fill="#1B3A6B" textAnchor="middle" fontFamily="sans-serif" fontWeight="bold">
              {(3.2 * (1 - progress)).toFixed(1)} km away
            </text>
          </>
        )}

        <g transform={`translate(${MAP_W - 22}, ${MAP_H - 22})`}>
          <circle r="10" fill="white" opacity="0.8" />
          <text x="0" y="4" fontSize="8" textAnchor="middle" fill="#1B3A6B" fontWeight="bold">
            N
          </text>
          <line x1="0" y1="5" x2="0" y2="9" stroke="#1B3A6B" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}

// ─── Countdown Timer ──────────────────────────────────────────────────────────

function CountdownTimer({ stepIdx }: { stepIdx: number }) {
  // Ensure stepIdx is within bounds (0 to ORDER_FLOW.length-1)
  const safeIdx = Math.min(Math.max(stepIdx, 0), ORDER_FLOW.length - 1);
  const totalSeconds = Math.max(30, (5 - safeIdx) * 3 * 60);
  const [secs, setSecs] = useState(totalSeconds);

  useEffect(() => {
    setSecs(Math.max(30, (5 - safeIdx) * 3 * 60));
  }, [safeIdx]);

  useEffect(() => {
    if (secs <= 0) return;
    const id = setInterval(() => setSecs((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [secs]);

  const mm = Math.floor(secs / 60).toString().padStart(2, "0");
  const ss = (secs % 60).toString().padStart(2, "0");

  if (secs === 0) return <span className="text-[#1E5BC6] font-black">Arriving now!</span>;

  return (
    <span className="font-black tabular-nums">
      {mm}:{ss}
    </span>
  );
}

// ─── Chat Panel ───────────────────────────────────────────────────────────────

type ChatMsg = { from: "driver" | "customer"; text: string; time: string };

const DEMO_MESSAGES: ChatMsg[] = [
  { from: "driver", text: "Hi! I have your order and I'm on my way 🚗", time: "10:32" },
  { from: "customer", text: "Great, please ring at the gate.", time: "10:33" },
  { from: "driver", text: "About 10 minutes away — traffic is light! 👍", time: "10:34" },
  { from: "driver", text: "I have arrived at the entrance.", time: "10:41" },
];

function ChatPanel({ driverName, onClose }: { driverName: string; onClose: () => void }) {
  const [messages, setMessages] = useState<ChatMsg[]>(DEMO_MESSAGES);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function send() {
    const text = input.trim();
    if (!text) return;
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, "0")}:${now
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
    setMessages((m) => [...m, { from: "customer", text, time }]);
    setInput("");
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        { from: "driver", text: "On my way! 🚗", time },
      ]);
    }, 1500);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl w-full max-w-sm flex flex-col overflow-hidden"
        style={{ maxHeight: "75vh" }}
      >
        <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-[#1B3A6B] to-[#1E5BC6] text-white">
          <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center font-black text-sm">
            {driverName
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </div>
          <div className="flex-1">
            <div className="font-black text-sm">{driverName}</div>
            <div className="text-[10px] opacity-80 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400 inline-block" />
              Active delivery
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full hover:bg-white/10 flex items-center justify-center"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-[#F5F7FA]" style={{ minHeight: 200 }}>
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.from === "customer" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm ${
                  m.from === "customer"
                    ? "bg-[#1E5BC6] text-white rounded-br-sm"
                    : "bg-white text-[#1B3A6B] rounded-bl-sm shadow-sm"
                }`}
              >
                <p>{m.text}</p>
                <p
                  className={`text-[10px] mt-0.5 ${
                    m.from === "customer" ? "text-white/60 text-right" : "text-slate-400"
                  }`}
                >
                  {m.time}
                </p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div className="flex gap-2 p-3 border-t border-slate-100 bg-white">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Type a message…"
            className="flex-1 h-10 rounded-full bg-[#F5F7FA] px-4 text-sm outline-none border border-transparent focus:border-[#1E5BC6]"
          />
          <button
            onClick={send}
            className="h-10 w-10 rounded-full bg-[#1B3A6B] text-white flex items-center justify-center shrink-0 hover:bg-[#1E5BC6] transition"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Mock Call Screen ─────────────────────────────────────────────────────────

function CallScreen({ driverName, onEnd }: { driverName: string; onEnd: () => void }) {
  const [phase, setPhase] = useState<"calling" | "connected">("calling");
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setPhase("connected"), 3000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (phase !== "connected") return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [phase]);

  const mm = Math.floor(seconds / 60).toString().padStart(2, "0");
  const ss = (seconds % 60).toString().padStart(2, "0");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-gradient-to-br from-[#1B3A6B] to-[#0F2347] flex flex-col items-center justify-center"
    >
      {phase === "calling" && (
        <>
          <motion.div
            className="absolute rounded-full border-2 border-white/10"
            animate={{ scale: [1, 2.5], opacity: [0.3, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
            style={{ width: 140, height: 140 }}
          />
          <motion.div
            className="absolute rounded-full border-2 border-white/10"
            animate={{ scale: [1, 2.5], opacity: [0.3, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeOut", delay: 0.7 }}
            style={{ width: 140, height: 140 }}
          />
        </>
      )}

      <div className="h-24 w-24 rounded-full bg-white/20 flex items-center justify-center text-4xl mb-4 relative z-10">
        🛵
      </div>
      <div className="text-white font-black text-2xl z-10">{driverName}</div>
      <div className="text-white/60 text-sm mt-1 z-10">Kings Pharmacy Driver</div>
      <div className="text-white/80 font-bold mt-3 z-10">
        {phase === "calling" ? (
          <motion.span
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ repeat: Infinity, duration: 1.2 }}
          >
            Calling…
          </motion.span>
        ) : (
          <span className="text-green-300">Connected · {mm}:{ss}</span>
        )}
      </div>

      <button
        onClick={onEnd}
        className="mt-14 h-16 w-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white z-10 transition"
      >
        <Phone className="h-7 w-7 rotate-[135deg]" />
      </button>
      <div className="text-white/50 text-xs mt-2 z-10">End Call</div>
    </motion.div>
  );
}

// ─── Main Track Component ─────────────────────────────────────────────────────

function Track() {
  const { id } = Route.useSearch();
  const orders = useOrders((s) => s.orders);
  const advance = useOrders((s) => s.advance);
  const rate = useOrders((s) => s.rate);
  const rateDelivery = useOrders((s) => s.rateDelivery);
  const order = id ? orders.find((o) => o.id === id) : orders[0];

  const [chat, setChat] = useState(false);
  const [calling, setCalling] = useState(false);

  // Handle missing order
  if (!order) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <Package className="h-16 w-16 mx-auto text-slate-300 mb-4" />
        <div className="text-lg font-bold text-[#1B3A6B]">No active orders</div>
        <div className="text-sm text-slate-500 mt-1">
          Place an order from the shop to start tracking.
        </div>
      </div>
    );
  }

  // Safely compute step index
  const stepIdx = ORDER_FLOW.indexOf(order.status as LiveStatus);
  const safeStepIdx = stepIdx === -1 ? 0 : Math.min(stepIdx, ORDER_FLOW.length - 1);
  const progress = safeStepIdx / (ORDER_FLOW.length - 1);
  const delivered = order.status === "Delivered";
  const isOutForDelivery = safeStepIdx >= 4; // "Out for Delivery" or later
  const driverName = order.driverName ?? "Awaiting driver";
  const branchName = "9th Ave CBD"; // default branch

  // Safely access history and items
  const history = order.history ?? [];
  const items = order.items ?? [];
  const total = order.total ?? 0;

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-4 md:py-8 space-y-4">
      {/* Top status card */}
      <div className="bg-gradient-to-r from-[#1B3A6B] to-[#1E5BC6] rounded-2xl p-4 md:p-5 text-white">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-[11px] opacity-70 font-bold uppercase tracking-wider">
              Order #{order.id}
            </div>
            <div className="text-lg md:text-xl font-black mt-0.5">
              {STEP_META[order.status]?.e} {order.status}
            </div>
            <div className="text-[12px] opacity-80 mt-0.5">
              {STEP_META[order.status]?.label}
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[11px] opacity-70 flex items-center gap-1 justify-end">
              <Clock className="h-3 w-3" /> Arriving in
            </div>
            <div className="text-xl md:text-2xl font-black mt-0.5">
              <CountdownTimer stepIdx={safeStepIdx} />
            </div>
          </div>
        </div>

        <div className="mt-3">
          <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-white rounded-full"
              initial={false}
              animate={{ width: `${(progress * 100).toFixed(0)}%` }}
              transition={{ duration: 1, ease: "easeInOut" }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] opacity-60">Order placed</span>
            <span className="text-[10px] opacity-60">Delivered</span>
          </div>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Map — col span 2 */}
        <div className="md:col-span-2 bg-white rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-black text-[#1B3A6B] flex items-center gap-2">
              <Navigation className="h-4 w-4 text-[#1E5BC6]" />
              {isOutForDelivery ? "Live Delivery Map" : "Delivery Route"}
            </div>
            {isOutForDelivery && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#1E5BC6] bg-[#EAF3FF] px-2.5 py-1 rounded-full">
                <span className="h-1.5 w-1.5 rounded-full bg-[#1E5BC6] animate-pulse" />
                Live tracking
              </span>
            )}
          </div>

          <DeliveryMap
            progress={isOutForDelivery ? progress : 0}
            driverName={driverName}
            isActive={isOutForDelivery}
            branchName={branchName}
          />

          <div className="flex items-center gap-4 text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-[#1E5BC6] inline-block" />
              Branch
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-red-500 inline-block" />
              Your location
            </span>
            {isOutForDelivery && (
              <span className="flex items-center gap-1.5">
                <span className="text-sm">🚗</span>
                Driver
              </span>
            )}
            <span className="flex items-center gap-1.5 ml-auto">
              <MapPin className="h-3 w-3" />
              Bulawayo CBD
            </span>
          </div>

          {!delivered && (
            <button
              onClick={() => {
                advance(order.id);
                toast.success(
                  `Status updated: ${
                    ORDER_FLOW[Math.min(safeStepIdx + 1, ORDER_FLOW.length - 1)]
                  }`
                );
              }}
              className="w-full h-11 rounded-full bg-[#1B3A6B] hover:bg-[#1E5BC6] text-white font-bold text-sm transition"
            >
              ▶ Simulate Next Delivery Stage
            </button>
          )}
          {delivered && (
            <div className="w-full h-11 rounded-full bg-[#EAF3FF] text-[#1E5BC6] font-black text-sm flex items-center justify-center gap-2">
              <Check className="h-4 w-4" strokeWidth={3} /> Order Delivered
            </div>
          )}
        </div>

        {/* Timeline — col span 1 */}
        <div className="bg-white rounded-2xl p-4">
          <div className="font-black text-[#1B3A6B] mb-4">Delivery Timeline</div>
          <ol>
            {ORDER_FLOW.map((s, i) => {
              const done = i < safeStepIdx;
              const current = i === safeStepIdx;
              const event = history.find((h) => h.status === s);
              const ts = event ? new Date(event.at) : null;
              const isLast = i === ORDER_FLOW.length - 1;
              return (
                <li key={s} className="flex items-start gap-3 relative pb-4">
                  {!isLast && (
                    <span
                      className={`absolute left-4 top-8 -translate-x-1/2 w-0.5 h-full transition-colors duration-500 ${
                        done ? "bg-[#1E5BC6]" : "bg-slate-200"
                      }`}
                      aria-hidden
                    />
                  )}
                  <div
                    className={`h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-sm font-black z-10 transition-all duration-500 ${
                      done
                        ? "bg-[#1E5BC6] text-white"
                        : current
                        ? "bg-[#1E5BC6] text-white ring-4 ring-[#1E5BC6]/20 animate-pulse"
                        : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {done ? <Check className="h-4 w-4" strokeWidth={3} /> : STEP_META[s].e}
                  </div>
                  <div className="pt-1 flex-1 min-w-0">
                    <div
                      className={`text-sm font-bold truncate ${
                        current ? "text-[#1B3A6B]" : done ? "text-slate-700" : "text-slate-400"
                      }`}
                    >
                      {s}
                    </div>
                    {ts ? (
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {ts.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-300 mt-0.5">Pending</div>
                    )}
                    {current && (
                      <div className="text-[11px] text-[#1E5BC6] font-semibold mt-0.5">
                        In progress…
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      {/* Driver card */}
      <div className="bg-white rounded-2xl p-4 flex items-center gap-3">
        <div className="h-14 w-14 rounded-full bg-gradient-to-br from-[#1E5BC6] to-[#1B3A6B] flex items-center justify-center text-white font-black text-lg shrink-0">
          {driverName !== "Awaiting driver assignment" && driverName !== "Awaiting driver"
            ? driverName
                .split(" ")
                .map((n: string) => n[0])
                .join("")
            : "?"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-black text-[#1B3A6B] truncate">{driverName}</div>
          <div className="text-xs text-slate-500">
            ⭐⭐⭐⭐⭐ <span className="text-slate-400">4.9 rating · Honda CB125</span>
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            {items.length} item{items.length !== 1 ? "s" : ""} · ${total.toFixed(2)}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => setCalling(true)}
            className="h-11 w-11 rounded-full bg-[#1E5BC6] text-white flex items-center justify-center hover:bg-[#1B3A6B] transition"
            title="Call driver"
          >
            <Phone className="h-5 w-5" />
          </button>
          <button
            onClick={() => setChat(true)}
            className="h-11 px-4 rounded-full bg-[#1B3A6B] text-white font-bold text-sm flex items-center gap-2 hover:bg-[#1E5BC6] transition"
          >
            <MessageCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Chat</span>
          </button>
        </div>
      </div>

      {/* Order items summary */}
      <div className="bg-white rounded-2xl p-4">
        <div className="font-black text-[#1B3A6B] mb-3">Order Items</div>
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <span className="text-slate-700">
                {item.name} <span className="text-slate-400">×{item.qty}</span>
              </span>
              <span className="font-bold text-[#1B3A6B]">
                ${(item.price * item.qty).toFixed(2)}
              </span>
            </div>
          ))}
          <div className="border-t pt-2 flex justify-between font-black text-[#1B3A6B]">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Rating cards */}
      {delivered && (
        <div className="grid md:grid-cols-2 gap-4">
          <RatingCard
            title="Rate this order"
            existing={order.rating}
            onSubmit={(s, t) => {
              rate(order.id, s, t);
              toast.success("Thanks for your rating!");
            }}
          />
          <RatingCard
            title="Rate your driver"
            existing={order.deliveryRating}
            onSubmit={(s, t) => {
              rateDelivery(order.id, s, t);
              toast.success("Driver rated — thank you!");
            }}
          />
        </div>
      )}

      {/* Chat panel */}
      <AnimatePresence>
        {chat && <ChatPanel driverName={driverName} onClose={() => setChat(false)} />}
      </AnimatePresence>

      {/* Call screen */}
      <AnimatePresence>
        {calling && <CallScreen driverName={driverName} onEnd={() => setCalling(false)} />}
      </AnimatePresence>
    </div>
  );
}

// ─── Rating Card ──────────────────────────────────────────────────────────────

function RatingCard({
  title,
  existing,
  onSubmit,
}: {
  title: string;
  existing?: { stars: number; text: string };
  onSubmit: (s: number, t: string) => void;
}) {
  const [stars, setStars] = useState(existing?.stars ?? 0);
  const [text, setText] = useState(existing?.text ?? "");
  const submitted = !!existing;

  return (
    <div className="bg-white rounded-2xl p-5">
      <div className="font-black text-[#1B3A6B] mb-3">{title}</div>
      <div className="flex gap-1.5 mb-3">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => !submitted && setStars(n)}
            disabled={submitted}
            className="transition hover:scale-110"
          >
            <Star
              className={`h-7 w-7 ${
                n <= stars ? "fill-[#1E5BC6] text-[#1E5BC6]" : "text-slate-200"
              }`}
            />
          </button>
        ))}
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={submitted}
        rows={2}
        placeholder="Share your experience…"
        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#1E5BC6] resize-none disabled:bg-slate-50 transition"
      />
      {!submitted ? (
        <button
          onClick={() => stars > 0 && onSubmit(stars, text)}
          disabled={stars === 0}
          className="mt-3 w-full h-10 rounded-full bg-[#1B3A6B] hover:bg-[#1E5BC6] text-white font-bold text-sm disabled:opacity-40 transition"
        >
          Submit Rating
        </button>
      ) : (
        <div className="mt-3 text-xs text-[#1E5BC6] font-bold flex items-center gap-1">
          <Check className="h-3.5 w-3.5" /> Thanks — your feedback has been recorded.
        </div>
      )}
    </div>
  );
}
