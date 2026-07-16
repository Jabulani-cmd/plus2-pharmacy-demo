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
  phone?: string;
  deliveryAddress?: {
    firstName?: string;
    lastName?: string;
    street?: string;
    suburb?: string;
    city?: string;
    province?: string;
    postal?: string;
    phone?: string;
    email?: string;
  };
  driverLat?: number;
  driverLng?: number;
  driverHeading?: number;
  branchName?: string;
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
  // Seed data removed
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
  // Seed data removed
];

export const STAFF_INVENTORY: StaffInventoryItem[] = [
  // Seed data removed
];

export const STAFF_EXPENSES: StaffExpense[] = [
  // Seed data removed
];

export const STAFF_PURCHASE_ORDERS: StaffPurchaseOrder[] = [
  // Seed data removed
];

export const STAFF_SYSTEM_USERS: StaffSystemUser[] = [
  // Seed data removed
];

export const SALES_HOURLY: { hour: string; sales: number; orders: number }[] = [
  // Seed data removed
];

export const SALES_7DAY: { day: string; sales: number }[] = [
  // Seed data removed
];

export const SALES_BY_CATEGORY: { category: string; value: number }[] = [
  // Seed data removed
];

export const TOP_SELLERS_TODAY: { name: string; revenue: number; units: number }[] = [
  // Seed data removed
];

export const todaysTotals = () => ({ sales: 0, orders: 0, avg: 0 });

