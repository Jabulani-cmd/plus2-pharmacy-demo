import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { Download, Printer, Mail, MessageSquare, X, Loader2, CheckCircle2, Send } from "lucide-react";
import { ReceiptDocument } from "./ReceiptDocument";
import { maskPhone, type Receipt } from "@/lib/receipts";

type Props = {
  open: boolean;
  receipt: Receipt;
  onClose: () => void;
};

export function ReceiptModal({ open, receipt, onClose }: Props) {
  const docRef = useRef<HTMLDivElement>(null);
  const [emailOpen, setEmailOpen] = useState(false);
  const [smsOpen, setSmsOpen] = useState(false);
  const [emailed, setEmailed] = useState<string[]>(receipt.meta.emailedTo.map((e) => e.email));
  const [smsed, setSmsed] = useState<string[]>(receipt.meta.smsedTo.map((s) => s.phone));

  if (!open) return null;

  const handlePrint = () => printReceipt(receipt);
  const handleDownload = async () => {
    await downloadReceiptPdf(receipt, docRef.current);
  };

  return createPortal(
    <>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-2 backdrop-blur-sm sm:p-4 animate-fade-in" onClick={onClose}>
        <div className="flex max-h-[95vh] w-full max-w-[540px] flex-col overflow-hidden rounded-xl bg-card shadow-2xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
          {/* Sticky header */}
          <div className="flex shrink-0 items-center justify-between border-b border-border bg-card px-4 py-3">
            <span className="text-sm font-bold">Receipt #{receipt.receiptNumber}</span>
            <div className="flex items-center gap-1">
              <IconBtn onClick={handleDownload} title="Download PDF"><Download className="h-4 w-4" /></IconBtn>
              <IconBtn onClick={handlePrint} title="Print"><Printer className="h-4 w-4" /></IconBtn>
              <IconBtn onClick={onClose} title="Close"><X className="h-4 w-4" /></IconBtn>
            </div>
          </div>
          {/* Body */}
          <div className="flex-1 overflow-y-auto bg-[#F3F4F6] p-3 sm:p-5">
            <ReceiptDocument ref={docRef} receipt={receipt} />
            {(emailed.length > 0 || smsed.length > 0) && (
              <div className="mx-auto mt-3 max-w-[480px] space-y-1">
                {emailed.map((e) => (
                  <div key={e} className="flex items-center gap-1.5 text-xs font-semibold text-success">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Emailed to {e}
                  </div>
                ))}
                {smsed.map((p) => (
                  <div key={p} className="flex items-center gap-1.5 text-xs font-semibold text-success">
                    <CheckCircle2 className="h-3.5 w-3.5" /> SMS sent to {maskPhone(p)}
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Sticky footer */}
          <div className="flex shrink-0 flex-wrap gap-2 border-t border-border bg-card px-4 py-3">
            <button onClick={() => setEmailOpen(true)} className="inline-flex flex-1 items-center justify-center gap-2 rounded-md border-2 border-primary px-3 py-2 text-sm font-bold text-primary hover:bg-primary/5">
              <Mail className="h-4 w-4" /> Email
            </button>
            <button onClick={() => setSmsOpen(true)} className="inline-flex flex-1 items-center justify-center gap-2 rounded-md border-2 border-primary px-3 py-2 text-sm font-bold text-primary hover:bg-primary/5">
              <MessageSquare className="h-4 w-4" /> SMS
            </button>
            <button onClick={onClose} className="rounded-md px-3 py-2 text-sm font-bold text-muted-foreground hover:bg-muted">Close</button>
          </div>
        </div>
      </div>

      {emailOpen && (
        <EmailModal
          receipt={receipt}
          onClose={() => setEmailOpen(false)}
          onSent={(e) => setEmailed((p) => [...p, e])}
        />
      )}
      {smsOpen && (
        <SmsModal
          receipt={receipt}
          onClose={() => setSmsOpen(false)}
          onSent={(p) => setSmsed((prev) => [...prev, p])}
        />
      )}
    </>,
    document.body
  );
}

function IconBtn({ children, onClick, title }: { children: React.ReactNode; onClick: () => void; title: string }) {
  return (
    <button onClick={onClick} title={title} className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
      {children}
    </button>
  );
}

function EmailModal({ receipt, onClose, onSent }: { receipt: Receipt; onClose: () => void; onSent: (email: string) => void }) {
  const [email, setEmail] = useState(receipt.customer.email);
  const [sending, setSending] = useState(false);
  const [preview, setPreview] = useState(false);

  const send = () => {
    if (!email.includes("@")) {
      toast.error("Please enter a valid email");
      return;
    }
    setSending(true);
    setTimeout(() => {
      setSending(false);
      onSent(email);
      toast.success(`📧 Receipt emailed to ${email}`, { description: "Check your inbox — delivery usually takes under a minute" });
      onClose();
    }, 1800);
  };

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-[440px] rounded-xl bg-card p-6 shadow-2xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary"><Mail className="h-6 w-6" /></div>
        <h3 className="mt-3 text-lg font-extrabold">Email Receipt</h3>
        <p className="text-xs text-muted-foreground">We'll send a copy of your receipt to:</p>
        <input value={email} onChange={(e) => setEmail(e.target.value)} className="mt-4 h-11 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
        <label className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>Attach PDF receipt</span>
          <input type="checkbox" defaultChecked className="accent-[var(--color-primary)]" />
        </label>
        <button onClick={() => setPreview((p) => !p)} className="mt-2 text-xs font-semibold text-primary hover:underline">{preview ? "Hide" : "Preview"} email</button>
        {preview && (
          <div className="mt-3 overflow-hidden rounded-md border border-border bg-[#F3F4F6] text-[11px]">
            <div className="bg-[#1F2937] px-3 py-1.5 text-[10px] text-white/70">mail.google.com</div>
            <div className="border-b border-border bg-white px-3 py-2 text-[10px] text-muted-foreground">
              <div>From: noreply@kingspharmacy.co.zw</div>
              <div>To: {email}</div>
              <div>Subject: Your Kings Pharmacy Receipt — Order #{receipt.orderNumber}</div>
            </div>
            <div className="bg-[#0EA5E9] py-2 text-center text-xs font-bold text-white">Kings Pharmacy</div>
            <div className="bg-white p-3">
              <p className="font-semibold">Hi {receipt.customer.name.split(" ")[0]},</p>
              <p className="mt-1 text-muted-foreground">Thank you for your order. Your receipt for Order #{receipt.orderNumber} is ready.</p>
              <div className="mt-2 rounded bg-[#F0F9F4] px-2 py-1 text-[10px] text-[#0EA5E9]">📎 Receipt_{receipt.receiptNumber}.pdf attached</div>
            </div>
          </div>
        )}
        <button onClick={send} disabled={sending} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary-dark disabled:opacity-70">
          {sending ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</> : <><Send className="h-4 w-4" /> Send Email</>}
        </button>
        <button onClick={onClose} className="mt-2 block w-full text-center text-xs text-muted-foreground hover:text-foreground">Cancel</button>
      </div>
    </div>,
    document.body
  );
}

function SmsModal({ receipt, onClose, onSent }: { receipt: Receipt; onClose: () => void; onSent: (phone: string) => void }) {
  const [phone, setPhone] = useState(receipt.customer.phone);
  const [sending, setSending] = useState(false);
  const msg = `Kings Pharmacy: Your receipt for Order #${receipt.orderNumber} (US$${receipt.pricing.total.toFixed(2)}) is ready. View: kingspharm.co/r/${receipt.receiptNumber.slice(-6)} Reply STOP to opt out.`;
  const send = () => {
    setSending(true);
    setTimeout(() => {
      setSending(false);
      onSent(phone);
      toast.success(`📱 Receipt SMS sent to ${phone}`, { description: "Message delivered via Kings Notify" });
      onClose();
    }, 1200);
  };
  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-[440px] rounded-xl bg-card p-6 shadow-2xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary"><MessageSquare className="h-6 w-6" /></div>
        <h3 className="mt-3 text-lg font-extrabold">Send Receipt via SMS</h3>
        <p className="text-xs text-muted-foreground">We'll send a receipt link to your phone</p>
        <div className="mt-4 flex items-center gap-2">
          <span className="rounded-md border border-border bg-surface px-3 py-2 text-sm">🇿🇼 +263</span>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className="h-11 flex-1 rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
        </div>
        <div className="mt-4 rounded-md border border-border bg-surface p-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Message preview</div>
          <div className="mt-2 inline-block max-w-full rounded-2xl rounded-tl-sm bg-muted px-3 py-2 text-[12px] leading-relaxed text-foreground">{msg}</div>
          <div className="mt-1 text-[10px] text-muted-foreground">{msg.length}/160 characters — 1 SMS</div>
        </div>
        <button onClick={send} disabled={sending} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary-dark disabled:opacity-70">
          {sending ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending SMS...</> : <><Send className="h-4 w-4" /> Send SMS</>}
        </button>
        <button onClick={onClose} className="mt-2 block w-full text-center text-xs text-muted-foreground hover:text-foreground">Cancel</button>
      </div>
    </div>,
    document.body
  );
}

/* -------------------- Print + PDF -------------------- */

function printReceipt(receipt: Receipt) {
  const el = document.getElementById("receipt-document");
  if (!el) return;
  const html = el.outerHTML;
  const w = window.open("", "_blank", "width=600,height=800");
  if (!w) {
    toast.error("Pop-ups blocked. Enable pop-ups to print.");
    return;
  }
  w.document.write(`<!doctype html><html><head><title>Kings Receipt ${receipt.receiptNumber}</title>
    <style>
      @page { size: A5 portrait; margin: 0; }
      html, body { margin:0; padding:0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      body { font-family: system-ui, -apple-system, Segoe UI, sans-serif; }
      #receipt-document { page-break-inside: avoid; }
    </style></head><body>${html}<script>window.onload=()=>{setTimeout(()=>{window.print();},150);};window.onafterprint=()=>window.close();</script></body></html>`);
  w.document.close();
  toast.success("🖨️ Receipt sent to printer");
}

async function downloadReceiptPdf(receipt: Receipt, el: HTMLDivElement | null) {
  if (!el) return;
  toast.info("Generating PDF...");
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
    const pageH = pdf.internal.pageSize.getHeight();
    if (pdfH <= pageH) {
      pdf.addImage(img, "PNG", 0, 0, pdfW, pdfH);
    } else {
      // Multi-page paste
      let y = 0;
      while (y < pdfH) {
        pdf.addImage(img, "PNG", 0, -y, pdfW, pdfH);
        y += pageH;
        if (y < pdfH) pdf.addPage();
      }
    }
    const filename = `Kings_Receipt_${receipt.receiptNumber}_${receipt.orderNumber}.pdf`;
    pdf.save(filename);
    toast.success("⬇️ Receipt downloaded", { description: filename });
  } catch (e) {
    console.error(e);
    toast.error("PDF generation failed");
  }
}