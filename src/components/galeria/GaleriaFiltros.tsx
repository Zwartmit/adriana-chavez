export interface CategoriaFiltro {
  nombre: string;
  slug: string;
}

interface GaleriaFiltrosProps {
  categorias: CategoriaFiltro[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  totalItems: number;
  filteredItems: number;
}

export function GaleriaFiltros({
  categorias,
  activeCategory,
  onCategoryChange,
  totalItems,
  filteredItems,
}: GaleriaFiltrosProps) {
  // Siempre agregamos "Todos" al inicio
  const allCategorias = [{ nombre: "Todos", slug: "todos" }, ...categorias];

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
          {allCategorias.map((cat) => {
            const active = cat.nombre === activeCategory;
            return (
              <button
                key={cat.slug}
                type="button"
                onClick={() => onCategoryChange(cat.nombre)}
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
                {cat.nombre}
              </button>
            );
          })}
          {/* Spacer para que el último elemento no quede pegado al borde en móviles */}
          <div className="w-4 shrink-0" aria-hidden="true" />
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
