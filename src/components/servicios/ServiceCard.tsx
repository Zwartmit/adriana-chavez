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
  /** "dark" (default, glass card) for dark sections, "light" for --color-bg-light sections. */
  theme?: "dark" | "light";
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
  theme = "dark",
}: ServiceCardProps) {
  const isLight = theme === "light";

  return (
    <article
      className={isLight ? "flex flex-col group" : "service-card-nc flex flex-col group"}
      style={
        isLight
          ? {
              backgroundColor: "var(--color-surface-light)",
              border: "1px solid var(--color-border-light)",
              boxShadow: "0 2px 12px rgba(10,10,11,0.08)",
              borderRadius: "var(--radius-xl)",
              overflow: "hidden",
              transition: "box-shadow var(--transition-slow), transform var(--transition-slow)",
              position: "relative",
            }
          : {
              background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
              border: "0.5px solid rgba(255,255,255,0.08)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 4px 24px rgba(0,0,0,0.4)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              borderRadius: "var(--radius-xl)",
              overflow: "hidden",
              transition: "border-color var(--transition-slow), box-shadow var(--transition-slow)",
              position: "relative",
            }
      }
      onMouseEnter={(e) => {
        if (isLight) {
          e.currentTarget.style.boxShadow = "0 8px 24px rgba(10,10,11,0.12)";
          e.currentTarget.style.transform = "translateY(-3px)";
        } else {
          e.currentTarget.style.borderColor = "rgba(232,201,122,0.35)";
          e.currentTarget.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.5)";
        }
      }}
      onMouseLeave={(e) => {
        if (isLight) {
          e.currentTarget.style.boxShadow = "0 2px 12px rgba(10,10,11,0.08)";
          e.currentTarget.style.transform = "translateY(0)";
        } else {
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
          e.currentTarget.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.06), 0 4px 24px rgba(0,0,0,0.4)";
        }
      }}
    >
      <div className="relative" style={{ height: "180px", overflow: "hidden" }}>
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>

      <div className="flex flex-col gap-3 p-5 flex-1">

        <Badge>{category}</Badge>
        <h3
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 600,
            fontSize: "var(--text-2xl)",
            color: isLight ? "var(--color-text-on-light)" : "var(--color-text-primary)",
            lineHeight: "var(--leading-tight)",
          }}
        >
          {name}
        </h3>
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-sm)",
            color: isLight ? "var(--color-text-on-light-muted)" : "rgba(247, 245, 240, 0.7)",
            lineHeight: "var(--leading-relaxed)",
          }}
        >
          {description}
        </p>

        <div
          className="flex items-center justify-between mt-auto pt-4"
          style={{ borderTop: isLight ? "1px solid var(--color-border-light)" : "1px solid rgba(255,255,255,0.08)" }}
        >
          <div
            className="flex items-center gap-2"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--text-xs)",
              color: isLight ? "var(--color-text-on-light-muted)" : "rgba(247, 245, 240, 0.6)",
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
              color: isLight ? "var(--color-primary-dim)" : "var(--color-accent)",
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
            color: "var(--color-text-inverse)",
            fontFamily: "var(--font-body)",
            fontWeight: 600,
            fontSize: "var(--text-sm)",
            letterSpacing: "var(--tracking-wide)",
            padding: "12px 28px",
            minHeight: "44px",
            whiteSpace: "nowrap",
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
