import { Button } from "@/components/ui/Button";
import { ServiceCard } from "@/components/servicios/ServiceCard";

const SERVICIOS_DESTACADOS = [
  {
    id: "1",
    name: "Corte & Estilo",
    category: "Cabello",
    description:
      "Corte personalizado según tu tipo de rostro y estilo de vida, con blow dry incluido.",
    duration: 60,
    price: 85000,
    image: "https://placehold.co/600x400/2A5C50/F7F5F0?text=Corte",
    href: "/servicios",
  },
  {
    id: "2",
    name: "Coloración Premium",
    category: "Color",
    description:
      "Técnicas avanzadas de coloración: balayage, highlights, color completo y más.",
    duration: 150,
    price: 280000,
    image: "https://placehold.co/600x400/1C3D35/C8A96E?text=Coloraci%C3%B3n",
    href: "/servicios",
  },
  {
    id: "3",
    name: "Tratamiento Capilar",
    category: "Tratamiento",
    description:
      "Nutrición profunda y restauración para cabello dañado o debilitado.",
    duration: 90,
    price: 150000,
    image: "https://placehold.co/600x400/2A5C50/F7F5F0?text=Tratamiento",
    href: "/servicios",
  },
  {
    id: "4",
    name: "Manicure & Pedicure",
    category: "Uñas",
    description:
      "Cuidado completo de manos y pies con técnicas semipermanentes o acrílico.",
    duration: 75,
    price: 95000,
    image: "https://placehold.co/600x400/1C3D35/C8A96E?text=Manicure",
    href: "/servicios",
  },
];

export function ServiciosDestacados() {
  return (
    <section
      style={{
        backgroundColor: "var(--color-primary)",
        color: "var(--color-text-inverse)",
        padding: "var(--section-padding-y) 0",
      }}
    >
      <div
        className="mx-auto"
        style={{
          maxWidth: "var(--container-max)",
          padding: "0 var(--container-padding)",
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
              fontWeight: 600,
              fontSize: "var(--text-5xl)",
              lineHeight: "var(--leading-tight)",
            }}
          >
            Cuidado experto, resultados extraordinarios
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {SERVICIOS_DESTACADOS.map((s) => (
            <ServiceCard key={s.id} {...s} />
          ))}
        </div>

        <div className="flex justify-center mt-12">
          <a href="/servicios">
            <Button variant="ghost">Ver todos los servicios →</Button>
          </a>
        </div>
      </div>
    </section>
  );
}
