import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";

const GALERIA = [
  { id: "1", src: "https://placehold.co/600x800/1C3D35/C8A96E?text=Antes+%26+Despu%C3%A9s", alt: "Transformación 1", gridRow: "span 2", gridColumn: undefined },
  { id: "2", src: "https://placehold.co/600x400/2A5C50/F7F5F0?text=Coloraci%C3%B3n", alt: "Coloración", gridRow: undefined, gridColumn: undefined },
  { id: "3", src: "https://placehold.co/600x800/EFECE5/1C3D35?text=Corte", alt: "Corte", gridRow: "span 2", gridColumn: undefined },
  { id: "4", src: "https://placehold.co/600x400/C8A96E/1C3D35?text=Tratamiento", alt: "Tratamiento", gridRow: undefined, gridColumn: undefined },
  { id: "5", src: "https://placehold.co/600x400/1C3D35/F7F5F0?text=Peinado", alt: "Peinado", gridRow: undefined, gridColumn: undefined },
  { id: "6", src: "https://placehold.co/800x400/2A5C50/C8A96E?text=Manicure", alt: "Manicure", gridRow: undefined, gridColumn: "span 2" },
]

export function GaleriaHome() {
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
          maxWidth: "1200px",
          marginLeft: "auto",
          marginRight: "auto",
          paddingLeft: "1.5rem",
          paddingRight: "1.5rem",
        }}
      >
        <SectionHeader
          eyebrow="Portafolio"
          title="Nuestro trabajo habla por sí solo"
          align="center"
          className="mx-auto mb-12"
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "1rem",
          }}
        >
          {GALERIA.map((g) => (
            <a
              key={g.id}
              href="/galeria"
              className="group block"
              style={{
                position: "relative",
                overflow: "hidden",
                borderRadius: "var(--radius-xl)",
                ...g.style,
              }}
            >
              <img
                src={g.src}
                alt={g.alt}
                className="transition-transform duration-500 group-hover:scale-105"
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
              <div
                className="opacity-0 group-hover:opacity-100"
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "rgba(0, 0, 0, 0.6)",
                  transition: "opacity 300ms ease",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    fontStyle: "italic",
                    fontSize: "var(--text-2xl)",
                    color: "var(--color-text-inverse)",
                  }}
                >
                  Ver más →
                </span>
              </div>
            </a>
          ))}
        </div>

        <div className="flex justify-center mt-12">
          <a href="/galeria">
            <Button variant="primary">Ver portafolio completo →</Button>
          </a>
        </div>
      </div>
    </section>
  );
}
