import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Search, Heart, ShoppingCart, User, Menu, MapPin, Phone, HelpCircle, Truck, FileText } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "./Logo";
import { useShop } from "@/store/shop";
import { useAuth } from "@/store/auth";
import { CATEGORIES } from "@/data/categories";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { BranchSelector } from "./BranchSelector";
import { getBranch } from "@/data/branches";
import { useBranch } from "@/store/branch";
import { NotificationsBell } from "./NotificationsBell";

export function Navbar() {
  const cart = useShop((s) => s.cart);
  const wishlist = useShop((s) => s.wishlist);
  const user = useAuth((s) => s.user);
  const branchId = useBranch((s) => s.selectedBranchId);
  const branch = getBranch(branchId);
  const cartCount = cart.reduce((a, c) => a + c.qty, 0);
  const [q, setQ] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: "/category/$slug", params: { slug: "all" }, search: { q } });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[#E5E7EB] bg-white">
      {/* Utility top bar */}
      <div className="hidden bg-[#F9FAFB] text-[#374151] md:block border-b border-[#E5E7EB]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 text-[12px]">
          <div className="flex items-center gap-5">
            <BranchSelector />
            <span className="flex items-center gap-1.5"><Truck className="h-3.5 w-3.5" /> Free delivery within 10km on orders over $30</span>
            <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {branch.phone}</span>
          </div>
          <div className="flex items-center gap-5">
            <Link to="/services" className="hover:text-primary">Pharmacy Services</Link>
            <Link to="/prescriptions" className="flex items-center gap-1 hover:text-primary"><FileText className="h-3.5 w-3.5" /> Upload Script</Link>
            <a href="#" className="flex items-center gap-1 hover:text-primary"><HelpCircle className="h-3.5 w-3.5" /> Help</a>
            <Link to="/track" className="hover:text-primary">Track Order</Link>
            <Link to={user ? "/account" : "/auth"} className="font-semibold hover:text-primary">{user ? `Hi, ${user.firstName}` : "Sign In / Register"}</Link>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger className="md:hidden -ml-1 rounded-md p-2 hover:bg-[#F0F9F4] active:bg-[#E5F4EC]" aria-label="Open menu">
            <Menu className="h-6 w-6" />
          </SheetTrigger>
          <SheetContent side="left" className="w-[85vw] max-w-sm overflow-y-auto p-4">
            <div className="mt-6 flex flex-col gap-1">
              <div className="mb-3">
                <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Your branch</div>
                <BranchSelector variant="full" />
              </div>
              {CATEGORIES.map((c) => {
                const Icon = c.icon;
                return (
                  <Link key={c.slug} to="/category/$slug" params={{ slug: c.slug }} onClick={() => setMenuOpen(false)} className="flex items-center gap-3 rounded-md px-3 py-3 text-sm font-medium text-[#374151] hover:bg-[#F0F9F4] hover:text-primary active:bg-[#E5F4EC]">
                    <Icon className="h-4 w-4" /> {c.name}
                  </Link>
                );
              })}
              <div className="my-2 border-t border-[#E5E7EB]" />
              <Link to="/prescriptions" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 rounded-md px-3 py-3 text-sm font-medium text-[#374151] hover:bg-[#F0F9F4] active:bg-[#E5F4EC]"><FileText className="h-4 w-4" /> Upload Prescription</Link>
              <Link to="/track" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 rounded-md px-3 py-3 text-sm font-medium text-[#374151] hover:bg-[#F0F9F4] active:bg-[#E5F4EC]"><Truck className="h-4 w-4" /> Track Order</Link>
              <Link to="/services" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 rounded-md px-3 py-3 text-sm font-medium text-[#374151] hover:bg-[#F0F9F4] active:bg-[#E5F4EC]"><HelpCircle className="h-4 w-4" /> Pharmacy Services</Link>
              <Link to={user ? "/account" : "/auth"} onClick={() => setMenuOpen(false)} className="flex items-center gap-3 rounded-md px-3 py-3 text-sm font-medium text-[#374151] hover:bg-[#F0F9F4] active:bg-[#E5F4EC]"><User className="h-4 w-4" /> {user ? "My Account" : "Sign In / Register"}</Link>
            </div>
          </SheetContent>
        </Sheet>

        <Logo />
        <span className="hidden rounded-full bg-[#F3F4F6] px-2 py-0.5 text-[11px] font-semibold text-[#6B7280] md:inline-block">DEMO</span>

        <form onSubmit={submit} className="ml-4 hidden flex-1 md:flex">
          <div className="flex w-full max-w-3xl overflow-hidden rounded-md border border-[#D1D5DB] bg-white focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search products, brands, conditions..."
              className="w-full bg-white px-4 py-2.5 text-sm outline-none placeholder:text-[#9CA3AF]"
            />
            <button type="submit" aria-label="Search" className="flex items-center justify-center bg-primary px-5 text-white transition hover:bg-primary-dark">
              <Search className="h-5 w-5" />
            </button>
          </div>
        </form>

        <div className="ml-auto flex items-center gap-2">
          {user && (
            <NotificationsBell audience="customer" userId={user.id ?? user.email} />
          )}
          <Link to={user ? "/account" : "/auth"} className="hidden items-center gap-2 rounded-md px-3 py-2 text-left text-xs hover:bg-[#F0F9F4] lg:flex">
            <User className="h-5 w-5 text-[#374151]" />
            <span className="leading-tight">
              <span className="block text-[11px] text-[#6B7280]">{user ? `Hi, ${user.firstName}` : "Hello, Guest"}</span>
              <span className="block text-sm font-semibold text-[#111827]">{user ? "My Account" : "Sign in"}</span>
            </span>
          </Link>
          <Link to="/account" className="relative hidden items-center justify-center rounded-md p-2 hover:bg-[#F0F9F4] sm:flex" aria-label="Wishlist">
            <Heart className="h-5 w-5 text-[#374151]" />
            {wishlist.length > 0 && (
              <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold text-white">{wishlist.length}</span>
            )}
          </Link>
          <button onClick={() => setCartOpen(true)} className="relative flex items-center justify-center rounded-md p-2 hover:bg-[#F0F9F4]" aria-label="Open cart">
            <ShoppingCart className="h-5 w-5 text-[#374151]" />
            <AnimatePresence>
              {cartCount > 0 && (
                <motion.span
                  key={cartCount}
                  initial={{ scale: 0.6 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold text-white"
                >
                  {cartCount}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>

      {/* Mobile search */}
      <form onSubmit={submit} className="px-4 pb-3 md:hidden">
        <div className="flex overflow-hidden rounded-md border border-[#D1D5DB] bg-white">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search products…"
            className="w-full bg-white px-3 py-2.5 text-sm outline-none placeholder:text-[#9CA3AF]"
          />
          <button type="submit" aria-label="Search" className="flex items-center justify-center bg-primary px-4 text-white">
            <Search className="h-5 w-5" />
          </button>
        </div>
      </form>

      {/* Category strip */}
      <nav className="hidden border-t border-[#E5E7EB] bg-[#F9FAFB] md:block">
        <div className="mx-auto flex max-w-7xl items-stretch gap-1 overflow-x-auto px-4 text-[13px] font-medium">
          {CATEGORIES.map((c) => {
            const active = pathname === `/category/${c.slug}`;
            return (
              <Link
                key={c.slug}
                to="/category/$slug"
                params={{ slug: c.slug }}
                className={`whitespace-nowrap border-b-2 px-4 py-3 transition ${active ? "border-primary text-primary" : "border-transparent text-[#374151] hover:text-primary"}`}
              >
                {c.name}
              </Link>
            );
          })}
          <Link to="/category/$slug" params={{ slug: "deals" }} className="ml-auto whitespace-nowrap border-b-2 border-transparent px-4 py-3 font-semibold text-[#EA580C] hover:border-[#EA580C]">Deals</Link>
        </div>
      </nav>

      <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />
    </header>
  );
}