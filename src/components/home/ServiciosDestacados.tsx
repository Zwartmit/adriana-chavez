import { Button } from "@/components/ui/Button";
import { ServiceCard } from "@/components/servicios/ServiceCard";

interface ServicioDestacadoUI {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  image: string;
  href: string;
}

const SERVICIOS_DESTACADOS: ServicioDestacadoUI[] = [
  {
    id: "s1",
    name: "Balayage & Diseño de Color",
    description: "Técnica de iluminación personalizada para un cabello radiante y natural.",
    duration: 180,
    price: 150000,
    image: "/images/servicios/balayage.jpg",
    href: "/servicios",
  },
  {
    id: "s2",
    name: "Diseño y Perfilado de Cejas",
    description: "Definición perfecta que enmarca tu mirada según tus facciones.",
    duration: 30,
    price: 25000,
    image: "/images/servicios/cejas.jpg",
    href: "/servicios",
  },
  {
    id: "s3",
    name: "Maquillaje Profesional",
    description: "Resaltamos tu belleza para eventos especiales con productos de alta gama.",
    duration: 60,
    price: 80000,
    image: "/images/servicios/maquillaje.jpg",
    href: "/servicios",
  },
  {
    id: "s4",
    name: "Manicura Spa",
    description: "Cuidado completo para tus manos con esmaltado semipermanente.",
    duration: 45,
    price: 35000,
    image: "/images/servicios/unas.jpg",
    href: "/servicios",
  },
];

export function ServiciosDestacados() {

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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            {SERVICIOS_DESTACADOS.map((s) => (
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
