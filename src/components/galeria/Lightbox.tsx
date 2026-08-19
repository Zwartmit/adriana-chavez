import { useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { GaleriaItem } from "@/components/galeria/GaleriaGrid";

interface LightboxProps {
  item: GaleriaItem | null;
  items: GaleriaItem[];
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

export function Lightbox({ item, items, onClose, onPrev, onNext }: LightboxProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        onPrev();
      } else if (e.key === "ArrowRight") {
        onNext();
      } else if (e.key === "Tab" && containerRef.current) {
        const focusable = containerRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, onPrev, onNext]);

  if (!item) return null;

  const currentIndex = items.findIndex((i) => i.id === item.id);
  const total = items.length;

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        backgroundColor: "rgba(0,0,0,0.92)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Barra superior */}
      <div
        className="flex items-center justify-between"
        style={{ backgroundColor: "rgba(0,0,0,0.5)", padding: "1rem 1.5rem" }}
      >
        <button
          ref={closeButtonRef}
          type="button"
          aria-label="Cerrar"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="flex items-center justify-center"
          style={{
            width: 40,
            height: 40,
            color: "white",
            borderRadius: "var(--radius-full)",
            transition: "background-color var(--transition-base)",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
        >
          <X size={24} />
        </button>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--text-sm)",
            color: "rgba(255,255,255,0.6)",
          }}
        >
          {currentIndex + 1} / {total}
        </span>
      </div>

      {/* Imagen + navegación */}
      <div className="relative flex-1 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
        {currentIndex > 0 && (
          <button
            type="button"
            aria-label="Anterior"
            onClick={onPrev}
            className="absolute flex items-center justify-center"
            style={{
              left: "1.5rem",
              width: 48,
              height: 48,
              color: "white",
              borderRadius: "var(--radius-full)",
              transition: "background-color var(--transition-base)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            <ChevronLeft size={32} />
          </button>
        )}

        <img
          src={item.src}
          alt={item.alt}
          style={{
            maxHeight: "80vh",
            maxWidth: "90vw",
            objectFit: "contain",
          }}
        />

        {currentIndex < total - 1 && (
          <button
            type="button"
            aria-label="Siguiente"
            onClick={onNext}
            className="absolute flex items-center justify-center"
            style={{
              right: "1.5rem",
              width: 48,
              height: 48,
              color: "white",
              borderRadius: "var(--radius-full)",
              transition: "background-color var(--transition-base)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            <ChevronRight size={32} />
          </button>
        )}
      </div>

      {/* Info inferior */}
      <div style={{ backgroundColor: "rgba(0,0,0,0.5)", padding: "1rem 1.5rem" }}>
        {item.tag && (
          <span
            className="uppercase"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--text-xs)",
              color: "var(--color-accent)",
            }}
          >
            {item.tag}
            {" · "}
          </span>
        )}
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontWeight: 500,
            color: "white",
          }}
        >
          {item.category}
        </span>
      </div>
    </div>
  );
}
