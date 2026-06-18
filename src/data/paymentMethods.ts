// ============================================
// ZIMBABWEAN PAYMENT METHODS
// src/data/paymentMethods.ts
// ============================================

export type PaymentMethodId =
  | "ecocash"
  | "onemoney"
  | "telecash"
  | "zimswitch"
  | "bank_transfer";

export type PaymentStatus =
  | "idle"
  | "processing"
  | "prompt_sent"
  | "success"
  | "failed"
  | "cancelled";

export type PaymentField = {
  id: string;
  label: string;
  placeholder: string;
  type: "tel" | "text" | "password";
  hint: string;
};

export type ZimPaymentMethod = {
  id: PaymentMethodId;
  name: string;
  provider: string;
  logo: string;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
  instructions: string;
  processingTime: string;
  fees: string;
  popular: boolean;
  fields: PaymentField[];
  bankDetails?: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    branchCode: string;
    branch: string;
    swiftCode: string;
  };
};

export type PaymentRecord = {
  id: string;
  orderId: string;
  rxRef?: string;
  method: PaymentMethodId;
  methodLabel: string;
  amount: number;
  currency: "USD";
  status: PaymentStatus;
  reference: string;
  initiatedAt: string;
  completedAt?: string;
  customerPhone?: string;
  failureReason?: string;
};

// ============================================
// PAYMENT METHODS DATA
// ============================================

export const ZIM_PAYMENT_METHODS: ZimPaymentMethod[] = [
  {
    id: "ecocash",
    name: "EcoCash",
    provider: "Econet Wireless Zimbabwe",
    logo: "EC",
    color: "#E31837",
    bgColor: "#FEF2F4",
    borderColor: "#FECDD3",
    description: "Pay instantly using your EcoCash mobile wallet",
    instructions:
      "Enter your Econet number below. You will receive a " +
      "payment prompt on your phone. Enter your EcoCash PIN " +
      "to confirm payment.",
    processingTime: "Instant",
    fees: "No additional fees",
    popular: true,
    fields: [
      {
        id: "phone",
        label: "EcoCash Number",
        placeholder: "077 XXX XXXX",
        type: "tel",
        hint:
          "Enter your Econet number that is registered for EcoCash",
      },
    ],
  },
  {
    id: "onemoney",
    name: "OneMoney",
    provider: "NetOne Zimbabwe",
    logo: "OM",
    color: "#F7941D",
    bgColor: "#FFF7ED",
    borderColor: "#FED7AA",
    description: "Pay using your NetOne OneMoney wallet",
    instructions:
      "Enter your NetOne number below. You will receive a " +
      "USSD payment prompt. Enter your OneMoney PIN to confirm.",
    processingTime: "Instant",
    fees: "No additional fees",
    popular: false,
    fields: [
      {
        id: "phone",
        label: "OneMoney Number",
        placeholder: "071 XXX XXXX",
        type: "tel",
        hint:
          "Enter your NetOne number that is registered for OneMoney",
      },
    ],
  },
  {
    id: "telecash",
    name: "TeleCash",
    provider: "Telecel Zimbabwe",
    logo: "TC",
    color: "#0066CC",
    bgColor: "#EFF6FF",
    borderColor: "#BFDBFE",
    description: "Pay using your Telecel TeleCash wallet",
    instructions:
      "Enter your Telecel number below. A payment prompt " +
      "will be sent to your phone to confirm with your PIN.",
    processingTime: "Instant",
    fees: "No additional fees",
    popular: false,
    fields: [
      {
        id: "phone",
        label: "TeleCash Number",
        placeholder: "073 XXX XXXX",
        type: "tel",
        hint:
          "Enter your Telecel number that is registered for TeleCash",
      },
    ],
  },
  {
    id: "zimswitch",
    name: "ZimSwitch / Bank Card",
    provider: "ZimSwitch Payment Network",
    logo: "ZS",
    color: "#0EA5E9",
    bgColor: "#F0F9F4",
    borderColor: "#BBF7D0",
    description:
      "Pay with any Zimbabwean bank debit or credit card",
    instructions:
      "Enter your ZimSwitch-enabled bank card details below. " +
      "Your payment is processed securely through the " +
      "ZimSwitch network.",
    processingTime: "2-3 minutes",
    fees: "No additional fees",
    popular: false,
    fields: [
      {
        id: "cardNumber",
        label: "Card Number",
        placeholder: "XXXX XXXX XXXX XXXX",
        type: "text",
        hint:
          "16-digit number on the front of your bank card",
      },
      {
        id: "cardName",
        label: "Cardholder Name",
        placeholder: "As printed on your card",
        type: "text",
        hint: "",
      },
      {
        id: "expiry",
        label: "Expiry Date",
        placeholder: "MM/YY",
        type: "text",
        hint: "",
      },
      {
        id: "cvv",
        label: "CVV",
        placeholder: "3 digits",
        type: "password",
        hint:
          "3-digit security code on the back of your card",
      },
    ],
  },
  {
    id: "bank_transfer",
    name: "Bank Transfer — ZIPIT",
    provider: "Zimbabwe Banking Network",
    logo: "BT",
    color: "#374151",
    bgColor: "#F9FAFB",
    borderColor: "#E5E7EB",
    description:
      "Transfer directly from any Zimbabwean bank account",
    instructions:
      "Use the banking details below to make an instant " +
      "ZIPIT transfer from your bank app, internet banking " +
      "or at any bank branch.",
    processingTime: "15-30 minutes",
    fees: "Standard bank transfer fees apply",
    popular: false,
    fields: [],
    bankDetails: {
      bankName: "CBZ Bank Zimbabwe",
      accountName: "Kings Pharmacy (Pvt) Ltd",
      accountNumber: "05488192100",
      branchCode: "055",
      branch: "Bulawayo CBD Branch",
      swiftCode: "COBZZWHAXXX",
    },
  },
];

// ============================================
// DEMO PRE-FILL DATA
// Used to auto-fill fields during presentation
// ============================================

export const DEMO_PAYMENT_DETAILS: Record<
  string,
  Record<string, string>
> = {
  ecocash: {
    phone: "077 123 4567",
  },
  onemoney: {
    phone: "071 234 5678",
  },
  telecash: {
    phone: "073 345 6789",
  },
  zimswitch: {
    cardNumber: "4532 1234 5678 9012",
    cardName: "Tinashe Mapfumo",
    expiry: "12/27",
    cvv: "123",
  },
};

// ============================================
// HELPERS
// ============================================

export const generatePaymentRef = (): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let ref = "P2ZW";
  for (let i = 0; i < 8; i++) {
    ref += chars.charAt(
      Math.floor(Math.random() * chars.length)
    );
  }
  return ref;
};

export const getMethodLabel = (id: string): string => {
  const method = ZIM_PAYMENT_METHODS.find((m) => m.id === id);
  return method ? method.name : id;
};

export const isMobileMoneyMethod = (id: string): boolean => {
  return ["ecocash", "onemoney", "telecash"].includes(id);
};

export const isCardMethod = (id: string): boolean => {
  return id === "zimswitch";
};

export const isBankTransfer = (id: string): boolean => {
  return id === "bank_transfer";
};
