import { forwardRef } from "react";
import { CreditCard, Building2, Banknote, Smartphone, Package, UserCheck } from "lucide-react";
import { formatUSD } from "@/store/shop";
import { formatReceiptDate, type Receipt } from "@/lib/receipts";
import kingsLogo from "@/assets/kings-logo.png";

type Props = { receipt: Receipt };

const typeBadge = (t: Receipt["type"]) => {
  if (t === "OTC") return { bg: "#DBEAFE", color: "#1E40AF", label: "Over-The-Counter (OTC)" };
  if (t === "Prescription") return { bg: "#F3E8FF", color: "#6B21A8", label: "Prescription Order" };
  return { bg: "#FEF3C7", color: "#92400E", label: "OTC + Prescription Order" };
};

const PayIcon = ({ method }: { method: string }) => {
  const m = method.toLowerCase();
  if (m.includes("card") || m.includes("visa") || m.includes("master")) return <CreditCard size={16} color="#374151" />;
  if (m.includes("eft") || m.includes("bank")) return <Building2 size={16} color="#374151" />;
  if (m.includes("cash")) return <Banknote size={16} color="#374151" />;
  return <Smartphone size={16} color="#374151" />;
};

export const ReceiptDocument = forwardRef<HTMLDivElement, Props>(function ReceiptDocument({ receipt: r }, ref) {
  const badge = typeBadge(r.type);
  return (
    <div
      ref={ref}
      id="receipt-document"
      style={{ background: "#fff", color: "#111827", fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif", maxWidth: 480, width: "100%", margin: "0 auto" }}
    >
      {/* HEADER */}
      <div style={{ background: "#0EA5E9", padding: "24px 32px", color: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ display: "inline-flex", width: 54, height: 54, borderRadius: 8, background: "#fff", alignItems: "center", justifyContent: "center", padding: 4 }}>
              <img src={kingsLogo} alt="Kings Pharmacy" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            </span>
            <span style={{ fontWeight: 700, fontSize: 18 }}>Kings Pharmacy</span>
          </div>
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>Tax Invoice / Receipt</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, fontSize: 13, opacity: 0.9 }}>
          <span>Receipt #{r.receiptNumber}</span>
          <span>{formatReceiptDate(r.timestamp)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 12, opacity: 0.75 }}>
          <span>Order #{r.orderNumber}</span>
          <span>Ref: {r.payment.authorisationCode}</span>
        </div>
      </div>

      {/* BUSINESS */}
      <div style={{ background: "#F0F9F4", padding: "16px 32px", borderBottom: "1px solid #E5E7EB", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "#6B7280", letterSpacing: "0.08em", marginBottom: 4 }}>Sold By</div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{r.business.name}</div>
          <div style={{ fontSize: 12, color: "#374151" }}>{r.business.branch}</div>
          <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>{r.business.address}</div>
          <div style={{ fontSize: 11, color: "#6B7280" }}>{r.business.phone} · {r.business.email}</div>
          <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>VAT Reg: {r.business.vatNumber}</div>
          <div style={{ fontSize: 11, color: "#6B7280" }}>MCAZ Reg: {r.business.sapcReg}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "#6B7280", letterSpacing: "0.08em", marginBottom: 4 }}>Billed To</div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{r.customer.name}</div>
          <div style={{ fontSize: 12, color: "#374151" }}>{r.customer.email}</div>
          <div style={{ fontSize: 12, color: "#374151" }}>{r.customer.phone}</div>
          <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>{r.customer.address}</div>
        </div>
      </div>

      {/* TYPE BADGE */}
      <div style={{ padding: "8px 32px", borderBottom: "1px solid #E5E7EB" }}>
        <span style={{ display: "inline-block", background: badge.bg, color: badge.color, fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 12 }}>{badge.label}</span>
      </div>

      {/* ITEMS */}
      <div style={{ padding: "0 32px", marginTop: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 50px 80px 80px", background: "#F9FAFB", borderTop: "1px solid #E5E7EB", borderBottom: "1px solid #E5E7EB", padding: "8px 0", fontSize: 10, fontWeight: 600, textTransform: "uppercase", color: "#6B7280", letterSpacing: "0.06em" }}>
            <span>Item</span><span style={{ textAlign: "center" }}>Qty</span><span style={{ textAlign: "right" }}>Unit</span><span style={{ textAlign: "right" }}>Total</span>
        </div>
        {r.items.map((it, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 50px 80px 80px", borderBottom: "1px solid #F3F4F6", padding: "10px 0", alignItems: "start" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: "#111827" }}>{it.name}</div>
              <div style={{ fontSize: 11, color: "#9CA3AF" }}>SKU {it.sku}</div>
              {it.isRx && (
                <div style={{ marginTop: 4, display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <span style={{ background: "#F3E8FF", color: "#7C3AED", fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4 }}>Rx</span>
                  <span style={{ fontSize: 10, color: "#7C3AED" }}>Script: {it.rxRef}</span>
                </div>
              )}
            </div>
            <div style={{ fontSize: 13, color: "#374151", textAlign: "center" }}>{it.qty}</div>
            <div style={{ fontSize: 13, color: "#374151", textAlign: "right" }}>{formatUSD(it.unitPrice)}</div>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#111827", textAlign: "right" }}>{formatUSD(it.lineTotal)}</div>
          </div>
        ))}
      </div>

      {/* PRICING */}
      <div style={{ padding: "16px 32px", background: "#F9FAFB", borderTop: "1px solid #E5E7EB" }}>
        <Line label="Subtotal" value={formatUSD(r.pricing.subtotal)} />
        {r.pricing.discount > 0 && (
          <Line label={`Discount${r.pricing.discountCode ? ` (${r.pricing.discountCode})` : ""}`} value={`−${formatUSD(r.pricing.discount)}`} color="#059669" />
        )}
        <Line label={`Delivery (${r.delivery.method})`} value={r.pricing.deliveryFee === 0 ? "FREE" : formatUSD(r.pricing.deliveryFee)} valueColor={r.pricing.deliveryFee === 0 ? "#059669" : undefined} />
        <Line label="VAT (15%)" value={formatUSD(r.pricing.vatAmount)} />
        <div style={{ borderTop: "1px solid #E5E7EB", margin: "8px 0" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ fontWeight: 700, fontSize: 16 }}>TOTAL</span>
          <span style={{ fontWeight: 700, fontSize: 18, color: "#0EA5E9" }}>{formatUSD(r.pricing.total)}</span>
        </div>
      </div>

      {/* PAYMENT */}
      <div style={{ padding: "16px 32px", borderTop: "1px solid #E5E7EB" }}>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "#6B7280", letterSpacing: "0.08em", marginBottom: 8 }}>Payment Details</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, color: "#374151" }}>
            <PayIcon method={r.payment.method} />
            {r.payment.cardLast4 ? `${r.payment.cardType ?? "Card"} ending ${r.payment.cardLast4}` : r.payment.method}
          </span>
          <span style={{ fontWeight: 600, fontSize: 13 }}>{formatUSD(r.pricing.total)}</span>
        </div>
        <div style={{ fontSize: 11, color: "#6B7280", marginTop: 6 }}>Authorisation Code: {r.payment.authorisationCode}</div>
        <div style={{ fontSize: 11, color: "#6B7280" }}>Transaction Ref: {r.payment.transactionRef}</div>
        <div style={{ fontSize: 11, color: "#6B7280" }}>Paid: {formatReceiptDate(r.payment.paidAt)}</div>
      </div>

      {/* DELIVERY */}
      <div style={{ padding: "16px 32px", borderTop: "1px solid #E5E7EB" }}>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "#6B7280", letterSpacing: "0.08em", marginBottom: 8 }}>Delivery Information</div>
        <div style={{ fontSize: 13, color: "#111827", fontWeight: 500 }}>{r.delivery.method}</div>
        <div style={{ fontSize: 12, color: "#374151", marginTop: 2 }}>{r.delivery.address}</div>
        <div style={{ fontSize: 12, color: "#111827", fontWeight: 600, marginTop: 4 }}>Estimated: {r.delivery.estimatedDate}</div>
        <div style={{ marginTop: 6, fontSize: 12, color: "#0EA5E9", display: "inline-flex", alignItems: "center", gap: 6 }}>
          <Package size={14} /> Tracking: {r.delivery.trackingRef}
        </div>
      </div>

      {/* PHARMACIST */}
      {r.pharmacist && (
        <div style={{ padding: "16px 32px", borderTop: "1px solid #E5E7EB", background: "#F5F3FF" }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "#6B7280", letterSpacing: "0.08em", marginBottom: 8 }}>Prescription Dispensed By</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <UserCheck size={16} color="#7C3AED" />
            <span style={{ fontWeight: 600, fontSize: 13 }}>{r.pharmacist.name}</span>
          </div>
          <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>MCAZ Registration: {r.pharmacist.sapcReg}</div>
          <div style={{ fontSize: 11, color: "#6B7280" }}>Approved: {formatReceiptDate(r.pharmacist.approvedAt)}</div>
          <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 8, fontStyle: "italic" }}>
            This prescription has been verified and dispensed by a registered Zimbabwean pharmacist in accordance with the Medicines and Allied Substances Control Act.
          </div>
        </div>
      )}

      {/* FOOTER */}
      <div style={{ background: "#0EA5E9", padding: "16px 32px", textAlign: "center", color: "#fff" }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>Thank you for choosing Kings Pharmacy</div>
        <div style={{ fontSize: 11, opacity: 0.85, marginTop: 2 }}>Your health is our priority</div>
        <div style={{ height: 1, background: "rgba(255,255,255,0.2)", margin: "10px 0" }} />
        <div style={{ fontSize: 10, opacity: 0.7 }}>This is a valid VAT invoice. Please retain for your records.</div>
        <div style={{ fontSize: 10, opacity: 0.7 }}>{r.business.website} | {r.business.phone} | {r.business.email}</div>
        <div style={{ fontSize: 9, opacity: 0.5, marginTop: 4 }}>© 2025 {r.business.name} | VAT Reg: {r.business.vatNumber}</div>
      </div>
    </div>
  );
});

function Line({ label, value, color, valueColor }: { label: string; value: string; color?: string; valueColor?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "3px 0" }}>
      <span style={{ color: color ?? "#374151" }}>{label}</span>
      <span style={{ color: valueColor ?? color ?? "#111827", fontWeight: 500 }}>{value}</span>
    </div>
  );
}