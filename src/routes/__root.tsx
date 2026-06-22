import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useNavigate,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { DemoBadge } from "@/components/layout/DemoBadge";
import { FloatingWhatsApp } from "@/components/layout/FloatingWhatsApp";
import { ChatBot } from "@/components/layout/ChatBot";
import { InstallPWA } from "@/components/layout/InstallPWA";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate({ to: "/", replace: true });
  }, [navigate]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h2 className="text-xl font-semibold text-foreground">Taking you home…</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          That page doesn't exist. Redirecting to the homepage.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home now
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Lovable App" },
      { name: "description", content: "A responsive pharmacy e-commerce app for browsing, ordering medicines, and managing prescriptions." },
      { name: "author", content: "Lovable" },
      { property: "og:title", content: "Lovable App" },
      { property: "og:description", content: "A responsive pharmacy e-commerce app for browsing, ordering medicines, and managing prescriptions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Lovable" },
      { name: "twitter:title", content: "Lovable App" },
      { name: "twitter:description", content: "A responsive pharmacy e-commerce app for browsing, ordering medicines, and managing prescriptions." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/809ef271-d8fb-46e8-953b-aa64cf8e51f8/id-preview-9aabf23a--545041ce-6fc5-480c-91af-bcf96c2183a2.lovable.app-1780825527608.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/809ef271-d8fb-46e8-953b-aa64cf8e51f8/id-preview-9aabf23a--545041ce-6fc5-480c-91af-bcf96c2183a2.lovable.app-1780825527608.png" },
      { name: "theme-color", content: "#0EA5E9" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { name: "apple-mobile-web-app-title", content: "Kings Rx" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "icon", type: "image/png", sizes: "192x192", href: "/icon-192.png" },
      { rel: "icon", type: "image/png", sizes: "512x512", href: "/icon-512.png" },
      { rel: "apple-touch-icon", href: "/icon-192.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700;800&family=Inter:wght@400;600;700;800&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isStaff = pathname.startsWith("/staff");

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-screen w-full flex-col overflow-x-hidden bg-background font-sans antialiased" style={{ fontFamily: "'Open Sans', 'Inter', system-ui, sans-serif" }}>
        {!isStaff && <Navbar />}
        <main className={isStaff ? "flex-1 w-full overflow-x-hidden" : "flex-1 w-full overflow-x-hidden pb-20 md:pb-0"}>
          <Outlet />
        </main>
        {!isStaff && <Footer />}
        {!isStaff && <MobileBottomNav />}
        {!isStaff && <DemoBadge />}
        {!isStaff && <FloatingWhatsApp />}
        {!isStaff && <ChatBot />}
        {!isStaff && <InstallPWA />}
        <Toaster position="top-center" richColors />
      </div>
    </QueryClientProvider>
  );
}
