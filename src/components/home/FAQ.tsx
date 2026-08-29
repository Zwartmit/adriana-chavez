import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";

const FAQS = [
  {
    q: "¿Con cuánto tiempo debo agendar una cita?",
    a: "Recomendamos agendar tu cita con al menos 3 a 5 días de anticipación para asegurar disponibilidad, especialmente en fines de semana.",
  },
  {
    q: "¿Realizan servicios sin cita previa?",
    a: "Sí, pero están sujetos a disponibilidad. Para garantizar tu atención, lo ideal es reservar con anticipación.",
  },
  {
    q: "¿Cuánto duran los servicios de color o balayage?",
    a: "Dependiendo del tipo de trabajo, pueden durar entre 2 y 8 horas, ya que se personaliza cada técnica según el cabello.",
  },
  {
    q: "¿La micropigmentación duele?",
    a: "Es un procedimiento mínimamente incómodo. Se utiliza anestesia tópica para reducir cualquier molestia durante la aplicación.",
  },
  {
    q: "¿Qué productos utilizan en el centro?",
    a: "Trabajamos con productos profesionales de alta calidad que cuidan la salud del cabello, la piel y las uñas, garantizando mejores resultados.",
  },
  {
    q: "¿Cuánto tiempo duran las uñas semipermanentes?",
    a: "Generalmente duran entre 2 y 3 semanas, dependiendo del crecimiento de la uña y los cuidados posteriores.",
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

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
          eyebrow="Preguntas frecuentes"
          title="Todo lo que necesitas saber"
          align="center"
          titleSize="clamp(1.75rem, 3vw, 2.5rem)"
          className="mx-auto mb-12"
          titleColor="var(--color-text-on-light)"
          eyebrowColor="var(--color-primary-dim)"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {FAQS.map((f, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={f.q}
                style={{ borderTop: "1px solid var(--color-border-light)" }}
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-4 text-left"
                  style={{
                    padding: "1.25rem 0",
                    fontFamily: "var(--font-body)",
                    fontSize: "var(--text-lg)",
                    fontWeight: isOpen ? 600 : 500,
                    color: isOpen
                      ? "var(--color-primary-dim)"
                      : "var(--color-text-on-light)",
                    transition: "color var(--transition-base)",
                  }}
                  aria-expanded={isOpen}
                >
                  <span>{f.q}</span>
                  <ChevronDown
                    size={20}
                    style={{
                      transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 300ms ease",
                      color: "var(--color-text-on-light-muted)",
                      flexShrink: 0,
                    }}
                  />
                </button>
                <div
                  style={{
                    maxHeight: isOpen ? "400px" : "0px",
                    overflow: "hidden",
                    transition: "max-height 300ms ease",
                  }}
                >
                  <p
                    style={{
                      paddingBottom: "1.5rem",
                      fontFamily: "var(--font-body)",
                      color: "var(--color-text-on-light-muted)",
                      lineHeight: "var(--leading-relaxed)",
                    }}
                  >
                    {f.a}
                  </p>
                </div>
              </div>
            );
          })}

        </div>
      </div>
    </section>
  );
}
