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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12 items-center">
          <div className="md:col-span-3 flex flex-col gap-6">
            <SectionHeader
              eyebrow="Nuestra historia"
              title="Más de una década transformando belleza"
              titleSize="clamp(2rem, 4vw, 3rem)"
              titleColor="var(--color-text-on-light)"
              eyebrowColor="var(--color-primary-dim)"
            />
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-lg)",
                color: "var(--color-text-on-light-muted)",
                lineHeight: "var(--leading-relaxed)",
              }}
            >
              En Centro de Belleza Adriana Chávez convertimos cada visita en
              una experiencia de belleza, bienestar y confianza. Combinamos
              talento, innovación y atención personalizada para ofrecer
              resultados que realzan tu esencia y te hacen sentir hermosa en
              cada detalle.
            </p>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-lg)",
                color: "var(--color-text-on-light-muted)",
                lineHeight: "var(--leading-relaxed)",
              }}
            >
              Más que un salón de belleza, somos un espacio donde la
              experiencia, la innovación y el cuidado de cada detalle se unen
              para resaltar la belleza de cada persona. Nuestro compromiso es
              brindar un servicio personalizado con altos estándares de
              calidad, para que cada visita se convierta en una experiencia
              única.
            </p>
            <div style={{ marginTop: "1.5rem" }}>
              <a href="/sobre-nosotros" style={{ display: "inline-block" }}>
                <Button variant="secondary" size="md" style={{ borderColor: "#0A0A0B", color: "#0A0A0B" }}>
                  Conoce nuestra historia →
                </Button>
              </a>
            </div>
          </div>

          <div className="md:col-span-2 relative">
            <img
              src="https://placehold.co/600x700/1A1820/D4AF6B?text=Foto+Sal%C3%B3n"
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
                left: "-1.5rem",
                backgroundColor: "#0A0A0B",
                boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
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
                backgroundColor: "var(--color-surface-light)",
                border: "1px solid var(--color-border-light)",
                borderRadius: "var(--radius-xl)",
                padding: "2rem",
                borderTop: "3px solid transparent",
                boxShadow: "0 2px 12px rgba(10,10,11,0.08)",
                transition: "all 300ms ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderTopColor = "var(--color-primary-dim)";
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(10,10,11,0.12)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderTopColor = "transparent";
                e.currentTarget.style.boxShadow = "0 2px 12px rgba(10,10,11,0.08)";
              }}
            >
              <Icon size={28} color="var(--color-primary-dim)" />
              <h3
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 600,
                  fontSize: "var(--text-xl)",
                  color: "var(--color-text-on-light)",
                }}
              >
                {title}
              </h3>
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  color: "var(--color-text-on-light-muted)",
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
