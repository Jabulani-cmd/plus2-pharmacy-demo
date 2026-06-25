import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { Printer, ArrowLeft, Loader2, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { buildReceipt, type Receipt } from "@/lib/receipts";
import { ReceiptDocument } from "@/components/receipt/ReceiptDocument";
import type { SharedOrder } from "@/store/sharedOrders";
import { toast } from "sonner";

const search = z.object({ id: z.string().optional() });

export const Route = createFileRoute("/receipt")({
  validateSearch: search.parse,
  head: () => ({ meta: [{ title: "Receipt — Kings Pharmacy" }] }),
  component: ReceiptPage,
});

function ReceiptPage() {
  const { id } = Route.useSearch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<SharedOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const docRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) {
      setError("No order ID provided.");
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("shared_orders")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        setError(error.message);
      } else if (!data) {
        setError("Order not found.");
      } else {
        setOrder(rowToOrder(data as never));
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading)
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center justify-center px-4 py-16 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-3 text-sm text-muted-foreground">Loading your receipt…</p>
      </div>
    );

  if (error || !order)
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-xl font-extrabold">Receipt unavailable</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error ?? "Order not found."}</p>
        <Link to="/account" className="mt-6 inline-block rounded-md bg-primary px-6 py-3 font-bold text-primary-foreground">
          Back to My Orders
        </Link>
      </div>
    );

  const receipt = orderToReceipt(order);

  const handlePrint = () => window.print();
  const handleDownload = async () => {
    const el = docRef.current;
    if (!el) return;
    toast.info("Preparing PDF…");
    try {
      const [{ default: html2canvas }, jspdfMod] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);
      const jsPDF = (jspdfMod as unknown as { jsPDF: typeof import("jspdf").jsPDF }).jsPDF;
      const canvas = await html2canvas(el, { scale: 2, backgroundColor: "#ffffff", logging: false, useCORS: true });
      const img = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a5" });
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = (canvas.height * pdfW) / canvas.width;
      pdf.addImage(img, "PNG", 0, 0, pdfW, pdfH);
      pdf.save(`Kings_Receipt_${order.id}.pdf`);
      toast.success("Receipt downloaded");
    } catch (e) {
      console.error(e);
      toast.error("PDF generation failed");
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 print:p-0">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 print:hidden">
        <button
          onClick={() => navigate({ to: "/account" })}
          className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-semibold hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" /> My Orders
        </button>
        <div className="flex gap-2">
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-2 rounded-md border border-primary px-3 py-2 text-sm font-bold text-primary hover:bg-primary/5"
          >
            <Download className="h-4 w-4" /> Download PDF
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary-dark"
          >
            <Printer className="h-4 w-4" /> Print Receipt
          </button>
        </div>
      </div>
      <ReceiptDocument ref={docRef} receipt={receipt} />
      <style>{`@media print { body { background: white; } .print\\:hidden { display: none !important; } .print\\:p-0 { padding: 0 !important; } header, footer, nav, [data-mobile-bottom-nav] { display: none !important; } }`}</style>
    </div>
  );
}

// --- helpers ---
function rowToOrder(r: Record<string, unknown>): SharedOrder {
  const g = (k: string) => r[k] as unknown;
  return {
    id: String(g("id")),
    customerId: (g("customer_id") as string | null) ?? undefined,
    customerEmail: (g("customer_email") as string | null) ?? undefined,
    customer: String(g("customer") ?? ""),
    phone: String(g("phone") ?? ""),
    branchId: (g("branch_id") as string | null) ?? undefined,
    branchName: (g("branch_name") as string | null) ?? undefined,
    items: (g("items") as SharedOrder["items"]) ?? [],
    itemCount: Number(g("item_count") ?? 0),
    address: String(g("address") ?? ""),
    deliveryAddress: (g("delivery_address") as SharedOrder["deliveryAddress"]) ?? undefined,
    deliveryMethod: String(g("delivery_method") ?? ""),
    deliverySlot: (g("delivery_slot") as string | null) ?? undefined,
    paymentMethod: String(g("payment_method") ?? ""),
    paymentRef: String(g("payment_ref") ?? ""),
    subtotal: Number(g("subtotal") ?? 0),
    deliveryFee: Number(g("delivery_fee") ?? 0),
    discountAmount: Number(g("discount_amount") ?? 0),
    discountCode: (g("discount_code") as string | null) ?? undefined,
    total: Number(g("total") ?? 0),
    status: g("status") as SharedOrder["status"],
    placedAt: String(g("placed_at") ?? ""),
    placedTs: Number(g("placed_ts") ?? Date.now()),
    driverName: (g("driver_name") as string | null) ?? undefined,
    driverPhone: (g("driver_phone") as string | null) ?? undefined,
    driverVehicle: (g("driver_vehicle") as string | null) ?? undefined,
    packedAt: (g("packed_at") as string | null) ?? undefined,
    dispatchedAt: (g("dispatched_at") as string | null) ?? undefined,
    deliveredAt: (g("delivered_at") as string | null) ?? undefined,
    eta: (g("eta") as string | null) ?? undefined,
    outForDeliveryTs: (g("out_for_delivery_ts") as number | null) ?? undefined,
  };
}

function orderToReceipt(o: SharedOrder): Receipt {
  const safe = (v: string | undefined, fallback: string) => (v && v.trim() ? v : fallback);
  return buildReceipt({
    orderNumber: o.id,
    authRef: o.paymentRef,
    items: o.items.map((i) => ({
      name: safe(i.name, "Unnamed item"),
      sku: i.id?.toUpperCase() ?? "—",
      qty: i.qty,
      unitPrice: i.price,
      lineTotal: +(i.price * i.qty).toFixed(2),
    })),
    customer: {
      name: safe(o.customer, "Not provided"),
      email: safe(o.customerEmail, "Not provided"),
      phone: safe(o.phone, "Not provided"),
      address: safe(o.address, "Not provided"),
    },
    paymentMethod: safe(o.paymentMethod, "Not provided"),
    deliveryMethod: o.branchName
      ? `${labelForMethod(o.deliveryMethod)} · ${o.branchName}`
      : labelForMethod(o.deliveryMethod),
    deliveryFee: o.deliveryFee,
    discount: o.discountAmount,
    discountCode: o.discountCode,
  });
}

function labelForMethod(m: string) {
  return (
    {
      standard: "Standard Delivery",
      express: "Same-day Express",
      national: "Nationwide Courier",
      collect: "Click & Collect",
    } as Record<string, string>
  )[m] ?? m;
}