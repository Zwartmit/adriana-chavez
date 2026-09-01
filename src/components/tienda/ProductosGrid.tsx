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
      setError("Lo sentimos, en este momento tenemos problemas para cargar los productos. Intenta más tarde.");
      setLoading(false);
      return;
    }

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

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8; // Muestra 8 por página por defecto

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, searchQuery, sortOrder]);

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
        backgroundColor: "var(--color-bg-light)",
        paddingTop: "3rem",
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
          <LoadingState variant="light" />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchProductos} variant="light" />
        ) : productosFiltrados.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              {productosFiltrados.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map((p) => (
                <ProductCard key={p.id} {...p} theme="light" onAddToCart={handleAddToCart} />
              ))}
            </div>

            {/* Paginación visual */}
            {productosFiltrados.length > ITEMS_PER_PAGE && (
              <div className="flex items-center justify-center gap-2 mt-12">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  style={{
                    width: "auto",
                    height: "40px",
                    padding: "0 1rem",
                    borderRadius: "var(--radius-full)",
                    border: "1px solid var(--color-border-light)",
                    backgroundColor: "transparent",
                    color: currentPage === 1 ? "var(--color-text-on-light-faint)" : "var(--color-text-on-light)",
                    fontFamily: "var(--font-mono)",
                    fontSize: "var(--text-sm)",
                    cursor: currentPage === 1 ? "not-allowed" : "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  ← Anterior
                </button>
                {Array.from({ length: Math.ceil(productosFiltrados.length / ITEMS_PER_PAGE) }).map((_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "var(--radius-full)",
                        border: page === currentPage ? "none" : "1px solid var(--color-border-light)",
                        backgroundColor: page === currentPage ? "var(--color-primary)" : "transparent",
                        color: page === currentPage ? "var(--color-text-inverse)" : "var(--color-text-on-light-muted)",
                        fontFamily: "var(--font-mono)",
                        fontSize: "var(--text-sm)",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                    >
                      {page}
                    </button>
                  );
                })}
                <button
                  disabled={currentPage === Math.ceil(productosFiltrados.length / ITEMS_PER_PAGE)}
                  onClick={() => setCurrentPage((prev) => Math.min(Math.ceil(productosFiltrados.length / ITEMS_PER_PAGE), prev + 1))}
                  style={{
                    width: "auto",
                    height: "40px",
                    padding: "0 1rem",
                    borderRadius: "var(--radius-full)",
                    border: "1px solid var(--color-border-light)",
                    backgroundColor: "transparent",
                    color: currentPage === Math.ceil(productosFiltrados.length / ITEMS_PER_PAGE) ? "var(--color-text-on-light-faint)" : "var(--color-text-on-light)",
                    fontFamily: "var(--font-mono)",
                    fontSize: "var(--text-sm)",
                    cursor: currentPage === Math.ceil(productosFiltrados.length / ITEMS_PER_PAGE) ? "not-allowed" : "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  Siguiente →
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-4 py-20">
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontStyle: "italic",
                fontSize: "var(--text-2xl)",
                color: "var(--color-text-on-light-faint)",
              }}
            >
              No encontramos productos con ese criterio.
            </span>
            <Button
              variant="secondary"
              size="sm"
              style={{ borderColor: "var(--color-primary-dim)", color: "var(--color-primary-dim)" }}
              onClick={onClearFilters}
            >
              Limpiar filtros
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
