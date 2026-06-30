import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useStaffAuth } from "@/store/staffAuth";
import { Truck, Pill, Store, Users, ShieldCheck, ClipboardList, LayoutDashboard } from "lucide-react";

export const Route = createFileRoute("/staff/select-portal")({
  head: () => ({ meta: [{ title: "Select Portal — Kings Pharmacy Staff" }] }),
  component: SelectPortal,
});

type Portal = {
  id: string;
  label: string;
  desc: string;
  to: string;
  search?: Record<string, string>;
  Icon: typeof Truck;
  accent: string;
};

const PORTALS: Portal[] = [
  { id: "overview", label: "Admin Overview", desc: "KPIs, branches, and reports", to: "/staff/dashboard", Icon: LayoutDashboard, accent: "#1E5BC6" },
  { id: "dispatch", label: "Dispatch Board", desc: "Manage OTC orders and deliveries", to: "/staff/dashboard", search: { view: "dispatch" }, Icon: Truck, accent: "#0EA5E9" },
  { id: "pharmacist", label: "Pharmacist Portal", desc: "Review and approve prescriptions", to: "/staff/dashboard", search: { view: "rx" }, Icon: Pill, accent: "#16A34A" },
  { id: "manager", label: "Store Manager", desc: "Inventory, staff and reports", to: "/staff/dashboard", search: { view: "sales" }, Icon: Store, accent: "#9333EA" },
  { id: "drivers", label: "Driver Management", desc: "Manage delivery fleet", to: "/staff/dashboard", search: { view: "drivers" }, Icon: Users, accent: "#EA580C" },
  { id: "users", label: "User Management", desc: "Staff accounts & roles", to: "/staff/dashboard", search: { view: "users" }, Icon: ShieldCheck, accent: "#DC2626" },
  { id: "audit", label: "Audit Logs", desc: "System activity trail", to: "/staff/dashboard", search: { view: "audit" }, Icon: ClipboardList, accent: "#475569" },
];

function SelectPortal() {
  const staff = useStaffAuth((s) => s.staff);
  const navigate = useNavigate();

  useEffect(() => {
    if (!staff) navigate({ to: "/staff/login", replace: true });
  }, [staff, navigate]);

  if (!staff) return null;

  return (
    <div className="min-h-screen bg-[#F2F4F7] p-4">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 pt-6 text-center">
          <div className="text-2xl font-black text-[#1B3A6B]">Select Your Portal</div>
          <div className="mt-1 text-sm text-slate-500">Welcome, {staff.name} — choose which workspace to access</div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {PORTALS.map((p) => {
            const Icon = p.Icon;
            return (
              <Link
                key={p.id}
                to={p.to}
                search={p.search ?? {}}
                className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white"
                  style={{ background: p.accent }}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-black text-[#1B3A6B]">{p.label}</div>
                  <div className="mt-0.5 text-xs text-slate-500">{p.desc}</div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}