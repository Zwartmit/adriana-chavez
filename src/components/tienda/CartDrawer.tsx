import { ShoppingBag, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useCart } from "@/lib/cart/CartContext";
import { formatPrice } from "@/lib/utils";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { items, updateQuantity, removeItem, totalItems, totalPrice } = useCart();

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 59,
          backgroundColor: "rgba(0,0,0,0.6)",
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          transition: "opacity 350ms ease",
        }}
      />

      {/* Panel */}
      <aside
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "min(420px, 95vw)",
          backgroundColor: "var(--color-surface)",
          zIndex: 60,
          display: "flex",
          flexDirection: "column",
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 350ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between"
          style={{
            background: "linear-gradient(135deg, rgba(232,201,122,0.1) 0%, rgba(26,24,32,0.95) 100%)",
            borderBottom: "0.5px solid rgba(232,201,122,0.25)",
            padding: "1.25rem 1.5rem",
          }}
        >
          <div>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontStyle: "italic",
                fontSize: "var(--text-xl)",
                color: "white",
              }}
            >
              Tu carrito
            </h2>
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--text-xs)",
                color: "var(--color-accent)",
              }}
            >
              {totalItems} producto{totalItems !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            type="button"
            aria-label="Cerrar carrito"
            onClick={onClose}
            style={{ color: "white" }}
          >
            <X size={22} />
          </button>
        </div>

        {items.length === 0 ? (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "1rem",
              padding: "2rem",
            }}
          >
            <ShoppingBag size={48} color="var(--color-text-muted)" />
            <p
              style={{
                fontFamily: "var(--font-display)",
                fontStyle: "italic",
                fontSize: "var(--text-xl)",
                color: "var(--color-text-muted)",
                textAlign: "center",
              }}
            >
              Tu carrito está vacío
            </p>
            <a href="/tienda" onClick={onClose}>
              <Button variant="primary" size="md">
                Ver productos
              </Button>
            </a>
          </div>
        ) : (
          <>
            {/* Items */}
            <div style={{ flex: 1, overflowY: "auto" }}>
              {items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    gap: "1rem",
                    padding: "1.25rem 1.5rem",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    style={{
                      width: 80,
                      height: 80,
                      objectFit: "cover",
                      borderRadius: "var(--radius-lg)",
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <p
                      style={{
                        fontFamily: "var(--font-body)",
                        fontWeight: 600,
                        fontSize: "var(--text-sm)",
                        color: "var(--color-text-primary)",
                      }}
                    >
                      {item.name}
                    </p>
                    <p
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "var(--text-xs)",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      {item.brand}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          style={{
                            width: 28,
                            height: 28,
                            border: "1px solid var(--color-border)",
                            borderRadius: "var(--radius-sm)",
                            background: "transparent",
                          }}
                        >
                          −
                        </button>
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "var(--text-sm)",
                            fontWeight: 700,
                            minWidth: 24,
                            textAlign: "center",
                          }}
                        >
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          style={{
                            width: 28,
                            height: 28,
                            border: "1px solid var(--color-border)",
                            borderRadius: "var(--radius-sm)",
                            background: "transparent",
                          }}
                        >
                          +
                        </button>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontWeight: 700,
                            fontSize: "var(--text-base)",
                            color: "var(--color-primary)",
                          }}
                        >
                          {formatPrice(item.price * item.quantity)}
                        </span>
                        <button
                          type="button"
                          aria-label="Eliminar"
                          onClick={() => removeItem(item.id)}
                          style={{
                            color: "var(--color-text-muted)",
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div
              style={{
                position: "sticky",
                bottom: 0,
                backgroundColor: "var(--color-surface)",
                borderTop: "1px solid var(--color-border)",
                padding: "1.5rem",
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "var(--text-sm)",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  Subtotal
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "var(--text-sm)",
                    color: "var(--color-text-primary)",
                  }}
                >
                  {formatPrice(totalPrice)}
                </span>
              </div>
              <div className="flex items-center justify-between mb-3">
                <span
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "var(--text-sm)",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  Envío
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "var(--text-sm)",
                    color: "var(--color-text-muted)",
                  }}
                >
                  A calcular
                </span>
              </div>
              <div style={{ borderTop: "1px solid var(--color-border)", margin: "0.75rem 0" }} />
              <div className="flex items-center justify-between mb-4">
                <span
                  style={{
                    fontFamily: "var(--font-body)",
                    fontWeight: 600,
                    fontSize: "var(--text-base)",
                    color: "var(--color-text-primary)",
                  }}
                >
                  Total
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontWeight: 700,
                    fontSize: "var(--text-xl)",
                    color: "var(--color-primary)",
                  }}
                >
                  {formatPrice(totalPrice)}
                </span>
              </div>

              <a href="/tienda/carrito">
                <Button variant="accent" size="lg" className="w-full">
                  Ir al checkout →
                </Button>
              </a>
              <button
                type="button"
                onClick={onClose}
                className="w-full text-center mt-3"
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--text-sm)",
                  color: "var(--color-text-secondary)",
                  transition: "color var(--transition-base)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-primary)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-secondary)")}
              >
                Seguir comprando
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
