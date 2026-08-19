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
  rating: number;
  reviews: number;
  isNew?: boolean;
  isAgotado?: boolean;
  slug: string;
  onAddToCart?: (product: ProductCardProps) => void;
}

export function ProductCard(props: ProductCardProps) {
  const {
    name,
    brand,
    description,
    price,
    image,
    rating,
    reviews,
    isNew,
    isAgotado,
    slug,
    onAddToCart,
  } = props;

  return (
    <div className="flex flex-col">
      <a
        href={`/tienda/${slug}`}
        className="group block relative"
        style={{
          position: "relative",
          aspectRatio: "1 / 1",
          overflow: "hidden",
          borderRadius: "var(--radius-xl) var(--radius-xl) 0 0",
        }}
      >
        <img
          src={image}
          alt={name}
          className="transition-transform duration-500 group-hover:scale-105"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        {isNew && !isAgotado && (
          <span
            className="uppercase"
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              backgroundColor: "var(--color-primary)",
              color: "var(--color-text-inverse)",
              fontFamily: "var(--font-mono)",
              fontSize: "var(--text-xs)",
              padding: "4px 10px",
              borderRadius: "var(--radius-full)",
            }}
          >
            Nuevo
          </span>
        )}
        {isAgotado && (
          <span
            className="uppercase"
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              backgroundColor: "var(--color-text-muted)",
              color: "var(--color-text-inverse)",
              fontFamily: "var(--font-mono)",
              fontSize: "var(--text-xs)",
              padding: "4px 10px",
              borderRadius: "var(--radius-full)",
            }}
          >
            Agotado
          </span>
        )}
      </a>

      <div
        className="flex flex-col gap-1"
        style={{
          backgroundColor: "var(--color-surface)",
          borderLeft: "1px solid var(--color-border)",
          borderRight: "1px solid var(--color-border)",
          borderBottom: "1px solid var(--color-border)",
          borderRadius: "0 0 var(--radius-xl) var(--radius-xl)",
          padding: "1.25rem",
          flex: 1,
        }}
      >
        <span
          className="uppercase"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--text-xs)",
            letterSpacing: "var(--tracking-wider)",
            color: "var(--color-accent)",
          }}
        >
          {brand}
        </span>
        <a href={`/tienda/${slug}`}>
          <h3
            style={{
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontWeight: 600,
              fontSize: "var(--text-lg)",
              color: "var(--color-text-primary)",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {name}
          </h3>
        </a>
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-sm)",
            color: "var(--color-text-secondary)",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {description}
        </p>

        <div className="flex items-center gap-2 mt-1">
          <span style={{ color: "var(--color-accent)" }}>
            {"★".repeat(Math.round(rating))}
          </span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--text-xs)",
              color: "var(--color-text-muted)",
            }}
          >
            ({rating}) {reviews} reseñas
          </span>
        </div>

        <div className="mt-2">
          {isAgotado ? (
            <>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontWeight: 700,
                  fontSize: "var(--text-xl)",
                  color: "var(--color-text-muted)",
                  textDecoration: "line-through",
                }}
              >
                {formatPrice(price)}
              </span>
              <div
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--text-sm)",
                  color: "var(--color-error)",
                }}
              >
                Agotado
              </div>
            </>
          ) : (
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontWeight: 700,
                fontSize: "var(--text-xl)",
                color: "var(--color-primary)",
              }}
            >
              {formatPrice(price)}
            </span>
          )}
        </div>

        <Button
          variant="accent"
          className="w-full mt-3"
          disabled={isAgotado}
          onClick={() => onAddToCart?.(props)}
        >
          Agregar al carrito →
        </Button>
      </div>
    </div>
  );
}
