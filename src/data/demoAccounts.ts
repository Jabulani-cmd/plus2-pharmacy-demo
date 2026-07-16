import type { User, Prescription, Order } from "@/store/auth";

export type DemoCustomer = {
  email: string;
  password: string;
  user: User;
  address: string;
  healthProfile: string;
  medicalAid: string;
  wishlist: string[];
  orders: Order[];
  prescriptions: Prescription[];
};

export type StaffRole =
  | "super_admin"
  | "system_admin"
  | "pharmacist"
  | "store_manager"
  | "dispatcher"
  | "cashier"
  | "inventory_clerk";

export type DemoStaff = {
  email: string;
  staffId: string;
  name: string;
  role: StaffRole;
  roleLabel: string;
  branch: string;
  access: string[];
};

const mkOrder = (o: Partial<Order> & Pick<Order, "id" | "date" | "total" | "status" | "items" | "address">): Order => ({
  tracking: [
    { label: "Order placed", at: o.date, done: true },
    { label: "Packed at pharmacy", at: o.date, done: o.status !== "Processing" },
    { label: "Out for delivery", at: o.date, done: ["Out for delivery", "Delivered"].includes(o.status) },
    { label: "Delivered", at: o.date, done: o.status === "Delivered" },
  ],
  ...o,
});

const ADDR_THABO = "14 Sandton Drive, Sandton, Johannesburg";
const ADDR_PRIYA = "7 Umhlanga Ridge, Umhlanga, Durban";
const ADDR_JAMES = "22 Blouberg Road, Bloubergstrand, Cape Town";
const ADDR_NOMSA = "3 Polokwane Street, Polokwane, Limpopo";
const ADDR_RUAN = "45 Menlyn Park Avenue, Pretoria";

export const DEMO_CUSTOMERS: DemoCustomer[] = [
  // Seed data removed — real customer accounts only
];


export const DEMO_STAFF: DemoStaff[] = [
  { email: "sysadmin@kingspharmacy.co.zw", staffId: "STF-0000", name: "Tendai Moyo", role: "system_admin", roleLabel: "Systems Administrator", branch: "Head Office — Bulawayo", access: ["User management", "Password resets", "Audit logs", "System settings", "All modules"] },
  { email: "admin@kingspharmacy.co.zw", staffId: "STF-0001", name: "Rumbidzai Chigumba", role: "super_admin", roleLabel: "Super Admin", branch: "Head Office — Bulawayo", access: ["All modules"] },
  { email: "pharmacist@kingspharmacy.co.zw", staffId: "STF-0042", name: "Dr. Aisha Moosa (B.Pharm)", role: "pharmacist", roleLabel: "Pharmacist", branch: "Bulawayo CBD Branch", access: ["Prescriptions", "Orders (Rx approval)"] },
  { email: "manager@kingspharmacy.co.zw", staffId: "STF-0018", name: "Michael Pretorius", role: "store_manager", roleLabel: "Store Manager", branch: "Bulawayo CBD Branch", access: ["Products", "Inventory", "Sales", "Expenses", "Reports"] },
  { email: "dispatcher@kingspharmacy.co.zw", staffId: "STF-0073", name: "Lungelo Zulu", role: "dispatcher", roleLabel: "Delivery Dispatcher", branch: "Bulawayo CBD Branch", access: ["Delivery management"] },
  { email: "dispatcher.6thave@kingspharmacy.co.zw", staffId: "STF-0074", name: "Chido Moyo", role: "dispatcher", roleLabel: "Delivery Dispatcher", branch: "6th Ave Branch CBD", access: ["Delivery management"] },
  { email: "dispatcher.oldmutual@kingspharmacy.co.zw", staffId: "STF-0075", name: "Farai Ncube", role: "dispatcher", roleLabel: "Delivery Dispatcher", branch: "Old Mutual Centre, Jason Moyo Ave", access: ["Delivery management"] },
  { email: "dispatcher.ascot@kingspharmacy.co.zw", staffId: "STF-0076", name: "Sibongile Dube", role: "dispatcher", roleLabel: "Delivery Dispatcher", branch: "Ascot Shopping Centre", access: ["Delivery management"] },
  { email: "cashier@kingspharmacy.co.zw", staffId: "STF-0091", name: "Kefilwe Sithole", role: "cashier", roleLabel: "Cashier", branch: "Bulawayo CBD Branch", access: ["Sales", "Orders (view)"] },
  { email: "inventory@kingspharmacy.co.zw", staffId: "STF-0056", name: "Sipho Mahlangu", role: "inventory_clerk", roleLabel: "Inventory Clerk", branch: "Bulawayo CBD Branch", access: ["Inventory", "Stock take", "POs"] },
];

export const ROLE_BADGE_BG: Record<StaffRole, string> = {
  super_admin: "#7C3AED",
  system_admin: "#DC2626",
  pharmacist: "#0EA5E9",
  store_manager: "#0EA5E9",
  dispatcher: "#F59E0B",
  cashier: "#EC4899",
  inventory_clerk: "#6B7280",
};

export const findDemoCustomer = (email: string) =>
  DEMO_CUSTOMERS.find((c) => c.email.toLowerCase() === email.toLowerCase());

export const findDemoStaff = (email: string) =>
  DEMO_STAFF.find((s) => s.email.toLowerCase() === email.toLowerCase());

// Demo-only passwords surfaced to the sign-in UI for the "click to prefill"
// buttons. These match STAFF_PASSWORDS in src/lib/staffAuth.server.ts.
export const DEMO_STAFF_PASSWORDS: Record<string, string> = {
  "sysadmin@kingspharmacy.co.zw": "SysAdmin1234!",
  "admin@kingspharmacy.co.zw": "Admin1234!",
  "pharmacist@kingspharmacy.co.zw": "Staff1234!",
  "manager@kingspharmacy.co.zw": "Staff1234!",
  "dispatcher@kingspharmacy.co.zw": "Staff1234!",
  "dispatcher.6thave@kingspharmacy.co.zw": "Staff1234!",
  "dispatcher.oldmutual@kingspharmacy.co.zw": "Staff1234!",
  "dispatcher.ascot@kingspharmacy.co.zw": "Staff1234!",
  "cashier@kingspharmacy.co.zw": "Staff1234!",
  "inventory@kingspharmacy.co.zw": "Staff1234!",
};
