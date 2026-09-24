import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ServiceCard } from "@/components/servicios/ServiceCard";
import { supabase } from "@/lib/supabase/client";

interface ServicioDestacadoUI {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  image: string;
  href: string;
  requiresAppointment: boolean;
  orden: number;
}

export function ServiciosDestacados() {
  const [servicios, setServicios] = useState<ServicioDestacadoUI[]>([]);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("servicios")
        .select("*")
        .eq("activo", true)
        .eq("destacado", true)
        .order("orden", { ascending: true })
        .limit(4);
      
      if (!error && data) {
        setServicios(
          data.map(s => ({
            id: s.id,
            name: s.nombre,
            description: s.descripcion ?? "",
            duration: s.duracion_min,
            price: s.precio,
            image: s.imagen_url ?? "",
            href: "/servicios",
            requiresAppointment: s.requiere_cita ?? false,
            orden: s.orden
          }))
        );
      }
    }
    load();
  }, []);

  return (
    <section
      data-navbar-dark
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
          maxWidth: "1440px",
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-center">
          {servicios.map((s) => (
            <ServiceCard key={s.id} {...s} />
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "center", marginTop: "2.5rem" }}>
          <a href="/servicios" style={{ display: "inline-block" }}>
            <Button variant="ghost" size="md">Ver todos los servicios →</Button>
          </a>
        </div>
      </div>
    </section>
  );
}
