import { Star } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { SectionHeader } from "@/components/ui/SectionHeader";

const EQUIPO = [
  {
    id: "e1",
    name: "Adriana Chávez",
    role: "Fundadora & Directora Creativa",
    experience: 14,
    specialties: ["Coloración", "Balayage", "Dirección artística"],
    photo: "https://placehold.co/120x120/1A1820/D4AF6B?text=AC",
    bio: "Fundadora del salón con más de 14 años de experiencia. Formada en Colombia, México y España.",
  },
  {
    id: "e2",
    name: "Valentina Mora",
    role: "Estilista Senior",
    experience: 8,
    specialties: ["Corte", "Peinado", "Tratamientos"],
    photo: "https://placehold.co/120x120/1A1820/D4AF6B?text=VM",
    bio: "Especialista en cortes de precisión y peinados para eventos. Certificada por L'Oréal Professionnel.",
  },
  {
    id: "e3",
    name: "Camila Restrepo",
    role: "Colorista",
    experience: 6,
    specialties: ["Highlights", "Mechas", "Color fantasy"],
    photo: "https://placehold.co/120x120/D4AF6B/0C0B0F?text=CR",
    bio: "Colorista especializada en técnicas de iluminación y color contemporáneo.",
  },
  {
    id: "e4",
    name: "Laura Jiménez",
    role: "Especialista en Uñas",
    experience: 5,
    specialties: ["Manicure", "Nail art", "Acrílico"],
    photo: "https://placehold.co/120x120/1A1820/D4AF6B?text=LJ",
    bio: "Especialista en nail art y técnicas de uñas con formación en Brasil y Colombia.",
  },
];

interface EstilistaCardProps {
  name: string;
  role: string;
  experience: number;
  specialties: string[];
  photo: string;
}

function EstilistaCard({ name, role, experience, specialties, photo }: EstilistaCardProps) {
  return (
    <div
      className="text-center"
      style={{
        backgroundColor: "var(--color-surface)",
        borderRadius: "var(--radius-xl)",
        padding: "2rem",
        boxShadow: "var(--shadow-card)",
        transition: "all var(--transition-slow)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "var(--shadow-lg)";
        e.currentTarget.style.transform = "translateY(-4px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "var(--shadow-card)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <img
        src={photo}
        alt={name}
        className="mx-auto rounded-full"
        style={{
          width: 120,
          height: 120,
          border: "3px solid var(--color-accent)",
          objectFit: "cover",
        }}
      />
      <h3
        className="mt-4"
        style={{
          fontFamily: "var(--font-display)",
          fontStyle: "italic",
          fontWeight: 600,
          fontSize: "var(--text-xl)",
          color: "var(--color-text-primary)",
        }}
      >
        {name}
      </h3>
      <p
        className="uppercase mt-1"
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "var(--text-xs)",
          letterSpacing: "var(--tracking-wider)",
          color: "var(--color-accent)",
        }}
      >
        {role}
      </p>

      <div style={{ borderTop: "1px solid var(--color-border)", margin: "1rem 0" }} />

      <div className="flex flex-wrap items-center justify-center gap-2">
        {specialties.slice(0, 3).map((s) => (
          <Badge key={s}>{s}</Badge>
        ))}
      </div>

      <div
        className="flex items-center justify-center gap-1 mt-4"
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "var(--text-sm)",
          color: "var(--color-text-muted)",
        }}
      >
        <Star size={12} color="var(--color-accent)" />
        {experience} años de exp.
      </div>
    </div>
  );
}

export function EquipoGrid() {
  return (
    <section
      style={{
        backgroundColor: "var(--color-bg-alt)",
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
        <SectionHeader
          eyebrow="Nuestro equipo"
          title="Las manos detrás de cada transformación"
          align="center"
          className="mx-auto mb-16"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {EQUIPO.map((e) => (
            <EstilistaCard key={e.id} {...e} />
          ))}
        </div>
      </div>
    </section>
  );
}
