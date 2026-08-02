import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";

const FAQS = [
  {
    q: "¿Necesito cita previa para ser atendida?",
    a: "Sí, trabajamos únicamente con cita previa para garantizarte atención personalizada y sin esperas. Puedes reservar desde nuestra web, WhatsApp o llamando directamente.",
  },
  {
    q: "¿Cuánto tiempo dura un servicio de coloración?",
    a: "Depende de la técnica: una coloración completa toma entre 2 y 3 horas, mientras que un balayage puede tomar entre 2.5 y 4 horas. Te informamos el tiempo exacto al momento de reservar.",
  },
  {
    q: "¿Aceptan pagos con tarjeta débito y crédito?",
    a: "Sí, aceptamos todas las formas de pago: efectivo, tarjeta débito, tarjeta crédito y transferencia bancaria. Para compras en nuestra tienda virtual procesamos pagos a través de Wompi.",
  },
  {
    q: "¿Qué pasa si necesito cancelar o reprogramar mi cita?",
    a: "Puedes cancelar o reprogramar sin costo hasta 24 horas antes de tu cita. Con menos de 24 horas de anticipación aplicamos una tarifa de cancelación del 20% del servicio reservado.",
  },
  {
    q: "¿Tienen estacionamiento disponible?",
    a: "Sí, contamos con parqueadero disponible en el edificio sin costo adicional para nuestras clientas durante el tiempo del servicio.",
  },
  {
    q: "¿Realizan servicios a domicilio?",
    a: "Por el momento no contamos con servicio a domicilio. Todos nuestros servicios se realizan en el salón para garantizar la calidad y los resultados que nos caracterizan.",
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section
      style={{
        backgroundColor: "var(--color-bg-alt)",
        paddingTop: "6rem",
        paddingBottom: "6rem",
      }}
    >
      <div
        className="mx-auto"
        style={{
          maxWidth: "720px",
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
        />

        <div className="flex flex-col">
          {FAQS.map((f, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={f.q}
                style={{ borderTop: "1px solid var(--color-border)" }}
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
                      ? "var(--color-primary)"
                      : "var(--color-text-primary)",
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
                      color: "var(--color-accent)",
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
                      color: "var(--color-text-secondary)",
                      lineHeight: "var(--leading-relaxed)",
                    }}
                  >
                    {f.a}
                  </p>
                </div>
              </div>
            );
          })}
          <div style={{ borderTop: "1px solid var(--color-border)" }} />
        </div>
      </div>
    </section>
  );
}
