import type { Product } from "./products";

export type Branch = {
  id: string;
  name: string;
  shortName: string;
  address: string;
  phone: string;
  hours: string;
  /**
   * Branch WhatsApp number in international format (no leading "+").
   * Used by `wa.me/<number>` deep links.
   * TODO: replace placeholder numbers once provided by Kings Pharmacy.
   */
  whatsapp: string;
};

// Only the 9th Ave WhatsApp number has been confirmed by the client.
// The other three default to the same number as a safe placeholder;
// swap each `whatsapp` value when the real number is provided.
const TODO_WHATSAPP = "263775715520";

export const BRANCHES: Branch[] = [
  {
    id: "9th-ave",
    name: "Kings Pharmacy — 9th Avenue CBD",
    shortName: "9th Ave CBD",
    address: "9th Avenue, Bulawayo CBD",
    phone: "+263 77 571 5520",
    hours: "Mon–Sat 08:00–19:00 · Sun 09:00–14:00",
    whatsapp: "263775715520",
  },
  {
    id: "6th-ave",
    name: "Kings Pharmacy — 6th Avenue CBD",
    shortName: "6th Ave CBD",
    address: "6th Avenue, Bulawayo CBD",
    phone: "+263 77 571 5520",
    hours: "Mon–Sat 08:00–19:00",
    whatsapp: TODO_WHATSAPP,
  },
  {
    id: "old-mutual",
    name: "Kings Pharmacy — Old Mutual Centre",
    shortName: "Old Mutual Centre",
    address: "Shop 4, Old Mutual Centre, Jason Moyo Avenue, Bulawayo",
    phone: "+263 77 571 5520",
    hours: "Mon–Fri 08:00–17:30 · Sat 08:00–13:00",
    whatsapp: TODO_WHATSAPP,
  },
  {
    id: "ascot",
    name: "Kings Pharmacy — Ascot Shopping Centre",
    shortName: "Ascot Centre",
    address: "Ascot Shopping Centre, Bulawayo",
    phone: "+263 77 571 5520",
    hours: "Mon–Sun 08:00–19:00",
    whatsapp: TODO_WHATSAPP,
  },
];

export const getBranch = (id: string) =>
  BRANCHES.find((b) => b.id === id) ?? BRANCHES[0];

/**
 * Deterministic per-branch stock simulation. Uses a stable hash of
 * (product.id + branch.id) so the same combo always returns the same status,
 * but different branches show realistically varied availability.
 */
export type StockStatus = "in" | "low" | "out";

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

export function getBranchStock(product: Pick<Product, "id" | "stock">, branchId: string): StockStatus {
  // If the master record is "out", it's out everywhere.
  if (product.stock === "out") return "out";
  const n = hash(product.id + ":" + branchId) % 10;
  if (n === 0) return "out";
  if (n <= 2) return "low";
  return "in";
}

export function getStockByBranch(product: Pick<Product, "id" | "stock">): { branch: Branch; status: StockStatus }[] {
  return BRANCHES.map((branch) => ({ branch, status: getBranchStock(product, branch.id) }));
}