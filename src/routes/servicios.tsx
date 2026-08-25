import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ServiciosFiltros } from "@/components/servicios/ServiciosFiltros";
import { ServiciosGrid } from "@/components/servicios/ServiciosGrid";
import { CTAFinal } from "@/components/home/CTAFinal";

export const Route = createFileRoute("/servicios")({
  component: ServiciosPage,
  head: () => ({
    meta: [
      { title: "Servicios — Adriana Chávez" },
      {
        name: "description",
        content:
          "Descubre todos nuestros servicios de belleza en Bogotá: corte, coloración, tratamientos, uñas y más. Reserva tu cita hoy.",
      },
    ],
  }),
});

function ServiciosPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [categories, setCategories] = useState<string[]>([]);

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
            Servicios
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
            Nuestros servicios
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
            Cada servicio está diseñado para realzar tu belleza con técnicas
            de vanguardia y atención completamente personalizada.
          </p>
        </div>
      </section>

      {/* Filtros */}
      <ServiciosFiltros
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        categories={categories}
      />

      {/* Grid */}
      <ServiciosGrid
        searchQuery={searchQuery}
        activeCategory={activeCategory}
        onSearchChange={setSearchQuery}
        onCategoryChange={setActiveCategory}
        onCategoriesChange={setCategories}
      />

      {/* CTA */}
      <CTAFinal />
    </main>
  );
}
