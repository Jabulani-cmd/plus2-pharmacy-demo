import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader, KPI, Card, LineChart, BarChart, StatusPill, fmtUSD } from "./shared";
import {
  SALES_7DAY, SALES_HOURLY, SALES_BY_CATEGORY, TOP_SELLERS_TODAY, todaysTotals,
  STAFF_EXPENSES, STAFF_INVENTORY, STAFF_SYSTEM_USERS, type StaffExpense,
} from "@/data/staffDemo";
import { DollarSign, ShoppingBag, AlertTriangle, Receipt as ReceiptIcon, CheckCircle2, X } from "lucide-react";

export function StoreManagerDashboard({ view }: { view?: string }) {
  if (view === "sales") return <SalesView />;
  if (view === "expenses") return <ExpensesView />;
  if (view === "inventory") return <InventoryView />;
  if (view === "staff") return <StaffView />;
  return <Overview />;
}

function Overview() {
  const totals = todaysTotals();
  const lowStock = STAFF_INVENTORY.filter((i) => i.onHand <= i.reorderLevel);
  const pendingExp = STAFF_EXPENSES.filter((e) => e.status === "Pending");

  return (
    <div>
      <PageHeader title="Bulawayo CBD — Today" subtitle="Branch performance &amp; alerts" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KPI label="Revenue" value={fmtUSD(totals.sales)} delta={12} accent="#0EA5E9" icon={<DollarSign className="h-5 w-5" />} />
        <KPI label="Orders" value={String(totals.orders)} delta={8} accent="#0EA5E9" icon={<ShoppingBag className="h-5 w-5" />} />
        <KPI label="Low stock" value={String(lowStock.length)} hint="items at/below reorder" accent="#DC2626" icon={<AlertTriangle className="h-5 w-5" />} />
        <KPI label="Pending expenses" value={String(pendingExp.length)} hint={fmtUSD(pendingExp.reduce((a, e) => a + e.amount, 0))} accent="#F59E0B" icon={<ReceiptIcon className="h-5 w-5" />} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card title="Hourly sales today" className="lg:col-span-2">
          <BarChart data={SALES_HOURLY} />
        </Card>
        <Card title="Low stock alerts">
          <ul className="space-y-2 text-xs">
            {lowStock.slice(0, 6).map((i) => (
              <li key={i.sku} className="flex items-center justify-between rounded bg-red-50 px-2 py-1.5">
                <span className="font-semibold">{i.name}</span>
                <span className="font-bold text-red-700">{i.onHand} / {i.reorderLevel}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function SalesView() {
  const totals = todaysTotals();
  return (
    <div>
      <PageHeader title="Sales" subtitle="Hourly, weekly, by category" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title={`Today · ${fmtUSD(totals.sales)} (${totals.orders} orders)`}><BarChart data={SALES_HOURLY} /></Card>
        <Card title="Last 7 days"><LineChart data={SALES_7DAY} /></Card>
        <Card title="By category"><BarChart data={SALES_BY_CATEGORY as unknown as Record<string, number | string>[]} valueKey="value" labelKey="category" color="#7C3AED" /></Card>
        <Card title="Top sellers today">
          <ul className="divide-y divide-border text-sm">
            {TOP_SELLERS_TODAY.map((t, i) => (
              <li key={t.name} className="flex items-center justify-between py-2">
                <span><span className="mr-2 text-xs font-bold text-primary">#{i + 1}</span>{t.name}</span>
                <span className="font-bold">{fmtUSD(t.revenue)}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function ExpensesView() {
  const [exp, setExp] = useState<StaffExpense[]>(STAFF_EXPENSES);
  const total = exp.reduce((a, e) => a + (e.status === "Approved" ? e.amount : 0), 0);
  const pending = exp.filter((e) => e.status === "Pending");

  const decide = (id: string, status: "Approved" | "Rejected") => {
    setExp((p) => p.map((e) => (e.id === id ? { ...e, status } : e)));
    toast.success(`Expense ${status.toLowerCase()}`);
  };

  return (
    <div>
      <PageHeader title="Expenses" subtitle="Review submissions, approve or reject" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <KPI label="Approved this period" value={fmtUSD(total)} accent="#059669" icon={<CheckCircle2 className="h-5 w-5" />} />
        <KPI label="Pending approval" value={String(pending.length)} hint={fmtUSD(pending.reduce((a, e) => a + e.amount, 0))} accent="#F59E0B" icon={<ReceiptIcon className="h-5 w-5" />} />
        <KPI label="Largest category" value="Stock" hint={fmtUSD(exp.filter((e) => e.category === "Stock").reduce((a, e) => a + e.amount, 0))} accent="#7C3AED" icon={<ShoppingBag className="h-5 w-5" />} />
      </div>
      <div className="mt-6">
        <Card title={`All expenses (${exp.length})`}>
          <table className="w-full text-sm">
            <thead className="text-left text-[10px] uppercase tracking-wider text-muted-foreground">
              <tr><th className="py-2">Date</th><th>Category</th><th>Description</th><th>Submitted by</th><th className="text-right">Amount</th><th className="text-right">Status</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {exp.map((e) => (
                <tr key={e.id}>
                  <td className="py-2 text-xs text-muted-foreground">{e.date}</td>
                  <td><span className="rounded bg-muted px-2 py-0.5 text-[10px] font-bold">{e.category}</span></td>
                  <td className="text-xs">{e.description}</td>
                  <td className="text-xs">{e.submittedBy}</td>
                  <td className="text-right font-bold">{fmtUSD(e.amount)}</td>
                  <td className="text-right">
                    {e.status === "Pending" ? (
                      <div className="flex justify-end gap-1">
                        <button onClick={() => decide(e.id, "Approved")} className="rounded bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">Approve</button>
                        <button onClick={() => decide(e.id, "Rejected")} className="rounded bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white">Reject</button>
                      </div>
                    ) : <StatusPill status={e.status} />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}

function InventoryView() {
  const low = STAFF_INVENTORY.filter((i) => i.onHand <= i.reorderLevel);
  const value = STAFF_INVENTORY.reduce((a, i) => a + i.onHand * i.costPrice, 0);
  return (
    <div>
      <PageHeader title="Inventory" subtitle="Stock health at a glance" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <KPI label="SKUs" value={String(STAFF_INVENTORY.length)} accent="#0EA5E9" />
        <KPI label="Low stock" value={String(low.length)} accent="#DC2626" icon={<AlertTriangle className="h-5 w-5" />} />
        <KPI label="Stock value (cost)" value={fmtUSD(value)} accent="#0EA5E9" icon={<DollarSign className="h-5 w-5" />} />
      </div>
      <div className="mt-6">
        <Card title="All inventory">
          <table className="w-full text-sm">
            <thead className="text-left text-[10px] uppercase tracking-wider text-muted-foreground">
              <tr><th className="py-2">SKU</th><th>Item</th><th>Category</th><th className="text-right">On hand</th><th className="text-right">Sell price</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {STAFF_INVENTORY.map((i) => (
                <tr key={i.sku} className={i.onHand <= i.reorderLevel ? "bg-red-50/50" : ""}>
                  <td className="py-2 font-mono text-[11px]">{i.sku}</td>
                  <td>{i.name}{i.isScheduled && <span className="ml-1 rounded bg-red-100 px-1 text-[9px] font-bold text-red-700">SCHED</span>}</td>
                  <td className="text-xs">{i.category}</td>
                  <td className="text-right font-bold">{i.onHand}</td>
                  <td className="text-right">{fmtUSD(i.sellingPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}

function StaffView() {
  return (
    <div>
      <PageHeader title="Branch staff" subtitle="Bulawayo CBD" />
      <Card>
        <ul className="divide-y divide-border text-sm">
          {STAFF_SYSTEM_USERS.filter((u) => u.branch === "Bulawayo CBD").map((u) => (
            <li key={u.id} className="flex items-center justify-between py-3">
              <div>
                <div className="font-bold">{u.name}</div>
                <div className="text-xs text-muted-foreground">{u.role.replace("_", " ")} · {u.email}</div>
              </div>
              <div className="flex items-center gap-2"><StatusPill status={u.status} /><span className="text-xs text-muted-foreground">{u.lastLogin}</span></div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

// suppress unused warning
export const _x = X;