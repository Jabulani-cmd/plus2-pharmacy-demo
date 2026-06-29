import { Link } from "@tanstack/react-router";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useShop } from "@/store/shop";
import { useMoney } from "@/lib/currency";
import { getProduct } from "@/data/products";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";

export function CartDrawer({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const cart = useShop((s) => s.cart);
  const updateQty = useShop((s) => s.updateQty);
  const removeFromCart = useShop((s) => s.removeFromCart);
  const money = useMoney();

  const items = cart.map((c) => ({ ...c, product: getProduct(c.id)! })).filter((i) => i.product);
  const subtotal = items.reduce((sum, i) => sum + i.product.price * i.qty, 0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border p-4 text-left">
          <SheetTitle className="flex items-center gap-2"><ShoppingBag className="h-5 w-5 text-primary" /> Your Cart ({items.length})</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center text-muted-foreground">
              <ShoppingBag className="mb-4 h-12 w-12 opacity-30" />
              <p className="font-medium">Your cart is empty</p>
              <p className="mt-1 text-sm">Add some products to get started</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((i) => (
                <li key={i.id} className="flex gap-3 p-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-[#F9FAFB]">
                    <img src={i.product.image} alt={i.product.name} className="h-full w-full object-contain p-1.5" loading="lazy" />
                  </div>
                  <div className="flex flex-1 flex-col">
                    <div className="text-[10px] font-bold uppercase text-muted-foreground">{i.product.brand}</div>
                    <div className="line-clamp-2 text-sm font-semibold">{i.product.name}</div>
                    <div className="mt-1 flex items-center justify-between">
                      <div className="flex items-center gap-1 rounded-md border border-border">
                        <button onClick={() => updateQty(i.id, i.qty - 1)} className="p-1 hover:bg-muted"><Minus className="h-3 w-3" /></button>
                        <span className="w-6 text-center text-sm font-bold">{i.qty}</span>
                        <button onClick={() => updateQty(i.id, i.qty + 1)} className="p-1 hover:bg-muted"><Plus className="h-3 w-3" /></button>
                      </div>
                      <span className="text-sm font-extrabold">{money(i.product.price * i.qty)}</span>
                    </div>
                  </div>
                  <button onClick={() => removeFromCart(i.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {items.length > 0 && (
          <div className="border-t border-border p-4">
            <div className="mb-3 flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span className="font-bold">{money(subtotal)}</span></div>
            {subtotal < 500 && <div className="mb-3 rounded-md bg-secondary px-3 py-2 text-xs font-medium text-primary-dark">Add {money(500 - subtotal)} more for FREE delivery</div>}
            <Link to="/cart" onClick={() => onOpenChange(false)} className="mb-2 block rounded-md border border-border py-2.5 text-center text-sm font-bold hover:bg-muted">View Cart</Link>
            <Link to="/checkout" onClick={() => onOpenChange(false)} className="block rounded-md bg-primary py-2.5 text-center text-sm font-bold text-primary-foreground hover:bg-primary-dark">Checkout</Link>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}