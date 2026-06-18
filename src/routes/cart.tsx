import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useShop, formatUSD } from "@/store/shop";
import { getProduct, PRODUCTS } from "@/data/products";
import { ProductCard } from "@/components/product/ProductCard";
import { Minus, Plus, Trash2, Tag, ShoppingBag } from "lucide-react";
import { FileText, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Cart — Kings Pharmacy" }] }),
  component: CartPage,
});

function CartPage() {
  const cart = useShop((s) => s.cart);
  const updateQty = useShop((s) => s.updateQty);
  const removeFromCart = useShop((s) => s.removeFromCart);
  const promoCode = useShop((s) => s.promoCode);
  const setPromoCode = useShop((s) => s.setPromoCode);
  const [code, setCode] = useState(promoCode);

  const items = cart.map((c) => ({ ...c, product: getProduct(c.id)! })).filter((i) => i.product);
  const hasRx = items.some((i) => i.product.isPrescription);
  const subtotal = items.reduce((sum, i) => sum + i.product.price * i.qty, 0);
  const discount = promoCode === "PLUS10" ? subtotal * 0.1 : 0;
  const delivery = subtotal >= 50 ? 0 : subtotal === 0 ? 0 : 5;
  const total = subtotal - discount + delivery;
  const upsell = PRODUCTS.filter((p) => !cart.some((c) => c.id === p.id)).slice(0, 4);

  const applyCode = () => {
    if (code.trim().toUpperCase() === "PLUS10") { setPromoCode("PLUS10"); toast.success("PLUS10 applied — 10% off"); }
    else { toast.error("Invalid promo code. Try PLUS10"); }
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground/30" />
        <h1 className="mt-4 text-2xl font-extrabold">Your cart is empty</h1>
        <p className="mt-2 text-muted-foreground">Looks like you haven't added anything yet.</p>
        <Link to="/" className="mt-6 inline-block rounded-md bg-primary px-6 py-3 font-bold text-primary-foreground hover:bg-primary-dark">Start Shopping →</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="text-2xl font-extrabold md:text-3xl">Your Cart ({items.length})</h1>
      {hasRx && (
        <div className="mt-4 flex items-start gap-3 rounded-md border border-[#FDE68A] bg-[#FEF3C7] p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#854D0E]" />
          <div className="flex-1">
            <div className="text-sm font-semibold text-[#854D0E]">Prescription required</div>
            <div className="text-xs text-[#854D0E]/90">This order contains prescription items. Please upload your valid script to proceed.</div>
          </div>
          <Link to="/prescriptions" className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-[#854D0E] px-3 py-2 text-xs font-semibold text-white hover:bg-[#713F0D]">
            <FileText className="h-3.5 w-3.5" /> Upload Now
          </Link>
        </div>
      )}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <ul className="space-y-3">
          {items.map((i) => (
            <li key={i.id} className="flex gap-4 rounded-xl border border-border bg-card p-4">
              <Link to="/product/$id" params={{ id: i.id }} className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-[#F9FAFB]">
                <img src={i.product.image} alt={i.product.name} className="h-full w-full object-contain p-2" loading="lazy" />
              </Link>
              <div className="flex flex-1 flex-col">
                <div className="text-[10px] font-bold uppercase text-muted-foreground">{i.product.brand}</div>
                <Link to="/product/$id" params={{ id: i.id }} className="font-semibold hover:text-primary">{i.product.name}</Link>
                <div className="mt-1 text-xs text-success">In stock</div>
                <div className="mt-auto flex items-end justify-between pt-2">
                  <div className="flex items-center gap-1 rounded-md border border-border">
                    <button onClick={() => updateQty(i.id, i.qty - 1)} className="p-1.5 hover:bg-muted"><Minus className="h-3 w-3" /></button>
                    <span className="w-8 text-center font-bold">{i.qty}</span>
                    <button onClick={() => updateQty(i.id, i.qty + 1)} className="p-1.5 hover:bg-muted"><Plus className="h-3 w-3" /></button>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-extrabold">{formatUSD(i.product.price * i.qty)}</div>
                    <button onClick={() => removeFromCart(i.id)} className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"><Trash2 className="h-3 w-3" /> Remove</button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="lg:sticky lg:top-32 lg:self-start">
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h3 className="text-lg font-extrabold">Order Summary</h3>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="font-semibold">{formatUSD(subtotal)}</span></div>
              {discount > 0 && <div className="flex justify-between text-success"><span>Discount (PLUS10)</span><span>− {formatUSD(discount)}</span></div>}
              <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span className="font-semibold">{delivery === 0 ? "FREE" : formatUSD(delivery)}</span></div>
            </div>
            <div className="mt-4 flex gap-2">
              <div className="relative flex-1">
                <Tag className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Promo code" className="w-full rounded-md border border-border bg-background py-2 pl-8 pr-2 text-sm" />
              </div>
              <button onClick={applyCode} className="rounded-md bg-foreground px-4 py-2 text-sm font-bold text-background hover:opacity-90">Apply</button>
            </div>
            <div className="mt-4 flex items-end justify-between border-t border-border pt-4">
              <span className="text-sm font-bold">Total</span>
              <span className="text-2xl font-extrabold">{formatUSD(total)}</span>
            </div>
            <Link to="/checkout" className="mt-4 block rounded-md bg-primary py-3 text-center font-bold text-primary-foreground hover:bg-primary-dark">Proceed to Checkout →</Link>
            <Link to="/" className="mt-2 block text-center text-sm text-primary hover:underline">Continue Shopping</Link>
          </div>
        </aside>
      </div>

      <section className="mt-12">
        <h2 className="mb-4 text-xl font-extrabold">You may also need</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {upsell.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>
    </div>
  );
}