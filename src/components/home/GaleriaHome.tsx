import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";

const GALERIA = [
  {
    id: "1",
    src: "https://placehold.co/600x800/1C3D35/C8A96E?text=Antes+%26+Despu%C3%A9s",
    alt: "Transformación 1",
    className: "md:row-span-2",
  },
  {
    id: "2",
    src: "https://placehold.co/600x400/2A5C50/F7F5F0?text=Coloraci%C3%B3n",
    alt: "Coloración",
    className: "",
  },
  {
    id: "3",
    src: "https://placehold.co/600x800/EFECE5/1C3D35?text=Corte",
    alt: "Corte",
    className: "md:row-span-2",
  },
  {
    id: "4",
    src: "https://placehold.co/600x400/C8A96E/1C3D35?text=Tratamiento",
    alt: "Tratamiento",
    className: "",
  },
  {
    id: "5",
    src: "https://placehold.co/600x400/1C3D35/F7F5F0?text=Peinado",
    alt: "Peinado",
    className: "",
  },
  {
    id: "6",
    src: "https://placehold.co/800x400/2A5C50/C8A96E?text=Manicure",
    alt: "Manicure",
    className: "md:col-span-2",
  },
];

export function GaleriaHome() {
  return (
    <section
      style={{
        backgroundColor: "var(--color-bg-alt)",
        padding: "var(--section-padding-y) 0",
      }}
    >
      <div
        className="mx-auto"
        style={{
          maxWidth: "var(--container-max)",
          padding: "0 var(--container-padding)",
        }}
      >
        <SectionHeader
          eyebrow="Portafolio"
          title="Nuestro trabajo habla por sí solo"
          align="center"
          className="mx-auto mb-12"
        />

        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6"
          style={{ gridAutoRows: "220px" }}
        >
          {GALERIA.map((g) => (
            <a
              key={g.id}
              href="/galeria"
              className={`group relative block overflow-hidden ${g.className}`}
              style={{ borderRadius: "var(--radius-xl)" }}
            >
              <img
                src={g.src}
                alt={g.alt}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div
                className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  backgroundColor: "rgba(15, 36, 32, 0.6)",
                  color: "var(--color-text-inverse)",
                }}
              >
                <span
                  className="inline-flex items-center gap-2"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontStyle: "italic",
                    fontSize: "var(--text-2xl)",
                  }}
                >
                  Antes & Después <ArrowUpRight size={20} />
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
