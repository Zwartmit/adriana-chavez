import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Edit, Scissors, Search } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminToast, type ToastState } from "@/components/admin/AdminToast";
import { Button } from "@/components/ui/Button";
import { LoadingState, ErrorState } from "@/components/ui/QueryState";
import { supabase } from "@/lib/supabase/client";

export const Route = createFileRoute("/admin/servicios/")({
  component: ServiciosAdminPage,
});

const PAGE_SIZE = 20;

interface ServicioRow {
  id: string;
  nombre: string;
  categoria_id: string | null;
  precio: number;
  duracion_min: number;
  activo: boolean;
  destacado: boolean;
  created_at: string;
  categorias_servicios: { nombre: string } | null;
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

function ServiciosAdminPage() {
  const navigate = useNavigate();
  const [servicios, setServicios] = useState<ServicioRow[]>([]);
  const [categorias, setCategorias] = useState<{ id: string; nombre: string }[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [sortOrder, setSortOrder] = useState(() => typeof window !== "undefined" ? localStorage.getItem("admin_servicios_sort") || "nuevos" : "nuevos");
  const [page, setPage] = useState(1);

  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    localStorage.setItem("admin_servicios_sort", sortOrder);
  }, [sortOrder]);

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

    const [serviciosRes, categoriasRes] = await Promise.all([
      supabase
        .from("servicios")
        .select("id, nombre, categoria_id, precio, duracion_min, activo, destacado, created_at, categorias_servicios(nombre)")
        .order("created_at", { ascending: false }),
      supabase
        .from("categorias_servicios")
        .select("id, nombre")
        .order("orden", { ascending: true })
    ]);

    if (serviciosRes.error) {
      console.error("[ServiciosAdminPage] error al cargar servicios:", serviciosRes.error.message);
      setError(serviciosRes.error.message);
      setLoading(false);
      return;
    }

    setCategorias(categoriasRes.data ?? []);
    setServicios(serviciosRes.data as unknown as ServicioRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtrado = useMemo(() => {
    const filtered = servicios.filter((s) => {
      const matchCat = !filtroCategoria || s.categoria_id === filtroCategoria;
      const q = searchQuery.toLowerCase();
      const matchSearch = !q || s.nombre.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });

    return filtered.sort((a, b) => {
      if (sortOrder === "nombre_asc") return a.nombre.localeCompare(b.nombre);
      if (sortOrder === "nombre_desc") return b.nombre.localeCompare(a.nombre);
      if (sortOrder === "antiguos") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      // por defecto 'nuevos'
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [servicios, filtroCategoria, searchQuery, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filtrado.length / PAGE_SIZE));
  const serviciosPagina = useMemo(
    () => filtrado.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtrado, page]
  );

  return (
    <AdminLayout pageTitle="Servicios">
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
            {servicios.length} {servicios.length === 1 ? "servicio registrado" : "servicios registrados"}
          </p>
        </div>
        <div className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto" variant="accent" size="md" onClick={() => navigate({ to: "/admin/servicios/nuevo" })}>
            Nuevo servicio +
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
        <select className="w-full sm:w-auto" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} style={selectStyle}>
          <option value="nuevos">Más nuevos primero</option>
          <option value="antiguos">Más antiguos primero</option>
          <option value="nombre_asc">Nombre (A-Z)</option>
          <option value="nombre_desc">Nombre (Z-A)</option>
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
            placeholder="Buscar servicio..."
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
                  {["Nombre", "Categoría", "Duración", "Precio", "Etiquetas", "Estado", "Acciones"].map((h) => (
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
                {serviciosPagina.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="flex flex-col items-center gap-3" style={{ padding: "4rem 0" }}>
                        <Scissors size={40} color="var(--color-text-on-light-faint)" />
                        <p
                          style={{
                            fontFamily: "var(--font-display)",
                            fontStyle: "italic",
                            fontSize: "var(--text-xl)",
                            color: "var(--color-text-on-light-faint)",
                          }}
                        >
                          No se encontraron servicios
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  serviciosPagina.map((s, i) => (
                    <tr
                      key={s.id}
                      style={{
                        backgroundColor: i % 2 === 0 ? "var(--color-surface-light)" : "var(--color-bg-light)",
                        transition: "background-color var(--transition-fast)",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-bg-light-alt)")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = i % 2 === 0 ? "var(--color-surface-light)" : "var(--color-bg-light)")}
                    >
                      <td style={{ padding: "14px 16px", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "var(--text-sm)", color: "var(--color-text-on-light)" }}>
                        {s.nombre}
                      </td>
                      <td style={{ padding: "14px 16px", fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--color-text-on-light-muted)" }}>
                        {s.categorias_servicios?.nombre ?? "—"}
                      </td>
                      <td style={{ padding: "14px 16px", fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)", color: "var(--color-text-on-light-muted)" }}>
                        {s.duracion_min} min
                      </td>
                      <td style={{ padding: "14px 16px", fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)", color: "var(--color-text-on-light-muted)" }}>
                        {new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(s.precio)}
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <div className="flex gap-2">
                          {s.destacado && (
                            <span style={{ backgroundColor: "rgba(200,168,74,0.18)", color: "var(--color-primary-dim)", padding: "2px 8px", borderRadius: "var(--radius-full)", fontSize: "10px", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>Destacado</span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: "14px 16px", fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)", color: s.activo ? "#4CAF80" : "var(--color-text-on-light-faint)" }}>
                        {s.activo ? "Activo" : "Inactivo"}
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <button
                          type="button"
                          aria-label="Editar"
                          onClick={() => navigate({ to: `/admin/servicios/$servicioId`, params: { servicioId: s.id } })}
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
