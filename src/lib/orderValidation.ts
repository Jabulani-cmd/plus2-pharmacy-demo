import type { SharedOrder } from "@/store/sharedOrders";

export type OrderDraft = Pick<
  SharedOrder,
  | "id"
  | "customer"
  | "phone"
  | "address"
  | "paymentMethod"
  | "items"
  | "total"
  | "branchId"
>;

export function validateOrderBeforeSubmit(o: OrderDraft): string[] {
  const errors: string[] = [];
  if (!o.id?.trim()) errors.push("Order ID is missing");
  if (!o.customer?.trim()) errors.push("Customer name is missing");
  if (!o.phone?.trim()) errors.push("Phone number is missing");
  if (!o.address?.trim()) errors.push("Delivery address is missing");
  if (!o.paymentMethod?.trim()) errors.push("Payment method is missing");
  if (!o.items?.length) errors.push("No items in order");
  if (
    o.items?.some(
      (i) => !i.name?.trim() || !i.price || i.price <= 0 || !i.qty || i.qty <= 0,
    )
  )
    errors.push("Some items have missing data");
  if (!o.total || o.total <= 0) errors.push("Order total is invalid");
  if (!o.branchId?.trim()) errors.push("Branch is missing");
  return errors;
}