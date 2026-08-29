import { createFileRoute } from "@tanstack/react-router";
import { HeroBanner } from "@/components/home/HeroBanner";
import { PropuestaValor } from "@/components/home/PropuestaValor";
import { ServiciosDestacados } from "@/components/home/ServiciosDestacados";
import { GaleriaHome } from "@/components/home/GaleriaHome";
import { Testimonios } from "@/components/home/Testimonios";
import { FAQ } from "@/components/home/FAQ";
import { CTAFinal } from "@/components/home/CTAFinal";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: "Centro de belleza Adriana Chávez",
      },
      {
        name: "description",
        content:
          "Centro de belleza en Monterrey, Casanare con más de 12 años realzando tu estilo. Corte, coloración, tratamientos capilares y manicure con atención personalizada.",
      },
      {
        property: "og:title",
        content: "Adriana Chávez — Centro de belleza en Monterrey, Casanare.",
      },
      {
        property: "og:description",
        content:
          "Corte, color, tratamientos y manicure con técnicas premium y atención personalizada en Monterrey, Casanare.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <main>
      <HeroBanner />
      <PropuestaValor />
      <ServiciosDestacados />
      <GaleriaHome />
      <Testimonios />
      <FAQ />
      <CTAFinal />
    </main>
  );
}
