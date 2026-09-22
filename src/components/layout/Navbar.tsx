import { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { Menu, ShoppingBag, X } from "lucide-react";
import { NAV_LINKS } from "@/constants";
import { cn } from "@/lib/utils";
import { useCart } from "@/lib/cart/CartContext";

function CartIcon({ isDark }: { isDark: boolean }) {
  const { totalItems, openDrawer } = useCart();
  return (
    <button
      type="button"
      onClick={openDrawer}
      aria-label="Carrito"
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        color: isDark ? "#F5F2EB" : "#0A0A0B",
        padding: "8px",
        transition: "color 300ms ease",
        cursor: "pointer",
      }}
    >
      <ShoppingBag size={22} />
      {totalItems > 0 && (
        <span
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: "18px",
            height: "18px",
            backgroundColor: "#E8C97A",
            color: "#0A0A0B",
            borderRadius: "50%",
            fontSize: "10px",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--font-mono)",
          }}
        >
          {totalItems > 9 ? "9+" : totalItems}
        </span>
      )}
    </button>
  );
}

export function Navbar() {
  const [isDark, setIsDark] = useState(true);
  const [isSolid, setIsSolid] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const sections = document.querySelectorAll<HTMLElement>("[data-navbar-dark]");
    if (sections.length === 0) {
      setIsDark(false);
      setIsSolid(false);
      return;
    }

    const solidSections = document.querySelectorAll<HTMLElement>("[data-navbar-solid]");
    setIsSolid(solidSections.length > 0);

    const intersecting = new Map<Element, boolean>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) intersecting.set(entry.target, entry.isIntersecting);
        setIsDark(Array.from(intersecting.values()).some(Boolean));
      },
      // Franja delgada justo debajo del navbar: cuenta como "oscuro" cuando
      // una sección con data-navbar-dark ocupa esa franja del viewport.
      { rootMargin: "-72px 0px -80% 0px", threshold: 0 },
    );
    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const textColor = isDark ? "rgba(245,242,235,0.7)" : "rgba(10,10,11,0.7)";
  const textHoverColor = isDark ? "#F5F2EB" : "#0A0A0B";
  const logoColor = isDark ? "#E8C97A" : "#0A0A0B";

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease",
        )}
        style={{
          backgroundColor: isSolid ? "#0A0A0B" : (isDark ? "rgba(10,10,11,0.85)" : "rgba(245,240,232,0.92)"),
          borderBottom: isSolid ? "0.5px solid rgba(232,201,122,0.15)" : (isDark ? "0.5px solid rgba(232,201,122,0.15)" : "0.5px solid rgba(10,10,11,0.08)"),
          backdropFilter: isSolid ? "none" : "blur(16px)",
          WebkitBackdropFilter: isSolid ? "none" : "blur(16px)",
          color: textColor,
        }}
      >
        <div
          className="flex items-center justify-between"
          style={{
            maxWidth: "1200px",
            marginLeft: "auto",
            marginRight: "auto",
            paddingLeft: "1.5rem",
            paddingRight: "1.5rem",
            paddingTop: "1rem",
            paddingBottom: "1rem",
          }}
        >

          {/* Logo */}
          <a
            href="/"
            className="font-semibold"
            style={{
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontSize: "var(--text-xl)",
              fontWeight: 600,
              color: logoColor,
              transition: "color 300ms ease",
            }}
          >
            Adriana Chávez
          </a>

          {/* Desktop links */}
          <nav className="hidden lg:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="group relative uppercase"
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--text-sm)",
                  fontWeight: 500,
                  letterSpacing: "var(--tracking-wide)",
                  color: textColor,
                  transition: "color 300ms ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = textHoverColor)}
                onMouseLeave={(e) => (e.currentTarget.style.color = textColor)}
              >
                <span>{link.label}</span>
                <span
                  className="absolute -bottom-1 left-0 h-px w-0 group-hover:w-full transition-all duration-300 ease"
                  style={{ backgroundColor: "#E8C97A" }}
                />
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {/* Desktop CTA */}
            <a
              href="/contacto"
              className="hidden lg:inline-flex items-center justify-center transition-colors"
              style={{
                backgroundColor: "#E8C97A",
                color: "#0A0A0B",
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-sm)",
                fontWeight: 600,
                letterSpacing: "var(--tracking-wide)",
                padding: "12px 32px",
                minHeight: "44px",
                whiteSpace: "nowrap",
                borderRadius: "var(--radius-full)",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "var(--color-primary-lt)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "#E8C97A")
              }
            >
              Reservar cita →
            </a>

            <CartIcon isDark={isDark} />

            {/* Mobile hamburger */}
            <button
              type="button"
              aria-label="Abrir menú"
              className="lg:hidden p-2"
              onClick={() => setOpen(true)}
              style={{ color: isDark ? "#F5F2EB" : "#0A0A0B", transition: "color 300ms ease" }}
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <div
        aria-hidden={!open}
        className={cn(
          "fixed inset-0 z-[60] lg:hidden transition-opacity duration-300",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        )}
      >
        {/* overlay */}
        <div
          className="absolute inset-0 bg-black/50"
          onClick={() => setOpen(false)}
        />
        {/* panel */}
        <aside
          className={cn(
            "absolute top-0 right-0 h-full w-72 flex flex-col transition-transform duration-300 ease",
            open ? "translate-x-0" : "translate-x-full",
          )}
          style={{
            backgroundColor: "var(--color-primary)",
            color: "var(--color-text-inverse)",
          }}
        >
          <div className="flex justify-end p-4">
            <button
              type="button"
              aria-label="Cerrar menú"
              onClick={() => setOpen(false)}
              className="p-2"
              style={{ color: "var(--color-text-inverse)" }}
            >
              <X size={24} />
            </button>
          </div>
          <nav className="flex flex-col gap-6 px-8 py-4">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="uppercase transition-colors hover:text-[var(--color-accent)]"
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--text-lg)",
                  fontWeight: 500,
                  letterSpacing: "var(--tracking-wide)",
                  color: "var(--color-text-inverse)",
                }}
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="mt-auto p-8">
            <a
              href="/contacto"
              onClick={() => setOpen(false)}
              className="inline-flex w-full items-center justify-center"
              style={{
                backgroundColor: "var(--color-accent)",
                color: "var(--color-text-inverse)",
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-base)",
                fontWeight: 600,
                letterSpacing: "var(--tracking-wide)",
                padding: "14px 32px",
                minHeight: "48px",
                whiteSpace: "nowrap",
                borderRadius: "var(--radius-full)",
              }}
            >
              Reservar cita →
            </a>

          </div>
        </aside>
      </div>
    </>
  );
}
