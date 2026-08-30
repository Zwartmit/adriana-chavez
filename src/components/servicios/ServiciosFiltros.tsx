import { Search } from "lucide-react";

// Categorías hardcodeadas originales — comentado, ahora vienen de Supabase
// (categorias_servicios) vía ServiciosGrid → onCategoriesChange.
// const CATEGORIAS = ["Todos", "Cabello", "Color", "Tratamiento", "Uñas", "Peinado"];

interface ServiciosFiltrosProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  categories: string[];
}

export function ServiciosFiltros({
  searchQuery,
  onSearchChange,
  activeCategory,
  onCategoryChange,
  categories,
}: ServiciosFiltrosProps) {
  const CATEGORIAS = ["Todos", ...categories];
  return (
    <section
      data-navbar-dark
      style={{
        backgroundColor: "var(--color-bg-alt)",
        paddingTop: "1.5rem",
        paddingBottom: "1.5rem",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          marginLeft: "auto",
          marginRight: "auto",
          paddingLeft: "1.5rem",
          paddingRight: "1.5rem",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
        }}
      >
        {/* Búsqueda — ancho fijo compacto */}
        <div className="relative shrink-0" style={{ width: 300 }}>
          <Search
            size={15}
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--color-text-muted)",
            }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar..."
            className="w-full outline-none"
            style={{
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-lg)",
              padding: "9px 12px 9px 34px",
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-sm)",
              color: "var(--color-text-primary)",
              transition: "border-color var(--transition-base)",
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "var(--color-primary)"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "var(--color-border)"; }}
          />
        </div>

        {/* Separador vertical */}
        <div
          style={{
            width: 1,
            height: 28,
            backgroundColor: "var(--color-border)",
            flexShrink: 0,
          }}
        />

        {/* Filtros — scroll horizontal, ocupa el resto del espacio */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            overflowX: "auto",
            scrollbarWidth: "none",
            flex: 1,
            minWidth: 0,
          }}
        >
          {CATEGORIAS.map((cat) => {
            const active = cat === activeCategory;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => onCategoryChange(cat)}
                style={{
                  flexShrink: 0,
                  backgroundColor: active ? "var(--color-primary)" : "var(--color-surface)",
                  border: `1px solid ${active ? "var(--color-primary)" : "var(--color-border)"}`,
                  color: active ? "var(--color-text-inverse)" : "var(--color-text-secondary)",
                  borderRadius: "var(--radius-full)",
                  padding: "7px 16px",
                  fontFamily: "var(--font-body)",
                  fontWeight: 500,
                  fontSize: "var(--text-sm)",
                  whiteSpace: "nowrap",
                  transition: "all var(--transition-base)",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  if (active) return;
                  e.currentTarget.style.borderColor = "var(--color-primary)";
                  e.currentTarget.style.color = "var(--color-primary)";
                }}
                onMouseLeave={(e) => {
                  if (active) return;
                  e.currentTarget.style.borderColor = "var(--color-border)";
                  e.currentTarget.style.color = "var(--color-text-secondary)";
                }}
              >
                {cat}
              </button>
            );
          })}
          {/* Spacer para que el último botón no quede pegado al borde */}
          <div style={{ width: 16, flexShrink: 0 }} aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}
