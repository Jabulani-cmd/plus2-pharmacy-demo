import { PageHeader, KPI, Card, LineChart, BarChart, StatusPill, fmtUSD } from "./shared";
import { SALES_7DAY, SALES_BY_CATEGORY, todaysTotals, STAFF_SYSTEM_USERS, TOP_SELLERS_TODAY } from "@/data/staffDemo";
import { DollarSign, ShoppingBag, Users, Building2, TrendingUp, FileText } from "lucide-react";

export function SuperAdminDashboard({ view }: { view?: string }) {
  if (view === "users") return <StaffRolesView />;
  if (view === "branches") return <BranchesView />;
  if (view === "reports") return <ReportsView />;
  return <Overview />;
}

function Overview() {
  const totals = todaysTotals();
  const weekTotal = SALES_7DAY.reduce((a, d) => a + d.sales, 0);
  return (
    <div>
      <PageHeader title="Group Overview" subtitle="All branches, real-time" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KPI label="Revenue today" value={fmtUSD(totals.sales)} delta={12} accent="#0EA5E9" icon={<DollarSign className="h-5 w-5" />} />
        <KPI label="Orders today" value={String(totals.orders)} delta={8} accent="#0EA5E9" icon={<ShoppingBag className="h-5 w-5" />} />
        <KPI label="Avg basket" value={fmtUSD(totals.avg)} delta={4} accent="#7C3AED" icon={<TrendingUp className="h-5 w-5" />} />
        <KPI label="Active staff" value={`${STAFF_SYSTEM_USERS.filter((u) => u.status === "Active").length} / ${STAFF_SYSTEM_USERS.length}`} accent="#F59E0B" icon={<Users className="h-5 w-5" />} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card title="7-day revenue" className="lg:col-span-2">
          <div className="mb-2 text-2xl font-extrabold">{fmtUSD(weekTotal)}</div>
          <LineChart data={SALES_7DAY} />
        </Card>
        <Card title="By category">
          <BarChart data={SALES_BY_CATEGORY as unknown as Record<string, number | string>[]} valueKey="value" labelKey="category" color="#0EA5E9" />
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="Top sellers — today">
          <ul className="divide-y divide-border text-sm">
            {TOP_SELLERS_TODAY.map((t, i) => (
              <li key={t.name} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-[10px] font-bold text-primary">{i + 1}</span>
                  <span className="font-semibold">{t.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold">{fmtUSD(t.revenue)}</div>
                  <div className="text-[10px] text-muted-foreground">{t.units} units</div>
                </div>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Branch performance">
          <ul className="space-y-3 text-sm">
            {[
              { name: "Bulawayo CBD", revenue: 6420, share: 62 },
              { name: "Bulawayo", revenue: 2890, share: 28 },
              { name: "Mutare", revenue: 1040, share: 10 },
            ].map((b) => (
              <li key={b.name}>
                <div className="flex justify-between text-xs">
                  <span className="font-bold">{b.name}</span>
                  <span className="text-muted-foreground">{fmtUSD(b.revenue)} · {b.share}%</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${b.share}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function StaffRolesView() {
  return (
    <div>
      <PageHeader title="Staff & Roles" subtitle="All workspace members" actions={<button className="rounded-md bg-primary px-3 py-2 text-xs font-bold text-primary-foreground">+ Invite user</button>} />
      <Card>
        <table className="w-full text-sm">
          <thead className="text-left text-[10px] uppercase tracking-wider text-muted-foreground">
            <tr><th className="py-2">Name</th><th>Role</th><th>Branch</th><th>Status</th><th>Last login</th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {STAFF_SYSTEM_USERS.filter((u) => u.role !== "customer").map((u) => (
              <tr key={u.id}>
                <td className="py-2"><div className="font-bold">{u.name}</div><div className="text-[11px] text-muted-foreground">{u.email}</div></td>
                <td className="text-xs">{u.role.replace("_", " ")}</td>
                <td className="text-xs">{u.branch}</td>
                <td><StatusPill status={u.status} /></td>
                <td className="text-xs text-muted-foreground">{u.lastLogin}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function BranchesView() {
  const branches = [
    { name: "Bulawayo CBD", address: "14 Samora Machel Ave", manager: "Michael Pretorius", staff: 7, revenueMTD: 142_840 },
    { name: "Bulawayo", address: "5 Joshua Mqabuko St", manager: "Patience Moyo", staff: 4, revenueMTD: 68_220 },
    { name: "Mutare", address: "22 Herbert Chitepo St", manager: "TBA", staff: 3, revenueMTD: 24_490 },
  ];
  return (
    <div>
      <PageHeader title="Branches" subtitle="3 operating branches" />
      <div className="grid gap-4 md:grid-cols-3">
        {branches.map((b) => (
          <Card key={b.name}>
            <div className="flex items-center gap-2"><Building2 className="h-5 w-5 text-primary" /><h4 className="font-bold">{b.name}</h4></div>
            <p className="mt-1 text-xs text-muted-foreground">{b.address}</p>
            <div className="mt-3 space-y-1 text-xs">
              <div><span className="text-muted-foreground">Manager: </span>{b.manager}</div>
              <div><span className="text-muted-foreground">Staff: </span>{b.staff}</div>
            </div>
            <div className="mt-3 rounded bg-primary/5 p-2">
              <div className="text-[10px] uppercase text-muted-foreground">Revenue MTD</div>
              <div className="text-lg font-extrabold text-primary">{fmtUSD(b.revenueMTD)}</div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ReportsView() {
  return (
    <div>
      <PageHeader title="Reports" subtitle="Exportable financials & operations" />
      <div className="grid gap-3 md:grid-cols-2">
        {[
          { name: "Daily sales summary", desc: "Per-branch sales, tax, profit margin" },
          { name: "Prescription audit log", desc: "PCZ-compliant Rx history" },
          { name: "Inventory valuation", desc: "Stock on hand at cost & retail" },
          { name: "Driver performance", desc: "On-time rate, deliveries, customer ratings" },
          { name: "Expense breakdown", desc: "By category, branch, period" },
          { name: "VAT return (ZIMRA)", desc: "Output & input VAT, ready for submission" },
        ].map((r) => (
          <div key={r.name} className="flex items-center justify-between rounded-lg border border-border bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-primary" />
              <div>
                <div className="text-sm font-bold">{r.name}</div>
                <div className="text-xs text-muted-foreground">{r.desc}</div>
              </div>
            </div>
            <button className="rounded border border-primary px-2 py-1 text-[10px] font-bold text-primary">Export</button>
          </div>
        ))}
      </div>
    </div>
  );
}