import {
  createFileRoute,
  Link,
  Outlet,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useStaffAuth } from "@/store/staffAuth";
import { ROLE_BADGE_BG } from "@/data/demoAccounts";
import { NotificationsBell } from "@/components/layout/NotificationsBell";
import kingsLogo from "@/assets/kings-logo.png";
import {
  LayoutDashboard,
  FileText,
  Truck,
  ShoppingCart,
  Boxes,
  Receipt as ReceiptIcon,
  Users,
  ShieldCheck,
  LogOut,
  Home,
  Building2,
  BarChart3,
  ClipboardList,
  Tag,
} from "lucide-react";

export const Route = createFileRoute("/staff")({
  head: () => ({
    meta: [{ title: "Staff Portal — Kings Pharmacy" }],
  }),
  component: StaffLayout,
});

type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
};

const ROLE_NAV: Record<string, NavItem[]> = {
  system_admin: [
    {
      to: "/staff/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      to: "/staff/dashboard?view=users",
      label: "User Management",
      icon: Users,
    },
    {
      to: "/staff/dashboard?view=audit",
      label: "Audit Logs",
      icon: ClipboardList,
    },
    {
      to: "/staff/dashboard?view=settings",
      label: "System Settings",
      icon: ShieldCheck,
    },
  ],
  super_admin: [
    {
      to: "/staff/dashboard",
      label: "Overview",
      icon: LayoutDashboard,
    },
    {
      to: "/staff/dashboard?view=branches",
      label: "Branches",
      icon: Building2,
    },
    {
      to: "/staff/dashboard?view=reports",
      label: "Reports",
      icon: BarChart3,
    },
    {
      to: "/staff/dashboard?view=users",
      label: "Staff & Roles",
      icon: Users,
    },
  ],
  pharmacist: [
    {
      to: "/staff/dashboard",
      label: "Rx Queue",
      icon: FileText,
    },
    {
      to: "/staff/dashboard?view=approved",
      label: "Approved",
      icon: ShieldCheck,
    },
    {
      to: "/staff/dashboard?view=dispensed",
      label: "Dispensed",
      icon: ClipboardList,
    },
  ],
  store_manager: [
    {
      to: "/staff/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      to: "/staff/dashboard?view=sales",
      label: "Sales",
      icon: BarChart3,
    },
    {
      to: "/staff/dashboard?view=expenses",
      label: "Expenses",
      icon: ReceiptIcon,
    },
    {
      to: "/staff/dashboard?view=inventory",
      label: "Inventory",
      icon: Boxes,
    },
    {
      to: "/staff/dashboard?view=staff",
      label: "Staff",
      icon: Users,
    },
  ],
  dispatcher: [
    {
      to: "/staff/dashboard",
      label: "Dispatch Board",
      icon: Truck,
    },
    {
      to: "/staff/dashboard?view=drivers",
      label: "Drivers",
      icon: Users,
    },
    {
      to: "/staff/dashboard?view=history",
      label: "History",
      icon: ClipboardList,
    },
  ],
  cashier: [
    {
      to: "/staff/dashboard",
      label: "POS",
      icon: ShoppingCart,
    },
    {
      to: "/staff/dashboard?view=sales",
      label: "Today's Sales",
      icon: BarChart3,
    },
    {
      to: "/staff/dashboard?view=orders",
      label: "Online Orders",
      icon: ClipboardList,
    },
  ],
  inventory_clerk: [
    {
      to: "/staff/dashboard",
      label: "Stock",
      icon: Boxes,
    },
    {
      to: "/staff/dashboard?view=pos",
      label: "Purchase Orders",
      icon: Tag,
    },
    {
      to: "/staff/dashboard?view=stocktake",
      label: "Stock Take",
      icon: ClipboardList,
    },
  ],
};

// ============================================================
// STAFF LAYOUT
// ============================================================
function StaffLayout() {
  const staff = useStaffAuth((s) => s.staff);
  const logout = useStaffAuth((s) => s.logout);
  const navigate = useNavigate();
  const location = useRouterState({ select: (s) => s.location });
  const pathname = location.pathname;
  const search = (location.search ?? {}) as unknown as Record<
    string,
    string
  >;

  const isLogin = pathname === "/staff/login";

  useEffect(() => {
    if (!isLogin && !staff) {
      navigate({ to: "/staff/login", replace: true });
    }
  }, [isLogin, staff, navigate]);

  if (isLogin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#003a1c] via-[#0EA5E9] to-[#00b855]">
        <Outlet />
      </div>
    );
  }

  if (!staff) return null;

  const nav = ROLE_NAV[staff.role] ?? [];
  const onLogout = () => {
    logout();
    toast.success("Signed out of staff portal");
    navigate({ to: "/staff/login" });
  };
  const activeView = search.view ?? "";

  return (
    <div className="min-h-screen bg-[#EFEFEF]">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-border bg-white shadow-sm">
        <div className="flex items-center justify-between px-4 py-3 lg:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white p-1 ring-1 ring-[#E5E7EB]">
              <img src={kingsLogo} alt="Kings Pharmacy" className="h-full w-full object-contain" />
            </div>
            <div>
              <div className="text-sm font-extrabold leading-tight text-foreground">
                Kings Pharmacy
              </div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Staff Portal
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <NotificationsBell audience="staff" />

            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
            >
              <Home className="h-3.5 w-3.5" /> Customer site
            </Link>

            <div className="flex items-center gap-3 border-l border-border pl-3">
              <div className="text-right">
                <div className="text-xs font-bold text-foreground">
                  {staff.name}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {staff.roleLabel}
                </div>
              </div>
              <div
                className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white shadow"
                style={{
                  background: ROLE_BADGE_BG[staff.role],
                }}
              >
                {staff.name
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")}
              </div>
              <button
                onClick={onLogout}
                className="rounded-md p-2 hover:bg-muted"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1600px] gap-6 px-4 py-6 lg:px-6">
        {/* Sidebar */}
        <aside className="hidden w-60 shrink-0 lg:block">
          <div className="sticky top-20 rounded-lg border border-border bg-white p-3 shadow-sm">
            <div
              className="mb-3 rounded-md p-3"
              style={{
                background: ROLE_BADGE_BG[staff.role] + "15",
              }}
            >
              <div
                className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: ROLE_BADGE_BG[staff.role] }}
              >
                {staff.roleLabel}
              </div>
              <div className="mt-1 text-xs font-semibold text-foreground">
                {staff.branch}
              </div>
              <div className="text-[10px] text-muted-foreground">
                ID · {staff.staffId}
              </div>
            </div>
            <nav className="space-y-0.5">
              {nav.map((n) => {
                const Icon = n.icon;
                const viewKey = n.to.includes("view=")
                  ? n.to.split("view=")[1]
                  : "";
                const isActive =
                  pathname === "/staff/dashboard" &&
                  (viewKey === activeView ||
                    (!viewKey && !activeView));
                return (
                  <Link
                    key={n.to}
                    to="/staff/dashboard"
                    search={viewKey ? { view: viewKey } : {}}
                    className={
                      "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition " +
                      (isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-muted")
                    }
                  >
                    <Icon className="h-4 w-4" /> {n.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Mobile nav pills */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-white p-2 shadow-lg">
          <div className="flex gap-1 overflow-x-auto">
            {nav.map((n) => {
              const Icon = n.icon;
              const viewKey = n.to.includes("view=")
                ? n.to.split("view=")[1]
                : "";
              const isActive =
                pathname === "/staff/dashboard" &&
                (viewKey === activeView ||
                  (!viewKey && !activeView));
              return (
                <Link
                  key={n.to}
                  to="/staff/dashboard"
                  search={viewKey ? { view: viewKey } : {}}
                  className={
                    "flex shrink-0 flex-col items-center gap-0.5 rounded-md px-3 py-1.5 text-[10px] font-bold " +
                    (isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground")
                  }
                >
                  <Icon className="h-4 w-4" /> {n.label}
                </Link>
              );
            })}
          </div>
        </div>

        <main className="min-w-0 flex-1 pb-24 lg:pb-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
