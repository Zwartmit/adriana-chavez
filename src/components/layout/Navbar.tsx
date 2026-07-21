import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { NAV_LINKS } from "@/constants";
import { cn } from "@/lib/utils";

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
          backgroundColor: scrolled ? "var(--color-primary)" : "transparent",
          boxShadow: scrolled ? "var(--shadow-md)" : "none",
          color: "var(--color-text-inverse)",
        }}
      >
        <div
          className="mx-auto flex items-center justify-between"
          style={{
            maxWidth: "var(--container-max)",
            padding: "1rem var(--container-padding)",
          }}
        >
          {/* Logo */}
          <a
            href="/"
            className="font-semibold"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--text-xl)",
              color: "var(--color-text-inverse)",
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
                  color: "var(--color-text-inverse)",
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

          {/* Desktop CTA */}
          <a
            href="/contacto"
            className="hidden md:inline-flex items-center transition-colors"
            style={{
              backgroundColor: "var(--color-accent)",
              color: "var(--color-primary-dim)",
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-sm)",
              fontWeight: 600,
              padding: "10px 24px",
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

          {/* Mobile hamburger */}
          <button
            type="button"
            aria-label="Abrir menú"
            className="md:hidden p-2"
            onClick={() => setOpen(true)}
            style={{ color: "var(--color-text-inverse)" }}
          >
            <Menu size={24} />
          </button>
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
                color: "var(--color-primary-dim)",
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-base)",
                fontWeight: 600,
                padding: "14px 24px",
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
