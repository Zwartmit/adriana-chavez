import { createFileRoute } from "@tanstack/react-router";
import { Heart, Shield, Sparkles, Users } from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { EquipoGrid } from "@/components/nosotros/EquipoGrid";
import { CTAFinal } from "@/components/home/CTAFinal";

export const Route = createFileRoute("/sobre-nosotros")({
  component: SobreNosotrosPage,
  head: () => ({
    meta: [
      { title: "Sobre Nosotros — Adriana Chávez" },
      {
        name: "description",
        content:
          "Conoce la historia, el equipo y los valores del salón de belleza Adriana Chávez en Bogotá. Más de 12 años transformando belleza.",
      },
    ],
  }),
});

const VALORES = [
  {
    icon: Sparkles,
    title: "Excelencia",
    description: "Nos actualizamos constantemente en técnicas y tendencias internacionales.",
  },
  {
    icon: Heart,
    title: "Calidez",
    description: "Cada clienta es recibida como en casa. La confianza es nuestra base.",
  },
  {
    icon: Shield,
    title: "Integridad",
    description: "Trabajamos con productos seguros y técnicas que respetan la salud capilar.",
  },
  {
    icon: Users,
    title: "Comunidad",
    description: "Construimos relaciones duraderas. Muchas clientas son parte de nuestra familia.",
  },
];

const CIFRAS = [
  { value: "12+", label: "Años de experiencia" },
  { value: "500+", label: "Clientas satisfechas" },
  { value: "98%", label: "Satisfacción" },
  { value: "4", label: "Estilistas certificadas" },
];

function SobreNosotrosPage() {
  return (
    <main>
      {/* Hero */}
      <section
        className="relative overflow-hidden"
        style={{
          background: `
            radial-gradient(ellipse at 80% 50%, rgba(232,201,122,0.07) 0%, transparent 55%),
            var(--color-bg)
          `,
          minHeight: "320px",
          paddingTop: "80px",
          display: "flex",
          alignItems: "center",
        }}
      >
        <div
          className="mx-auto w-full"
          style={{
            maxWidth: "1200px",
            marginLeft: "auto",
            marginRight: "auto",
            paddingLeft: "1.5rem",
            paddingRight: "1.5rem",
            paddingTop: "4rem",
            paddingBottom: "4rem",
          }}
        >
          <div
            style={{
              width: 60,
              height: 2,
              backgroundColor: "var(--color-accent)",
              marginBottom: "1.5rem",
            }}
          />
          <p
            className="uppercase"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--text-xs)",
              letterSpacing: "var(--tracking-widest)",
              color: "var(--color-accent)",
              marginBottom: "1rem",
            }}
          >
            Sobre nosotros
          </p>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontWeight: 600,
              fontSize: "clamp(2.5rem, 5vw, 3.5rem)",
              color: "var(--color-text-primary)",
              lineHeight: "var(--leading-tight)",
              marginBottom: "1.25rem",
            }}
          >
            Adriana Chávez
          </h1>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontWeight: 300,
              fontSize: "var(--text-lg)",
              color: "rgba(247,245,240,0.65)",
              maxWidth: "520px",
              lineHeight: "var(--leading-relaxed)",
            }}
          >
            Más de una década dedicada a realzar la belleza de las mujeres de
            Bogotá.
          </p>
        </div>
      </section>

      {/* Historia */}
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
          <div className="grid grid-cols-1 lg:grid-cols-[45fr_55fr] gap-12 items-center">
            {/* Columna izquierda — imagen */}
            <div className="relative">
              <img
                src="https://placehold.co/580x680/1C3D35/C8A96E?text=Adriana+Ch%C3%A1vez"
                alt="Adriana Chávez"
                className="w-full h-auto"
                style={{ borderRadius: "var(--radius-2xl)" }}
              />
              <div
                className="absolute"
                style={{
                  bottom: "1.5rem",
                  right: "-1rem",
                  background: "linear-gradient(135deg, rgba(232,201,122,0.12) 0%, rgba(232,201,122,0.05) 100%)",
                  border: "0.5px solid rgba(232,201,122,0.35)",
                  boxShadow: "inset 0 1px 0 rgba(232,201,122,0.2), 0 8px 32px rgba(0,0,0,0.5)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  borderRadius: "var(--radius-xl)",
                  padding: "20px 24px",
                }}
              >
                <div
                  className="uppercase"
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "var(--text-xs)",
                    letterSpacing: "var(--tracking-wider)",
                    color: "var(--color-accent)",
                  }}
                >
                  Fundado en
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontStyle: "italic",
                    fontWeight: 700,
                    fontSize: "var(--text-4xl)",
                    color: "var(--color-text-primary)",
                  }}
                >
                  2012
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "var(--text-sm)",
                    color: "rgba(247,245,240,0.6)",
                  }}
                >
                  Bogotá, Colombia
                </div>
              </div>
            </div>

            {/* Columna derecha — texto */}
            <div className="flex flex-col gap-6">
              <SectionHeader eyebrow="Nuestra historia" title="El origen de una pasión" />
              <div className="flex flex-col" style={{ gap: "1.5rem" }}>
                <p
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "var(--text-lg)",
                    color: "var(--color-text-secondary)",
                    lineHeight: "var(--leading-relaxed)",
                  }}
                >
                  Todo comenzó en 2012 cuando Adriana Chávez decidió convertir
                  su pasión por la belleza en un espacio donde las mujeres
                  bogotanas pudieran sentirse verdaderamente especiales. Con
                  un pequeño local en el norte de Bogotá y una visión clara,
                  comenzó a construir lo que hoy es uno de los salones más
                  queridos de la ciudad.
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "var(--text-lg)",
                    color: "var(--color-text-secondary)",
                    lineHeight: "var(--leading-relaxed)",
                  }}
                >
                  A lo largo de los años, el salón creció no solo en tamaño
                  sino en propósito. Hoy contamos con un equipo de estilistas
                  certificados internacionalmente, productos de las mejores
                  marcas del mundo y un ambiente diseñado para que cada
                  visita sea una experiencia de bienestar completa.
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "var(--text-lg)",
                    color: "var(--color-text-secondary)",
                    lineHeight: "var(--leading-relaxed)",
                  }}
                >
                  Pero lo que realmente nos define no es nuestro espacio ni
                  nuestros productos — es la relación que construimos con
                  cada clienta. Muchas de ellas llevan años acompañándonos, y
                  eso es el logro del que más nos enorgullecemos.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Misión, Visión y Valores */}
      <section
        className="section-glow-center"
        style={{
          backgroundColor: "var(--color-bg-alt)",
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
            eyebrow="Nuestra esencia"
            title="Lo que nos mueve cada día"
            align="center"
            className="mx-auto mb-16"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
            <div
              style={{
                background: "linear-gradient(135deg, rgba(232,201,122,0.08) 0%, rgba(232,201,122,0.03) 100%)",
                border: "0.5px solid rgba(232,201,122,0.35)",
                boxShadow: "inset 0 1px 0 rgba(232,201,122,0.15), var(--shadow-lg)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                borderRadius: "var(--radius-xl)",
                padding: "2.5rem",
              }}
            >
              <p
                className="uppercase"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--text-xs)",
                  letterSpacing: "var(--tracking-widest)",
                  color: "var(--color-accent)",
                  marginBottom: "1rem",
                }}
              >
                Misión
              </p>
              <p
                style={{
                  fontFamily: "var(--font-display)",
                  fontStyle: "italic",
                  fontSize: "var(--text-xl)",
                  lineHeight: "var(--leading-relaxed)",
                  color: "rgba(247,245,240,0.85)",
                }}
              >
                Realzar la belleza única de cada clienta mediante servicios
                de excelencia, atención personalizada y un espacio donde cada
                mujer se sienta valorada, cómoda y extraordinaria.
              </p>
            </div>

            <div
              style={{
                background: "linear-gradient(135deg, rgba(232,201,122,0.08) 0%, rgba(232,201,122,0.03) 100%)",
                border: "0.5px solid rgba(232,201,122,0.35)",
                boxShadow: "inset 0 1px 0 rgba(232,201,122,0.15), var(--shadow-lg)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                borderRadius: "var(--radius-xl)",
                padding: "2.5rem",
              }}
            >
              <p
                className="uppercase"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--text-xs)",
                  letterSpacing: "var(--tracking-widest)",
                  color: "var(--color-accent)",
                  marginBottom: "1rem",
                }}
              >
                Visión
              </p>
              <p
                style={{
                  fontFamily: "var(--font-display)",
                  fontStyle: "italic",
                  fontSize: "var(--text-xl)",
                  lineHeight: "var(--leading-relaxed)",
                  color: "rgba(247,245,240,0.85)",
                }}
              >
                Ser el salón de referencia en Bogotá por la calidad de
                nuestros servicios, la formación continua de nuestro equipo y
                la experiencia única que ofrecemos a cada clienta que cruza
                nuestra puerta.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {VALORES.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex flex-col">
                <Icon size={32} color="var(--color-accent)" />
                <div
                  style={{
                    width: 40,
                    height: 2,
                    borderTop: "2px solid rgba(232,201,122,0.3)",
                    marginTop: "1rem",
                    marginBottom: "1rem",
                  }}
                />
                <h3
                  style={{
                    fontFamily: "var(--font-display)",
                    fontStyle: "italic",
                    fontWeight: 600,
                    fontSize: "var(--text-xl)",
                    color: "white",
                    marginBottom: "0.5rem",
                  }}
                >
                  {title}
                </h3>
                <p
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "var(--text-sm)",
                    color: "rgba(255,255,255,0.6)",
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

      {/* Equipo */}
      <EquipoGrid />

      {/* Cifras */}
      <section
        style={{
          backgroundColor: "var(--color-bg)",
          paddingTop: "5rem",
          paddingBottom: "5rem",
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
          <div className="grid grid-cols-2 md:grid-cols-4">
            {CIFRAS.map((c) => (
              <div
                key={c.label}
                className="flex flex-col items-center text-center gap-2 md:border-l md:first:border-l-0"
                style={{ borderColor: "var(--color-border)", padding: "0 1rem" }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    fontStyle: "italic",
                    fontWeight: 700,
                    fontSize: "clamp(2.5rem, 5vw, 4rem)",
                    color: "var(--color-primary)",
                  }}
                >
                  {c.value}
                </span>
                <span
                  className="uppercase"
                  style={{
                    fontFamily: "var(--font-body)",
                    fontWeight: 500,
                    fontSize: "var(--text-sm)",
                    color: "var(--color-text-secondary)",
                    letterSpacing: "var(--tracking-wide)",
                  }}
                >
                  {c.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <CTAFinal />
    </main>
  );
}
