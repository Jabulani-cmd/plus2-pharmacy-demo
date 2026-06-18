import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader, KPI, Card, StatusPill, fmtUSD } from "./shared";
import { STAFF_INVENTORY, STAFF_PURCHASE_ORDERS, type StaffInventoryItem, type StaffPurchaseOrder } from "@/data/staffDemo";
import { Boxes, AlertTriangle, DollarSign, Plus, X, ClipboardCheck, Truck } from "lucide-react";

export function InventoryDashboard({ view }: { view?: string }) {
  if (view === "pos") return <POView />;
  if (view === "stocktake") return <StockTakeView />;
  return <StockView />;
}

function StockView() {
  const low = STAFF_INVENTORY.filter((i) => i.onHand <= i.reorderLevel);
  const value = STAFF_INVENTORY.reduce((a, i) => a + i.onHand * i.costPrice, 0);
  return (
    <div>
      <PageHeader title="Stock on Hand" subtitle="Bulawayo CBD branch" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <KPI label="Total SKUs" value={String(STAFF_INVENTORY.length)} accent="#0EA5E9" icon={<Boxes className="h-5 w-5" />} />
        <KPI label="Below reorder" value={String(low.length)} accent="#DC2626" icon={<AlertTriangle className="h-5 w-5" />} />
        <KPI label="Stock value (cost)" value={fmtUSD(value)} accent="#0EA5E9" icon={<DollarSign className="h-5 w-5" />} />
      </div>
      <div className="mt-6">
        <Card title="Items requiring action" action={<span className="text-xs text-muted-foreground">Click ‘Order’ to draft a PO</span>}>
          <table className="w-full text-sm">
            <thead className="text-left text-[10px] uppercase tracking-wider text-muted-foreground">
              <tr><th className="py-2">SKU</th><th>Item</th><th className="text-right">On hand</th><th className="text-right">Reorder at</th><th>Supplier</th><th className="text-right">Action</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {low.map((i) => (
                <tr key={i.sku} className="bg-red-50/40">
                  <td className="py-2 font-mono text-[11px]">{i.sku}</td>
                  <td className="font-semibold">{i.name}{i.isScheduled && <span className="ml-1 rounded bg-red-100 px-1 text-[9px] font-bold text-red-700">SCHED</span>}</td>
                  <td className="text-right font-bold text-red-700">{i.onHand}</td>
                  <td className="text-right text-xs">{i.reorderLevel}</td>
                  <td className="text-xs">{i.supplier}</td>
                  <td className="text-right"><button onClick={() => toast.success(`Draft PO created for ${i.name}`)} className="rounded bg-primary px-2 py-1 text-[10px] font-bold text-primary-foreground">Order</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
      <div className="mt-6">
        <Card title="All inventory">
          <table className="w-full text-sm">
            <thead className="text-left text-[10px] uppercase tracking-wider text-muted-foreground">
              <tr><th className="py-2">SKU</th><th>Item</th><th>Expiry</th><th className="text-right">On hand</th><th className="text-right">Cost</th><th className="text-right">Sell</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {STAFF_INVENTORY.map((i) => (
                <tr key={i.sku}>
                  <td className="py-2 font-mono text-[11px]">{i.sku}</td>
                  <td>{i.name}</td>
                  <td className="text-xs">{i.expiry}</td>
                  <td className="text-right font-bold">{i.onHand}</td>
                  <td className="text-right text-xs">{fmtUSD(i.costPrice)}</td>
                  <td className="text-right">{fmtUSD(i.sellingPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}

function POView() {
  const [pos, setPos] = useState<StaffPurchaseOrder[]>(STAFF_PURCHASE_ORDERS);
  const [creating, setCreating] = useState(false);

  const receive = (id: string) => {
    setPos((p) => p.map((o) => o.id === id ? { ...o, status: "Received" } : o));
    toast.success("PO marked as received — stock updated");
  };

  return (
    <div>
      <PageHeader
        title="Purchase Orders"
        subtitle="Drafts, in-flight & received"
        actions={<button onClick={() => setCreating(true)} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-bold text-primary-foreground"><Plus className="h-3.5 w-3.5" /> New PO</button>}
      />
      <div className="space-y-4">
        {pos.map((po) => (
          <Card key={po.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2"><h4 className="font-bold">{po.id}</h4><StatusPill status={po.status} /></div>
                <div className="text-xs text-muted-foreground">{po.supplier} · created {po.createdAt} · expected {po.expectedAt}</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-extrabold text-primary">{fmtUSD(po.total)}</div>
                {po.status !== "Received" && (
                  <button onClick={() => receive(po.id)} className="mt-1 inline-flex items-center gap-1 rounded bg-emerald-600 px-2 py-1 text-[10px] font-bold text-white"><ClipboardCheck className="h-3 w-3" /> Mark received</button>
                )}
              </div>
            </div>
            <ul className="mt-3 divide-y divide-border text-sm">
              {po.items.map((it) => (
                <li key={it.sku} className="flex items-center justify-between py-2">
                  <span>{it.name} <span className="text-[11px] text-muted-foreground">({it.sku})</span></span>
                  <span className="text-xs">{it.qty} × {fmtUSD(it.unitCost)} = <span className="font-bold">{fmtUSD(it.qty * it.unitCost)}</span></span>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
      {creating && <NewPOModal items={STAFF_INVENTORY} onClose={() => setCreating(false)} onCreate={(po) => { setPos((p) => [po, ...p]); setCreating(false); toast.success(`PO ${po.id} drafted`); }} />}
    </div>
  );
}

function NewPOModal({ items, onClose, onCreate }: { items: StaffInventoryItem[]; onClose: () => void; onCreate: (po: StaffPurchaseOrder) => void }) {
  const lowItems = items.filter((i) => i.onHand <= i.reorderLevel);
  const [supplier, setSupplier] = useState(lowItems[0]?.supplier ?? "");
  const [selected, setSelected] = useState<Record<string, number>>(() => Object.fromEntries(lowItems.map((i) => [i.sku, Math.max(i.reorderLevel * 2 - i.onHand, 20)])));
  const supplierItems = items.filter((i) => i.supplier === supplier);
  const total = useMemo(() => supplierItems.reduce((a, i) => a + (selected[i.sku] ?? 0) * i.costPrice, 0), [selected, supplierItems]);
  const suppliers = Array.from(new Set(items.map((i) => i.supplier))).sort();

  const create = () => {
    const lines = supplierItems.filter((i) => (selected[i.sku] ?? 0) > 0).map((i) => ({ sku: i.sku, name: i.name, qty: selected[i.sku], unitCost: i.costPrice }));
    if (lines.length === 0) return toast.error("Select at least one item");
    onCreate({
      id: "PO-2026-0" + Math.floor(120 + Math.random() * 80),
      supplier, items: lines, total, status: "Draft", createdAt: "Just now", expectedAt: "TBC",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-white px-5 py-3">
          <div><h2 className="text-sm font-extrabold">New Purchase Order</h2><p className="text-xs text-muted-foreground">Select supplier and quantities</p></div>
          <button onClick={onClose} className="rounded p-1.5 hover:bg-muted"><X className="h-4 w-4" /></button>
        </header>
        <div className="p-5">
          <label className="block">
            <span className="block text-xs font-bold uppercase tracking-wide text-muted-foreground">Supplier</span>
            <select value={supplier} onChange={(e) => setSupplier(e.target.value)} className="mt-1 w-full rounded-md border border-input bg-background py-2 px-3 text-sm">
              {suppliers.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <ul className="mt-4 divide-y divide-border">
            {supplierItems.map((i) => (
              <li key={i.sku} className="flex items-center gap-3 py-2">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold">{i.name}</div>
                  <div className="text-[11px] text-muted-foreground">On hand {i.onHand} · reorder at {i.reorderLevel} · cost {fmtUSD(i.costPrice)}</div>
                </div>
                <input type="number" min={0} value={selected[i.sku] ?? 0} onChange={(e) => setSelected({ ...selected, [i.sku]: Number(e.target.value) || 0 })} className="w-20 rounded-md border border-input px-2 py-1 text-right text-sm" />
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
            <div className="text-sm text-muted-foreground">PO total</div>
            <div className="text-xl font-extrabold text-primary">{fmtUSD(total)}</div>
          </div>
          <button onClick={create} className="mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-primary py-3 text-sm font-bold text-primary-foreground hover:bg-primary-dark"><Truck className="h-4 w-4" /> Create draft PO</button>
        </div>
      </div>
    </div>
  );
}

function StockTakeView() {
  return (
    <div>
      <PageHeader title="Stock Take" subtitle="Monthly count — June 2026" />
      <Card>
        <p className="text-sm text-muted-foreground">Last full count: <span className="font-semibold text-foreground">31 May 2026</span> — variance recorded: <span className="font-bold text-amber-600">−$148.20</span></p>
        <button className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-bold text-primary-foreground"><ClipboardCheck className="h-4 w-4" /> Start new count</button>
      </Card>
    </div>
  );
}