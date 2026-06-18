import type { Order } from "@/store/auth";

export type ReceiptItem = {
  name: string;
  sku: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
  isRx?: boolean;
  rxRef?: string;
};

export type Receipt = {
  receiptNumber: string;
  orderNumber: string;
  transactionRef: string;
  timestamp: string;
  type: "OTC" | "Prescription" | "Mixed";
  business: {
    name: string;
    branch: string;
    address: string;
    phone: string;
    email: string;
    website: string;
    vatNumber: string;
    sapcReg: string;
  };
  customer: { name: string; email: string; phone: string; address: string };
  items: ReceiptItem[];
  pricing: {
    subtotal: number;
    discount: number;
    discountCode?: string | null;
    deliveryFee: number;
    vatAmount: number;
    vatRate: number;
    total: number;
  };
  payment: {
    method: string;
    cardLast4?: string | null;
    cardType?: string | null;
    transactionRef: string;
    authorisationCode: string;
    paidAt: string;
  };
  delivery: { method: string; address: string; estimatedDate: string; trackingRef: string };
  pharmacist?: { name: string; sapcReg: string; approvedAt: string };
  meta: {
    generatedAt: string;
    generatedBy: string;
    printCount: number;
    emailedTo: { email: string; at: string }[];
    smsedTo: { phone: string; at: string }[];
  };
};

export const KINGS_BUSINESS = {
  name: "Kings Pharmacy (Pvt) Ltd",
  branch: "Hillside Branch",
  address: "Shop 14, Hillside Shopping Centre, Cecil Avenue, Bulawayo",
  phone: "+263 78 200 0100",
  email: "hillside@kingspharmacy.co.zw",
  website: "www.kingspharmacy.co.zw",
  vatNumber: "10045678-2",
  sapcReg: "MCAZ-PHM-00441",
};

const rand6 = () => Math.floor(100000 + Math.random() * 899999).toString();
const rand8 = () => Math.random().toString(36).slice(2, 10).toUpperCase();

/** Zimbabwe number plate: 3 letters + 4 digits, e.g. "AEB 7790" */
export const randomZwPlate = () => {
  const letters = "ABCDEFGHJKLMNPRSTUVWXYZ";
  const L = () => letters[Math.floor(Math.random() * letters.length)];
  const d = () => Math.floor(Math.random() * 10);
  return `${L()}${L()}${L()} ${d()}${d()}${d()}${d()}`;
};

export function buildReceipt(opts: {
  order?: Partial<Order>;
  orderNumber: string;
  authRef?: string;
  items: ReceiptItem[];
  customer: { name: string; email: string; phone: string; address: string };
  paymentMethod: string;
  cardLast4?: string;
  cardType?: string;
  deliveryMethod: string;
  deliveryFee: number;
  discount?: number;
  discountCode?: string;
  hasRx?: boolean;
}): Receipt {
  const subtotal = opts.items.reduce((s, i) => s + i.lineTotal, 0);
  const discount = opts.discount ?? 0;
  const vatRate = 0.15;
  const taxable = subtotal - discount + opts.deliveryFee;
  const vatAmount = +(taxable - taxable / (1 + vatRate)).toFixed(2);
  const total = +(taxable).toFixed(2);
  const auth = opts.authRef ?? `AUTH-${rand8()}`;
  const hasRxItem = opts.items.some((i) => i.isRx) || !!opts.hasRx;
  const type: Receipt["type"] = hasRxItem
    ? opts.items.some((i) => !i.isRx)
      ? "Mixed"
      : "Prescription"
    : "OTC";

  return {
    receiptNumber: `RCP-2025-${rand6()}`,
    orderNumber: opts.orderNumber,
    transactionRef: `TXN-${rand8()}`,
    timestamp: new Date().toISOString(),
    type,
    business: KINGS_BUSINESS,
    customer: opts.customer,
    items: opts.items,
    pricing: {
      subtotal,
      discount,
      discountCode: opts.discountCode ?? null,
      deliveryFee: opts.deliveryFee,
      vatAmount,
      vatRate,
      total,
    },
    payment: {
      method: opts.paymentMethod,
      cardLast4: opts.cardLast4 ?? null,
      cardType: opts.cardType ?? null,
      transactionRef: `TXN-${rand8()}`,
      authorisationCode: auth,
      paidAt: new Date().toISOString(),
    },
    delivery: {
      method: opts.deliveryMethod,
      address: opts.customer.address,
      estimatedDate: "1–2 working days",
      trackingRef: `TRK-${rand6()}`,
    },
    pharmacist:
      type !== "OTC"
        ? {
            name: "Dr. Aisha Moosa (BPharm)",
            sapcReg: "MCAZ-BPharm-00234",
            approvedAt: new Date().toISOString(),
          }
        : undefined,
    meta: {
      generatedAt: new Date().toISOString(),
      generatedBy: "System",
      printCount: 0,
      emailedTo: [],
      smsedTo: [],
    },
  };
}

export const formatReceiptDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString("en-ZW", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const maskPhone = (p: string) => {
  const digits = p.replace(/\D/g, "");
  if (digits.length < 6) return p;
  return p.replace(digits.slice(-7, -3), " *** ");
};