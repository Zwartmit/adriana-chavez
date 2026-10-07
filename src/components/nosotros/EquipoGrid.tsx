import { useCallback, useEffect, useState } from "react";
import { Star, Check } from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { LoadingState, ErrorState } from "@/components/ui/QueryState";
import { supabase } from "@/lib/supabase/client";

interface ProfesionalUI {
  id: string;
  name: string;
  experience: number;
  bio: string;
  specialties: string[];
  photo: string;
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
      className="flex flex-col md:flex-row gap-6 md:gap-10 items-center md:items-stretch w-full"
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
      {/* IZQUIERDA: Foto, nombre, experiencia */}
      <div className="flex flex-col items-center justify-start min-w-[200px] pt-2">
        {photo ? (
          <img
            src={photo}
            alt={name}
            className="rounded-full mb-4"
            style={{
              width: 120,
              height: 120,
              border: "3px solid var(--color-primary-dim)",
              objectFit: "cover",
            }}
          />
        ) : (
          <div 
            className="rounded-full mb-4 flex items-center justify-center font-display font-semibold"
            style={{
              width: 120,
              height: 120,
              border: "3px solid var(--color-primary-dim)",
              backgroundColor: "var(--color-bg-light-alt)",
              color: "var(--color-text-on-light-muted)",
              fontSize: "3rem"
            }}
          >
            {name.charAt(0).toUpperCase()}
          </div>
        )}
        <h3
          style={{
            fontFamily: "var(--font-display)",
            fontStyle: "italic",
            fontWeight: 600,
            fontSize: "var(--text-2xl)",
            color: "var(--color-text-on-light)",
            textAlign: "center"
          }}
        >
          {name}
        </h3>
        <div
          className="flex items-center justify-center gap-1 mt-2"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--text-sm)",
            color: "var(--color-text-on-light-faint)",
          }}
        >
          <Star size={14} color="var(--color-primary-dim)" />
          {experience} años de exp.
        </div>
      </div>

      {/* SEPARADOR */}
      <div className="hidden md:block w-px bg-black/5 mx-2" />
      <div className="md:hidden w-full h-px bg-black/5 my-2" />

      {/* DERECHA: Especialidades */}
      <div className="flex-1 flex flex-col justify-start py-2">
        <h4 
          className="mb-4 text-center md:text-left uppercase tracking-widest"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            color: "var(--color-text-on-light-muted)",
          }}
        >
          Especialidades
        </h4>
        <ul className="flex flex-col items-start gap-3 w-full">
          {specialties.map((s, idx) => (
            <li
              key={`${s}-${idx}`}
              className="flex items-start gap-2.5 text-left"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "13px",
                color: "var(--color-text-on-light-muted)",
                lineHeight: "1.4",
              }}
            >
              <Check 
                size={16} 
                className="mt-[2px] shrink-0" 
                color="var(--color-primary-dim)" 
              />
              <span>{s}</span>
            </li>
          ))}
        </ul>
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
          maxWidth: "1440px",
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
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 w-full max-w-7xl mx-auto">
            {equipo.map((e) => (
              <ProfesionalCard key={e.id} {...e} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

