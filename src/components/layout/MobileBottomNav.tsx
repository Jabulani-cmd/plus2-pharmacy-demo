import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Home, LayoutGrid, ShoppingCart, User, LogIn } from "lucide-react";
import { toast } from "sonner";
import { useShop } from "@/store/shop";
import { useAuth } from "@/store/auth";

export function MobileBottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const cartQty = useShop((s) => s.cart.reduce((a, c) => a + c.qty, 0));
  const user = useAuth((s) => s.user);
  const navigate = useNavigate();
  // Guests never see a cart count.
  const count = user ? cartQty : 0;
  const accountItem = user
    ? { to: "/account", label: "Account", icon: User, match: pathname === "/account" }
    : { to: "/auth", label: "Sign In", icon: LogIn, match: pathname === "/auth" };
  const items = [
    { to: "/", label: "Home", icon: Home, match: pathname === "/" },
    { to: "/category/$slug", label: "Shop", icon: LayoutGrid, params: { slug: "all" }, match: pathname.startsWith("/category") },
    { to: "/cart", label: "Cart", icon: ShoppingCart, match: pathname === "/cart", badge: count },
    accountItem,
  ] as const;
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-background/95 backdrop-blur md:hidden">
      <div className="flex">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <Link
              key={it.label}
              to={it.to}
              params={"params" in it ? it.params : undefined}
              onClick={(e) => {
                if (it.label === "Cart" && !user) {
                  e.preventDefault();
                  toast.error("Please sign in to view your cart");
                  navigate({ to: "/auth", search: { redirect: "/cart" } });
                }
              }}
              className={`relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium ${it.match ? "text-primary" : "text-muted-foreground"}`}
            >
              <Icon className="h-5 w-5" />
              {it.label}
              {"badge" in it && it.badge ? (
                <span className="absolute right-1/4 top-1 rounded-full bg-accent px-1.5 text-[9px] font-bold text-accent-foreground">{it.badge}</span>
              ) : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
