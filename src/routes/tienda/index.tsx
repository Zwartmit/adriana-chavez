import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { TiendaFiltros } from "@/components/tienda/TiendaFiltros";
import { ProductosGrid } from "@/components/tienda/ProductosGrid";

export const Route = createFileRoute("/tienda/")({
  component: TiendaPage,
  head: () => ({
    meta: [
      { title: "Tienda — Adriana Chávez" },
      {
        name: "description",
        content:
          "Compra los productos de belleza profesionales que usamos en el centro. Envíos a toda Colombia.",
      },
    ],
  }),
});

function TiendaPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("todas");
  const [sortOrder, setSortOrder] = useState("destacados");
  const [filteredCount, setFilteredCount] = useState(16);

  const handleClearFilters = () => {
    setSearchQuery("");
    setActiveCategory("todas");
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
            Tienda virtual
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
            Cuida tu cabello
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
            Los mismos productos que usamos en el centro, ahora disponibles
            para ti en casa.
          </p>
        </div>
      </section>

      {/* Filtros */}
      <TiendaFiltros
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        sortOrder={sortOrder}
        onSortChange={setSortOrder}
        totalProducts={16}
        filteredCount={filteredCount}
      />

      {/* Grid */}
      <ProductosGrid
        searchQuery={searchQuery}
        activeCategory={activeCategory}
        sortOrder={sortOrder}
        onFilteredCountChange={setFilteredCount}
        onClearFilters={handleClearFilters}
      />
    </main>
  );
}
