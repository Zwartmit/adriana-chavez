const CATEGORIAS = [
  "Todos",
  "Antes & Después",
  "Coloración",
  "Corte",
  "Tratamiento",
  "Uñas",
  "Peinado",
];

interface GaleriaFiltrosProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  totalItems: number;
  filteredItems: number;
}

export function GaleriaFiltros({
  activeCategory,
  onCategoryChange,
  totalItems,
  filteredItems,
}: GaleriaFiltrosProps) {
  return (
    <section
      data-navbar-dark
      style={{
        backgroundColor: "var(--color-bg-alt)",
        paddingTop: "2rem",
        paddingBottom: "2rem",
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
        <div
          className="flex items-center gap-3 overflow-x-auto"
          style={{ scrollbarWidth: "none" }}
        >
          {CATEGORIAS.map((cat) => {
            const active = cat === activeCategory;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => onCategoryChange(cat)}
                className="shrink-0"
                style={{
                  backgroundColor: active ? "var(--color-primary)" : "var(--color-surface)",
                  border: `1px solid ${active ? "var(--color-primary)" : "var(--color-border)"}`,
                  color: active ? "var(--color-text-inverse)" : "var(--color-text-secondary)",
                  borderRadius: "var(--radius-full)",
                  padding: "8px 20px",
                  fontFamily: "var(--font-body)",
                  fontWeight: 500,
                  fontSize: "var(--text-sm)",
                  whiteSpace: "nowrap",
                  transition: "all var(--transition-base)",
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
        </div>

        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--text-sm)",
            color: "var(--color-text-muted)",
            marginTop: "1rem",
          }}
        >
          Mostrando {filteredItems} de {totalItems} trabajos
        </p>
      </div>
    </section>
  );
}
