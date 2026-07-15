import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { Printer, ArrowLeft, Loader2, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { buildReceipt, type Receipt } from "@/lib/receipts";
import { ReceiptDocument } from "@/components/receipt/ReceiptDocument";
import { getMethodLabel } from "@/data/paymentMethods";
import type { SharedPrescription, SharedQuotation, SharedDeliveryAddress } from "@/store/sharedPrescriptions";
import { toast } from "sonner";

const search = z.object({ id: z.string().optional() });

export const Route = createFileRoute("/rx-receipt")({
  validateSearch: search.parse,
  head: () => ({ meta: [{ title: "Prescription Receipt — Kings Pharmacy" }] }),
  component: RxReceiptPage,
});

function RxReceiptPage() {
  const { id } = Route.useSearch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [rx, setRx] = useState<SharedPrescription | null>(null);
  const [error, setError] = useState<string | null>(null);
  const docRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) { setError("No prescription ID provided."); setLoading(false); return; }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("prescriptions").select("*").eq("id", id).maybeSingle();
      if (cancelled) return;
      if (error) setError(error.message);
      else if (!data) setError("Prescription not found.");
      else setRx(rowToRx(data as never));
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [id]);

  if (loading)
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center justify-center px-4 py-16 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-3 text-sm text-muted-foreground">Loading receipt…</p>
      </div>
    );

  if (error || !rx)
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-xl font-extrabold">Receipt unavailable</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error ?? "Prescription not found."}</p>
        <Link to="/staff/dashboard" className="mt-6 inline-block rounded-md bg-primary px-6 py-3 font-bold text-primary-foreground">
          Back to Dispatch
        </Link>
      </div>
    );

  const receipt = rxToReceipt(rx);

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
      pdf.save(`Kings_Rx_Receipt_${rx.id}.pdf`);
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
          onClick={() => navigate({ to: "/staff/dashboard" })}
          className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-semibold hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" /> Dispatch
        </button>
        <div className="flex gap-2">
          <button onClick={handleDownload} className="inline-flex items-center gap-2 rounded-md border border-primary px-3 py-2 text-sm font-bold text-primary hover:bg-primary/5">
            <Download className="h-4 w-4" /> Download PDF
          </button>
          <button onClick={handlePrint} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary-dark">
            <Printer className="h-4 w-4" /> Print Receipt
          </button>
        </div>
      </div>
      <ReceiptDocument ref={docRef} receipt={receipt} />
      <style>{`@media print { body { background: white; } .print\\:hidden { display: none !important; } .print\\:p-0 { padding: 0 !important; } header, footer, nav, [data-mobile-bottom-nav] { display: none !important; } }`}</style>
    </div>
  );
}

function rowToRx(r: Record<string, unknown>): SharedPrescription {
  const g = (k: string) => r[k] as unknown;
  return {
    id: String(g("id")),
    customerId: (g("customer_id") as string | null) ?? undefined,
    customerName: String(g("customer_name") ?? ""),
    customerEmail: (g("customer_email") as string | null) ?? undefined,
    customerPhone: String(g("customer_phone") ?? ""),
    fileName: String(g("file_name") ?? ""),
    patientName: String(g("patient_name") ?? ""),
    doctorName: String(g("doctor_name") ?? ""),
    status: (g("status") as SharedPrescription["status"]) ?? "Pending",
    uploadedAt: String(g("uploaded_at") ?? ""),
    quotation: (g("quotation") as SharedQuotation | null) ?? undefined,
    paymentRef: (g("payment_ref") as string | null) ?? undefined,
    paymentMethod: (g("payment_method") as string | null) ?? undefined,
    paidAt: (g("paid_at") as string | null) ?? undefined,
    branchName: (g("branch_name") as string | null) ?? undefined,
    delivery: (g("delivery") as "delivery" | "collect" | null) ?? undefined,
    deliveryAddress: (g("delivery_address") as SharedDeliveryAddress | null) ?? undefined,
    driverName: (g("driver_name") as string | null) ?? undefined,
    driverPhone: (g("driver_phone") as string | null) ?? undefined,
    driverVehicle: (g("driver_vehicle") as string | null) ?? undefined,
  };
}

function rxToReceipt(rx: SharedPrescription): Receipt {
  const medCost = rx.quotation?.medicationCost ?? 0;
  const deliveryFee = rx.quotation?.deliveryFee ?? 0;
  const addr = rx.deliveryAddress;
  const addressStr = addr
    ? [addr.streetAddress, addr.suburb, addr.city, addr.province, addr.postalCode].filter(Boolean).join(", ")
    : rx.branchName
    ? `Collect at ${rx.branchName}`
    : "Not provided";
  const name = addr ? `${addr.firstName} ${addr.lastName}`.trim() : rx.customerName;
  const phone = addr?.phone || rx.customerPhone || "Not provided";
  return buildReceipt({
    orderNumber: rx.id,
    authRef: rx.paymentRef,
    items: [
      {
        name: "Prescription items (as dispensed)",
        sku: rx.id,
        qty: 1,
        unitPrice: medCost,
        lineTotal: medCost,
        isRx: true,
        rxRef: rx.id,
      },
    ],
    customer: {
      name: name || "Not provided",
      email: rx.customerEmail || "Not provided",
      phone,
      address: addressStr,
    },
    paymentMethod: rx.paymentMethod ? getMethodLabel(rx.paymentMethod) : "Not provided",
    deliveryMethod: rx.delivery === "collect"
      ? `Click & Collect${rx.branchName ? " · " + rx.branchName : ""}`
      : "Home Delivery",
    deliveryFee,
    hasRx: true,
  });
}