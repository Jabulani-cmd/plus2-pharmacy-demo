import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { useMemo, useState } from "react";
import { PRODUCTS } from "@/data/products";
import { CATEGORIES, BRANDS } from "@/data/categories";
import { ProductCard } from "@/components/product/ProductCard";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { SlidersHorizontal, ChevronRight } from "lucide-react";

const searchSchema = z.object({ q: z.string().optional().catch("") });

export const Route = createFileRoute("/category/$slug")({
  validateSearch: searchSchema,
  head: ({ params }) => ({
    meta: [
      { title: `${(CATEGORIES.find((c) => c.slug === params.slug)?.name) ?? "Shop"} — Kings Pharmacy` },
      { name: "description", content: "Browse quality products from Zimbabwe's trusted pharmacy." },
    ],
  }),
  component: CategoryPage,
});

function CategoryPage() {
  const { slug } = Route.useParams();
  const { q = "" } = Route.useSearch();
  const cat = CATEGORIES.find((c) => c.slug === slug);
  const title = slug === "all" ? "All Products" : slug === "deals" ? "Hot Deals" : cat?.name ?? "Shop";

  const [brand, setBrand] = useState<string | null>(null);
  const [maxPrice, setMaxPrice] = useState(700);
  const [onPromo, setOnPromo] = useState(slug === "deals");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sort, setSort] = useState("popular");

  const products = useMemo(() => {
    let p = [...PRODUCTS];
    if (slug !== "all" && slug !== "deals" && cat) p = p.filter((x) => x.category === slug);
    if (slug === "deals") p = p.filter((x) => x.savePct);
    if (q) p = p.filter((x) => x.name.toLowerCase().includes(q.toLowerCase()) || x.brand.toLowerCase().includes(q.toLowerCase()));
    if (brand) p = p.filter((x) => x.brand === brand);
    if (onPromo) p = p.filter((x) => x.savePct);
    if (inStockOnly) p = p.filter((x) => x.stock !== "out");
    p = p.filter((x) => x.price <= maxPrice);
    if (sort === "price-asc") p.sort((a, b) => a.price - b.price);
    else if (sort === "price-desc") p.sort((a, b) => b.price - a.price);
    else if (sort === "rating") p.sort((a, b) => b.rating - a.rating);
    return p;
  }, [slug, q, brand, onPromo, inStockOnly, maxPrice, sort, cat]);

  const filters = (
    <div className="space-y-6">
      <div>
        <h4 className="mb-2 text-sm font-bold">Brand</h4>
        <div className="space-y-1.5">
          <button onClick={() => setBrand(null)} className={`block w-full rounded-md px-2 py-1.5 text-left text-sm ${!brand ? "bg-primary/10 font-bold text-primary" : "hover:bg-muted"}`}>All brands</button>
          {BRANDS.map((b) => (
            <button key={b} onClick={() => setBrand(b)} className={`block w-full rounded-md px-2 py-1.5 text-left text-sm ${brand === b ? "bg-primary/10 font-bold text-primary" : "hover:bg-muted"}`}>{b}</button>
          ))}
        </div>
      </div>
      <div>
        <h4 className="mb-2 text-sm font-bold">Max Price: US${maxPrice}</h4>
        <input type="range" min={50} max={700} value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} className="w-full accent-[var(--color-primary)]" />
      </div>
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={onPromo} onChange={(e) => setOnPromo(e.target.checked)} className="accent-[var(--color-primary)]" /> On Promotion</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={inStockOnly} onChange={(e) => setInStockOnly(e.target.checked)} className="accent-[var(--color-primary)]" /> In stock only</label>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <nav className="mb-3 flex items-center gap-1 text-xs text-muted-foreground">
        <Link to="/" className="hover:text-primary">Home</Link><ChevronRight className="h-3 w-3" /><span className="text-foreground">{title}</span>
      </nav>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold md:text-3xl">{title}</h1>
          <p className="text-sm text-muted-foreground">Showing {products.length} of {PRODUCTS.length} products{q && ` for "${q}"`}</p>
        </div>
        <div className="flex items-center gap-2">
          <Sheet>
            <SheetTrigger className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-semibold lg:hidden">
              <SlidersHorizontal className="h-4 w-4" /> Filters
            </SheetTrigger>
            <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto">
              <SheetHeader><SheetTitle>Filters</SheetTitle></SheetHeader>
              <div className="mt-4">{filters}</div>
            </SheetContent>
          </Sheet>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="rounded-md border border-border bg-card px-3 py-2 text-sm font-semibold">
            <option value="popular">Best Sellers</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="rating">Top Rated</option>
          </select>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="hidden rounded-xl border border-border bg-card p-5 lg:block">{filters}</aside>
        <div>
          {products.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">No products match your filters.</div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}