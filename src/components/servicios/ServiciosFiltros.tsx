import { Search } from "lucide-react";

const CATEGORIAS = ["Todos", "Cabello", "Color", "Tratamiento", "Uñas", "Peinado"];

interface ServiciosFiltrosProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

export function ServiciosFiltros({
  searchQuery,
  onSearchChange,
  activeCategory,
  onCategoryChange,
}: ServiciosFiltrosProps) {
  return (
    <section
      style={{
        backgroundColor: "var(--color-bg-alt)",
        paddingTop: "2rem",
        paddingBottom: "2rem",
      }}
    >
      <div
        className="mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        style={{
          maxWidth: "1200px",
          marginLeft: "auto",
          marginRight: "auto",
          paddingLeft: "1.5rem",
          paddingRight: "1.5rem",
        }}
      >
        <div className="relative w-full" style={{ maxWidth: 360 }}>
          <Search
            size={18}
            style={{
              position: "absolute",
              left: 16,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--color-text-muted)",
            }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar servicios..."
            className="w-full outline-none"
            style={{
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-lg)",
              padding: "12px 16px 12px 44px",
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-base)",
              color: "var(--color-text-primary)",
              transition: "border-color var(--transition-base)",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "var(--color-primary)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "var(--color-border)";
            }}
          />
        </div>

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
      </div>
    </section>
  );
}
