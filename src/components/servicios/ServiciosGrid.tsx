import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ServiceCard } from "@/components/servicios/ServiceCard";
import { LoadingState, ErrorState } from "@/components/ui/QueryState";
import { supabase } from "@/lib/supabase/client";

// Array local original — comentado por si hay que hacer rollback rápido.
// const SERVICIOS = [
//   // CABELLO
//   {
//     id: "s1", name: "Corte & Estilo", category: "Cabello",
//     description: "Corte personalizado según tu tipo de rostro y estilo de vida, con blow dry incluido.",
//     duration: 60, price: 85000,
//     image: "https://placehold.co/600x400/131118/D4AF6B?text=Corte+%26+Estilo",
//     href: "/servicios",
//   },
//   ... (ver historial de git para el array completo de 12 servicios)
// ];

interface ServicioUI {
  id: string;
  name: string;
  category: string;
  categorySlug: string;
  categoryOrden: number;
  description: string;
  duration: number;
  price: number;
  image: string;
  href: string;
  orden: number;
  requiere_cita: boolean;
}

interface ServiciosGridProps {
  searchQuery: string;
  activeCategory: string;
  onSearchChange: (value: string) => void;
  onCategoryChange: (category: string) => void;
  onCategoriesChange?: (categories: string[]) => void;
}

export function ServiciosGrid({
  searchQuery,
  activeCategory,
  onSearchChange,
  onCategoryChange,
  onCategoriesChange,
}: ServiciosGridProps) {
  const [servicios, setServicios] = useState<ServicioUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServicios = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("servicios")
      .select("*, categorias_servicios(nombre, slug, orden)")
      .eq("activo", true);

    if (error) {
      console.error("[ServiciosGrid] error al cargar:", error.message);
      setError("Lo sentimos, en este momento tenemos problemas para cargar los servicios. Intenta más tarde.");
      setLoading(false);
      return;
    }


    const mapped: ServicioUI[] = data.map((s) => {
      const cat = (s as unknown as {
        categorias_servicios: { nombre: string; slug: string; orden: number } | null;
      }).categorias_servicios;
      return {
        id: s.id,
        name: s.nombre,
        category: cat?.nombre ?? "",
        categorySlug: cat?.slug ?? "",
        categoryOrden: cat?.orden ?? 0,
        description: s.descripcion ?? "",
        duration: s.duracion_min,
        price: s.precio,
        image: s.imagen_url ?? "",
        href: "/servicios",
        orden: s.orden,
        requiere_cita: s.requiere_cita ?? false,
      };
    });

    // Orden por categoría → orden de servicio (PostgREST no ordena filas
    // padre por una columna de la tabla embebida, así que se ordena aquí)
    mapped.sort((a, b) => a.categoryOrden - b.categoryOrden || a.orden - b.orden);

    setServicios(mapped);

    const uniqueCategories = Array.from(new Set(mapped.map((s) => s.category))).filter(Boolean);
    onCategoriesChange?.(uniqueCategories);

    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchServicios();
  }, [fetchServicios]);

  const serviciosFiltrados = servicios.filter((s) => {
    const matchesCategory = activeCategory === "Todos" || s.category === activeCategory;
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const ITEMS_PER_PAGE = 8;
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [activeCategory, searchQuery]);

  const totalPages = Math.ceil(serviciosFiltrados.length / ITEMS_PER_PAGE);
  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const paginatedServicios = serviciosFiltrados.slice(startIndex, startIndex + ITEMS_PER_PAGE);

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
          <ErrorState message={error} onRetry={fetchServicios} variant="light" />
        ) : (
          <>
            <p
              className="mb-6"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--text-sm)",
                color: "var(--color-text-on-light-faint)",
              }}
            >
              {serviciosFiltrados.length} {serviciosFiltrados.length === 1 ? "servicio" : "servicios"} encontrados
            </p>

            {serviciosFiltrados.length > 0 ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mt-6">
                  {paginatedServicios.map((s) => (
                    <ServiceCard key={s.id} {...s} theme="light" requiresAppointment={s.requiere_cita} />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex justify-center items-center mt-12 gap-2 sm:gap-4">
                    <button
                      onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                      disabled={page === 1}
                      style={{
                        backgroundColor: "transparent",
                        color: page === 1 ? "var(--color-text-on-light-faint)" : "var(--color-primary-dim)",
                        border: `1px solid ${page === 1 ? "var(--color-border-light)" : "var(--color-primary-dim)"}`,
                        padding: "8px 16px",
                        borderRadius: "var(--radius-full)",
                        fontFamily: "var(--font-body)",
                        fontWeight: 500,
                        cursor: page === 1 ? "not-allowed" : "pointer",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        if (page === 1) return;
                        e.currentTarget.style.backgroundColor = "var(--color-primary-dim)";
                        e.currentTarget.style.color = "white";
                      }}
                      onMouseLeave={(e) => {
                        if (page === 1) return;
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.style.color = "var(--color-primary-dim)";
                      }}
                    >
                      Anterior
                    </button>
                    
                    <span 
                      style={{
                        fontFamily: "var(--font-mono)", 
                        fontSize: "var(--text-sm)",
                        color: "var(--color-text-on-light)",
                        padding: "0 8px"
                      }}
                    >
                      Página {page} de {totalPages}
                    </span>

                    <button
                      onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={page === totalPages}
                      style={{
                        backgroundColor: "transparent",
                        color: page === totalPages ? "var(--color-text-on-light-faint)" : "var(--color-primary-dim)",
                        border: `1px solid ${page === totalPages ? "var(--color-border-light)" : "var(--color-primary-dim)"}`,
                        padding: "8px 16px",
                        borderRadius: "var(--radius-full)",
                        fontFamily: "var(--font-body)",
                        fontWeight: 500,
                        cursor: page === totalPages ? "not-allowed" : "pointer",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        if (page === totalPages) return;
                        e.currentTarget.style.backgroundColor = "var(--color-primary-dim)";
                        e.currentTarget.style.color = "white";
                      }}
                      onMouseLeave={(e) => {
                        if (page === totalPages) return;
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.style.color = "var(--color-primary-dim)";
                      }}
                    >
                      Siguiente
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
                  No encontramos servicios con ese criterio.
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  style={{ borderColor: "var(--color-primary-dim)", color: "var(--color-primary-dim)" }}
                  onClick={() => {
                    onSearchChange("");
                    onCategoryChange("Todos");
                  }}
                >
                  Limpiar filtros
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
