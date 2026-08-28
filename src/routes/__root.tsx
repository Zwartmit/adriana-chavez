import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Navbar } from "../components/layout/Navbar";
import { Footer } from "../components/layout/Footer";
import { CartProvider, useCart } from "../lib/cart/CartContext";
import { CartDrawer } from "../components/tienda/CartDrawer";

function NotFoundComponent() {
  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{ backgroundColor: "var(--color-bg)" }}
    >
      <div className="max-w-md text-center">
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--text-6xl)",
            color: "var(--color-primary)",
            fontWeight: 600,
          }}
        >
          404
        </h1>
        <p
          className="mt-4"
          style={{
            fontFamily: "var(--font-body)",
            color: "var(--color-text-secondary)",
          }}
        >
          La página que buscas no existe.
        </p>
        <a
          href="/"
          className="mt-6 inline-flex items-center justify-center"
          style={{
            backgroundColor: "var(--color-accent)",
            color: "var(--color-text-inverse)",
            padding: "10px 24px",
            borderRadius: "var(--radius-full)",
            fontWeight: 600,
          }}
        >
          Volver al inicio
        </a>
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
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{ backgroundColor: "var(--color-bg)" }}
    >
      <div className="max-w-md text-center">
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--text-3xl)",
            color: "var(--color-primary)",
          }}
        >
          Algo salió mal
        </h1>
        <p
          className="mt-2"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Intenta recargar la página.
        </p>
        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="mt-6"
          style={{
            backgroundColor: "var(--color-primary)",
            color: "var(--color-text-inverse)",
            padding: "10px 24px",
            borderRadius: "var(--radius-full)",
            fontWeight: 600,
          }}
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Adriana Chávez — Centro de belleza en Monterrey, Casanare" },
      {
        name: "description",
        content:
          "Adriana Chávez — Centro de belleza en Monterrey, Casanare.",
      },
      {
        property: "og:title",
        content: "Adriana Chávez — Centro de belleza en Monterrey, Casanare",
      },
      {
        property: "og:description",
        content: "Centro de belleza en Monterrey, Casanare.",
      },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Adriana Chávez — Centro de Belleza" },
      { property: "og:locale", content: "es_CO" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        name: "keywords",
        content: "centro de belleza monterrey, coloración monterrey, corte de cabello monterrey, adriana chávez belleza, monterrey casanare, casanare",
      },
      { name: "theme-color", content: "#E8C97A" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "Adriana Chávez" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.json" },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "icon", href: "/icon-192.png", type: "image/png" },
      { rel: "apple-touch-icon", href: "/icon-192.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,400&family=Inter:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap",
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
    <html lang="es">
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

  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <RootLayout />
      </CartProvider>
    </QueryClientProvider>
  );
}

function RootLayout() {
  const { isDrawerOpen, closeDrawer } = useCart();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAdmin = pathname.startsWith("/admin");

  return (
    <>
      {!isAdmin && <Navbar />}
      <Outlet />
      {!isAdmin && <Footer />}
      <CartDrawer isOpen={isDrawerOpen} onClose={closeDrawer} />
    </>
  );
}
