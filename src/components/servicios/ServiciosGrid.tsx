import { Button } from "@/components/ui/Button";
import { ServiceCard } from "@/components/servicios/ServiceCard";

const SERVICIOS = [
  // CABELLO
  {
    id: "s1", name: "Corte & Estilo", category: "Cabello",
    description: "Corte personalizado según tu tipo de rostro y estilo de vida, con blow dry incluido.",
    duration: 60, price: 85000,
    image: "https://placehold.co/600x400/131118/D4AF6B?text=Corte+%26+Estilo",
    href: "/servicios",
  },
  {
    id: "s2", name: "Corte + Tratamiento", category: "Cabello",
    description: "Corte personalizado más tratamiento nutritivo para cabello sano y brillante.",
    duration: 90, price: 150000,
    image: "https://placehold.co/600x400/1A1820/D4AF6B?text=Corte+Tratamiento",
    href: "/servicios",
  },
  {
    id: "s3", name: "Blowout Premium", category: "Cabello",
    description: "Lavado, hidratación y blow dry profesional para un acabado perfecto y duradero.",
    duration: 45, price: 65000,
    image: "https://placehold.co/600x400/131118/D4AF6B?text=Blowout",
    href: "/servicios",
  },
  // COLOR
  {
    id: "s4", name: "Coloración Completa", category: "Color",
    description: "Coloración de raíz a puntas con productos premium. Incluye tratamiento post-color.",
    duration: 150, price: 220000,
    image: "https://placehold.co/600x400/1A1820/D4AF6B?text=Coloraci%C3%B3n",
    href: "/servicios",
  },
  {
    id: "s5", name: "Balayage", category: "Color",
    description: "Técnica de iluminación a mano alzada para un efecto natural y progresivo.",
    duration: 180, price: 320000,
    image: "https://placehold.co/600x400/131118/D4AF6B?text=Balayage",
    href: "/servicios",
  },
  {
    id: "s6", name: "Highlights & Mechas", category: "Color",
    description: "Mechones de color estratégicamente ubicados para dar luminosidad y volumen visual.",
    duration: 120, price: 280000,
    image: "https://placehold.co/600x400/1A1820/D4AF6B?text=Highlights",
    href: "/servicios",
  },
  // TRATAMIENTO
  {
    id: "s7", name: "Tratamiento Capilar", category: "Tratamiento",
    description: "Nutrición profunda y restauración para cabello dañado, seco o debilitado.",
    duration: 60, price: 120000,
    image: "https://placehold.co/600x400/131118/D4AF6B?text=Tratamiento",
    href: "/servicios",
  },
  {
    id: "s8", name: "Botox Capilar", category: "Tratamiento",
    description: "Tratamiento de relleno y nutrición extrema. Devuelve elasticidad y brillo al cabello.",
    duration: 90, price: 180000,
    image: "https://placehold.co/600x400/1A1820/D4AF6B?text=Bot%C3%B3x+Capilar",
    href: "/servicios",
  },
  {
    id: "s9", name: "Alisado Brasileño", category: "Tratamiento",
    description: "Reduce el frizz y define la forma del cabello con efecto duradero de hasta 6 meses.",
    duration: 180, price: 380000,
    image: "https://placehold.co/600x400/131118/D4AF6B?text=Alisado",
    href: "/servicios",
  },
  // UÑAS
  {
    id: "s10", name: "Manicure Semipermanente", category: "Uñas",
    description: "Esmaltado semipermanente de larga duración con acabado perfecto.",
    duration: 60, price: 70000,
    image: "https://placehold.co/600x400/1A1820/D4AF6B?text=Manicure",
    href: "/servicios",
  },
  {
    id: "s11", name: "Pedicure Spa", category: "Uñas",
    description: "Tratamiento completo de pies con exfoliación, hidratación y esmaltado.",
    duration: 75, price: 85000,
    image: "https://placehold.co/600x400/131118/D4AF6B?text=Pedicure+Spa",
    href: "/servicios",
  },
  // PEINADO
  {
    id: "s12", name: "Peinado para Eventos", category: "Peinado",
    description: "Peinado profesional para bodas, grados, fiestas y cualquier ocasión especial.",
    duration: 90, price: 150000,
    image: "https://placehold.co/600x400/1A1820/D4AF6B?text=Peinado+Evento",
    href: "/servicios",
  },
];

interface ServiciosGridProps {
  searchQuery: string;
  activeCategory: string;
  onSearchChange: (value: string) => void;
  onCategoryChange: (category: string) => void;
}

export function ServiciosGrid({
  searchQuery,
  activeCategory,
  onSearchChange,
  onCategoryChange,
}: ServiciosGridProps) {
  const serviciosFiltrados = SERVICIOS.filter((s) => {
    const matchesCategory = activeCategory === "Todos" || s.category === activeCategory;
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

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
        <p
          className="mb-6"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--text-sm)",
            color: "var(--color-text-muted)",
          }}
        >
          {serviciosFiltrados.length} {serviciosFiltrados.length === 1 ? "servicio" : "servicios"} encontrados
        </p>

        {serviciosFiltrados.length > 0 ? (
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            style={{
              backgroundColor: "var(--color-bg-alt)",
              borderRadius: "var(--radius-2xl)",
              padding: "2rem",
            }}
          >
            {serviciosFiltrados.map((s) => (
              <ServiceCard key={s.id} {...s} />
            ))}
          </div>
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
              No encontramos servicios con ese criterio.
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                onSearchChange("");
                onCategoryChange("Todos");
              }}
            >
              Limpiar filtros
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
