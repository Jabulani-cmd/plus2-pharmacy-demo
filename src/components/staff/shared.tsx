import type { ReactNode } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

export const fmtUSD = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground md:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function KPI({
  label, value, hint, delta, accent = "#0EA5E9", icon,
}: {
  label: string; value: string; hint?: string; delta?: number; accent?: string; icon?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</div>
          <div className="mt-2 text-2xl font-extrabold text-foreground md:text-3xl">{value}</div>
          {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
          {delta !== undefined && (
            <div className={`mt-2 inline-flex items-center gap-1 text-xs font-bold ${delta >= 0 ? "text-emerald-600" : "text-red-600"}`}>
              {delta >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {delta >= 0 ? "+" : ""}{delta}% vs yesterday
            </div>
          )}
        </div>
        {icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg text-white" style={{ background: accent }}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

export function Card({ title, action, children, className = "" }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border border-border bg-white shadow-sm ${className}`}>
      {(title || action) && (
        <header className="flex items-center justify-between border-b border-border px-5 py-3">
          {title && <h3 className="text-sm font-bold text-foreground">{title}</h3>}
          {action}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    Pending: "bg-amber-50 text-amber-700 ring-amber-200",
    Approved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    Dispensed: "bg-sky-50 text-sky-700 ring-sky-200",
    Rejected: "bg-red-50 text-red-700 ring-red-200",
    Active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    Available: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    "On delivery": "bg-amber-50 text-amber-700 ring-amber-200",
    "Off duty": "bg-gray-100 text-gray-600 ring-gray-200",
    Locked: "bg-red-50 text-red-700 ring-red-200",
    Invited: "bg-violet-50 text-violet-700 ring-violet-200",
    Urgent: "bg-orange-50 text-orange-700 ring-orange-200",
    Stat: "bg-red-50 text-red-700 ring-red-200",
    Routine: "bg-gray-100 text-gray-700 ring-gray-200",
    "Ready to dispatch": "bg-amber-50 text-amber-700 ring-amber-200",
    Assigned: "bg-blue-50 text-blue-700 ring-blue-200",
    "Out for delivery": "bg-violet-50 text-violet-700 ring-violet-200",
    Delivered: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    Sent: "bg-blue-50 text-blue-700 ring-blue-200",
    Draft: "bg-gray-100 text-gray-700 ring-gray-200",
    "Partially received": "bg-amber-50 text-amber-700 ring-amber-200",
    Received: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ${map[status] ?? "bg-gray-100 text-gray-700 ring-gray-200"}`}>
      {status}
    </span>
  );
}

// Tiny inline SVG bar chart — no extra deps
export function BarChart({ data, height = 120, valueKey = "sales", labelKey = "hour", color = "#0EA5E9" }: {
  data: Record<string, number | string>[]; height?: number; valueKey?: string; labelKey?: string; color?: string;
}) {
  const max = Math.max(...data.map((d) => Number(d[valueKey])));
  const barW = 100 / data.length;
  return (
    <div>
      <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="w-full" style={{ height }}>
        {data.map((d, i) => {
          const v = Number(d[valueKey]);
          const h = (v / max) * (height - 24);
          return (
            <g key={i}>
              <rect
                x={i * barW + barW * 0.15}
                y={height - 18 - h}
                width={barW * 0.7}
                height={h}
                fill={color}
                rx={1}
              />
            </g>
          );
        })}
      </svg>
      <div className="mt-1 flex justify-between text-[9px] text-muted-foreground">
        {data.map((d, i) => <span key={i}>{String(d[labelKey])}</span>)}
      </div>
    </div>
  );
}

export function LineChart({ data, height = 140, valueKey = "sales", labelKey = "day", color = "#0EA5E9" }: {
  data: Record<string, number | string>[]; height?: number; valueKey?: string; labelKey?: string; color?: string;
}) {
  const max = Math.max(...data.map((d) => Number(d[valueKey])));
  const min = Math.min(...data.map((d) => Number(d[valueKey])));
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = height - 20 - ((Number(d[valueKey]) - min) / (max - min || 1)) * (height - 30);
    return `${x},${y}`;
  });
  const area = `0,${height - 20} ${pts.join(" ")} 100,${height - 20}`;
  return (
    <div>
      <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="w-full" style={{ height }}>
        <polygon points={area} fill={color} opacity={0.12} />
        <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth={1.2} vectorEffect="non-scaling-stroke" />
        {pts.map((p, i) => {
          const [x, y] = p.split(",").map(Number);
          return <circle key={i} cx={x} cy={y} r={1.4} fill={color} />;
        })}
      </svg>
      <div className="mt-1 flex justify-between text-[9px] text-muted-foreground">
        {data.map((d, i) => <span key={i}>{String(d[labelKey])}</span>)}
      </div>
    </div>
  );
}