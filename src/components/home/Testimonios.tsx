import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Star } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { SectionHeader } from "@/components/ui/SectionHeader";

const TESTIMONIOS = [
  {
    id: "1",
    name: "María García",
    since: "Clienta desde 2021",
    service: "Coloración Premium",
    rating: 5,
    text: "El mejor salón en el que he estado. El resultado superó todas mis expectativas. Adriana y su equipo son increíbles.",
    initials: "MG",
  },
  {
    id: "2",
    name: "Laura Rodríguez",
    since: "Clienta desde 2020",
    service: "Corte & Estilo",
    rating: 5,
    text: "Llevo 4 años yendo y nunca me han decepcionado. El ambiente es precioso y el trato es excepcional.",
    initials: "LR",
  },
  {
    id: "3",
    name: "Daniela Torres",
    since: "Clienta desde 2022",
    service: "Tratamiento Capilar",
    rating: 5,
    text: "Mi cabello estaba muy dañado y después del tratamiento quedó como nuevo. 100% recomendado.",
    initials: "DT",
  },
  {
    id: "4",
    name: "Valentina López",
    since: "Clienta desde 2019",
    service: "Manicure & Pedicure",
    rating: 5,
    text: "El servicio de uñas es impecable. Duran semanas perfectas y los diseños son exactamente lo que pido.",
    initials: "VL",
  },
  {
    id: "5",
    name: "Camila Martínez",
    since: "Clienta desde 2023",
    service: "Coloración Premium",
    rating: 5,
    text: "Primera vez que venía y ya soy clienta fija. El equipo es profesional, cálido y muy detallista.",
    initials: "CM",
  },
];

export function Testimonios() {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "start",
    slidesToScroll: 1,
  });
  const [selected, setSelected] = useState(0);
  const [snaps, setSnaps] = useState<number[]>([]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelected(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    setSnaps(emblaApi.scrollSnapList());
    emblaApi.on("select", onSelect);
    onSelect();
    const id = setInterval(() => emblaApi.scrollNext(), 5000);
    return () => {
      clearInterval(id);
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  return (
    <section
      style={{
        backgroundColor: "var(--color-surface)",
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
          eyebrow="Testimonios"
          title="Lo que dicen nuestras clientas"
          align="center"
          titleSize="clamp(1.75rem, 3vw, 2.5rem)"
          className="mx-auto mb-12"
        />

        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-6">
            {TESTIMONIOS.map((t) => (
              <div
                key={t.id}
                className="shrink-0 basis-full md:basis-1/2 lg:basis-1/3"
              >
                <article
                  className="h-full flex flex-col gap-4"
                  style={{
                    backgroundColor: "var(--color-bg)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-2xl)",
                    padding: "2rem",
                    boxShadow: "var(--shadow-card)",
                  }}
                >
                  <div className="flex gap-1">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        fill="var(--color-accent)"
                        color="var(--color-accent)"
                      />
                    ))}
                  </div>
                  <p
                    style={{
                      fontFamily: "var(--font-display)",
                      fontStyle: "italic",
                      fontSize: "var(--text-lg)",
                      lineHeight: "var(--leading-relaxed)",
                      color: "var(--color-text-primary)",
                    }}
                  >
                    “{t.text}”
                  </p>
                  <Badge>{t.service}</Badge>
                  <div className="flex items-center gap-3 mt-auto pt-4">
                    <div
                      className="flex items-center justify-center rounded-full shrink-0"
                      style={{
                        width: 48,
                        height: 48,
                        backgroundColor: "var(--color-accent-lt)",
                        color: "var(--color-primary)",
                        fontFamily: "var(--font-display)",
                        fontWeight: 600,
                      }}
                    >
                      {t.initials}
                    </div>
                    <div className="flex flex-col">
                      <span
                        style={{
                          fontFamily: "var(--font-body)",
                          fontWeight: 600,
                          fontSize: "var(--text-sm)",
                          color: "var(--color-text-primary)",
                        }}
                      >
                        {t.name}
                      </span>
                      <span
                        style={{
                          fontFamily: "var(--font-body)",
                          fontSize: "var(--text-xs)",
                          color: "var(--color-text-muted)",
                        }}
                      >
                        {t.since}
                      </span>
                    </div>
                  </div>
                </article>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center gap-2 mt-8">
          {snaps.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Ir al testimonio ${i + 1}`}
              onClick={() => emblaApi?.scrollTo(i)}
              style={{
                width: i === selected ? 24 : 8,
                height: 8,
                borderRadius: "var(--radius-full)",
                backgroundColor:
                  i === selected
                    ? "var(--color-accent)"
                    : "var(--color-border)",
                transition: "all var(--transition-base)",
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
