import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

export interface ServiceCardProps {
  id: string;
  name: string;
  category: string;
  description: string;
  duration: number;
  price: number;
  image: string;
  href: string;
}

function formatCOP(n: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);
}

export function ServiceCard({
  name,
  category,
  description,
  duration,
  price,
  image,
  href,
}: ServiceCardProps) {
  return (
    <article
      className="flex flex-col overflow-hidden group"
      style={{
        backgroundColor: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "var(--radius-xl)",
        transition: "all var(--transition-base)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.08)";
        e.currentTarget.style.borderColor = "rgba(200, 169, 110, 0.4)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)";
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
      }}
    >
      <div className="relative overflow-hidden" style={{ aspectRatio: "16/9" }}>
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>

      <div className="flex flex-col gap-3 p-6 flex-1">
        <Badge>{category}</Badge>
        <h3
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 600,
            fontSize: "var(--text-2xl)",
            color: "var(--color-text-inverse)",
            lineHeight: "var(--leading-tight)",
          }}
        >
          {name}
        </h3>
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-sm)",
            color: "rgba(247, 245, 240, 0.7)",
            lineHeight: "var(--leading-relaxed)",
          }}
        >
          {description}
        </p>

        <div
          className="flex items-center justify-between mt-auto pt-4"
          style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
        >
          <div
            className="flex items-center gap-2"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--text-xs)",
              color: "rgba(247, 245, 240, 0.6)",
            }}
          >
            <Clock size={14} />
            {duration} min
          </div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontWeight: 600,
              fontSize: "var(--text-lg)",
              color: "var(--color-accent)",
            }}
          >
            {formatCOP(price)}
          </div>
        </div>

        <a
          href={href}
          className="inline-flex items-center justify-center mt-2"
          style={{
            backgroundColor: "var(--color-accent)",
            color: "var(--color-primary-dim)",
            fontFamily: "var(--font-body)",
            fontWeight: 600,
            fontSize: "var(--text-sm)",
            padding: "10px 20px",
            borderRadius: "var(--radius-full)",
            transition: "background-color var(--transition-base)",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = "var(--color-accent-dim)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "var(--color-accent)")
          }
        >
          Reservar →
        </a>
      </div>
    </article>
  );
}
