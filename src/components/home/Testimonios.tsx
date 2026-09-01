import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Star } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { LoadingState, ErrorState } from "@/components/ui/QueryState";
import { supabase } from "@/lib/supabase/client";

// Array local original — comentado por si hay que hacer rollback rápido.
// const TESTIMONIOS = [
//   {
//     id: "1",
//     name: "María García",
//     since: "Clienta desde 2021",
//     service: "Coloración Premium",
//     rating: 5,
//     text: "El mejor centro en el que he estado. El resultado superó todas mis expectativas. Adriana y su equipo son increíbles.",
//     initials: "MG",
//   },
//   {
//     id: "2",
//     name: "Laura Rodríguez",
//     since: "Clienta desde 2020",
//     service: "Corte & Estilo",
//     rating: 5,
//     text: "Llevo 4 años yendo y nunca me han decepcionado. El ambiente es precioso y el trato es excepcional.",
//     initials: "LR",
//   },
//   {
//     id: "3",
//     name: "Daniela Torres",
//     since: "Clienta desde 2022",
//     service: "Tratamiento Capilar",
//     rating: 5,
//     text: "Mi cabello estaba muy dañado y después del tratamiento quedó como nuevo. 100% recomendado.",
//     initials: "DT",
//   },
//   {
//     id: "4",
//     name: "Valentina López",
//     since: "Clienta desde 2019",
//     service: "Manicure & Pedicure",
//     rating: 5,
//     text: "El servicio de uñas es impecable. Duran semanas perfectas y los diseños son exactamente lo que pido.",
//     initials: "VL",
//   },
//   {
//     id: "5",
//     name: "Camila Martínez",
//     since: "Clienta desde 2023",
//     service: "Coloración Premium",
//     rating: 5,
//     text: "Primera vez que venía y ya soy clienta fija. El equipo es profesional, cálido y muy detallista.",
//     initials: "CM",
//   },
// ];

interface TestimonioUI {
  id: string;
  name: string;
  since: string;
  service: string;
  rating: number;
  text: string;
  initials: string;
}

function toInitials(nombre: string): string {
  return nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function Testimonios() {
  const [testimonios, setTestimonios] = useState<TestimonioUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTestimonios = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("testimonios")
      .select("*")
      .eq("aprobado", true)
      .order("orden", { ascending: true });

    if (error) {
      console.error("[Testimonios] error al cargar:", error.message);
      setError("Lo sentimos, en este momento tenemos problemas para cargar los testimonios. Intenta más tarde.");
      setLoading(false);
      return;
    }

    setTestimonios(
      data.map((t) => ({
        id: t.id,
        name: t.nombre,
        since: t.desde_anio ? `Clienta desde ${t.desde_anio}` : "",
        service: t.servicio ?? "",
        rating: t.rating,
        text: t.texto,
        initials: toInitials(t.nombre),
      })),
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTestimonios();
  }, [fetchTestimonios]);

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
  }, [emblaApi, onSelect, testimonios]);

  return (
    <section
      data-navbar-dark
      style={{
        backgroundColor: "var(--color-surface)",
        paddingTop: "4rem",
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

        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchTestimonios} />
        ) : (
          <>
            <div className="overflow-hidden" ref={emblaRef}>
              <div className="flex gap-6">
                {testimonios.map((t) => (
                  <div
                    key={t.id}
                    className="shrink-0 basis-full md:basis-1/2 lg:basis-1/3 self-stretch px-2"
                  >
                    <article
                      className="min-h-full flex flex-col gap-4"
                      style={{
                        background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
                        border: "0.5px solid rgba(255,255,255,0.08)",
                        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), var(--shadow-card)",
                        backdropFilter: "blur(12px)",
                        WebkitBackdropFilter: "blur(12px)",
                        borderRadius: "var(--radius-2xl)",
                        padding: "2rem 2rem 1.5rem",
                        transition: "border-color var(--transition-slow), box-shadow var(--transition-slow)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "rgba(232,201,122,0.35)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
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

            <div className="flex justify-center gap-2 mt-12">
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
          </>
        )}
      </div>
    </section>
  );
}
