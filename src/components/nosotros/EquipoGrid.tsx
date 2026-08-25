import { useCallback, useEffect, useState } from "react";
import { Star } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { LoadingState, ErrorState } from "@/components/ui/QueryState";
import { supabase } from "@/lib/supabase/client";

// Array local original — comentado por si hay que hacer rollback rápido.
// const EQUIPO = [
//   {
//     id: "e1",
//     name: "Adriana Chávez",
//     role: "Fundadora & Directora Creativa",
//     experience: 14,
//     specialties: ["Coloración", "Balayage", "Dirección artística"],
//     photo: "https://placehold.co/120x120/1A1820/D4AF6B?text=AC",
//     bio: "Fundadora del salón con más de 14 años de experiencia. Formada en Colombia, México y España.",
//   },
//   // ... ver historial de git para el array completo de 4 estilistas
// ];

interface EstilistaUI {
  id: string;
  name: string;
  role: string;
  experience: number;
  specialties: string[];
  photo: string;
  bio: string;
}

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
        backgroundColor: "var(--color-surface-light)",
        border: "1px solid var(--color-border-light)",
        borderRadius: "var(--radius-xl)",
        padding: "2rem",
        boxShadow: "0 2px 12px rgba(10,10,11,0.08)",
        transition: "all var(--transition-slow)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 8px 24px rgba(10,10,11,0.12)";
        e.currentTarget.style.transform = "translateY(-3px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "0 2px 12px rgba(10,10,11,0.08)";
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
          border: "3px solid var(--color-primary-dim)",
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
          color: "var(--color-text-on-light)",
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
          color: "var(--color-primary-dim)",
        }}
      >
        {role}
      </p>

      <div style={{ borderTop: "1px solid var(--color-border-light)", margin: "1rem 0" }} />

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
          color: "var(--color-text-on-light-faint)",
        }}
      >
        <Star size={12} color="var(--color-primary-dim)" />
        {experience} años de exp.
      </div>
    </div>
  );
}

export function EquipoGrid() {
  const [equipo, setEquipo] = useState<EstilistaUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEquipo = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("estilistas")
      .select("*")
      .eq("activo", true)
      .order("orden", { ascending: true });

    if (error) {
      console.error("[EquipoGrid] error al cargar:", error.message);
      setError(error.message);
      setLoading(false);
      return;
    }

    console.log(`[EquipoGrid] ${data.length} registros cargados desde Supabase`);
    setEquipo(
      data.map((e) => ({
        id: e.id,
        name: e.nombre,
        role: e.cargo,
        experience: e.anos_experiencia,
        specialties: e.especialidades,
        photo: e.foto_url ?? "",
        bio: e.bio ?? "",
      })),
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchEquipo();
  }, [fetchEquipo]);

  return (
    <section
      style={{
        backgroundColor: "var(--color-bg-light)",
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
          titleColor="var(--color-text-on-light)"
          eyebrowColor="var(--color-primary-dim)"
        />

        {loading ? (
          <LoadingState variant="light" />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchEquipo} variant="light" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {equipo.map((e) => (
              <EstilistaCard key={e.id} {...e} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
