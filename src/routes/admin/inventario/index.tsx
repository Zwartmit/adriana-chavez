import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, Edit, ArrowRightLeft, Package, Search } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminToast, type ToastState } from "@/components/admin/AdminToast";
import { MovimientoPanel } from "@/components/admin/inventario/MovimientoPanel";
import { AjustarUmbralesModal } from "@/components/admin/inventario/AjustarUmbralesModal";
import { Button } from "@/components/ui/Button";
import { LoadingState, ErrorState } from "@/components/ui/QueryState";
import { supabase } from "@/lib/supabase/client";
import type { TipoMovimiento } from "@/lib/supabase/types";

export const Route = createFileRoute("/admin/inventario/")({
  component: InventarioPage,
});

type EstadoStock = "disponible" | "critico" | "agotado";

interface InventarioRow {
  id: string;
  producto_id: string;
  stock_virtual: number;
  stock_fisico: number;
  stock_total: number;
  umbral_alerta: number;
  estado_stock: EstadoStock;
  producto_nombre: string;
  producto_marca: string;
  categoria_id: string;
  categoria_nombre: string;
}

interface CategoriaOption {
  id: string;
  nombre: string;
}

interface MovimientoUI {
  id: string;
  createdAt: Date;
  productoNombre: string;
  productoMarca: string;
  tipo: TipoMovimiento;
  origen: string | null;
  cantidad: number;
  stockAntes: number;
  stockDespues: number;
  notas: string | null;
}

interface MovimientoRow {
  id: string;
  created_at: string;
  tipo: TipoMovimiento;
  origen: string | null;
  cantidad: number;
  stock_antes: number;
  stock_despues: number;
  notas: string | null;
  productos: { nombre: string; marca: string } | null;
}

const ESTADO_STYLES: Record<EstadoStock, { label: string; bg: string; color: string }> = {
  disponible: { label: "Disponible", bg: "rgba(76,175,128,0.15)", color: "#3D8F66" },
  critico: { label: "Crítico", bg: "rgba(200,168,74,0.18)", color: "var(--color-primary-dim)" },
  agotado: { label: "Agotado", bg: "rgba(224,82,82,0.15)", color: "var(--color-error)" },
};

const TIPO_STYLES: Record<TipoMovimiento, { label: string; bg: string; color: string }> = {
  entrada: { label: "Entrada", bg: "rgba(76,175,128,0.15)", color: "#3D8F66" },
  salida: { label: "Salida", bg: "rgba(224,82,82,0.15)", color: "var(--color-error)" },
  ajuste: { label: "Ajuste", bg: "rgba(200,168,74,0.18)", color: "var(--color-primary-dim)" },
};

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

function InventarioPage() {
  const [inventario, setInventario] = useState<InventarioRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [categorias, setCategorias] = useState<CategoriaOption[]>([]);
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<"todos" | EstadoStock>("todos");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [movimientos, setMovimientos] = useState<MovimientoUI[]>([]);
  const [movimientosLoading, setMovimientosLoading] = useState(true);
  const [historialOpen, setHistorialOpen] = useState(false);

  const [panelOpen, setPanelOpen] = useState(false);
  const [panelTipo, setPanelTipo] = useState<"entrada" | "salida">("entrada");
  const [panelProducto, setPanelProducto] = useState<{ id: string; nombre: string; marca: string } | null>(null);

  const [umbralesTarget, setUmbralesTarget] = useState<InventarioRow | null>(null);

  const [toast, setToast] = useState<ToastState | null>(null);
  const showToast = (message: string, type: ToastState["type"] = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2000);
  };

  useEffect(() => {
    const timeout = setTimeout(() => setSearchQuery(searchInput.trim().toLowerCase()), 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const fetchInventario = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("inventario_completo")
      .select("*")
      .order("estado_stock", { ascending: true })
      .order("producto_nombre", { ascending: true });

    if (error) {
      console.error("[InventarioPage] error al cargar inventario:", error.message);
      setError(error.message);
      setLoading(false);
      return;
    }

    console.log(`[InventarioPage] ${data.length} registros de inventario cargados desde Supabase`);
    setInventario(data as unknown as InventarioRow[]);
    setLoading(false);
  }, []);

  const fetchMovimientos = useCallback(async () => {
    setMovimientosLoading(true);
    const { data, error } = await supabase
      .from("movimientos_inventario")
      .select("id, created_at, tipo, origen, cantidad, stock_antes, stock_despues, notas, productos(nombre, marca)")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("[InventarioPage] error al cargar movimientos:", error.message);
      setMovimientosLoading(false);
      return;
    }

    console.log(`[InventarioPage] ${data.length} movimientos cargados desde Supabase`);
    setMovimientos(
      (data as unknown as MovimientoRow[]).map((m) => ({
        id: m.id,
        createdAt: new Date(m.created_at),
        productoNombre: m.productos?.nombre ?? "Producto",
        productoMarca: m.productos?.marca ?? "",
        tipo: m.tipo,
        origen: m.origen,
        cantidad: m.cantidad,
        stockAntes: m.stock_antes,
        stockDespues: m.stock_despues,
        notas: m.notas,
      })),
    );
    setMovimientosLoading(false);
  }, []);

  useEffect(() => {
    fetchInventario();
    fetchMovimientos();
    supabase
      .from("categorias_productos")
      .select("id, nombre")
      .order("orden", { ascending: true })
      .then(({ data }) => setCategorias(data ?? []));
  }, [fetchInventario, fetchMovimientos]);

  const resumen = useMemo(() => {
    let disponible = 0;
    let critico = 0;
    let agotado = 0;
    for (const r of inventario) {
      if (r.estado_stock === "disponible") disponible++;
      else if (r.estado_stock === "critico") critico++;
      else agotado++;
    }
    return { disponible, critico, agotado };
  }, [inventario]);

  const filtrado = useMemo(() => {
    return inventario.filter((r) => {
      const matchCategoria = !filtroCategoria || r.categoria_id === filtroCategoria;
      const matchEstado = filtroEstado === "todos" || r.estado_stock === filtroEstado;
      const q = searchQuery;
      const matchSearch = !q || r.producto_nombre.toLowerCase().includes(q) || r.producto_marca.toLowerCase().includes(q);
      return matchCategoria && matchEstado && matchSearch;
    });
  }, [inventario, filtroCategoria, filtroEstado, searchQuery]);

  const openMovimiento = (tipo: "entrada" | "salida", producto?: InventarioRow) => {
    setPanelTipo(tipo);
    setPanelProducto(
      producto ? { id: producto.producto_id, nombre: producto.producto_nombre, marca: producto.producto_marca } : null,
    );
    setPanelOpen(true);
  };

  return (
    <AdminLayout pageTitle="Inventario">
      <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-4" style={{ marginBottom: "1.5rem" }}>
        <div className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto" variant="accent" size="md" onClick={() => openMovimiento("entrada")}>
            Registrar movimiento
          </Button>
        </div>
      </div>

      {loading ? (
        <LoadingState variant="light" />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchInventario} variant="light" />
      ) : (
        <>
          {/* Resumen */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" style={{ marginBottom: "1.75rem" }}>
            <div
              style={{
                backgroundColor: "var(--color-surface-light)",
                border: "1px solid var(--color-border-light)",
                borderRadius: "var(--radius-xl)",
                padding: "1.25rem 1.5rem",
              }}
            >
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", textTransform: "uppercase", letterSpacing: "var(--tracking-wider)", color: "var(--color-text-on-light-faint)" }}>
                Productos en stock
              </p>
              <p style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 600, fontSize: "var(--text-3xl)", color: "#4CAF80", marginTop: "0.4rem" }}>
                {resumen.disponible}
              </p>
            </div>
            <div
              style={{
                backgroundColor: "var(--color-surface-light)",
                border: "1px solid var(--color-border-light)",
                borderRadius: "var(--radius-xl)",
                padding: "1.25rem 1.5rem",
                position: "relative",
              }}
            >
              <div className="flex items-center gap-2">
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", textTransform: "uppercase", letterSpacing: "var(--tracking-wider)", color: "var(--color-text-on-light-faint)" }}>
                  Stock crítico
                </p>
                {resumen.critico > 0 && (
                  <span
                    className="animate-pulse"
                    style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "var(--color-error)" }}
                  />
                )}
              </div>
              <p style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 600, fontSize: "var(--text-3xl)", color: "var(--color-primary-dim)", marginTop: "0.4rem" }}>
                {resumen.critico}
              </p>
            </div>
            <div
              style={{
                backgroundColor: "var(--color-surface-light)",
                border: "1px solid var(--color-border-light)",
                borderRadius: "var(--radius-xl)",
                padding: "1.25rem 1.5rem",
              }}
            >
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", textTransform: "uppercase", letterSpacing: "var(--tracking-wider)", color: "var(--color-text-on-light-faint)" }}>
                Agotados
              </p>
              <p style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 600, fontSize: "var(--text-3xl)", color: "var(--color-error)", marginTop: "0.4rem" }}>
                {resumen.agotado}
              </p>
            </div>
          </div>

          {/* Filtros */}
          <div className="flex flex-col sm:flex-row flex-wrap sm:items-center gap-3" style={{ marginBottom: "1.25rem" }}>
            <select className="w-full sm:w-auto" value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)} style={selectStyle}>
              <option value="">Todas las categorías</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
            <select className="w-full sm:w-auto" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value as "todos" | EstadoStock)} style={selectStyle}>
              <option value="todos">Todos los estados</option>
              <option value="disponible">Disponible</option>
              <option value="critico">Crítico</option>
              <option value="agotado">Agotado</option>
            </select>
            <div className="relative w-full sm:w-auto sm:max-w-[280px]">
              <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-on-light-faint)" }} />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Buscar por nombre o marca..."
                style={{ ...selectStyle, padding: "10px 14px 10px 36px", width: "100%" }}
              />
            </div>
          </div>

          {/* Tabla */}
          <div className="overflow-x-auto w-full" style={{ borderRadius: "var(--radius-xl)", border: "1px solid var(--color-border-light)", backgroundColor: "var(--color-surface-light)" }}>
            <table className="w-full min-w-[900px]" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#0A0A0B" }}>
                  {["Producto", "Marca", "Categoría", "Stock virtual", "Stock físico", "Stock total", "Umbral alerta", "Estado", "Acciones"].map((h) => (
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
                {filtrado.length === 0 ? (
                  <tr>
                    <td colSpan={9}>
                      <div className="flex flex-col items-center gap-3" style={{ padding: "3rem 0" }}>
                        <Package size={36} color="var(--color-text-on-light-faint)" />
                        <p style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: "var(--text-lg)", color: "var(--color-text-on-light-faint)" }}>
                          No hay productos con ese criterio.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtrado.map((r) => {
                    const estilo = ESTADO_STYLES[r.estado_stock];
                    const rowStyle: React.CSSProperties =
                      r.estado_stock === "critico"
                        ? { backgroundColor: "rgba(212,175,107,0.06)", borderLeft: "2px solid var(--color-primary)" }
                        : r.estado_stock === "agotado"
                          ? { backgroundColor: "rgba(224,82,82,0.06)", borderLeft: "2px solid var(--color-error)", opacity: 0.7 }
                          : { borderLeft: "2px solid transparent" };
                    return (
                      <tr key={r.id} style={rowStyle}>
                        <td style={{ padding: "12px 16px", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "var(--text-sm)", color: "var(--color-text-on-light)" }}>
                          {r.producto_nombre}
                        </td>
                        <td style={{ padding: "12px 16px", fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--color-text-on-light-muted)" }}>
                          {r.producto_marca}
                        </td>
                        <td style={{ padding: "12px 16px", fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--color-text-on-light-muted)" }}>
                          {r.categoria_nombre}
                        </td>
                        <td style={{ padding: "12px 16px", fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)", color: "var(--color-text-on-light-muted)" }}>
                          {r.stock_virtual}
                        </td>
                        <td style={{ padding: "12px 16px", fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)", color: "var(--color-text-on-light-muted)" }}>
                          {r.stock_fisico}
                        </td>
                        <td style={{ padding: "12px 16px", fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)", color: "var(--color-text-on-light)" }}>
                          {r.stock_total}
                        </td>
                        <td style={{ padding: "12px 16px", fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)", color: "var(--color-text-on-light-muted)" }}>
                          {r.umbral_alerta}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span
                            style={{
                              backgroundColor: estilo.bg,
                              color: estilo.color,
                              fontFamily: "var(--font-mono)",
                              fontSize: "var(--text-xs)",
                              textTransform: "uppercase",
                              letterSpacing: "var(--tracking-wider)",
                              padding: "3px 10px",
                              borderRadius: "var(--radius-full)",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {estilo.label}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              aria-label="Ajustar umbrales"
                              onClick={() => setUmbralesTarget(r)}
                              style={{ color: "var(--color-text-on-light-faint)", background: "transparent", border: "none", cursor: "pointer" }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-primary)")}
                              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-on-light-faint)")}
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              type="button"
                              aria-label="Registrar movimiento"
                              onClick={() => openMovimiento("entrada", r)}
                              style={{ color: "var(--color-text-on-light-faint)", background: "transparent", border: "none", cursor: "pointer", marginLeft: "4px" }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = "#4CAF80")}
                              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-on-light-faint)")}
                            >
                              <ArrowRightLeft size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Historial de movimientos */}
          <div style={{ marginTop: "2rem" }}>
            <button
              type="button"
              onClick={() => setHistorialOpen((o) => !o)}
              className="flex items-center gap-2"
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                fontFamily: "var(--font-body)",
                fontWeight: 600,
                fontSize: "var(--text-base)",
                color: "var(--color-text-on-light)",
                padding: "0.5rem 0",
              }}
            >
              <ChevronDown
                size={18}
                style={{ transform: historialOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 250ms ease" }}
              />
              Historial de movimientos
            </button>

            {historialOpen && (
              <div className="overflow-x-auto w-full" style={{ borderRadius: "var(--radius-xl)", border: "1px solid var(--color-border-light)", marginTop: "1rem" }}>
                {movimientosLoading ? (
                  <LoadingState variant="light" />
                ) : (
                  <table className="w-full min-w-[800px]" style={{ borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ backgroundColor: "#0A0A0B" }}>
                        {["Fecha", "Producto", "Tipo", "Origen", "Cantidad", "Stock antes → después", "Notas"].map((h) => (
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
                      {movimientos.length === 0 ? (
                        <tr>
                          <td colSpan={7} style={{ padding: "2rem 16px", textAlign: "center", fontFamily: "var(--font-body)", color: "var(--color-text-on-light-faint)" }}>
                            Aún no hay movimientos registrados.
                          </td>
                        </tr>
                      ) : (
                        movimientos.map((m, i) => {
                          const tStyle = TIPO_STYLES[m.tipo];
                          return (
                            <tr key={m.id} style={{ backgroundColor: i % 2 === 0 ? "var(--color-surface-light)" : "var(--color-bg-light)" }}>
                              <td style={{ padding: "10px 16px", fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", color: "var(--color-text-on-light-faint)", whiteSpace: "nowrap" }}>
                                {m.createdAt.toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })}
                                {" "}
                                {m.createdAt.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
                              </td>
                              <td style={{ padding: "10px 16px", fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--color-text-on-light)" }}>
                                {m.productoNombre}
                              </td>
                              <td style={{ padding: "10px 16px" }}>
                                <span
                                  style={{
                                    backgroundColor: tStyle.bg,
                                    color: tStyle.color,
                                    fontFamily: "var(--font-mono)",
                                    fontSize: "var(--text-xs)",
                                    textTransform: "uppercase",
                                    letterSpacing: "var(--tracking-wider)",
                                    padding: "3px 10px",
                                    borderRadius: "var(--radius-full)",
                                  }}
                                >
                                  {tStyle.label}
                                </span>
                              </td>
                              <td style={{ padding: "10px 16px", fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--color-text-on-light-muted)", textTransform: "capitalize" }}>
                                {m.origen?.replace(/_/g, " ") ?? "—"}
                              </td>
                              <td style={{ padding: "10px 16px", fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)", color: "var(--color-text-on-light-muted)" }}>
                                {m.cantidad}
                              </td>
                              <td style={{ padding: "10px 16px", fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)", color: "var(--color-text-on-light-muted)" }}>
                                {m.stockAntes} → {m.stockDespues}
                              </td>
                              <td style={{ padding: "10px 16px", fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--color-text-on-light-faint)" }}>
                                {m.notas ?? "—"}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        </>
      )}

      <MovimientoPanel
        isOpen={panelOpen}
        onClose={() => setPanelOpen(false)}
        defaultTipo={panelTipo}
        preselectedProducto={panelProducto}
        onSaved={() => {
          fetchInventario();
          fetchMovimientos();
          showToast("Movimiento registrado correctamente");
        }}
        onError={(msg) => showToast(msg, "error")}
      />

      {umbralesTarget && (
        <AjustarUmbralesModal
          productoId={umbralesTarget.producto_id}
          productoNombre={umbralesTarget.producto_nombre}
          stockVirtual={umbralesTarget.stock_virtual}
          stockFisico={umbralesTarget.stock_fisico}
          umbralAlerta={umbralesTarget.umbral_alerta}
          onClose={() => setUmbralesTarget(null)}
          onSaved={() => {
            fetchInventario();
            showToast("Umbrales actualizados correctamente");
          }}
          onError={(msg) => showToast(msg, "error")}
        />
      )}

      <AdminToast toast={toast} />
    </AdminLayout>
  );
}
