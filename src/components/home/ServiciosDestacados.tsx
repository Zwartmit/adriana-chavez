import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ServiceCard } from "@/components/servicios/ServiceCard";
import { LoadingState, ErrorState } from "@/components/ui/QueryState";
import { supabase } from "@/lib/supabase/client";

// Array local original — comentado por si hay que hacer rollback rápido.
// const SERVICIOS_DESTACADOS = [
//   {
//     id: "1",
//     name: "Corte & Estilo",
//     category: "Cabello",
//     description:
//       "Corte personalizado según tu tipo de rostro y estilo de vida, con blow dry incluido.",
//     duration: 60,
//     price: 85000,
//     image: "https://placehold.co/600x400/131118/D4AF6B?text=Corte",
//     href: "/servicios",
//   },
//   {
//     id: "2",
//     name: "Coloración Premium",
//     category: "Color",
//     description:
//       "Técnicas avanzadas de coloración: balayage, highlights, color completo y más.",
//     duration: 150,
//     price: 280000,
//     image: "https://placehold.co/600x400/1A1820/D4AF6B?text=Coloraci%C3%B3n",
//     href: "/servicios",
//   },
//   {
//     id: "3",
//     name: "Tratamiento Capilar",
//     category: "Tratamiento",
//     description:
//       "Nutrición profunda y restauración para cabello dañado o debilitado.",
//     duration: 90,
//     price: 150000,
//     image: "https://placehold.co/600x400/131118/D4AF6B?text=Tratamiento",
//     href: "/servicios",
//   },
//   {
//     id: "4",
//     name: "Manicure & Pedicure",
//     category: "Uñas",
//     description:
//       "Cuidado completo de manos y pies con técnicas semipermanentes o acrílico.",
//     duration: 75,
//     price: 95000,
//     image: "https://placehold.co/600x400/1A1820/D4AF6B?text=Manicure",
//     href: "/servicios",
//   },
// ];

interface ServicioDestacadoUI {
  id: string;
  name: string;
  category: string;
  description: string;
  duration: number;
  price: number;
  image: string;
  href: string;
}

export function ServiciosDestacados() {
  const [servicios, setServicios] = useState<ServicioDestacadoUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServiciosDestacados = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("servicios")
      .select("*, categorias_servicios(nombre)")
      .eq("destacado", true)
      .eq("activo", true)
      .order("orden", { ascending: true })
      .limit(4);

    if (error) {
      console.error("[ServiciosDestacados] error al cargar:", error.message);
      setError(error.message);
      setLoading(false);
      return;
    }

    console.log(`[ServiciosDestacados] ${data.length} registros cargados desde Supabase`);
    setServicios(
      data.map((s) => ({
        id: s.id,
        name: s.nombre,
        category: (s as unknown as { categorias_servicios: { nombre: string } | null }).categorias_servicios?.nombre ?? "",
        description: s.descripcion ?? "",
        duration: s.duracion_min,
        price: s.precio,
        image: s.imagen_url ?? "",
        href: "/servicios",
      })),
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchServiciosDestacados();
  }, [fetchServiciosDestacados]);

  return (
    <section
      className="section-glow-center"
      style={{
        backgroundColor: "var(--color-bg-alt)",
        color: "var(--color-text-primary)",
        paddingTop: "6rem",
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
        <div className="flex flex-col items-center text-center gap-4 mb-16">
          <span
            className="uppercase"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--text-xs)",
              letterSpacing: "var(--tracking-widest)",
              color: "var(--color-accent)",
            }}
          >
            Servicios destacados
          </span>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontWeight: 600,
              fontSize: "clamp(2rem, 4vw, 3rem)",
              lineHeight: "var(--leading-tight)",
            }}
          >
            Cuidado experto, resultados extraordinarios
          </h2>
        </div>

        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchServiciosDestacados} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {servicios.map((s) => (
              <ServiceCard key={s.id} {...s} />
            ))}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "center", marginTop: "2.5rem" }}>
          <a href="/servicios" style={{ display: "inline-block" }}>
            <Button variant="ghost" size="md">Ver todos los servicios →</Button>
          </a>
        </div>
      </div>
    </section>
  );
}
