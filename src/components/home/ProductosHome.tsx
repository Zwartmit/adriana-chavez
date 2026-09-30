import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { ProductCard, type ProductCardProps } from "@/components/tienda/ProductCard";
import { LoadingState, ErrorState } from "@/components/ui/QueryState";
import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { useCart } from "@/lib/cart/CartContext";

export function ProductosHome() {
  const [productos, setProductos] = useState<ProductCardProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addItem } = useCart();

  const fetchProductos = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("productos")
      .select(`
        id, slug, nombre, marca, descripcion, precio, precio_original,
        imagenes, es_nuevo, rating,
        categorias_productos(nombre, slug),
        inventario(stock_virtual, stock_fisico)
      `)
      .eq("activo", true)
      .order("orden", { ascending: true })
      .limit(8);

    if (error) {
      console.error("[ProductosHome] error al cargar:", error.message);
      setError("No se pudieron cargar los productos. Intenta más tarde.");
      setLoading(false);
      return;
    }

    setProductos(
      (data ?? []).map((p: any) => {
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
        };
      }),
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProductos();
  }, [fetchProductos]);

  return (
    <section
      id="productos"
      style={{
        backgroundColor: "var(--color-bg-light)",
        paddingTop: "6rem",
        paddingBottom: "6rem",
      }}
    >
      <div
        className="mx-auto"
        style={{
          maxWidth: "1440px",
          marginLeft: "auto",
          marginRight: "auto",
          paddingLeft: "1.5rem",
          paddingRight: "1.5rem",
        }}
      >
        <SectionHeader
          eyebrow="Tienda"
          title="Productos para llevar en casa"
          align="center"
          titleSize="clamp(2rem, 4vw, 3rem)"
          className="mx-auto mb-12"
          titleColor="var(--color-text-on-light)"
          eyebrowColor="var(--color-primary-dim)"
        />

        {loading ? (
          <LoadingState variant="light" />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchProductos} variant="light" />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {productos.map((p) => (
              <ProductCard
                key={p.id}
                {...p}
                onAddToCart={() =>
                  addItem({
                    id: p.id,
                    name: p.name,
                    brand: p.brand,
                    price: p.price,
                    image: p.image,
                    slug: p.slug,
                  })
                }
              />
            ))}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "center", marginTop: "3rem" }}>
          <a href="/tienda" style={{ display: "inline-block" }}>
            <Button variant="primary" size="md">Ver todos los productos →</Button>
          </a>
        </div>
      </div>
    </section>
  );
}
