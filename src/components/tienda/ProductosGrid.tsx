import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ProductCard, type ProductCardProps } from "@/components/tienda/ProductCard";
import { useCart } from "@/lib/cart/CartContext";
import { LoadingState, ErrorState } from "@/components/ui/QueryState";
import { supabase } from "@/lib/supabase/client";

// Array local original — comentado por si hay que hacer rollback rápido.
// const PRODUCTOS_LOCAL: ProductCardProps[] = [
//   {
//     id: "p1", slug: "shampoo-hidratacion-profunda",
//     name: "Shampoo Hidratación Profunda", brand: "L'Oréal Professionnel",
//     description: "Shampoo nutritivo para cabello seco y dañado. Fórmula con aceite de argán.",
//     price: 85000, category: "cuidado-capilar", rating: 4.8, reviews: 24,
//     image: "https://placehold.co/400x400/131118/E8C97A?text=Shampoo",
//     isNew: true,
//   },
//   // ... ver historial de git para el array completo de 16 productos
// ];

// Poblado por ProductosGrid tras su fetch a Supabase. Usado por
// src/routes/tienda/$slug.tsx solo como respaldo — esa ruta hace su
// propia consulta independiente para no depender del montaje de este grid.
export let PRODUCTOS: ProductCardProps[] = [];

type ProductoRow = {
  id: string;
  slug: string;
  nombre: string;
  marca: string;
  descripcion: string | null;
  precio: number;
  precio_original: number | null;
  imagenes: string[];
  rating: number;
  total_resenas: number;
  es_nuevo: boolean;
  categorias_productos: { nombre: string; slug: string } | null;
  inventario: { stock_virtual: number; stock_fisico: number }[] | null;
};

function mapProducto(p: ProductoRow): ProductCardProps {
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
    rating: p.rating,
    reviews: p.total_resenas,
    isNew: p.es_nuevo,
    isAgotado,
  };
}

interface ProductosGridProps {
  searchQuery: string;
  activeCategory: string;
  sortOrder: string;
  onFilteredCountChange: (count: number) => void;
  onClearFilters: () => void;
}

export function ProductosGrid({
  searchQuery,
  activeCategory,
  sortOrder,
  onFilteredCountChange,
  onClearFilters,
}: ProductosGridProps) {
  const { addItem } = useCart();
  const [productos, setProductos] = useState<ProductCardProps[]>(PRODUCTOS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProductos = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("productos")
      .select("*, categorias_productos(nombre, slug), inventario(stock_virtual, stock_fisico)")
      .eq("activo", true)
      .order("orden", { ascending: true });

    if (error) {
      console.error("[ProductosGrid] error al cargar:", error.message);
      setError(error.message);
      setLoading(false);
      return;
    }

    console.log(`[ProductosGrid] ${data.length} registros cargados desde Supabase`);
    const mapped = (data as unknown as ProductoRow[]).map(mapProducto);
    PRODUCTOS = mapped;
    setProductos(mapped);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProductos();
  }, [fetchProductos]);

  const productosFiltrados = useMemo(() => {
    let result = productos.filter((p) => {
      const matchCat = activeCategory === "todas" || p.category === activeCategory;
      const matchSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.brand.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });

    switch (sortOrder) {
      case "precio-asc":
        result = [...result].sort((a, b) => a.price - b.price);
        break;
      case "precio-desc":
        result = [...result].sort((a, b) => b.price - a.price);
        break;
      case "nombre-asc":
        result = [...result].sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        break;
    }

    return result;
  }, [productos, activeCategory, searchQuery, sortOrder]);

  useEffect(() => {
    onFilteredCountChange(productosFiltrados.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productosFiltrados.length]);

  const handleAddToCart = (product: ProductCardProps) => {
    addItem({
      id: product.id,
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      price: product.price,
      image: product.image,
    });
  };

  return (
    <section
      style={{
        backgroundColor: "var(--color-bg)",
        paddingTop: "4rem",
        paddingBottom: "6rem",
      }}
    >
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
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchProductos} />
        ) : productosFiltrados.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {productosFiltrados.map((p) => (
                <ProductCard key={p.id} {...p} onAddToCart={handleAddToCart} />
              ))}
            </div>

            {/* Paginación visual */}
            <div className="flex items-center justify-center gap-2 mt-12">
              <button
                disabled
                style={{
                  width: "auto",
                  height: "40px",
                  padding: "0 1rem",
                  borderRadius: "var(--radius-full)",
                  border: "1px solid var(--color-border)",
                  backgroundColor: "transparent",
                  color: "var(--color-text-muted)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--text-sm)",
                  cursor: "not-allowed",
                }}
              >
                ← Anterior
              </button>
              {[1, 2, 3].map((page) => (
                <button
                  key={page}
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "var(--radius-full)",
                    border: page === 1 ? "none" : "1px solid var(--color-border)",
                    backgroundColor: page === 1 ? "var(--color-primary)" : "transparent",
                    color: page === 1 ? "var(--color-text-inverse)" : "var(--color-text-secondary)",
                    fontFamily: "var(--font-mono)",
                    fontSize: "var(--text-sm)",
                    cursor: "pointer",
                  }}
                >
                  {page}
                </button>
              ))}
              <button
                style={{
                  width: "auto",
                  height: "40px",
                  padding: "0 1rem",
                  borderRadius: "var(--radius-full)",
                  border: "1px solid var(--color-border)",
                  backgroundColor: "transparent",
                  color: "var(--color-text-secondary)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--text-sm)",
                  cursor: "pointer",
                }}
              >
                Siguiente →
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-4 py-20">
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontStyle: "italic",
                fontSize: "var(--text-2xl)",
                color: "var(--color-text-muted)",
              }}
            >
              No encontramos productos con ese criterio.
            </span>
            <Button variant="secondary" size="sm" onClick={onClearFilters}>
              Limpiar filtros
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
