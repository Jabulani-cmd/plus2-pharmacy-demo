import { createFileRoute, Link, notFound, useNavigate, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { getProduct, PRODUCTS } from "@/data/products";
import { ProductImage } from "@/components/product/ProductImage";
import { ProductCard } from "@/components/product/ProductCard";
import { RatingStars } from "@/components/product/RatingStars";
import { useShop, formatUSD } from "@/store/shop";
import { useAuth } from "@/store/auth";
import { useBranch } from "@/store/branch";
import { getBranch, getStockByBranch, getBranchStock } from "@/data/branches";
import { Heart, Minus, Plus, ShoppingCart, ChevronRight, CheckCircle2, AlertTriangle, FileText, MapPin, XCircle } from "lucide-react";

export const Route = createFileRoute("/product/$id")({
  loader: ({ params }) => {
    const p = getProduct(params.id);
    if (!p) throw notFound();
    return p;
  },
  head: ({ loaderData }) => ({
    meta: loaderData ? [
      { title: `${loaderData.name} — Kings Pharmacy` },
      { name: "description", content: loaderData.shortDesc },
    ] : [],
  }),
  notFoundComponent: () => <div className="p-12 text-center">Product not found</div>,
  component: ProductPage,
});

function ProductPage() {
  const product = Route.useLoaderData();
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState<"desc" | "ingredients" | "use" | "reviews">("desc");
  const addToCart = useShop((s) => s.addToCart);
  const toggleWishlist = useShop((s) => s.toggleWishlist);
  const wished = useShop((s) => s.wishlist.includes(product.id));
  const user = useAuth((s) => s.user);
  const branchId = useBranch((s) => s.selectedBranchId);
  const branch = getBranch(branchId);
  const branchStock = getBranchStock(product, branchId);
  const stockByBranch = getStockByBranch(product);
  const navigate = useNavigate();
  const location = useRouterState({ select: (s) => s.location });
  const related = PRODUCTS.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <nav className="mb-4 flex items-center gap-1 text-xs text-muted-foreground">
        <Link to="/" className="hover:text-primary">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <Link to="/category/$slug" params={{ slug: product.category }} className="capitalize hover:text-primary">{product.category}</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="line-clamp-1 text-foreground">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <ProductImage product={product} className="aspect-square w-full rounded-2xl" />
          <div className="mt-3 grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-square cursor-pointer overflow-hidden rounded-lg border-2 border-border opacity-70 transition hover:border-primary hover:opacity-100" style={{ background: product.bg }}>
                <div className="flex h-full items-center justify-center text-2xl">{product.emoji}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-primary">{product.brand}</div>
          <h1 className="mt-1 text-2xl font-extrabold md:text-3xl">{product.name}</h1>
          <div className="mt-2 flex items-center gap-3">
            <RatingStars rating={product.rating} reviews={product.reviewCount} size="md" />
            <span className="text-xs text-muted-foreground">SKU: {product.id.toUpperCase()}-001</span>
          </div>

          <div className="mt-5 flex items-baseline gap-3">
            <span className="text-4xl font-extrabold text-foreground">{formatUSD(product.price)}</span>
            {product.originalPrice && (
              <>
                <span className="text-lg text-muted-foreground line-through">{formatUSD(product.originalPrice)}</span>
                <span className="rounded-md bg-accent px-2 py-1 text-xs font-bold text-accent-foreground">SAVE {product.savePct}%</span>
              </>
            )}
          </div>

          <div className="mt-4">
            {branchStock === "in" && <span className="inline-flex items-center gap-1 text-sm font-semibold text-success"><CheckCircle2 className="h-4 w-4" /> In stock at {branch.shortName}</span>}
            {branchStock === "low" && <span className="inline-flex items-center gap-1 text-sm font-semibold text-warning"><AlertTriangle className="h-4 w-4" /> Low stock at {branch.shortName} — order soon</span>}
            {branchStock === "out" && <span className="inline-flex items-center gap-1 text-sm font-semibold text-destructive"><XCircle className="h-4 w-4" /> Out of stock at {branch.shortName}</span>}
          </div>

          <div className="mt-4 rounded-lg border border-border bg-muted/40 p-3">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 text-primary" /> Availability across Bulawayo branches
            </div>
            <ul className="grid gap-1.5 sm:grid-cols-2">
              {stockByBranch.map(({ branch: b, status }) => (
                <li key={b.id} className="flex items-center justify-between rounded-md bg-white px-2.5 py-1.5 text-xs">
                  <span className="font-medium text-foreground">{b.shortName}</span>
                  {status === "in" && <span className="inline-flex items-center gap-1 font-semibold text-success"><CheckCircle2 className="h-3.5 w-3.5" /> In stock</span>}
                  {status === "low" && <span className="inline-flex items-center gap-1 font-semibold text-warning"><AlertTriangle className="h-3.5 w-3.5" /> Low</span>}
                  {status === "out" && <span className="inline-flex items-center gap-1 font-semibold text-destructive"><XCircle className="h-3.5 w-3.5" /> Out</span>}
                </li>
              ))}
            </ul>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">{product.shortDesc}</p>

          <div className="mt-6 flex items-center gap-3">
            <div className="flex items-center rounded-md border border-border">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="p-3 hover:bg-muted"><Minus className="h-4 w-4" /></button>
              <span className="w-10 text-center font-bold">{qty}</span>
              <button onClick={() => setQty(qty + 1)} className="p-3 hover:bg-muted"><Plus className="h-4 w-4" /></button>
            </div>
            <button
              onClick={() => {
                if (!user) {
                  toast.info("Please sign in to add items to your cart");
                  navigate({ to: "/auth", search: { redirect: location.href } });
                  return;
                }
                addToCart(product.id, qty);
                toast.success(`Added ${qty} × ${product.brand}`);
              }}
              className="flex flex-1 items-center justify-center gap-2 rounded-md bg-primary py-3 font-bold text-primary-foreground transition hover:bg-primary-dark"
            >
              <ShoppingCart className="h-4 w-4" /> Add to Cart
            </button>
          </div>
          <div className="mt-3 flex gap-3">
            <button onClick={() => { toggleWishlist(product.id); toast.success(wished ? "Removed from wishlist" : "Added to wishlist"); }} className="flex flex-1 items-center justify-center gap-2 rounded-md border border-border py-3 text-sm font-bold hover:bg-muted">
              <Heart className={`h-4 w-4 ${wished ? "fill-accent text-accent" : ""}`} /> Wishlist
            </button>
            <button className="flex flex-1 items-center justify-center gap-2 rounded-md border border-border py-3 text-sm font-bold hover:bg-muted">
              <FileText className="h-4 w-4" /> Schedule Repeat
            </button>
          </div>

          <div className="mt-8">
            <div className="flex gap-1 border-b border-border">
              {([["desc", "Description"], ["ingredients", "Ingredients"], ["use", "How to Use"], ["reviews", "Reviews"]] as const).map(([k, label]) => (
                <button key={k} onClick={() => setTab(k)} className={`px-4 py-2 text-sm font-semibold transition ${tab === k ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"}`}>{label}</button>
              ))}
            </div>
            <div className="py-4 text-sm text-foreground/80">
              {tab === "desc" && <p>{product.longDesc}</p>}
              {tab === "ingredients" && <p>{product.ingredients}</p>}
              {tab === "use" && <p>{product.howToUse}</p>}
              {tab === "reviews" && <p>{product.rating.toFixed(1)} / 5 from {product.reviewCount} verified customers. "Excellent product, fast delivery, will buy again!" — Verified buyer</p>}
            </div>
          </div>
        </div>
      </div>

      {product.isPrescription && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#E5E7EB] bg-white p-3 shadow-lg md:hidden">
          <Link to="/prescriptions" className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-primary-dark">
            <FileText className="h-4 w-4" /> Upload Script for This Item
          </Link>
        </div>
      )}

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-xl font-extrabold">Customers Also Viewed</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}