import type { Product } from "./products";

export type Branch = {
  id: string;
  name: string;
  shortName: string;
  address: string;
  phone: string;
  hours: string;
};

export const BRANCHES: Branch[] = [
  {
    id: "byo-cbd",
    name: "Kings Pharmacy — Bulawayo CBD",
    shortName: "Bulawayo CBD",
    address: "Shop 5, Fife Street & 9th Avenue, Bulawayo CBD",
    phone: "+263 29 220 0101",
    hours: "Mon–Sat 08:00–19:00 · Sun 09:00–14:00",
  },
  {
    id: "byo-hillside",
    name: "Kings Pharmacy — Hillside",
    shortName: "Hillside",
    address: "Hillside Shopping Centre, Cecil Avenue, Bulawayo",
    phone: "+263 29 224 5500",
    hours: "Mon–Sun 08:00–20:00",
  },
  {
    id: "byo-ascot",
    name: "Kings Pharmacy — Ascot",
    shortName: "Ascot",
    address: "Ascot Shopping Centre, Cecil Avenue, Bulawayo",
    phone: "+263 29 226 7788",
    hours: "Mon–Sat 08:00–18:30",
  },
  {
    id: "byo-khumalo",
    name: "Kings Pharmacy — Khumalo",
    shortName: "Khumalo",
    address: "Khumalo Shopping Centre, Burnside Road, Bulawayo",
    phone: "+263 29 228 3344",
    hours: "Mon–Sun 08:00–19:00",
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