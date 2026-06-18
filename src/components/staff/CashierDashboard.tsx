import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader, KPI, Card, fmtUSD } from "./shared";
import { STAFF_INVENTORY, SALES_HOURLY, todaysTotals } from "@/data/staffDemo";
import { ShoppingCart, DollarSign, Search, Plus, Minus, Trash2, CreditCard, Banknote, Smartphone } from "lucide-react";

type CartLine = { sku: string; name: string; price: number; qty: number };

export function CashierDashboard({ view }: { view?: string }) {
  if (view === "sales") return <SalesView />;
  if (view === "orders") return <OrdersView />;
  return <POSView />;
}

function POSView() {
  const [q, setQ] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [paid, setPaid] = useState<number | null>(null);

  const results = useMemo(() => {
    if (!q.trim()) return STAFF_INVENTORY.slice(0, 8);
    const t = q.toLowerCase();
    return STAFF_INVENTORY.filter((i) => i.name.toLowerCase().includes(t) || i.sku.toLowerCase().includes(t)).slice(0, 10);
  }, [q]);

  const add = (sku: string) => {
    const item = STAFF_INVENTORY.find((i) => i.sku === sku); if (!item) return;
    setCart((p) => {
      const ex = p.find((l) => l.sku === sku);
      return ex ? p.map((l) => l.sku === sku ? { ...l, qty: l.qty + 1 } : l) : [...p, { sku, name: item.name, price: item.sellingPrice, qty: 1 }];
    });
  };
  const setQty = (sku: string, qty: number) => setCart((p) => qty <= 0 ? p.filter((l) => l.sku !== sku) : p.map((l) => l.sku === sku ? { ...l, qty } : l));

  const subtotal = cart.reduce((a, l) => a + l.price * l.qty, 0);
  const vat = subtotal * 0.145;
  const total = subtotal + vat;

  const checkout = (method: string) => {
    if (cart.length === 0) return toast.error("Cart is empty");
    toast.success(`Sale complete · ${method} · ${fmtUSD(total)}`);
    setPaid(total); setCart([]); setQ("");
    setTimeout(() => setPaid(null), 2500);
  };

  return (
    <div>
      <PageHeader title="Point of Sale" subtitle="Walk-in counter · Bulawayo CBD" />
      {paid !== null && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
          <DollarSign className="h-5 w-5" />
          <div className="flex-1"><div className="font-bold">Sale complete</div><div className="text-sm">{fmtUSD(paid)} processed</div></div>
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        <Card>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Scan barcode or search by name / SKU…"
              className="w-full rounded-md border border-input bg-background py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <ul className="mt-3 divide-y divide-border">
            {results.map((i) => (
              <li key={i.sku} className="flex items-center justify-between py-2">
                <div>
                  <div className="text-sm font-semibold">{i.name}</div>
                  <div className="text-[11px] text-muted-foreground">{i.sku} · {i.onHand} in stock</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold">{fmtUSD(i.sellingPrice)}</span>
                  <button onClick={() => add(i.sku)} className="rounded bg-primary px-3 py-1 text-xs font-bold text-primary-foreground hover:bg-primary-dark">Add</button>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <div className="rounded-xl border border-border bg-white shadow-sm">
          <header className="flex items-center gap-2 border-b border-border px-5 py-3">
            <ShoppingCart className="h-4 w-4" /><h3 className="text-sm font-bold">Current sale</h3>
            <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold">{cart.length}</span>
          </header>
          <div className="max-h-72 overflow-y-auto p-3">
            {cart.length === 0 ? <p className="py-6 text-center text-xs text-muted-foreground">Cart is empty</p> : (
              <ul className="space-y-2">
                {cart.map((l) => (
                  <li key={l.sku} className="rounded border border-border p-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1 text-xs font-semibold">{l.name}</div>
                      <button onClick={() => setQty(l.sku, 0)} className="text-red-500 hover:text-red-700"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setQty(l.sku, l.qty - 1)} className="rounded border border-border p-1"><Minus className="h-3 w-3" /></button>
                        <span className="w-6 text-center text-xs font-bold">{l.qty}</span>
                        <button onClick={() => setQty(l.sku, l.qty + 1)} className="rounded border border-border p-1"><Plus className="h-3 w-3" /></button>
                      </div>
                      <span className="text-xs font-bold">{fmtUSD(l.price * l.qty)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="border-t border-border p-4 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{fmtUSD(subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">VAT 14.5%</span><span>{fmtUSD(vat)}</span></div>
            <div className="mt-2 flex justify-between border-t border-border pt-2 text-base font-extrabold"><span>Total</span><span>{fmtUSD(total)}</span></div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <button onClick={() => checkout("Cash")} className="flex flex-col items-center rounded bg-emerald-600 p-2 text-[11px] font-bold text-white"><Banknote className="h-4 w-4" /> Cash</button>
              <button onClick={() => checkout("Card")} className="flex flex-col items-center rounded bg-primary p-2 text-[11px] font-bold text-primary-foreground"><CreditCard className="h-4 w-4" /> Card</button>
              <button onClick={() => checkout("EcoCash")} className="flex flex-col items-center rounded bg-amber-500 p-2 text-[11px] font-bold text-white"><Smartphone className="h-4 w-4" /> EcoCash</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SalesView() {
  const totals = todaysTotals();
  return (
    <div>
      <PageHeader title="Today's Sales" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <KPI label="Revenue" value={fmtUSD(totals.sales)} accent="#0EA5E9" />
        <KPI label="Orders" value={String(totals.orders)} accent="#0EA5E9" />
        <KPI label="Average" value={fmtUSD(totals.avg)} accent="#7C3AED" />
      </div>
      <div className="mt-6">
        <Card title="Hour by hour">
          <ul className="space-y-1.5 text-sm">
            {SALES_HOURLY.map((h) => (
              <li key={h.hour} className="flex items-center gap-3">
                <span className="w-12 text-xs font-bold text-muted-foreground">{h.hour}</span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${(h.sales / 1240) * 100}%` }} />
                </div>
                <span className="w-20 text-right text-xs font-bold">{fmtUSD(h.sales)}</span>
                <span className="w-10 text-right text-[10px] text-muted-foreground">{h.orders} ord</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function OrdersView() {
  return (
    <div>
      <PageHeader title="Online orders pending pickup" />
      <Card>
        <p className="py-6 text-center text-sm text-muted-foreground">No pickup orders waiting at the counter.</p>
      </Card>
    </div>
  );
}