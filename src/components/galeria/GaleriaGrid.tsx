import { useCallback, useEffect, useState } from "react";
import { ZoomIn } from "lucide-react";
import { LoadingState, ErrorState } from "@/components/ui/QueryState";
import { supabase } from "@/lib/supabase/client";

export interface GaleriaItem {
  id: string;
  src: string;
  alt: string;
  category: string;
  tag?: string;
  aspectRatio: "tall" | "wide" | "square";
}

// Array local original — comentado por si hay que hacer rollback rápido.
// const GALERIA_ITEMS: GaleriaItem[] = [
//   // Antes & Después
//   { id: "g1", src: "https://placehold.co/400x600/131118/E8C97A?text=Antes+%26+Despu%C3%A9s+1", alt: "Transformación completa 1", category: "Antes & Después", tag: "Transformación completa", aspectRatio: "tall" },
//   { id: "g2", src: "https://placehold.co/400x600/181818/E8C97A?text=Antes+%26+Despu%C3%A9s+2", alt: "Transformación completa 2", category: "Antes & Después", tag: "Cambio de look", aspectRatio: "tall" },
//   { id: "g3", src: "https://placehold.co/400x600/131118/E8C97A?text=Antes+%26+Despu%C3%A9s+3", alt: "Transformación completa 3", category: "Antes & Después", tag: "Renovación total", aspectRatio: "tall" },
//   // ... ver historial de git para el array completo de 18 items
// ];

const ASPECT_CYCLE: GaleriaItem["aspectRatio"][] = ["tall", "wide", "square"];

interface GaleriaCardProps {
  item: GaleriaItem;
  onClick: () => void;
}

function GaleriaCard({ item, onClick }: GaleriaCardProps) {
  return (
    <div
      onClick={onClick}
      className="group relative cursor-pointer"
      style={{
        breakInside: "avoid",
        marginBottom: "1rem",
        borderRadius: "var(--radius-xl)",
        overflow: "hidden",
      }}
    >
      <img
        src={item.src}
        alt={item.alt}
        style={{ width: "100%", height: "auto", display: "block", objectFit: "cover" }}
      />
      <div
        className="absolute opacity-0 group-hover:opacity-100 flex flex-col justify-end"
        style={{
          inset: 0,
          backgroundColor: "rgba(12,11,15,0.75)",
          transition: "opacity 300ms ease",
          padding: "1.25rem",
        }}
      >
        <div className="flex items-end justify-between gap-2">
          <div className="flex flex-col gap-1">
            {item.tag && (
              <span
                className="uppercase"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--text-xs)",
                  color: "var(--color-accent)",
                }}
              >
                {item.tag}
              </span>
            )}
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontStyle: "italic",
                fontSize: "var(--text-xl)",
                color: "white",
              }}
            >
              {item.category}
            </span>
          </div>
          <ZoomIn size={24} color="white" />
        </div>
      </div>
    </div>
  );
}

interface GaleriaGridProps {
  activeCategory: string;
  onItemClick: (item: GaleriaItem) => void;
  onFilteredItemsChange: (items: GaleriaItem[]) => void;
}

export function GaleriaGrid({
  activeCategory,
  onItemClick,
  onFilteredItemsChange,
}: GaleriaGridProps) {
  const [galeriaItems, setGaleriaItems] = useState<GaleriaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGaleria = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("galeria")
      .select("*")
      .eq("activo", true)
      .order("orden", { ascending: true });

    if (error) {
      console.error("[GaleriaGrid] error al cargar:", error.message);
      setError(error.message);
      setLoading(false);
      return;
    }

    console.log(`[GaleriaGrid] ${data.length} registros cargados desde Supabase`);
    setGaleriaItems(
      data.map((g, i) => ({
        id: g.id,
        src: g.imagen_url,
        alt: g.titulo ?? g.tag ?? "",
        category: g.categoria,
        tag: g.tag ?? undefined,
        aspectRatio: ASPECT_CYCLE[i % ASPECT_CYCLE.length],
      })),
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchGaleria();
  }, [fetchGaleria]);

  const itemsFiltrados = galeriaItems.filter(
    (item) => activeCategory === "Todos" || item.category === activeCategory,
  );

  useEffect(() => {
    onFilteredItemsChange(itemsFiltrados);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory, galeriaItems]);

  return (
    <section
      style={{
        backgroundColor: "var(--color-bg-light)",
        paddingTop: "3rem",
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
        {loading ? (
          <LoadingState variant="light" />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchGaleria} variant="light" />
        ) : (
          <div
            key={activeCategory}
            className="animate-in fade-in duration-300 columns-1 sm:columns-2 lg:columns-3 gap-x-4"
          >
            {itemsFiltrados.map((item) => (
              <GaleriaCard key={item.id} item={item} onClick={() => onItemClick(item)} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
