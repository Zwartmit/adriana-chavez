import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Star } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ProductCard, type ProductCardProps } from "@/components/tienda/ProductCard";
import { PRODUCTOS } from "@/components/tienda/ProductosGrid";
import { useCart } from "@/lib/cart/CartContext";
import { formatPrice } from "@/lib/utils";

export const Route = createFileRoute("/tienda/$slug")({
  component: ProductoPage,
  head: ({ params }) => {
    const producto = PRODUCTOS.find((p) => p.slug === params.slug);
    return {
      meta: [
        { title: producto ? `${producto.name} — Adriana Chávez` : "Producto — Adriana Chávez" },
        {
          name: "description",
          content: producto?.description ?? "Producto de la tienda Adriana Chávez.",
        },
      ],
    };
  },
});

const CARACTERISTICAS = [
  { label: "Contenido", value: "250ml" },
  { label: "Tipo de cabello", value: "Todo tipo" },
  { label: "Ingrediente clave", value: "Aceite de argán" },
  { label: "País de origen", value: "Francia" },
  { label: "Uso", value: "Diario" },
];

const RESEÑAS = [
  {
    name: "Camila R.",
    date: "Hace 2 semanas",
    rating: 5,
    text: "Excelente producto, se nota la diferencia desde el primer uso. Mi cabello quedó mucho más suave.",
  },
  {
    name: "Valentina M.",
    date: "Hace 1 mes",
    rating: 5,
    text: "Lo recomiendo totalmente, el olor es delicioso y rinde bastante.",
  },
  {
    name: "Laura J.",
    date: "Hace 2 meses",
    rating: 4,
    text: "Muy bueno, aunque esperaba un poco más de hidratación para cabello muy seco.",
  },
];

const TABS = ["Descripción", "Características", "Reseñas"] as const;

function ProductoPage() {
  const { slug } = Route.useParams();
  const producto = PRODUCTOS.find((p) => p.slug === slug);

  if (!producto) {
    return (
      <main
        style={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <p
            style={{
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontSize: "var(--text-2xl)",
              color: "var(--color-text-muted)",
            }}
          >
            Producto no encontrado
          </p>
          <a href="/tienda" style={{ marginTop: "1rem", display: "inline-block" }}>
            <Button variant="primary" size="md">
              Volver a la tienda
            </Button>
          </a>
        </div>
      </main>
    );
  }

  return <ProductoDetalle producto={producto} />;
}

function ProductoDetalle({ producto }: { producto: ProductCardProps }) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("Descripción");

  const relacionados = PRODUCTOS.filter(
    (p) => p.category === producto.category && p.id !== producto.id,
  ).slice(0, 4);

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addItem({
        id: producto.id,
        slug: producto.slug,
        name: producto.name,
        brand: producto.brand,
        price: producto.price,
        image: producto.image,
      });
    }
  };

  const handleBuyNow = () => {
    handleAddToCart();
    window.location.href = "/tienda/carrito";
  };

  return (
    <main>
      {/* Breadcrumb */}
      <nav
        style={{
          paddingTop: "80px",
          paddingBottom: "1rem",
          borderBottom: "0.5px solid var(--color-border)",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1.5rem" }}>
          <ol style={{ display: "flex", gap: "0.5rem", alignItems: "center", listStyle: "none" }}>
            {[
              { label: "Inicio", href: "/" },
              { label: "Tienda", href: "/tienda" },
              { label: producto.name, href: null },
            ].map((item, i) => (
              <li key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                {i > 0 && <span style={{ color: "var(--color-text-muted)" }}>/</span>}
                {item.href ? (
                  <a
                    href={item.href}
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "var(--text-sm)",
                      color: "var(--color-text-secondary)",
                      textDecoration: "none",
                    }}
                  >
                    {item.label}
                  </a>
                ) : (
                  <span
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "var(--text-sm)",
                      color: "var(--color-text-primary)",
                      fontWeight: 500,
                    }}
                  >
                    {item.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </div>
      </nav>

      {/* Layout principal */}
      <section style={{ paddingTop: "4rem", paddingBottom: "4rem" }}>
        <div
          className="mx-auto"
          style={{
            maxWidth: "1200px",
            marginLeft: "auto",
            marginRight: "auto",
            paddingLeft: "1.5rem",
            paddingRight: "1.5rem",
          }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-[45fr_55fr] gap-8 lg:gap-16">
            {/* Imágenes */}
            <div>
              <img
                src={producto.image}
                alt={producto.name}
                style={{
                  width: "100%",
                  aspectRatio: "1 / 1",
                  objectFit: "cover",
                  borderRadius: "var(--radius-2xl)",
                }}
              />
              <div className="flex gap-3 mt-4">
                {[0, 1, 2, 3].map((i) => (
                  <img
                    key={i}
                    src={producto.image}
                    alt={`${producto.name} miniatura ${i + 1}`}
                    style={{
                      width: 80,
                      height: 80,
                      objectFit: "cover",
                      borderRadius: "var(--radius-lg)",
                      border: i === 0 ? "2px solid var(--color-primary)" : "2px solid transparent",
                      cursor: "pointer",
                      transition: "border-color var(--transition-base)",
                    }}
                    onMouseEnter={(e) => {
                      if (i !== 0) e.currentTarget.style.borderColor = "var(--color-accent)";
                    }}
                    onMouseLeave={(e) => {
                      if (i !== 0) e.currentTarget.style.borderColor = "transparent";
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Info */}
            <div className="flex flex-col">
              <span
                className="uppercase"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--text-xs)",
                  letterSpacing: "var(--tracking-widest)",
                  color: "var(--color-accent)",
                }}
              >
                {producto.brand}
              </span>
              <h1
                style={{
                  fontFamily: "var(--font-display)",
                  fontStyle: "italic",
                  fontWeight: 600,
                  fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
                  color: "var(--color-text-primary)",
                  marginTop: "0.5rem",
                }}
              >
                {producto.name}
              </h1>

              <div className="flex items-center gap-2 mt-3">
                <span style={{ color: "var(--color-accent)" }}>
                  {"★".repeat(Math.round(producto.rating))}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "var(--text-sm)",
                    color: "var(--color-text-muted)",
                  }}
                >
                  {producto.rating} ({producto.reviews} reseñas)
                </span>
              </div>

              <div style={{ borderTop: "1px solid var(--color-border)", margin: "1.5rem 0" }} />

              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontWeight: 700,
                  fontSize: "var(--text-4xl)",
                  color: "var(--color-primary)",
                }}
              >
                {formatPrice(producto.price)}
              </span>

              <div style={{ borderTop: "1px solid var(--color-border)", margin: "1.5rem 0" }} />

              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--text-base)",
                  color: "var(--color-text-secondary)",
                  lineHeight: "var(--leading-relaxed)",
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {producto.description}
              </p>

              <div style={{ borderTop: "1px solid var(--color-border)", margin: "1.5rem 0" }} />

              {/* Selector de cantidad */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  style={{
                    width: 36,
                    height: 36,
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-md)",
                    backgroundColor: "transparent",
                    transition: "all var(--transition-base)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--color-primary)";
                    e.currentTarget.style.color = "var(--color-text-inverse)";
                    e.currentTarget.style.borderColor = "var(--color-primary)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = "inherit";
                    e.currentTarget.style.borderColor = "var(--color-border)";
                  }}
                >
                  −
                </button>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontWeight: 700,
                    fontSize: "var(--text-lg)",
                    minWidth: 48,
                    textAlign: "center",
                  }}
                >
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  style={{
                    width: 36,
                    height: 36,
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-md)",
                    backgroundColor: "transparent",
                    transition: "all var(--transition-base)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--color-primary)";
                    e.currentTarget.style.color = "var(--color-text-inverse)";
                    e.currentTarget.style.borderColor = "var(--color-primary)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = "inherit";
                    e.currentTarget.style.borderColor = "var(--color-border)";
                  }}
                >
                  +
                </button>
              </div>

              <div style={{ borderTop: "1px solid var(--color-border)", margin: "1.5rem 0" }} />

              {/* Botones de acción */}
              <div className="flex flex-col gap-3">
                <Button variant="accent" size="lg" className="w-full" onClick={handleAddToCart}>
                  Agregar al carrito →
                </Button>
                <Button variant="primary" size="lg" className="w-full" onClick={handleBuyNow}>
                  Comprar ahora →
                </Button>
              </div>

              <div style={{ borderTop: "1px solid var(--color-border)", margin: "1.5rem 0" }} />

              {/* Badges de garantía */}
              <div className="flex flex-wrap items-center gap-4">
                {["Envío a toda Colombia", "Producto 100% original", "Pago seguro con Wompi"].map(
                  (texto) => (
                    <div key={texto} className="flex items-center gap-2">
                      <Check size={14} color="var(--color-primary)" />
                      <span
                        style={{
                          fontFamily: "var(--font-body)",
                          fontSize: "var(--text-sm)",
                          color: "var(--color-text-secondary)",
                        }}
                      >
                        {texto}
                      </span>
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-16">
            <div className="flex" style={{ borderBottom: "1px solid var(--color-border)" }}>
              {TABS.map((tab) => {
                const isActive = tab === activeTab;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    style={{
                      fontFamily: "var(--font-body)",
                      fontWeight: isActive ? 600 : 500,
                      fontSize: "var(--text-sm)",
                      color: isActive ? "var(--color-primary)" : "var(--color-text-muted)",
                      padding: "12px 20px",
                      borderBottom: isActive
                        ? "2px solid var(--color-primary)"
                        : "2px solid transparent",
                      marginBottom: "-1px",
                      transition: "color var(--transition-base)",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.color = "var(--color-text-primary)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.color = "var(--color-text-muted)";
                    }}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>

            <div className="py-8">
              {activeTab === "Descripción" && (
                <div className="flex flex-col gap-4" style={{ maxWidth: "720px" }}>
                  <p
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "var(--text-base)",
                      color: "var(--color-text-secondary)",
                      lineHeight: "var(--leading-relaxed)",
                    }}
                  >
                    {producto.description} Formulado con ingredientes de alta calidad
                    seleccionados por nuestro equipo de estilistas para ofrecer resultados
                    visibles desde las primeras aplicaciones.
                  </p>
                  <p
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "var(--text-base)",
                      color: "var(--color-text-secondary)",
                      lineHeight: "var(--leading-relaxed)",
                    }}
                  >
                    <strong>Modo de uso:</strong> aplica sobre el cabello húmedo o seco según
                    corresponda, distribuye uniformemente y sigue las instrucciones del
                    empaque para obtener el mejor resultado.
                  </p>
                  <p
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "var(--text-base)",
                      color: "var(--color-text-secondary)",
                      lineHeight: "var(--leading-relaxed)",
                    }}
                  >
                    Recomendado por nuestro equipo de estilistas para uso regular en casa,
                    complementando los tratamientos realizados en el salón.
                  </p>
                </div>
              )}

              {activeTab === "Características" && (
                <div style={{ maxWidth: "560px", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
                  <div className="flex" style={{ backgroundColor: "var(--color-bg-alt)" }}>
                    <div
                      style={{
                        flex: 1,
                        padding: "0.75rem 1rem",
                        fontFamily: "var(--font-body)",
                        fontWeight: 600,
                        fontSize: "var(--text-sm)",
                        color: "var(--color-text-primary)",
                      }}
                    >
                      Marca
                    </div>
                    <div
                      style={{
                        flex: 1,
                        padding: "0.75rem 1rem",
                        fontFamily: "var(--font-body)",
                        fontSize: "var(--text-sm)",
                        color: "var(--color-text-secondary)",
                      }}
                    >
                      {producto.brand}
                    </div>
                  </div>
                  {CARACTERISTICAS.map((row, i) => (
                    <div
                      key={row.label}
                      className="flex"
                      style={{ backgroundColor: i % 2 === 0 ? "var(--color-bg)" : "var(--color-bg-alt)" }}
                    >
                      <div
                        style={{
                          flex: 1,
                          padding: "0.75rem 1rem",
                          fontFamily: "var(--font-body)",
                          fontWeight: 600,
                          fontSize: "var(--text-sm)",
                          color: "var(--color-text-primary)",
                        }}
                      >
                        {row.label}
                      </div>
                      <div
                        style={{
                          flex: 1,
                          padding: "0.75rem 1rem",
                          fontFamily: "var(--font-body)",
                          fontSize: "var(--text-sm)",
                          color: "var(--color-text-secondary)",
                        }}
                      >
                        {row.value}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "Reseñas" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {RESEÑAS.map((r) => (
                    <div
                      key={r.name}
                      style={{
                        backgroundColor: "var(--color-surface)",
                        border: "1px solid var(--color-border)",
                        borderRadius: "var(--radius-lg)",
                        padding: "1.25rem",
                      }}
                    >
                      <div className="flex gap-1 mb-2">
                        {Array.from({ length: r.rating }).map((_, i) => (
                          <Star key={i} size={14} fill="var(--color-accent)" color="var(--color-accent)" />
                        ))}
                      </div>
                      <p
                        style={{
                          fontFamily: "var(--font-body)",
                          fontSize: "var(--text-sm)",
                          color: "var(--color-text-secondary)",
                          lineHeight: "var(--leading-relaxed)",
                        }}
                      >
                        {r.text}
                      </p>
                      <div className="flex items-center justify-between mt-3">
                        <span
                          style={{
                            fontFamily: "var(--font-body)",
                            fontWeight: 600,
                            fontSize: "var(--text-sm)",
                            color: "var(--color-text-primary)",
                          }}
                        >
                          {r.name}
                        </span>
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "var(--text-xs)",
                            color: "var(--color-text-muted)",
                          }}
                        >
                          {r.date}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Productos relacionados */}
      {relacionados.length > 0 && (
        <section style={{ backgroundColor: "var(--color-bg-alt)", paddingTop: "6rem", paddingBottom: "6rem" }}>
          <div
            className="mx-auto"
            style={{
              maxWidth: "1200px",
              marginLeft: "auto",
              marginRight: "auto",
              paddingLeft: "1.5rem",
              paddingRight: "1.5rem",
            }}
          >
            <SectionHeader
              eyebrow="También te puede interesar"
              title="Productos relacionados"
              titleSize="var(--text-2xl)"
              align="center"
              className="mx-auto mb-12"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relacionados.map((p) => (
                <ProductCard
                  key={p.id}
                  {...p}
                  onAddToCart={(prod) => {
                    addItem({
                      id: prod.id,
                      slug: prod.slug,
                      name: prod.name,
                      brand: prod.brand,
                      price: prod.price,
                      image: prod.image,
                    });
                  }}
                />
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
