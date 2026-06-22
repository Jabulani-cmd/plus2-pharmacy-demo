import type { StaffRole } from "./demoAccounts";

export type StaffRxQueueItem = {
  id: string;
  patient: string;
  doctor: string;
  medication: string;
  dosage: string;
  uploadedAt: string;
  priority: "Routine" | "Urgent" | "Stat";
  status: "Pending" | "Approved" | "Dispensed" | "Rejected";
  notes?: string;
  customerPhone: string;
  customerEmail: string;
  medicalAid?: string;
  isRepeat?: boolean;
  repeatsLeft?: number;
  isCustomerRx?: boolean;
  authId?: string;
};

export type StaffDriver = {
  id: string;
  name: string;
  phone: string;
  vehicle: string;
  status: "Available" | "On delivery" | "Off duty";
  zone: string;
  activeOrders: number;
  completedToday: number;
};

export type StaffDelivery = {
  id: string;
  customer: string;
  address: string;
  items: number;
  total: number;
  status:
    | "Confirmed"
    | "Ready to dispatch"
    | "Assigned"
    | "Out for delivery"
    | "Delivered";
  driverId?: string;
  eta?: string;
  paymentMethod: string;
  placedAt: string;
};

export type StaffInventoryItem = {
  sku: string;
  name: string;
  category: string;
  onHand: number;
  reorderLevel: number;
  costPrice: number;
  sellingPrice: number;
  expiry: string;
  supplier: string;
  isScheduled?: boolean;
};

export type StaffExpense = {
  id: string;
  category:
    | "Rent"
    | "Utilities"
    | "Stock"
    | "Salaries"
    | "Logistics"
    | "Marketing"
    | "Other";
  description: string;
  amount: number;
  date: string;
  submittedBy: string;
  status: "Pending" | "Approved" | "Rejected";
  receiptUrl?: string;
};

export type StaffPurchaseOrder = {
  id: string;
  supplier: string;
  items: {
    sku: string;
    name: string;
    qty: number;
    unitCost: number;
  }[];
  total: number;
  status: "Draft" | "Sent" | "Partially received" | "Received";
  createdAt: string;
  expectedAt: string;
};

export type StaffSystemUser = {
  id: string;
  name: string;
  email: string;
  role: StaffRole | "customer";
  branch: string;
  status: "Active" | "Locked" | "Invited";
  lastLogin: string;
};

export const STAFF_RX_QUEUE: StaffRxQueueItem[] = [
  {
    id: "RX-2026-001142",
    patient: "Nomsa Dlamini",
    doctor: "Dr R. Khumalo (MP12345)",
    medication: "Metformin 850mg",
    dosage: "1 tab BD x 30 days + Aspirin 75mg OD",
    uploadedAt: "Today 08:45",
    priority: "Urgent",
    status: "Pending",
    notes:
      "Patient is diabetic with cardiac history. " +
      "Verify dose with prescriber if unsure.",
    customerPhone: "+263 73 890 1234",
    customerEmail: "nomsa.dlamini@demo.kingspharmacy.com",
    medicalAid: "Bonitas BonEssential #BON7723981",
    isRepeat: false,
  },
  {
    id: "RX-2026-001141",
    patient: "Tinashe Mukamuri",
    doctor: "Dr S. Patel (MP44521)",
    medication: "Amoxicillin 500mg",
    dosage: "1 cap TDS x 7 days",
    uploadedAt: "Today 07:22",
    priority: "Routine",
    status: "Pending",
    notes: "Chest infection. Patient allergies: none disclosed.",
    customerPhone: "+263 71 445 8821",
    customerEmail: "tinashe.m@demo.kingspharmacy.com",
  },
  {
    id: "RX-2026-001140",
    patient: "Chipo Marufu",
    doctor: "Dr M. Banda (MP91230)",
    medication: "Atorvastatin 20mg",
    dosage: "1 tab nocte",
    uploadedAt: "Today 06:58",
    priority: "Routine",
    status: "Pending",
    isRepeat: true,
    repeatsLeft: 4,
    customerPhone: "+263 78 220 9981",
    customerEmail: "chipo.m@demo.kingspharmacy.com",
    medicalAid: "PSMAS Standard",
  },
  {
    id: "RX-2026-001139",
    patient: "Thabo Nkosi",
    doctor: "Dr Patel",
    medication: "Amlodipine 10mg",
    dosage: "1 tab OD x 30 days",
    uploadedAt: "Yesterday 16:10",
    priority: "Routine",
    status: "Approved",
    customerPhone: "+263 71 234 5678",
    customerEmail: "thabo.nkosi@demo.kingspharmacy.com",
  },
  {
    id: "RX-2026-001138",
    patient: "Priya Naidoo",
    doctor: "Dr Singh",
    medication: "Ventolin Inhaler 100mcg",
    dosage: "2 puffs PRN",
    uploadedAt: "2 days ago",
    priority: "Routine",
    status: "Dispensed",
    customerPhone: "+263 82 567 8901",
    customerEmail: "priya.naidoo@demo.kingspharmacy.com",
  },
  {
    id: "RX-2026-001137",
    patient: "Faith Moyo",
    doctor: "Dr P. Sibanda",
    medication: "Tramadol 50mg",
    dosage: "1 cap QDS PRN x 5 days",
    uploadedAt: "Today 09:12",
    priority: "Stat",
    status: "Pending",
    notes: "Schedule 5 — verify ID on collection.",
    customerPhone: "+263 77 660 1102",
    customerEmail: "faith.moyo@demo.kingspharmacy.com",
  },
];

export const STAFF_DRIVERS: StaffDriver[] = [
  {
    id: "DRV-01",
    name: "Siphamandla Dube",
    phone: "+263 77 334 5566",
    vehicle: "VW Polo · AEB 7790",
    status: "On delivery",
    zone: "Avondale / Mount Pleasant",
    activeOrders: 2,
    completedToday: 5,
  },
  {
    id: "DRV-02",
    name: "Tatenda Chirwa",
    phone: "+263 71 998 4421",
    vehicle: "Honda Fit · AFC 1230",
    status: "Available",
    zone: "CBD / Eastlea",
    activeOrders: 0,
    completedToday: 7,
  },
  {
    id: "DRV-03",
    name: "Bongani Sithole",
    phone: "+263 78 661 7700",
    vehicle: "Toyota Hilux · ACJ 4821",
    status: "Available",
    zone: "Borrowdale / Highlands",
    activeOrders: 0,
    completedToday: 4,
  },
  {
    id: "DRV-04",
    name: "Rudo Mhlanga",
    phone: "+263 73 220 9981",
    vehicle: "Mahindra Bolero · AGB 2287",
    status: "Off duty",
    zone: "Chitungwiza",
    activeOrders: 0,
    completedToday: 6,
  },
];

export const STAFF_DELIVERIES: StaffDelivery[] = [
  {
    id: "P2-2026-3301",
    customer: "Nomsa Dlamini",
    address: "3 Polokwane Street, Mount Pleasant",
    items: 4,
    total: 89.5,
    status: "Ready to dispatch",
    paymentMethod: "Card · Paid",
    placedAt: "09:14",
  },
  {
    id: "P2-2026-3302",
    customer: "James van der Merwe",
    address: "22 Blouberg Road, Borrowdale",
    items: 2,
    total: 149.99,
    status: "Ready to dispatch",
    paymentMethod: "EFT · Pending",
    placedAt: "09:42",
  },
  {
    id: "P2-2026-3303",
    customer: "Priya Naidoo",
    address: "7 Umhlanga Ridge, Avondale",
    items: 6,
    total: 245.0,
    status: "Ready to dispatch",
    paymentMethod: "COD",
    placedAt: "10:01",
  },
  {
    id: "P2-2026-3298",
    customer: "Ruan Botha",
    address: "45 Menlyn Park Ave, Eastlea",
    items: 3,
    total: 119.97,
    status: "Assigned",
    driverId: "DRV-01",
    eta: "11:30",
    paymentMethod: "Card · Paid",
    placedAt: "08:55",
  },
  {
    id: "P2-2026-3299",
    customer: "Thabo Nkosi",
    address: "14 Samora Machel Ave, CBD",
    items: 5,
    total: 312.45,
    status: "Out for delivery",
    driverId: "DRV-01",
    eta: "10:50",
    paymentMethod: "Medical Aid",
    placedAt: "08:32",
  },
  {
    id: "P2-2026-3295",
    customer: "Chipo Marufu",
    address: "12 Glenara South, Eastlea",
    items: 2,
    total: 67.0,
    status: "Delivered",
    driverId: "DRV-02",
    paymentMethod: "Card · Paid",
    placedAt: "07:40",
  },
];

export const STAFF_INVENTORY: StaffInventoryItem[] = [
  {
    sku: "MED-0021",
    name: "Panado 500mg 24s",
    category: "Pain & Fever",
    onHand: 142,
    reorderLevel: 50,
    costPrice: 18.5,
    sellingPrice: 29.99,
    expiry: "2027-08",
    supplier: "Adcock Ingram ZW",
  },
  {
    sku: "MED-0044",
    name: "Amoxicillin 500mg 21s",
    category: "Antibiotics",
    onHand: 18,
    reorderLevel: 30,
    costPrice: 42.0,
    sellingPrice: 79.99,
    expiry: "2026-12",
    supplier: "CAPS Pharmaceuticals",
    isScheduled: true,
  },
  {
    sku: "MED-0078",
    name: "Ventolin Inhaler 100mcg",
    category: "Respiratory",
    onHand: 64,
    reorderLevel: 20,
    costPrice: 95.0,
    sellingPrice: 149.99,
    expiry: "2027-03",
    supplier: "GSK Zimbabwe",
  },
  {
    sku: "MED-0091",
    name: "Metformin 850mg 90s",
    category: "Chronic",
    onHand: 89,
    reorderLevel: 25,
    costPrice: 78.0,
    sellingPrice: 124.99,
    expiry: "2027-06",
    supplier: "Datlabs",
  },
  {
    sku: "MED-0102",
    name: "Amlodipine 10mg 30s",
    category: "Chronic",
    onHand: 11,
    reorderLevel: 30,
    costPrice: 32.5,
    sellingPrice: 64.99,
    expiry: "2026-11",
    supplier: "CAPS Pharmaceuticals",
  },
  {
    sku: "MED-0115",
    name: "Atorvastatin 20mg 30s",
    category: "Chronic",
    onHand: 47,
    reorderLevel: 20,
    costPrice: 56.0,
    sellingPrice: 99.99,
    expiry: "2027-09",
    supplier: "Datlabs",
  },
  {
    sku: "MED-0133",
    name: "Tramadol 50mg 20s",
    category: "Pain & Fever",
    onHand: 6,
    reorderLevel: 15,
    costPrice: 88.0,
    sellingPrice: 159.99,
    expiry: "2026-10",
    supplier: "Adcock Ingram ZW",
    isScheduled: true,
  },
  {
    sku: "VIT-0203",
    name: "Vitaforce Multivitamin 60s",
    category: "Vitamins",
    onHand: 220,
    reorderLevel: 40,
    costPrice: 89.0,
    sellingPrice: 149.99,
    expiry: "2028-01",
    supplier: "Vitaforce SA",
  },
  {
    sku: "VIT-0214",
    name: "Caltrate Calcium 60s",
    category: "Vitamins",
    onHand: 56,
    reorderLevel: 25,
    costPrice: 64.5,
    sellingPrice: 99.99,
    expiry: "2027-11",
    supplier: "Pfizer",
  },
  {
    sku: "BAB-0301",
    name: "Huggies Gold Nappies M",
    category: "Baby",
    onHand: 78,
    reorderLevel: 30,
    costPrice: 220.0,
    sellingPrice: 349.99,
    expiry: "—",
    supplier: "Kimberly-Clark",
  },
  {
    sku: "BAB-0307",
    name: "Johnson's Baby Shampoo 500ml",
    category: "Baby",
    onHand: 134,
    reorderLevel: 40,
    costPrice: 38.0,
    sellingPrice: 69.99,
    expiry: "2028-04",
    supplier: "Johnson & Johnson",
  },
  {
    sku: "PER-0411",
    name: "Dettol Antiseptic 500ml",
    category: "Personal Care",
    onHand: 92,
    reorderLevel: 30,
    costPrice: 38.5,
    sellingPrice: 64.99,
    expiry: "2028-02",
    supplier: "Reckitt Benckiser",
  },
  {
    sku: "PER-0418",
    name: "Dove Body Wash 400ml",
    category: "Personal Care",
    onHand: 8,
    reorderLevel: 20,
    costPrice: 48.0,
    sellingPrice: 79.99,
    expiry: "2027-05",
    supplier: "Unilever ZW",
  },
  {
    sku: "PER-0425",
    name: "Bio-Oil 125ml",
    category: "Personal Care",
    onHand: 41,
    reorderLevel: 15,
    costPrice: 110.0,
    sellingPrice: 179.99,
    expiry: "2028-08",
    supplier: "Bio-Oil",
  },
  {
    sku: "PER-0431",
    name: "Neutrogena Hydro Boost 50ml",
    category: "Personal Care",
    onHand: 27,
    reorderLevel: 12,
    costPrice: 145.0,
    sellingPrice: 229.99,
    expiry: "2027-07",
    supplier: "Neutrogena",
  },
  {
    sku: "SUP-0501",
    name: "USN Whey Protein 1kg",
    category: "Supplements",
    onHand: 33,
    reorderLevel: 10,
    costPrice: 320.0,
    sellingPrice: 499.99,
    expiry: "2027-04",
    supplier: "USN",
  },
  {
    sku: "SUP-0512",
    name: "Herbalife Formula 1 Shake",
    category: "Supplements",
    onHand: 22,
    reorderLevel: 10,
    costPrice: 410.0,
    sellingPrice: 649.99,
    expiry: "2027-02",
    supplier: "Herbalife",
  },
  {
    sku: "ORL-0610",
    name: "Oral-B Electric Toothbrush",
    category: "Oral Care",
    onHand: 14,
    reorderLevel: 8,
    costPrice: 380.0,
    sellingPrice: 549.99,
    expiry: "—",
    supplier: "P&G",
  },
  {
    sku: "DEV-0710",
    name: "Omron BP Monitor M2",
    category: "Devices",
    onHand: 9,
    reorderLevel: 5,
    costPrice: 880.0,
    sellingPrice: 1289.0,
    expiry: "—",
    supplier: "Omron Health",
  },
  {
    sku: "FCS-0801",
    name: "Bioplus Energy 100ml",
    category: "Energy",
    onHand: 188,
    reorderLevel: 50,
    costPrice: 58.0,
    sellingPrice: 89.99,
    expiry: "2027-10",
    supplier: "Adcock Ingram ZW",
  },
];

export const STAFF_EXPENSES: StaffExpense[] = [
  {
    id: "EXP-2026-0042",
    category: "Stock",
    description: "Restock — Datlabs PO #DT-4421 (chronic meds)",
    amount: 4280.5,
    date: "Today",
    submittedBy: "Sipho Mahlangu",
    status: "Pending",
  },
  {
    id: "EXP-2026-0041",
    category: "Logistics",
    description: "Fuel — delivery fleet weekly top-up",
    amount: 380.0,
    date: "Today",
    submittedBy: "Lungelo Zulu",
    status: "Pending",
  },
  {
    id: "EXP-2026-0040",
    category: "Utilities",
    description: "ZESA prepaid — Bulawayo CBD branch",
    amount: 220.0,
    date: "Yesterday",
    submittedBy: "Michael Pretorius",
    status: "Approved",
  },
  {
    id: "EXP-2026-0039",
    category: "Marketing",
    description: "Local radio spot — Star FM (1 week)",
    amount: 540.0,
    date: "2 days ago",
    submittedBy: "Michael Pretorius",
    status: "Approved",
  },
  {
    id: "EXP-2026-0038",
    category: "Salaries",
    description: "Casual cashier — weekend cover",
    amount: 180.0,
    date: "3 days ago",
    submittedBy: "Michael Pretorius",
    status: "Approved",
  },
  {
    id: "EXP-2026-0037",
    category: "Rent",
    description: "Bulawayo CBD branch rent — June",
    amount: 2400.0,
    date: "1 week ago",
    submittedBy: "Rumbidzai Chigumba",
    status: "Approved",
  },
  {
    id: "EXP-2026-0036",
    category: "Stock",
    description: "Emergency restock — Amoxicillin (out of stock)",
    amount: 1450.0,
    date: "1 week ago",
    submittedBy: "Sipho Mahlangu",
    status: "Approved",
  },
  {
    id: "EXP-2026-0035",
    category: "Other",
    description: "PCZ annual licence renewal",
    amount: 320.0,
    date: "2 weeks ago",
    submittedBy: "Rumbidzai Chigumba",
    status: "Approved",
  },
  {
    id: "EXP-2026-0034",
    category: "Logistics",
    description: "Vehicle service — VW Polo AEB 7790",
    amount: 290.0,
    date: "2 weeks ago",
    submittedBy: "Lungelo Zulu",
    status: "Rejected",
  },
  {
    id: "EXP-2026-0033",
    category: "Marketing",
    description: "Pamphlet print run (2 000 units)",
    amount: 165.0,
    date: "3 weeks ago",
    submittedBy: "Michael Pretorius",
    status: "Approved",
  },
  {
    id: "EXP-2026-0032",
    category: "Utilities",
    description: "TelOne fibre — June",
    amount: 95.0,
    date: "3 weeks ago",
    submittedBy: "Tendai Moyo",
    status: "Approved",
  },
  {
    id: "EXP-2026-0031",
    category: "Stock",
    description: "Vitamins restock — Vitaforce SA",
    amount: 1820.0,
    date: "1 month ago",
    submittedBy: "Sipho Mahlangu",
    status: "Approved",
  },
];

export const STAFF_PURCHASE_ORDERS: StaffPurchaseOrder[] = [
  {
    id: "PO-2026-0118",
    supplier: "CAPS Pharmaceuticals",
    items: [
      {
        sku: "MED-0044",
        name: "Amoxicillin 500mg 21s",
        qty: 100,
        unitCost: 42.0,
      },
      {
        sku: "MED-0102",
        name: "Amlodipine 10mg 30s",
        qty: 80,
        unitCost: 32.5,
      },
    ],
    total: 6800.0,
    status: "Sent",
    createdAt: "Yesterday",
    expectedAt: "In 3 days",
  },
  {
    id: "PO-2026-0117",
    supplier: "Adcock Ingram ZW",
    items: [
      {
        sku: "MED-0133",
        name: "Tramadol 50mg 20s",
        qty: 60,
        unitCost: 88.0,
      },
    ],
    total: 5280.0,
    status: "Partially received",
    createdAt: "4 days ago",
    expectedAt: "Today",
  },
  {
    id: "PO-2026-0116",
    supplier: "Unilever ZW",
    items: [
      {
        sku: "PER-0418",
        name: "Dove Body Wash 400ml",
        qty: 50,
        unitCost: 48.0,
      },
    ],
    total: 2400.0,
    status: "Draft",
    createdAt: "Today",
    expectedAt: "TBC",
  },
];

export const STAFF_SYSTEM_USERS: StaffSystemUser[] = [
  {
    id: "STF-0000",
    name: "Tendai Moyo",
    email: "sysadmin@kingspharmacy.co.zw",
    role: "system_admin",
    branch: "Head Office",
    status: "Active",
    lastLogin: "5 min ago",
  },
  {
    id: "STF-0001",
    name: "Rumbidzai Chigumba",
    email: "admin@kingspharmacy.co.zw",
    role: "super_admin",
    branch: "Head Office",
    status: "Active",
    lastLogin: "1 hour ago",
  },
  {
    id: "STF-0042",
    name: "Dr. Aisha Moosa",
    email: "pharmacist@kingspharmacy.co.zw",
    role: "pharmacist",
    branch: "Bulawayo CBD",
    status: "Active",
    lastLogin: "20 min ago",
  },
  {
    id: "STF-0018",
    name: "Michael Pretorius",
    email: "manager@kingspharmacy.co.zw",
    role: "store_manager",
    branch: "Bulawayo CBD",
    status: "Active",
    lastLogin: "10 min ago",
  },
  {
    id: "STF-0073",
    name: "Lungelo Zulu",
    email: "dispatcher@kingspharmacy.co.zw",
    role: "dispatcher",
    branch: "Bulawayo CBD",
    status: "Active",
    lastLogin: "2 min ago",
  },
  {
    id: "STF-0091",
    name: "Kefilwe Sithole",
    email: "cashier@kingspharmacy.co.zw",
    role: "cashier",
    branch: "Bulawayo CBD",
    status: "Active",
    lastLogin: "30 min ago",
  },
  {
    id: "STF-0056",
    name: "Sipho Mahlangu",
    email: "inventory@kingspharmacy.co.zw",
    role: "inventory_clerk",
    branch: "Bulawayo CBD",
    status: "Active",
    lastLogin: "1 hour ago",
  },
  {
    id: "STF-0102",
    name: "Tendai Nyathi",
    email: "tendai.n@kingspharmacy.co.zw",
    role: "cashier",
    branch: "Bulawayo",
    status: "Locked",
    lastLogin: "3 days ago",
  },
  {
    id: "STF-0099",
    name: "Patience Moyo",
    email: "patience.m@kingspharmacy.co.zw",
    role: "pharmacist",
    branch: "Bulawayo",
    status: "Invited",
    lastLogin: "Never",
  },
];

export const SALES_HOURLY = [
  { hour: "8am", sales: 145, orders: 4 },
  { hour: "9am", sales: 320, orders: 9 },
  { hour: "10am", sales: 580, orders: 14 },
  { hour: "11am", sales: 720, orders: 18 },
  { hour: "12pm", sales: 940, orders: 23 },
  { hour: "1pm", sales: 1120, orders: 27 },
  { hour: "2pm", sales: 880, orders: 21 },
  { hour: "3pm", sales: 760, orders: 19 },
  { hour: "4pm", sales: 920, orders: 22 },
  { hour: "5pm", sales: 1240, orders: 28 },
];

export const SALES_7DAY = [
  { day: "Mon", sales: 4820, orders: 118 },
  { day: "Tue", sales: 5240, orders: 132 },
  { day: "Wed", sales: 4980, orders: 124 },
  { day: "Thu", sales: 5610, orders: 141 },
  { day: "Fri", sales: 6820, orders: 168 },
  { day: "Sat", sales: 7240, orders: 184 },
  { day: "Sun", sales: 3920, orders: 96 },
];

export const SALES_BY_CATEGORY = [
  { category: "Chronic", value: 8420 },
  { category: "Antibiotics", value: 3210 },
  { category: "Pain & Fever", value: 4860 },
  { category: "Vitamins", value: 5240 },
  { category: "Personal Care", value: 3990 },
  { category: "Baby", value: 2980 },
];

export const TOP_SELLERS_TODAY = [
  { name: "Panado 500mg 24s", units: 38, revenue: 1139.62 },
  { name: "Vitaforce Multivitamin 60s", units: 22, revenue: 3299.78 },
  { name: "Bioplus Energy 100ml", units: 31, revenue: 2789.69 },
  { name: "Dettol Antiseptic 500ml", units: 18, revenue: 1169.82 },
  { name: "Ventolin Inhaler 100mcg", units: 9, revenue: 1349.91 },
];

export const todaysTotals = () => {
  const sales = SALES_HOURLY.reduce((a, h) => a + h.sales, 0);
  const orders = SALES_HOURLY.reduce((a, h) => a + h.orders, 0);
  return { sales, orders, avg: sales / orders };
};
