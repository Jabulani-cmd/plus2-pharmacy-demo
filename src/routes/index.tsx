import { createFileRoute, Link } from "@tanstack/react-router";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { FlashDeals } from "@/components/home/FlashDeals";
import { ProductCard } from "@/components/product/ProductCard";
import { PRODUCTS } from "@/data/products";
import { CATEGORIES, BRANDS, BLOG_POSTS } from "@/data/categories";
import { Truck, ShieldCheck, Clock, HeartPulse } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kings Pharmacy — Your Health, Our Priority" },
      { name: "description", content: "Shop pharmacy, beauty, baby, vitamins and more. Free delivery over US$30 across Zimbabwe." },
      { property: "og:title", content: "Kings Pharmacy" },
      { property: "og:description", content: "Zimbabwe's trusted pharmacy — quality healthcare for every family." },
    ],
  }),
  component: Home,
});

function Home() {
  const featured = PRODUCTS.filter((p) => p.featured);
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:py-8">
      <HeroCarousel />

      {/* Trust strip */}
      <section className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-[#E5E7EB] bg-[#E5E7EB] md:grid-cols-4">
        {[
          { Icon: Truck, t: "Free Delivery", s: "Within 10km on orders over $30" },
          { Icon: Clock, t: "Same-Day Delivery", s: "Available in Bulawayo" },
          { Icon: ShieldCheck, t: "Secure Checkout", s: "EcoCash, ZIG, USD Card" },
          { Icon: HeartPulse, t: "Registered Pharmacists", s: "Trusted health advice" },
        ].map(({ Icon, t, s }) => (
          <div key={t} className="flex items-center gap-3 bg-white p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#F0F9F4] text-primary">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-[#111827]">{t}</div>
              <div className="text-xs text-[#6B7280]">{s}</div>
            </div>
          </div>
        ))}
      </section>

      <section className="mt-12">
        <SectionHeader eyebrow="Browse" title="Shop by Category" />
        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-0">
          {CATEGORIES.map((c) => {
            const Icon = c.icon;
            return (
              <Link
                key={c.slug}
                to="/category/$slug"
                params={{ slug: c.slug }}
                className="group relative flex min-w-[180px] aspect-[5/3] overflow-hidden rounded-lg border border-[#E5E7EB] md:min-w-0"
              >
                <img src={c.image} alt={c.name} className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105" loading="lazy" />
                <div className="absolute inset-0 bg-black/55" />
                <div className="relative z-10 mt-auto flex w-full items-center gap-2 p-4 text-white">
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-semibold">{c.name}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <FlashDeals />

      <section className="mt-12">
        <SectionHeader eyebrow="Trending Now" title="Top Selling Products" right={<Link to="/category/$slug" params={{ slug: "all" }} className="text-sm font-semibold text-primary hover:underline">View all →</Link>} />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {featured.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      <section className="mt-12">
        <SectionHeader eyebrow="Brands We Stock" title="Featured Brands" />
        <div className="flex flex-wrap items-center gap-2">
          {BRANDS.map((b) => (
            <div key={b} className="rounded-md border border-[#E5E7EB] bg-white px-5 py-3 text-sm font-semibold tracking-wide text-[#6B7280] transition hover:border-primary hover:text-primary">{b}</div>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <SectionHeader eyebrow="Kings Wellness" title="Health Tips & Articles" />
        <div className="grid gap-4 md:grid-cols-3">
          {BLOG_POSTS.map((b) => (
            <article key={b.id} className="overflow-hidden rounded-lg border border-[#E5E7EB] bg-white transition hover:shadow-md">
              <img src={b.image} alt={b.title} className="h-44 w-full object-cover" loading="lazy" />
              <div className="p-5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">{b.category}</span>
                <h3 className="mt-2 font-semibold leading-snug text-[#111827]">{b.title}</h3>
                <p className="mt-2 text-xs text-[#6B7280]">{b.readTime}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function SectionHeader({ eyebrow, title, right }: { eyebrow: string; title: string; right?: React.ReactNode }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-primary">{eyebrow}</p>
        <h2 className="mt-1 text-xl font-bold tracking-tight text-[#111827] md:text-2xl">{title}</h2>
      </div>
      {right}
    </div>
  );
}