import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { LoadingState, ErrorState } from "@/components/ui/QueryState";
import { supabase } from "@/lib/supabase/client";
import { ReactCompareSlider } from "react-compare-slider";

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
  srcAfter?: string | null;
  alt: string;
}

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
      .eq("destacado", true)
      .order("orden", { ascending: true })
      .limit(4);

    if (error) {
      console.error("[GaleriaHome] error al cargar:", error.message);
      setError("Lo sentimos, en este momento tenemos problemas para cargar la galería. Intenta más tarde.");
      setLoading(false);
      return;
    }

    setGaleria(
      data.map((g) => ({
        id: g.id,
        src: g.imagen_url,
        srcAfter: g.imagen_despues_url || null,
        alt: g.titulo ?? g.tag ?? "",
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
          maxWidth: "1440px",
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {galeria.map((g) => (
            <div
              key={g.id}
              className="group block relative rounded-xl overflow-hidden bg-[var(--color-bg-light-alt)] aspect-[3/4]"
            >
              {g.srcAfter ? (
                <ReactCompareSlider
                  itemOne={<img src={g.src} alt={g.alt + " Antes"} className="w-full h-full object-cover" />}
                  itemTwo={<img src={g.srcAfter} alt={g.alt + " Después"} className="w-full h-full object-cover" />}
                  className="w-full h-full transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <img
                  src={g.src}
                  alt={g.alt}
                  className="w-full h-full object-cover block transition-transform duration-500 group-hover:scale-105"
                />
              )}
            </div>
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
