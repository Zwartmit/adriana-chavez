import { ChevronDown, Search } from "lucide-react";

const CATEGORIAS = [
  { value: "todas", label: "Todas las categorías" },
  { value: "cuidado-capilar", label: "Cuidado capilar" },
  { value: "coloracion", label: "Coloración" },
  { value: "tratamientos", label: "Tratamientos" },
  { value: "estilizado", label: "Estilizado" },
  { value: "unas", label: "Uñas" },
  { value: "accesorios", label: "Accesorios" },
];

const ORDEN_OPTIONS = [
  { value: "destacados", label: "Destacados" },
  { value: "precio-asc", label: "Precio: menor a mayor" },
  { value: "precio-desc", label: "Precio: mayor a menor" },
  { value: "nombre-asc", label: "Nombre: A–Z" },
];

interface TiendaFiltrosProps {
  searchQuery: string;
  onSearchChange: (v: string) => void;
  activeCategory: string;
  onCategoryChange: (v: string) => void;
  sortOrder: string;
  onSortChange: (v: string) => void;
  totalProducts: number;
  filteredCount: number;
}

const selectStyle: React.CSSProperties = {
  backgroundColor: "var(--color-surface)",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-lg)",
  padding: "12px 40px 12px 16px",
  fontFamily: "var(--font-body)",
  fontSize: "var(--text-base)",
  color: "var(--color-text-primary)",
  minWidth: "180px",
  appearance: "none",
  transition: "border var(--transition-base)",
};

function handleFocus(e: React.FocusEvent<HTMLSelectElement>) {
  e.currentTarget.style.border = "1px solid var(--color-primary)";
}
function handleBlur(e: React.FocusEvent<HTMLSelectElement>) {
  e.currentTarget.style.border = "1px solid var(--color-border)";
}

export function TiendaFiltros({
  searchQuery,
  onSearchChange,
  activeCategory,
  onCategoryChange,
  sortOrder,
  onSortChange,
  totalProducts,
  filteredCount,
}: TiendaFiltrosProps) {
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
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="relative w-full md:max-w-[360px]">
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
              placeholder="Buscar productos..."
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
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-primary)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative">
              <select
                value={activeCategory}
                onChange={(e) => onCategoryChange(e.target.value)}
                onFocus={handleFocus}
                onBlur={handleBlur}
                style={selectStyle}
              >
                {CATEGORIAS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                style={{
                  position: "absolute",
                  right: 16,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--color-text-muted)",
                  pointerEvents: "none",
                }}
              />
            </div>

            <div className="relative">
              <select
                value={sortOrder}
                onChange={(e) => onSortChange(e.target.value)}
                onFocus={handleFocus}
                onBlur={handleBlur}
                style={selectStyle}
              >
                {ORDEN_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                style={{
                  position: "absolute",
                  right: 16,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--color-text-muted)",
                  pointerEvents: "none",
                }}
              />
            </div>
          </div>
        </div>

        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--text-sm)",
            color: "var(--color-text-muted)",
            marginTop: "1rem",
          }}
        >
          {filteredCount} de {totalProducts} productos
        </p>
      </div>
    </section>
  );
}
