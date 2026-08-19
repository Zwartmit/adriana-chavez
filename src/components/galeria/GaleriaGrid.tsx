import { useEffect } from "react";
import { ZoomIn } from "lucide-react";

export interface GaleriaItem {
  id: string;
  src: string;
  alt: string;
  category: string;
  tag?: string;
  aspectRatio: "tall" | "wide" | "square";
}

const GALERIA_ITEMS: GaleriaItem[] = [
  // Antes & Después
  { id: "g1", src: "https://placehold.co/400x600/131118/E8C97A?text=Antes+%26+Despu%C3%A9s+1", alt: "Transformación completa 1", category: "Antes & Después", tag: "Transformación completa", aspectRatio: "tall" },
  { id: "g2", src: "https://placehold.co/400x600/181818/E8C97A?text=Antes+%26+Despu%C3%A9s+2", alt: "Transformación completa 2", category: "Antes & Después", tag: "Cambio de look", aspectRatio: "tall" },
  { id: "g3", src: "https://placehold.co/400x600/131118/E8C97A?text=Antes+%26+Despu%C3%A9s+3", alt: "Transformación completa 3", category: "Antes & Después", tag: "Renovación total", aspectRatio: "tall" },

  // Coloración
  { id: "g4", src: "https://placehold.co/600x400/181818/E8C97A?text=Balayage", alt: "Balayage natural", category: "Coloración", tag: "Balayage", aspectRatio: "wide" },
  { id: "g5", src: "https://placehold.co/500x500/131118/E8C97A?text=Highlights", alt: "Highlights dorados", category: "Coloración", tag: "Highlights", aspectRatio: "square" },
  { id: "g6", src: "https://placehold.co/600x400/E8C97A/0A0A0B?text=Color+completo", alt: "Color completo castaño", category: "Coloración", tag: "Color completo", aspectRatio: "wide" },
  { id: "g7", src: "https://placehold.co/400x600/181818/E8C97A?text=Mechas", alt: "Mechas californianas", category: "Coloración", tag: "Mechas californianas", aspectRatio: "tall" },

  // Corte
  { id: "g8", src: "https://placehold.co/500x500/131118/E8C97A?text=Corte+bob", alt: "Corte bob moderno", category: "Corte", tag: "Bob moderno", aspectRatio: "square" },
  { id: "g9", src: "https://placehold.co/600x400/181818/E8C97A?text=Corte+largo", alt: "Corte en capas largo", category: "Corte", tag: "Capas largas", aspectRatio: "wide" },
  { id: "g10", src: "https://placehold.co/400x600/E8C97A/0A0A0B?text=Corte+pixie", alt: "Corte pixie", category: "Corte", tag: "Pixie cut", aspectRatio: "tall" },

  // Tratamiento
  { id: "g11", src: "https://placehold.co/600x400/131118/E8C97A?text=Alisado", alt: "Alisado brasileño", category: "Tratamiento", tag: "Alisado brasileño", aspectRatio: "wide" },
  { id: "g12", src: "https://placehold.co/500x500/181818/E8C97A?text=Bot%C3%B3x+capilar", alt: "Botox capilar", category: "Tratamiento", tag: "Botox capilar", aspectRatio: "square" },
  { id: "g13", src: "https://placehold.co/400x600/131118/E8C97A?text=Tratamiento", alt: "Tratamiento nutritivo", category: "Tratamiento", tag: "Nutrición profunda", aspectRatio: "tall" },

  // Uñas
  { id: "g14", src: "https://placehold.co/500x500/E8C97A/0A0A0B?text=Manicure", alt: "Manicure semipermanente", category: "Uñas", tag: "Semipermanente", aspectRatio: "square" },
  { id: "g15", src: "https://placehold.co/600x400/181818/E8C97A?text=Nail+art", alt: "Nail art diseño floral", category: "Uñas", tag: "Nail art", aspectRatio: "wide" },

  // Peinado
  { id: "g16", src: "https://placehold.co/400x600/131118/E8C97A?text=Peinado+novia", alt: "Peinado de novia", category: "Peinado", tag: "Novia", aspectRatio: "tall" },
  { id: "g17", src: "https://placehold.co/600x400/181818/E8C97A?text=Recogido", alt: "Recogido elegante", category: "Peinado", tag: "Recogido elegante", aspectRatio: "wide" },
  { id: "g18", src: "https://placehold.co/500x500/E8C97A/0A0A0B?text=Ondas", alt: "Ondas naturales", category: "Peinado", tag: "Ondas naturales", aspectRatio: "square" },
];

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
  const itemsFiltrados = GALERIA_ITEMS.filter(
    (item) => activeCategory === "Todos" || item.category === activeCategory,
  );

  useEffect(() => {
    onFilteredItemsChange(itemsFiltrados);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory]);

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
        <div
          key={activeCategory}
          className="animate-in fade-in duration-300 columns-1 sm:columns-2 lg:columns-3 gap-x-4"
        >
          {itemsFiltrados.map((item) => (
            <GaleriaCard key={item.id} item={item} onClick={() => onItemClick(item)} />
          ))}
        </div>
      </div>
    </section>
  );
}
