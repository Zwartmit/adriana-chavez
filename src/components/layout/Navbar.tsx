import { useEffect, useState } from "react";
import { Menu, ShoppingBag, X } from "lucide-react";
import { NAV_LINKS } from "@/constants";
import { cn } from "@/lib/utils";
import { useCart } from "@/lib/cart/CartContext";

function CartIcon() {
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
        color: "var(--color-text-primary)",
        padding: "8px",
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
            backgroundColor: "var(--color-accent)",
            color: "var(--color-primary)",
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
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease",
        )}
        style={{
          backgroundColor: scrolled ? "var(--color-bg)" : "transparent",
          borderBottom: scrolled ? "0.5px solid var(--color-border-gold)" : "none",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(20px)" : "none",
          boxShadow: scrolled ? "0 8px 32px rgba(0,0,0,0.5)" : "none",
          color: "var(--color-text-primary)",
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
              color: "var(--color-primary)",
            }}
          >
            Adriana Chávez
          </a>

          {/* Desktop links */}
          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="group relative uppercase transition-colors"
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--text-sm)",
                  fontWeight: 500,
                  letterSpacing: "var(--tracking-wide)",
                  color: "var(--color-text-primary)",
                }}
              >
                <span className="group-hover:text-[var(--color-accent)] transition-colors">
                  {link.label}
                </span>
                <span
                  className="absolute -bottom-1 left-0 h-px w-0 group-hover:w-full transition-all duration-300 ease"
                  style={{ backgroundColor: "var(--color-accent)" }}
                />
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {/* Desktop CTA */}
            <a
              href="/contacto"
              className="hidden md:inline-flex items-center justify-center transition-colors"
              style={{
                backgroundColor: "var(--color-accent)",
                color: "var(--color-text-inverse)",
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
                (e.currentTarget.style.backgroundColor = "var(--color-accent-dim)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "var(--color-accent)")
              }
            >
              Reservar cita →
            </a>

            <CartIcon />

            {/* Mobile hamburger */}
            <button
              type="button"
              aria-label="Abrir menú"
              className="md:hidden p-2"
              onClick={() => setOpen(true)}
              style={{ color: "var(--color-text-primary)" }}
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
          "fixed inset-0 z-[60] md:hidden transition-opacity duration-300",
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
