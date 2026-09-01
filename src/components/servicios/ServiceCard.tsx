import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export interface ServiceCardProps {
  id: string;
  name: string;
  category?: string;
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

const REQUIRES_APPOINTMENT_SERVICES = [
  "balayage",
  "baby lights",
  "morena iluminada",
  "contour",
  "mechas clásicas",
  "decoloración parcial",
  "corrección de color",
  "micropigmentación de cejas",
  "micropigmentación de labios",
];

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
  
  const normalizedName = name.toLowerCase();
  const requiresAppointment = REQUIRES_APPOINTMENT_SERVICES.some(s => normalizedName.includes(s));

  return (
    <article className="flex flex-col h-full group">
      <div className="relative w-full overflow-hidden rounded-t-[var(--radius-xl)] aspect-square">
        <img
          src={image || "https://images.unsplash.com/photo-1562322140-8baeececf3df?q=80&w=400&auto=format&fit=crop"}
          alt={name}
          className="transition-transform duration-500 group-hover:scale-105 w-full h-full object-cover"
        />
        {requiresAppointment && (
          <span
            className="uppercase absolute top-2 right-2 sm:top-3 sm:right-3 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs"
            style={{
              backgroundColor: "var(--color-primary)",
              color: "var(--color-text-inverse)",
              fontFamily: "var(--font-mono)",
            }}
          >
            Requiere cita
          </span>
        )}
      </div>

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
          {category}
        </span>
        
        <a href={href}>
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

        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-1 sm:gap-x-2 mt-auto pt-2 w-full">
          <div
            className="flex items-center justify-center sm:justify-start gap-1 text-[10px] sm:text-xs"
            style={{
              fontFamily: "var(--font-mono)",
              color: isLight ? "var(--color-text-on-light-muted)" : "rgba(247, 245, 240, 0.6)",
            }}
          >
            <Clock size={12} className="sm:w-3.5 sm:h-3.5" />
            <span className="hidden sm:inline">{duration} min/aprox.</span>
            <span className="sm:hidden">{duration} min/aprox.</span>
          </div>
        </div>

        <div className="mt-1 sm:mt-2 flex flex-col items-center sm:items-start w-full">
          <span
            className="font-bold text-base sm:text-xl block"
            style={{
              fontFamily: "var(--font-mono)",
              color: isLight ? "var(--color-primary-dim)" : "var(--color-primary)",
            }}
          >
            {formatCOP(price)}
          </span>
        </div>

        <Button
          variant="accent"
          className="w-full mt-2 sm:mt-3 px-2 sm:px-4 text-xs sm:text-sm h-9 sm:h-10"
          onClick={() => window.location.href = href}
        >
          <span className="hidden sm:inline">Reservar cita →</span>
          <span className="sm:hidden">Reservar</span>
        </Button>
      </div>
    </article>
  );
}
