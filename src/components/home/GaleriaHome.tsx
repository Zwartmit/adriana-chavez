import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { LoadingState, ErrorState } from "@/components/ui/QueryState";
import { supabase } from "@/lib/supabase/client";

// Array local original — comentado por si hay que hacer rollback rápido.
// const GALERIA = [
//   { id: "1", src: "https://placehold.co/600x800/181818/E8C97A?text=Antes+%26+Despu%C3%A9s", alt: "Transformación 1", gridRow: "span 2", gridColumn: undefined },
//   { id: "2", src: "https://placehold.co/600x400/131118/E8C97A?text=Coloraci%C3%B3n", alt: "Coloración", gridRow: undefined, gridColumn: undefined },
//   { id: "3", src: "https://placehold.co/600x800/131118/E8C97A?text=Corte", alt: "Corte", gridRow: "span 2", gridColumn: undefined },
//   { id: "4", src: "https://placehold.co/600x400/E8C97A/0A0A0B?text=Tratamiento", alt: "Tratamiento", gridRow: undefined, gridColumn: undefined },
//   { id: "5", src: "https://placehold.co/600x400/181818/F5F2EB?text=Peinado", alt: "Peinado", gridRow: undefined, gridColumn: undefined },
//   { id: "6", src: "https://placehold.co/800x400/131118/E8C97A?text=Manicure", alt: "Manicure", gridRow: undefined, gridColumn: "span 2" },
// ]

interface GaleriaHomeItem {
  id: string;
  src: string;
  alt: string;
  gridRow?: string;
  gridColumn?: string;
}

// Patrón de grid original repetido por índice (span2, normal, span2, normal, normal, span2col)
const GRID_PATTERN: { gridRow?: string; gridColumn?: string }[] = [
  { gridRow: "span 2" },
  {},
  { gridRow: "span 2" },
  {},
  {},
  { gridColumn: "span 2" },
];

export function GaleriaHome() {
  const [galeria, setGaleria] = useState<GaleriaHomeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGaleria = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("galeria")
      .select("*")
      .eq("activo", true)
      .order("orden", { ascending: true })
      .limit(6);

    if (error) {
      console.error("[GaleriaHome] error al cargar:", error.message);
      setError("Lo sentimos, en este momento tenemos problemas para cargar la galería. Intenta más tarde.");
      setLoading(false);
      return;
    }

    console.log(`[GaleriaHome] ${data.length} registros cargados desde Supabase`);
    setGaleria(
      data.map((g, i) => ({
        id: g.id,
        src: g.imagen_url,
        alt: g.titulo ?? g.tag ?? "",
        ...GRID_PATTERN[i % GRID_PATTERN.length],
      })),
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchGaleria();
  }, [fetchGaleria]);

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
          eyebrow="Portafolio"
          title="Nuestro trabajo habla por sí solo"
          align="center"
          titleSize="clamp(2rem, 4vw, 3rem)"
          className="mx-auto mb-12"
          titleColor="var(--color-text-on-light)"
          eyebrowColor="var(--color-primary-dim)"
        />

        {loading ? (
          <LoadingState variant="light" />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchGaleria} variant="light" />
        ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gridTemplateRows: "200px 200px 200px",
            gap: "0.75rem",
          }}
        >
          {galeria.map((g) => (
            <a
              key={g.id}
              href="/galeria"
              className="group"
              style={{
                display: "block",
                position: "relative",
                borderRadius: "var(--radius-xl)",
                overflow: "hidden",
                cursor: "pointer",
                gridRow: g.gridRow,
                gridColumn: g.gridColumn,
              }}
            >
              <img
                src={g.src}
                alt={g.alt}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                  transition: "transform var(--transition-slow)",
                }}
                className="group-hover:scale-105"
              />
              {/* Overlay */}
              <div
                className="opacity-0 group-hover:opacity-100"
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(180deg, rgba(10,10,11,0.15) 0%, rgba(10,10,11,0.75) 100%)",
                  transition: "opacity 350ms ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                  gap: "0.5rem",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    fontStyle: "italic",
                    fontSize: "var(--text-xl)",
                    color: "#F5F2EB",
                  }}
                >
                  Ver más →
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "var(--text-xs)",
                    letterSpacing: "var(--tracking-wider)",
                    textTransform: "uppercase",
                    color: "var(--color-primary)",
                  }}
                >
                  {g.alt}
                </span>
              </div>
            </a>
          ))}
        </div>
        )}

        <div style={{ display: "flex", justifyContent: "center", marginTop: "3rem" }}>
          <a href="/galeria" style={{ display: "inline-block" }}>
            <Button variant="primary" size="md">Ver portafolio completo →</Button>
          </a>
        </div>

      </div>
    </section>
  );
}
