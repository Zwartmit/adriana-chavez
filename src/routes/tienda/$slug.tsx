import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Check, Star } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ProductCard, type ProductCardProps } from "@/components/tienda/ProductCard";
import { PRODUCTOS } from "@/components/tienda/ProductosGrid";
import { LoadingState, ErrorState } from "@/components/ui/QueryState";
import { supabase } from "@/lib/supabase/client";
import { useCart } from "@/lib/cart/CartContext";
import { formatPrice } from "@/lib/utils";

// $slug.tsx hace su propia consulta independiente a Supabase en vez de
// depender de que ProductosGrid ya se haya montado y poblado PRODUCTOS
// (necesario para navegación directa a /tienda/{slug}). El export
// PRODUCTOS se mantiene (poblado por ProductosGrid) solo como respaldo
// para head(), que corre en SSR sin poder esperar una consulta async aquí.

interface ProductoDetalleRow {
  id: string;
  slug: string;
  nombre: string;
  marca: string;
  descripcion: string | null;
  descripcion_larga: string | null;
  caracteristicas: any;
  precio: number;
  precio_original: number | null;
  imagenes: string[];
  es_nuevo: boolean;
  categorias_productos: { nombre: string; slug: string } | null;
  inventario: { stock_virtual: number; stock_fisico: number }[] | null;
}

function mapProductoDetalle(p: ProductoDetalleRow): ProductCardProps {
  const stock = p.inventario?.[0];
  const isAgotado = stock ? stock.stock_virtual + stock.stock_fisico === 0 : false;
  return {
    id: p.id,
    slug: p.slug,
    name: p.nombre,
    brand: p.marca,
    description: p.descripcion ?? "",
    price: p.precio,
    originalPrice: p.precio_original ?? undefined,
    image: p.imagenes?.[0] ?? "",
    category: p.categorias_productos?.slug ?? "",
    isNew: p.es_nuevo,
    isAgotado,
    descripcion_larga: p.descripcion_larga ?? undefined,
    caracteristicas: p.caracteristicas ?? undefined,
  };
}

export const Route = createFileRoute("/tienda/$slug")({
  component: ProductoPage,
  head: ({ params }) => {
    const producto = PRODUCTOS.find((p) => p.slug === params.slug);
    return {
      meta: [
        { title: producto ? `${producto.name} | Centro de Belleza Adriana Chávez` : "Producto | Centro de Belleza Adriana Chávez" },
        {
          name: "description",
          content: producto?.description ?? "Producto de la tienda Adriana Chávez.",
        },
      ],
    };
  },
});

const TABS = ["Descripción", "Características"] as const;

function ProductoPage() {
  const { slug } = Route.useParams();
  const [producto, setProducto] = useState<ProductCardProps | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const fetchProducto = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNotFound(false);
    const { data, error } = await supabase
      .from("productos")
      .select("*, categorias_productos(nombre, slug), inventario(stock_virtual, stock_fisico)")
      .eq("slug", slug)
      .eq("activo", true)
      .maybeSingle();

    if (error) {
      console.error("[ProductoPage] error al cargar:", error.message);
      setError("Lo sentimos, no pudimos cargar los detalles del producto en este momento.");
      setLoading(false);
      return;
    }

    if (!data) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setProducto(mapProductoDetalle(data as unknown as ProductoDetalleRow));
    setLoading(false);
  }, [slug]);

  useEffect(() => {
    fetchProducto();
  }, [fetchProducto]);

  if (loading) {
    return (
      <main style={{ minHeight: "60vh", paddingTop: "80px" }}>
        <LoadingState />
      </main>
    );
  }

  if (error) {
    return (
      <main style={{ minHeight: "60vh", paddingTop: "80px" }}>
        <ErrorState message={error} onRetry={fetchProducto} />
      </main>
    );
  }

  if (notFound || !producto) {
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
  const [relacionados, setRelacionados] = useState<ProductCardProps[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function fetchRelacionados() {
      const { data, error } = await supabase
        .from("productos")
        .select("*, categorias_productos(nombre, slug), inventario(stock_virtual, stock_fisico)")
        .eq("activo", true)
        .neq("id", producto.id)
        .limit(8);

      if (error) {
        console.error("[ProductoPage] error al cargar relacionados:", error.message);
        return;
      }
      if (cancelled) return;

      const mapped = (data as unknown as ProductoDetalleRow[])
        .map(mapProductoDetalle)
        .filter((p) => p.category === producto.category)
        .slice(0, 4);
      setRelacionados(mapped);
    }
    fetchRelacionados();
    return () => {
      cancelled = true;
    };
  }, [producto.id, producto.category]);

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
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {producto.descripcion_larga || producto.description}
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
                  {(!producto.caracteristicas || producto.caracteristicas.length === 0) && (
                    <div style={{ padding: "1rem", color: "var(--color-text-muted)", fontFamily: "var(--font-body)", fontSize: "var(--text-sm)" }}>
                      No hay características adicionales para este producto.
                    </div>
                  )}
                  {producto.caracteristicas?.map((row, i) => (
                    <div
                      key={i}
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
                        {row.valor}
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

