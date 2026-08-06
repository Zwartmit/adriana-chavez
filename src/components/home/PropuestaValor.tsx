import { Award, Heart, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";

const VALORES = [
  {
    icon: Award,
    title: "Experiencia certificada",
    description:
      "Estilistas con formación internacional y actualización constante en técnicas premium.",
  },
  {
    icon: Heart,
    title: "Confianza personalizada",
    description:
      "Escuchamos, asesoramos y diseñamos cada servicio pensando en ti y tu estilo único.",
  },
  {
    icon: Sparkles,
    title: "Cuidado premium",
    description:
      "Productos de alta gama y protocolos de bienestar que cuidan tu cabello y tu tiempo.",
  },
];

export function PropuestaValor() {
  return (
    <section
      style={{
        backgroundColor: "var(--color-bg)",
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12 items-center">
          <div className="md:col-span-3 flex flex-col gap-6">
            <SectionHeader
              eyebrow="Nuestra historia"
              title="Más de una década transformando belleza"
              titleSize="clamp(2rem, 4vw, 3rem)"
            />
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-lg)",
                color: "var(--color-text-secondary)",
                lineHeight: "var(--leading-relaxed)",
              }}
            >
              En Adriana Chávez creemos que cada persona merece sentirse
              extraordinaria. Desde 2012, hemos acompañado a cientos de clientas
              en Bogotá a descubrir y realzar su mejor versión con técnicas de
              vanguardia y un servicio profundamente personalizado.
            </p>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-lg)",
                color: "var(--color-text-secondary)",
                lineHeight: "var(--leading-relaxed)",
              }}
            >
              Nuestro equipo de estilistas certificados combina creatividad y
              precisión técnica para garantizar resultados que superan
              expectativas, en un espacio diseñado para que te sientas
              completamente a gusto.
            </p>
            <div>
              <a href="/sobre-nosotros">
                <Button variant="secondary">Conoce nuestra historia →</Button>
              </a>
            </div>
          </div>

          <div className="md:col-span-2 relative">
            <img
              src="https://placehold.co/600x700/EFECE5/1C3D35?text=Foto+Sal%C3%B3n"
              alt="Salón Adriana Chávez"
              width={600}
              height={700}
              className="w-full h-auto"
              style={{ borderRadius: "var(--radius-2xl)" }}
            />
            <div
              className="absolute"
              style={{
                bottom: "1.5rem",
                left: "-1rem",
                backgroundColor: "var(--color-surface)",
                boxShadow: "var(--shadow-lg)",
                borderRadius: "var(--radius-xl)",
                padding: "16px 20px",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontWeight: 700,
                  color: "var(--color-accent)",
                  fontSize: "var(--text-base)",
                }}
              >
                ★ 4.9 / 5.0
              </div>
              <div
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--text-sm)",
                  color: "var(--color-text-secondary)",
                }}
              >
                +320 reseñas
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 mt-20" style={{ gap: "2rem" }}>
          {VALORES.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="group flex flex-col items-center text-center gap-3 hover:-translate-y-1"
              style={{
                backgroundColor: "var(--color-surface)",
                borderRadius: "var(--radius-xl)",
                padding: "2rem",
                borderTop: "3px solid transparent",
                boxShadow: "var(--shadow-card)",
                transition: "all 300ms ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderTopColor = "var(--color-accent)";
                e.currentTarget.style.boxShadow = "var(--shadow-md)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderTopColor = "transparent";
                e.currentTarget.style.boxShadow = "var(--shadow-card)";
              }}
            >
              <Icon size={28} color="var(--color-accent)" />
              <h3
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 600,
                  fontSize: "var(--text-xl)",
                  color: "var(--color-text-primary)",
                }}
              >
                {title}
              </h3>
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  color: "var(--color-text-secondary)",
                  lineHeight: "var(--leading-relaxed)",
                }}
              >
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
