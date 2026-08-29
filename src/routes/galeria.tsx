import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { GaleriaFiltros } from "@/components/galeria/GaleriaFiltros";
import { GaleriaGrid } from "@/components/galeria/GaleriaGrid";
import { Lightbox } from "@/components/galeria/Lightbox";
import { CTAFinal } from "@/components/home/CTAFinal";
import type { GaleriaItem } from "@/components/galeria/GaleriaGrid";

export const Route = createFileRoute("/galeria")({
  component: GaleriaPage,
  head: () => ({
    meta: [
      { title: "Galería | Centro de belleza Adriana Chávez" },
      {
        name: "description",
        content:
          "Explora nuestro portafolio de transformaciones reales: coloración, cortes, tratamientos y más. Resultados que hablan por sí solos.",
      },
    ],
  }),
});

function GaleriaPage() {
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [lightboxItem, setLightboxItem] = useState<GaleriaItem | null>(null);
  const [filteredItems, setFilteredItems] = useState<GaleriaItem[]>([]);

  const handlePrev = () => {
    const idx = filteredItems.findIndex((i) => i.id === lightboxItem?.id);
    if (idx > 0) setLightboxItem(filteredItems[idx - 1]);
  };
  const handleNext = () => {
    const idx = filteredItems.findIndex((i) => i.id === lightboxItem?.id);
    if (idx < filteredItems.length - 1) setLightboxItem(filteredItems[idx + 1]);
  };

  return (
    <main>
      {/* Hero */}
      <section
        data-navbar-dark
        className="relative overflow-hidden"
        style={{
          background: `
            radial-gradient(ellipse at 80% 50%, rgba(232,201,122,0.07) 0%, transparent 55%),
            var(--color-bg)
          `,
          minHeight: "220px",
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
            paddingTop: "2rem",
            paddingBottom: "2rem",
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
            Portafolio
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
            Nuestro trabajo
          </h1>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontWeight: 300,
              fontSize: "var(--text-lg)",
              color: "rgba(247,245,240,0.65)",
              maxWidth: "100%",
              lineHeight: "var(--leading-relaxed)",
            }}
          >
            Cada imagen cuenta una historia de transformación y confianza
            entre nosotras.
          </p>
        </div>
      </section>

      {/* Filtros */}
      <GaleriaFiltros
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        totalItems={18}
        filteredItems={filteredItems.length}
      />

      {/* Grid */}
      <GaleriaGrid
        activeCategory={activeCategory}
        onItemClick={setLightboxItem}
        onFilteredItemsChange={setFilteredItems}
      />

      {/* Lightbox */}
      {lightboxItem && (
        <Lightbox
          item={lightboxItem}
          items={filteredItems}
          onClose={() => setLightboxItem(null)}
          onPrev={handlePrev}
          onNext={handleNext}
        />
      )}

      {/* CTA */}
      <CTAFinal />
    </main>
  );
}
