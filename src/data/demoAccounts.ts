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
  password: string;
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
  {
    email: "thabo.nkosi@demo.kingspharmacy.com",
    password: "Demo1234!",
    address: ADDR_THABO,
    healthProfile: "Hypertension, Diabetes",
    medicalAid: "Discovery Health · Comprehensive · #DIS2045123",
    wishlist: ["oralb", "neutrogena", "himalaya"],
    user: { id: "c_thabo", email: "thabo.nkosi@demo.kingspharmacy.com", firstName: "Thabo", lastName: "Nkosi", phone: "071 234 5678", points: 1820, tier: "Gold" },
    orders: [
      mkOrder({ id: "P2-001", date: "3 days ago", total: 48.97, status: "Delivered", address: ADDR_THABO, items: [{ name: "Panado 500mg 24s", qty: 2, price: 29.99 }, { name: "Vitaforce Multivitamin", qty: 1, price: 149.99 }, { name: "Dettol Antiseptic", qty: 1, price: 64.99 }] }),
      mkOrder({ id: "P2-002", date: "Today 11:30", total: 137.97, status: "Out for delivery", address: ADDR_THABO, items: [{ name: "USN Whey Protein 1kg", qty: 1, price: 499.99 }, { name: "Bioplus Energy", qty: 2, price: 89.99 }], driver: { name: "Siphamandla Dube", phone: "+263 77 334 5566", vehicle: "VW Polo · AEB 7790" } }),
    ],
    prescriptions: [
      { id: "RX-2025-000021", fileName: "amlodipine.pdf", patientName: "Thabo Nkosi", doctorName: "Dr Patel", status: "Approved — Awaiting Payment", uploadedAt: "2 days ago", notes: "Amlodipine 10mg" },
    ],
  },
  {
    email: "priya.naidoo@demo.kingspharmacy.com",
    password: "Demo1234!",
    address: ADDR_PRIYA,
    healthProfile: "Asthma",
    medicalAid: "Momentum Health · Ingwe · #MOM3318844",
    wishlist: ["natio", "dove", "biooil"],
    user: { id: "c_priya", email: "priya.naidoo@demo.kingspharmacy.com", firstName: "Priya", lastName: "Naidoo", phone: "082 567 8901", points: 940, tier: "Silver" },
    orders: [
      mkOrder({ id: "P2-003", date: "5 days ago", total: 169.97, status: "Delivered", address: ADDR_PRIYA, items: [{ name: "Dove Body Wash", qty: 2, price: 79.99 }, { name: "Bio-Oil 125ml", qty: 1, price: 179.99 }, { name: "Neutrogena Hydro Boost", qty: 1, price: 229.99 }] }),
      mkOrder({ id: "P2-004", date: "Yesterday", total: 489.97, status: "Processing", address: ADDR_PRIYA, items: [{ name: "Johnson's Baby Shampoo", qty: 3, price: 69.99 }, { name: "Huggies Gold Nappies", qty: 1, price: 349.99 }, { name: "Pampers Active", qty: 1, price: 249.99 }] }),
    ],
    prescriptions: [
      { id: "RX-2025-000034", fileName: "ventolin.pdf", patientName: "Priya Naidoo", doctorName: "Dr Singh", status: "Dispensed", uploadedAt: "5 days ago", notes: "Ventolin Inhaler 100mcg" },
    ],
  },
  {
    email: "james.vdm@demo.kingspharmacy.com",
    password: "Demo1234!",
    address: ADDR_JAMES,
    healthProfile: "None",
    medicalAid: "None",
    wishlist: ["bioplus", "panado"],
    user: { id: "c_james", email: "james.vdm@demo.kingspharmacy.com", firstName: "James", lastName: "van der Merwe", phone: "064 321 9870", points: 410, tier: "Silver" },
    orders: [
      mkOrder({ id: "P2-005", date: "1 week ago", total: 659.97, status: "Delivered", address: ADDR_JAMES, items: [{ name: "Oral-B Electric Toothbrush", qty: 1, price: 549.99 }, { name: "Nurofen 200mg", qty: 2, price: 44.99 }, { name: "Rennies Antacid", qty: 1, price: 34.99 }] }),
      mkOrder({ id: "P2-006", date: "2 hours ago", total: 1149.98, status: "Processing", address: ADDR_JAMES, items: [{ name: "Herbalife Formula 1 Shake", qty: 1, price: 649.99 }, { name: "USN Whey Protein", qty: 1, price: 499.99 }] }),
    ],
    prescriptions: [],
  },
  {
    email: "nomsa.dlamini@demo.kingspharmacy.com",
    password: "Demo1234!",
    address: ADDR_NOMSA,
    healthProfile: "Diabetes, Heart Disease",
    medicalAid: "Bonitas · BonEssential · #BON7723981",
    wishlist: ["caltrate", "dettol"],
    user: { id: "c_nomsa", email: "nomsa.dlamini@demo.kingspharmacy.com", firstName: "Nomsa", lastName: "Dlamini", phone: "073 890 1234", points: 2640, tier: "Gold" },
    orders: [
      mkOrder({ id: "P2-007", date: "2 weeks ago", total: 429.97, status: "Delivered", address: ADDR_NOMSA, items: [{ name: "Caltrate Calcium", qty: 2, price: 99.99 }, { name: "Vitaforce Multivitamin", qty: 1, price: 149.99 }, { name: "Himalaya Liv.52", qty: 1, price: 179.99 }] }),
      mkOrder({ id: "P2-008", date: "Today", total: 209.95, status: "Packed", address: "Collect: Sandton Branch", items: [{ name: "Panado 500mg", qty: 3, price: 29.99 }, { name: "Lennon Wonderkruid", qty: 2, price: 59.99 }] }),
    ],
    prescriptions: [
      { id: "RX-2025-000047", fileName: "metformin.pdf", patientName: "Nomsa Dlamini", doctorName: "Dr Khumalo", status: "Pending", uploadedAt: "Today 08:45", notes: "Metformin 850mg + Aspirin 75mg" },
    ],
  },
  {
    email: "ruan.botha@demo.kingspharmacy.com",
    password: "Demo1234!",
    address: ADDR_RUAN,
    healthProfile: "None",
    medicalAid: "None",
    wishlist: ["usn", "herbalife"],
    user: { id: "c_ruan", email: "ruan.botha@demo.kingspharmacy.com", firstName: "Ruan", lastName: "Botha", phone: "083 456 7890", points: 1180, tier: "Silver" },
    orders: [
      mkOrder({ id: "P2-009", date: "10 days ago", total: 694.97, status: "Delivered", address: ADDR_RUAN, items: [{ name: "Dettol Antiseptic", qty: 2, price: 64.99 }, { name: "Dove Body Wash", qty: 1, price: 79.99 }, { name: "Oral-B Toothbrush", qty: 1, price: 549.99 }] }),
      mkOrder({ id: "P2-010", date: "4 days ago", total: 609.97, status: "Delivered", address: ADDR_RUAN, items: [{ name: "Natio Rosehip Oil", qty: 1, price: 199.99 }, { name: "Neutrogena Hydro Boost", qty: 1, price: 229.99 }, { name: "Bio-Oil", qty: 1, price: 179.99 }] }),
    ],
    prescriptions: [],
  },
];

export const DEMO_STAFF: DemoStaff[] = [
  { email: "sysadmin@kingspharmacy.co.zw", password: "SysAdmin1234!", staffId: "STF-0000", name: "Tendai Moyo", role: "system_admin", roleLabel: "Systems Administrator", branch: "Head Office — Bulawayo", access: ["User management", "Password resets", "Audit logs", "System settings", "All modules"] },
  { email: "admin@kingspharmacy.co.zw", password: "Admin1234!", staffId: "STF-0001", name: "Rumbidzai Chigumba", role: "super_admin", roleLabel: "Super Admin", branch: "Head Office — Bulawayo", access: ["All modules"] },
  { email: "pharmacist@kingspharmacy.co.zw", password: "Staff1234!", staffId: "STF-0042", name: "Dr. Aisha Moosa (B.Pharm)", role: "pharmacist", roleLabel: "Pharmacist", branch: "Bulawayo CBD Branch", access: ["Prescriptions", "Orders (Rx approval)"] },
  { email: "manager@kingspharmacy.co.zw", password: "Staff1234!", staffId: "STF-0018", name: "Michael Pretorius", role: "store_manager", roleLabel: "Store Manager", branch: "Bulawayo CBD Branch", access: ["Products", "Inventory", "Sales", "Expenses", "Reports"] },
  { email: "dispatcher@kingspharmacy.co.zw", password: "Staff1234!", staffId: "STF-0073", name: "Lungelo Zulu", role: "dispatcher", roleLabel: "Delivery Dispatcher", branch: "Bulawayo CBD Branch", access: ["Delivery management"] },
  { email: "cashier@kingspharmacy.co.zw", password: "Staff1234!", staffId: "STF-0091", name: "Kefilwe Sithole", role: "cashier", roleLabel: "Cashier", branch: "Bulawayo CBD Branch", access: ["Sales", "Orders (view)"] },
  { email: "inventory@kingspharmacy.co.zw", password: "Staff1234!", staffId: "STF-0056", name: "Sipho Mahlangu", role: "inventory_clerk", roleLabel: "Inventory Clerk", branch: "Bulawayo CBD Branch", access: ["Inventory", "Stock take", "POs"] },
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