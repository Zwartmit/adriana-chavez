import { useEffect, useMemo } from "react";
import { Button } from "@/components/ui/Button";
import { ProductCard, type ProductCardProps } from "@/components/tienda/ProductCard";
import { useCart } from "@/lib/cart/CartContext";

export const PRODUCTOS: ProductCardProps[] = [
  // Cuidado capilar
  {
    id: "p1", slug: "shampoo-hidratacion-profunda",
    name: "Shampoo Hidratación Profunda", brand: "L'Oréal Professionnel",
    description: "Shampoo nutritivo para cabello seco y dañado. Fórmula con aceite de argán.",
    price: 85000, category: "cuidado-capilar", rating: 4.8, reviews: 24,
    image: "https://placehold.co/400x400/131118/E8C97A?text=Shampoo",
    isNew: true,
  },
  {
    id: "p2", slug: "acondicionador-reparador",
    name: "Acondicionador Reparador", brand: "Kérastase",
    description: "Acondicionador de alta concentración para cabello muy dañado o quebradizo.",
    price: 125000, category: "cuidado-capilar", rating: 4.9, reviews: 18,
    image: "https://placehold.co/400x400/181818/E8C97A?text=Acondicionador",
  },
  {
    id: "p3", slug: "mascarilla-nutricion-extrema",
    name: "Mascarilla Nutrición Extrema", brand: "Wella Professionals",
    description: "Mascarilla semanal de nutrición profunda. Restaura la fibra capilar desde adentro.",
    price: 98000, category: "cuidado-capilar", rating: 4.7, reviews: 31,
    image: "https://placehold.co/400x400/131118/E8C97A?text=Mascarilla",
  },
  {
    id: "p4", slug: "serum-brillo-intenso",
    name: "Sérum Brillo Intenso", brand: "Redken",
    description: "Sérum ligero para dar brillo y suavidad sin pesar el cabello.",
    price: 72000, category: "cuidado-capilar", rating: 4.6, reviews: 15,
    image: "https://placehold.co/400x400/E8C97A/0A0A0B?text=S%C3%A9rum",
  },
  // Coloración
  {
    id: "p5", slug: "tinte-permanente-castaño",
    name: "Tinte Permanente Castaño Natural", brand: "Schwarzkopf",
    description: "Coloración permanente profesional. Cobertura total de canas con brillo intenso.",
    price: 45000, category: "coloracion", rating: 4.5, reviews: 42,
    image: "https://placehold.co/400x400/181818/E8C97A?text=Tinte",
  },
  {
    id: "p6", slug: "tratamiento-post-color",
    name: "Tratamiento Post-Color", brand: "L'Oréal Professionnel",
    description: "Tratamiento sellador para preservar el color y añadir brillo después de la coloración.",
    price: 68000, category: "coloracion", rating: 4.8, reviews: 19,
    image: "https://placehold.co/400x400/131118/E8C97A?text=Post-Color",
    isNew: true,
  },
  // Tratamientos
  {
    id: "p7", slug: "ampolla-keratina-pura",
    name: "Ampolla Keratina Pura", brand: "Inoar",
    description: "Ampolla de keratina pura para uso en casa. Sella la cutícula y elimina el frizz.",
    price: 35000, category: "tratamientos", rating: 4.7, reviews: 56,
    image: "https://placehold.co/400x400/181818/E8C97A?text=Amp%C3%B3lla",
  },
  {
    id: "p8", slug: "aceite-argán-premium",
    name: "Aceite de Argán Premium", brand: "Moroccanoil",
    description: "Aceite multiusos de argán marroquí. Nutrición, brillo y protección térmica.",
    price: 145000, category: "tratamientos", rating: 4.9, reviews: 67,
    image: "https://placehold.co/400x400/E8C97A/0A0A0B?text=Aceite+Arg%C3%A1n",
  },
  {
    id: "p9", slug: "crema-peinar-rizos",
    name: "Crema para Peinar Rizos", brand: "DevaCurl",
    description: "Crema definidora de rizos sin sulfatos. Define, hidrata y controla el volumen.",
    price: 89000, category: "tratamientos", rating: 4.6, reviews: 28,
    image: "https://placehold.co/400x400/131118/E8C97A?text=Crema+Rizos",
  },
  // Estilizado
  {
    id: "p10", slug: "spray-protector-termico",
    name: "Spray Protector Térmico", brand: "Tresemmé Pro",
    description: "Protector térmico hasta 230°C. Ideal para uso con plancha y secador profesional.",
    price: 42000, category: "estilizado", rating: 4.5, reviews: 33,
    image: "https://placehold.co/400x400/181818/E8C97A?text=Protector+T%C3%A9rmico",
  },
  {
    id: "p11", slug: "laca-fijacion-fuerte",
    name: "Laca Fijación Fuerte", brand: "Schwarzkopf",
    description: "Laca de fijación extrafuerte para peinados duraderos. Sin efecto cartón.",
    price: 38000, category: "estilizado", rating: 4.4, reviews: 21,
    image: "https://placehold.co/400x400/131118/E8C97A?text=Laca",
  },
  {
    id: "p12", slug: "cera-modeladora-mate",
    name: "Cera Modeladora Mate", brand: "American Crew",
    description: "Cera de acabado mate para dar textura y definición con sujeción flexible.",
    price: 55000, category: "estilizado", rating: 4.7, reviews: 14,
    image: "https://placehold.co/400x400/181818/E8C97A?text=Cera",
    isAgotado: true,
  },
  // Uñas
  {
    id: "p13", slug: "esmalte-semipermanente-nude",
    name: "Esmalte Semipermanente Nude", brand: "OPI",
    description: "Esmalte gel de larga duración. Tono nude natural. Hasta 3 semanas sin descascararse.",
    price: 32000, category: "unas", rating: 4.8, reviews: 45,
    image: "https://placehold.co/400x400/E8C97A/0A0A0B?text=Esmalte+Nude",
  },
  {
    id: "p14", slug: "base-coat-uñas",
    name: "Base Coat Fortalecedora", brand: "Sally Hansen",
    description: "Base endurecedora de uñas con calcio y vitaminas. Previene el quiebre.",
    price: 28000, category: "unas", rating: 4.6, reviews: 38,
    image: "https://placehold.co/400x400/131118/E8C97A?text=Base+Coat",
  },
  // Accesorios
  {
    id: "p15", slug: "cepillo-paleta-profesional",
    name: "Cepillo Paleta Profesional", brand: "Termix",
    description: "Cepillo de paleta neumática con cerdas de jabalí y nylon. Desenlaza sin romper.",
    price: 78000, category: "accesorios", rating: 4.9, reviews: 22,
    image: "https://placehold.co/400x400/181818/E8C97A?text=Cepillo",
    isNew: true,
  },
  {
    id: "p16", slug: "toalla-microfibra-cabello",
    name: "Toalla de Microfibra para Cabello", brand: "Aquis",
    description: "Toalla ultrafina de microfibra que reduce el frizz y el tiempo de secado en un 50%.",
    price: 48000, category: "accesorios", rating: 4.7, reviews: 29,
    image: "https://placehold.co/400x400/131118/E8C97A?text=Toalla",
  },
];

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

  const productosFiltrados = useMemo(() => {
    let result = PRODUCTOS.filter((p) => {
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
        {productosFiltrados.length > 0 ? (
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
