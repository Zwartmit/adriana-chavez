import { useCallback, useEffect, useState } from "react";
import { Star } from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { LoadingState, ErrorState } from "@/components/ui/QueryState";
import { supabase } from "@/lib/supabase/client";

interface ProfesionalUI {
  id: string;
  name: string;
  experience: number;
  specialties: string[];
  photo: string;
  bio: string;
}

interface ProfesionalCardProps {
  name: string;
  experience: number;
  specialties: string[];
  photo: string;
}

function ProfesionalCard({ name, experience, specialties, photo }: ProfesionalCardProps) {
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


      <div style={{ borderTop: "1px solid var(--color-border-light)", margin: "1rem 0" }} />

      <div className="flex flex-col items-center justify-center gap-y-1">
        {specialties
          .flatMap((s) => s.split(/\s+/))
          .filter(Boolean)
          .slice(0, 4)
          .map((s, idx) => (
            <span
              key={`${s}-${idx}`}
              className="uppercase text-center"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--text-xs)",
                letterSpacing: "var(--tracking-wider)",
                color: "var(--color-primary-dim)",
              }}
            >
              {s}
            </span>
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
  const [equipo, setEquipo] = useState<ProfesionalUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEquipo = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("profesionales")
      .select("*")
      .eq("activo", true)
      .order("orden", { ascending: true });

    if (error) {
      console.error("[EquipoGrid] error al cargar:", error.message);
      setError("Lo sentimos, en este momento tenemos problemas para cargar el equipo. Intenta más tarde.");
      setLoading(false);
      return;
    }

    setEquipo(
      data.map((e) => ({
        id: e.id,
        name: e.nombre,
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
              <ProfesionalCard key={e.id} {...e} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

