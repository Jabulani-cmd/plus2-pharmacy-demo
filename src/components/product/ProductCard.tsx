import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Heart, ShoppingCart, Pill } from "lucide-react";
import { toast } from "sonner";
import type { Product } from "@/data/products";
import { useShop } from "@/store/shop";
import { useMoney } from "@/lib/currency";
import { useAuth } from "@/store/auth";
import { ProductImage } from "./ProductImage";
import { RatingStars } from "./RatingStars";

export function ProductCard({ product }: { product: Product }) {
  const addToCart = useShop((s) => s.addToCart);
  const toggleWishlist = useShop((s) => s.toggleWishlist);
  const wished = useShop((s) => s.wishlist.includes(product.id));
  const user = useAuth((s) => s.user);
  const money = useMoney();
  const navigate = useNavigate();
  const location = useRouterState({ select: (s) => s.location });

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-lg border border-[#E5E7EB] bg-white transition duration-200 hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
      <button
        onClick={(e) => { e.preventDefault(); toggleWishlist(product.id); toast.success(wished ? "Removed from wishlist" : "Added to wishlist"); }}
        className="absolute right-2 top-2 z-10 rounded-full bg-white p-1.5 shadow-sm transition hover:scale-105"
        aria-label="Toggle wishlist"
      >
        <Heart className={`h-4 w-4 ${wished ? "fill-[#DC2626] text-[#DC2626]" : "text-[#9CA3AF]"}`} />
      </button>
      <div className="absolute left-2 top-2 z-10 flex flex-col gap-1">
        {product.savePct && (
          <span className="rounded-[3px] bg-[#EA580C] px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">Save {product.savePct}%</span>
        )}
        {product.isPrescription && (
          <span className="inline-flex items-center gap-1 rounded-[3px] bg-[#FEF2F2] px-1.5 py-0.5 text-[10px] font-semibold text-[#DC2626]">
            <Pill className="h-2.5 w-2.5" /> Rx Required
          </span>
        )}
      </div>
      <Link to="/product/$id" params={{ id: product.id }} className="block">
        <ProductImage product={product} className="h-[220px] w-full" />
      </Link>
      <div className="flex flex-1 flex-col gap-1.5 border-t border-[#E5E7EB] p-4">
        <div className="text-[11px] font-medium uppercase tracking-[0.05em] text-[#6B7280]">{product.brand}</div>
        <Link to="/product/$id" params={{ id: product.id }} className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug text-[#111827] hover:text-primary">
          {product.name}
        </Link>
        <RatingStars rating={product.rating} reviews={product.reviewCount} />
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-base font-bold text-[#111827]">{money(product.price)}</span>
          {product.originalPrice && <span className="text-[13px] text-[#9CA3AF] line-through">{money(product.originalPrice)}</span>}
        </div>
        <button
          onClick={() => {
            if (!user) {
              toast.info("Please sign in to add items to your cart");
              navigate({ to: "/auth", search: { redirect: location.href } });
              return;
            }
            addToCart(product.id);
            toast.success("Added to cart");
          }}
          className="mt-2 flex h-9 items-center justify-center gap-1.5 rounded-md bg-primary text-[13px] font-semibold text-white transition hover:bg-primary-dark active:scale-[0.98]"
        >
          <ShoppingCart className="h-3.5 w-3.5" /> Add to Cart
        </button>
      </div>
    </div>
  );
}