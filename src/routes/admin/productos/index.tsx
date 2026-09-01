import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Edit, Package, Search } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminToast, type ToastState } from "@/components/admin/AdminToast";
import { Button } from "@/components/ui/Button";
import { LoadingState, ErrorState } from "@/components/ui/QueryState";
import { supabase } from "@/lib/supabase/client";

export const Route = createFileRoute("/admin/productos/")({
  component: ProductosPage,
});

const PAGE_SIZE = 20;

interface ProductoRow {
  id: string;
  nombre: string;
  marca: string;
  categoria_id: string | null;
  precio: number;
  activo: boolean;
  destacado: boolean;
  es_nuevo: boolean;
  categorias_productos: { nombre: string } | null;
}

const selectStyle: React.CSSProperties = {
  padding: "10px 14px",
  backgroundColor: "var(--color-surface-light)",
  border: "1px solid var(--color-border-light)",
  borderRadius: "var(--radius-lg)",
  fontFamily: "var(--font-body)",
  fontSize: "var(--text-sm)",
  color: "var(--color-text-on-light)",
  outline: "none",
};

function ProductosPage() {
  const navigate = useNavigate();
  const [productos, setProductos] = useState<ProductoRow[]>([]);
  const [categorias, setCategorias] = useState<{ id: string; nombre: string }[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [page, setPage] = useState(1);

  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearchQuery(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [productosRes, categoriasRes] = await Promise.all([
      supabase
        .from("productos")
        .select("id, nombre, marca, categoria_id, precio, activo, destacado, es_nuevo, categorias_productos(nombre)")
        .order("created_at", { ascending: false }),
      supabase
        .from("categorias_productos")
        .select("id, nombre")
        .order("orden", { ascending: true })
    ]);

    if (productosRes.error) {
      console.error("[ProductosPage] error al cargar productos:", productosRes.error.message);
      setError(productosRes.error.message);
      setLoading(false);
      return;
    }

    setCategorias(categoriasRes.data ?? []);
    setProductos(productosRes.data as unknown as ProductoRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtrado = useMemo(() => {
    return productos.filter((p) => {
      const matchCat = !filtroCategoria || p.categoria_id === filtroCategoria;
      const q = searchQuery.toLowerCase();
      const matchSearch = !q || p.nombre.toLowerCase().includes(q) || p.marca.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [productos, filtroCategoria, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtrado.length / PAGE_SIZE));
  const productosPagina = useMemo(
    () => filtrado.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtrado, page]
  );

  const showToast = (message: string, type: ToastState["type"] = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2000);
  };

  return (
    <AdminLayout pageTitle="Catálogo de productos">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4" style={{ marginBottom: "0.5rem" }}>
        <div>
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--text-sm)",
              color: "var(--color-text-on-light-faint)",
              marginTop: "0.25rem",
            }}
          >
            {productos.length} {productos.length === 1 ? "producto registrado" : "productos registrados"}
          </p>
        </div>
        <div className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto" variant="accent" size="md" onClick={() => navigate({ to: "/admin/productos/nuevo" })}>
            Nuevo producto +
          </Button>
        </div>
      </div>

      {/* Filtros y Búsqueda */}
      <div className="flex flex-col sm:flex-row flex-wrap sm:items-center gap-3" style={{ margin: "1.5rem 0" }}>
        <select className="w-full sm:w-auto" value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)} style={selectStyle}>
          <option value="">Todas las categorías</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
        <div className="relative w-full sm:w-auto sm:max-w-[360px]">
          <Search
            size={18}
            style={{
              position: "absolute",
              left: 14,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--color-text-on-light-faint)",
            }}
          />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar producto o marca..."
            style={{
              ...selectStyle,
              padding: "10px 14px 10px 42px",
              width: "100%",
            }}
          />
        </div>
      </div>

      {loading ? (
        <LoadingState variant="light" />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchData} variant="light" />
      ) : (
        <>
          <div
            className="overflow-x-auto w-full"
            style={{
              borderRadius: "var(--radius-xl)",
              border: "1px solid var(--color-border-light)",
            }}
          >
            <table className="w-full min-w-[800px]" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#0A0A0B" }}>
                  {["Nombre", "Marca", "Categoría", "Precio", "Etiquetas", "Estado", "Acciones"].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: "left",
                        padding: "12px 16px",
                        fontFamily: "var(--font-mono)",
                        fontSize: "var(--text-xs)",
                        textTransform: "uppercase",
                        letterSpacing: "var(--tracking-wider)",
                        color: "var(--color-primary)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {productosPagina.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="flex flex-col items-center gap-3" style={{ padding: "4rem 0" }}>
                        <Package size={40} color="var(--color-text-on-light-faint)" />
                        <p
                          style={{
                            fontFamily: "var(--font-display)",
                            fontStyle: "italic",
                            fontSize: "var(--text-xl)",
                            color: "var(--color-text-on-light-faint)",
                          }}
                        >
                          No se encontraron productos
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  productosPagina.map((p, i) => (
                    <tr
                      key={p.id}
                      style={{
                        backgroundColor: i % 2 === 0 ? "var(--color-surface-light)" : "var(--color-bg-light)",
                        transition: "background-color var(--transition-fast)",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-bg-light-alt)")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = i % 2 === 0 ? "var(--color-surface-light)" : "var(--color-bg-light)")}
                    >
                      <td style={{ padding: "14px 16px", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "var(--text-sm)", color: "var(--color-text-on-light)" }}>
                        {p.nombre}
                      </td>
                      <td style={{ padding: "14px 16px", fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--color-text-on-light-muted)" }}>
                        {p.marca}
                      </td>
                      <td style={{ padding: "14px 16px", fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--color-text-on-light-muted)" }}>
                        {p.categorias_productos?.nombre ?? "—"}
                      </td>
                      <td style={{ padding: "14px 16px", fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)", color: "var(--color-text-on-light-muted)" }}>
                        {new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(p.precio)}
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <div className="flex gap-2">
                          {p.destacado && (
                            <span style={{ backgroundColor: "rgba(200,168,74,0.18)", color: "var(--color-primary-dim)", padding: "2px 8px", borderRadius: "var(--radius-full)", fontSize: "10px", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>Destacado</span>
                          )}
                          {p.es_nuevo && (
                            <span style={{ backgroundColor: "rgba(76,175,128,0.15)", color: "#3D8F66", padding: "2px 8px", borderRadius: "var(--radius-full)", fontSize: "10px", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>Nuevo</span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: "14px 16px", fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)", color: p.activo ? "#4CAF80" : "var(--color-text-on-light-faint)" }}>
                        {p.activo ? "Activo" : "Inactivo"}
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <button
                          type="button"
                          aria-label="Editar"
                          onClick={() => navigate({ to: `/admin/productos/$productoId`, params: { productoId: p.id } })}
                          style={{ color: "var(--color-text-on-light-faint)", background: "transparent", border: "none", cursor: "pointer" }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-primary-dim)")}
                          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-on-light-faint)")}
                        >
                          <Edit size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {filtrado.length > PAGE_SIZE && (
            <div className="flex items-center justify-center gap-2" style={{ marginTop: "1.5rem" }}>
              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                style={{
                  padding: "8px 16px",
                  borderRadius: "var(--radius-full)",
                  border: "1px solid var(--color-border-light)",
                  backgroundColor: "transparent",
                  color: page === 1 ? "var(--color-text-on-light-faint)" : "var(--color-text-on-light-muted)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--text-sm)",
                  cursor: page === 1 ? "not-allowed" : "pointer",
                }}
              >
                ← Anterior
              </button>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--text-sm)",
                  color: "var(--color-text-on-light-faint)",
                  padding: "0 0.5rem",
                }}
              >
                {page} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                style={{
                  padding: "8px 16px",
                  borderRadius: "var(--radius-full)",
                  border: "1px solid var(--color-border-light)",
                  backgroundColor: "transparent",
                  color: page === totalPages ? "var(--color-text-on-light-faint)" : "var(--color-text-on-light-muted)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--text-sm)",
                  cursor: page === totalPages ? "not-allowed" : "pointer",
                }}
              >
                Siguiente →
              </button>
            </div>
          )}
        </>
      )}

      <AdminToast toast={toast} />
    </AdminLayout>
  );
}
