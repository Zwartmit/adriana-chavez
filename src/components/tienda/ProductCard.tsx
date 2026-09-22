import { Star } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/utils";

export interface ProductCardProps {
  id: string;
  name: string;
  brand: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  isNew?: boolean;
  isAgotado?: boolean;
  slug: string;
  descripcion_larga?: string;
  caracteristicas?: { label: string; valor: string }[];
  onAddToCart?: (product: ProductCardProps) => void;
  /** "dark" (default) for dark sections, "light" for --color-bg-light sections. */
  theme?: "dark" | "light";
}

export function ProductCard(props: ProductCardProps) {
  const {
    name,
    brand,
    description,
    price,
    image,
    isNew,
    isAgotado,
    slug,
    onAddToCart,
    theme = "dark",
  } = props;
  const isLight = theme === "light";

  return (
    <div className="flex flex-col h-full">
      <a
        href={`/tienda/${slug}`}
        className="group block relative w-full overflow-hidden rounded-t-[var(--radius-xl)] aspect-square"
      >
        {image ? (
          <img
            src={image}
            alt={name}
            className="transition-transform duration-500 group-hover:scale-105 w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: isLight ? "var(--color-surface-light)" : "var(--color-surface)" }}>
            <span style={{ color: isLight ? "var(--color-text-on-light-muted)" : "var(--color-text-faint)", fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)" }}>Sin imagen</span>
          </div>
        )}
        {isNew && !isAgotado && (
          <span
            className="uppercase absolute top-2 right-2 sm:top-3 sm:right-3 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs"
            style={{
              backgroundColor: "var(--color-primary)",
              color: "var(--color-text-inverse)",
              fontFamily: "var(--font-mono)",
            }}
          >
            Nuevo
          </span>
        )}
        {isAgotado && (
          <span
            className="uppercase absolute top-2 right-2 sm:top-3 sm:right-3 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs"
            style={{
              backgroundColor: "var(--color-text-muted)",
              color: "var(--color-text-inverse)",
              fontFamily: "var(--font-mono)",
            }}
          >
            Agotado
          </span>
        )}
      </a>

      <div
        className={`flex flex-col gap-1 p-3 sm:p-5 flex-1 rounded-b-[var(--radius-xl)] transition-all duration-300 items-center sm:items-start text-center sm:text-left ${
          isLight
            ? "bg-[var(--color-surface-light)] border border-t-0 border-[var(--color-border-light)] shadow-sm hover:shadow-md hover:-translate-y-1"
            : "bg-[var(--color-surface)] border border-t-0 border-[var(--color-border)]"
        }`}
      >
        <span
          className="uppercase text-[10px] sm:text-xs tracking-wider"
          style={{
            fontFamily: "var(--font-mono)",
            color: isLight ? "var(--color-primary-dim)" : "var(--color-accent)",
          }}
        >
          {brand}
        </span>
        
        <a href={`/tienda/${slug}`}>
          <h3
            className="font-semibold italic line-clamp-2 text-sm sm:text-lg leading-tight"
            style={{
              fontFamily: "var(--font-display)",
              color: isLight ? "var(--color-text-on-light)" : "var(--color-text-primary)",
            }}
          >
            {name}
          </h3>
        </a>
        
        <p
          className="hidden sm:-webkit-box line-clamp-2 text-xs sm:text-sm mt-1"
          style={{
            fontFamily: "var(--font-body)",
            color: isLight ? "var(--color-text-on-light-muted)" : "var(--color-text-secondary)",
          }}
        >
          {description}
        </p>

        <div className="mt-auto pt-2 sm:pt-4 flex flex-col items-center sm:items-start w-full">
          {isAgotado ? (
            <div className="flex flex-col">
              <span
                className="font-bold line-through text-base sm:text-xl"
                style={{
                  fontFamily: "var(--font-mono)",
                  color: isLight ? "var(--color-text-on-light-faint)" : "var(--color-text-muted)",
                }}
              >
                {formatPrice(price)}
              </span>
              <span className="text-xs sm:text-sm text-[var(--color-error)]">
                Agotado
              </span>
            </div>
          ) : (
            <span
              className="font-bold text-base sm:text-xl block"
              style={{
                fontFamily: "var(--font-mono)",
                color: isLight ? "var(--color-primary-dim)" : "var(--color-primary)",
              }}
            >
              {formatPrice(price)}
            </span>
          )}
        </div>

        <Button
          variant="accent"
          className="w-full mt-2 sm:mt-3 px-2 sm:px-4 text-xs sm:text-sm h-9 sm:h-10"
          disabled={isAgotado}
          onClick={() => onAddToCart?.(props)}
        >
          <span className="hidden sm:inline">Agregar al carrito →</span>
          <span className="sm:hidden">Agregar</span>
        </Button>
      </div>
    </div>
  );
}
