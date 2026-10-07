import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, Plus, Eye, ShoppingBag } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminToast, type ToastState } from "@/components/admin/AdminToast";
import { OrdenDetallePanel, type OrdenDetalle, type EstadoOrden, ESTADO_ORDEN_STYLES } from "@/components/admin/ordenes/OrdenDetallePanel";
import { NuevaOrdenPanel } from "@/components/admin/ordenes/NuevaOrdenPanel";
import { Button } from "@/components/ui/Button";
import { LoadingState, ErrorState } from "@/components/ui/QueryState";
import { supabase } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";

export const Route = createFileRoute("/admin/ordenes/")({
  component: OrdenesPage,
});

interface OrdenRow {
  id: string;
  estado: EstadoOrden;
  total: number;
  subtotal: number;
  costo_envio: number;
  nombre_envio: string | null;
  telefono_envio: string | null;
  direccion_envio: string | null;
  ciudad_envio: string | null;
  notas_cliente: string | null;
  notas_internas: string | null;
  wompi_referencia: string | null;
  wompi_estado: string | null;
  fecha_pago: string | null;
  created_at: string;
  itemCount: number;
}

const FILTROS: { label: string; value: EstadoOrden | "todos" }[] = [
  { label: "Todas", value: "todos" },
  { label: "Pendientes", value: "pendiente" },
  { label: "Pagadas", value: "pagada" },
  { label: "En preparacion", value: "en_preparacion" },
  { label: "Enviadas", value: "enviada" },
  { label: "Entregadas", value: "entregada" },
  { label: "Canceladas", value: "cancelada" },
];

const selectStyle: React.CSSProperties = {
  padding: "9px 14px",
  backgroundColor: "var(--color-surface-light)",
  border: "1px solid var(--color-border-light)",
  borderRadius: "var(--radius-lg)",
  fontFamily: "var(--font-body)",
  fontSize: "var(--text-sm)",
  color: "var(--color-text-on-light)",
  outline: "none",
};

function OrdenesPage() {
  const [ordenes, setOrdenes] = useState<OrdenRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filtroEstado, setFiltroEstado] = useState<EstadoOrden | "todos">("todos");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [detalleOpen, setDetalleOpen] = useState(false);
  const [selectedOrden, setSelectedOrden] = useState<OrdenDetalle | null>(null);
  const [nuevaOrdenOpen, setNuevaOrdenOpen] = useState(false);

  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchOrdenes = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("ordenes")
      .select("*, items_orden(id)")
      .order("created_at", { ascending: false });

    if (err) {
      setError("No se pudieron cargar las ordenes.");
      setLoading(false);
      return;
    }

    setOrdenes((data ?? []).map((o) => ({
      id: o.id,
      estado: o.estado as EstadoOrden,
      total: o.total,
      subtotal: o.subtotal,
      costo_envio: o.costo_envio,
      nombre_envio: o.nombre_envio,
      telefono_envio: o.telefono_envio,
      direccion_envio: o.direccion_envio,
      ciudad_envio: o.ciudad_envio,
      notas_cliente: o.notas_cliente,
      notas_internas: o.notas_internas,
      wompi_referencia: o.wompi_referencia,
      wompi_estado: o.wompi_estado,
      fecha_pago: o.fecha_pago,
      created_at: o.created_at,
      itemCount: Array.isArray(o.items_orden) ? o.items_orden.length : 0,
    })));
    setLoading(false);
  }, []);

  useEffect(() => { fetchOrdenes(); }, [fetchOrdenes]);

  useEffect(() => {
    const t = setTimeout(() => setSearchQuery(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const ordenesFiltradas = useMemo(() => {
    return ordenes.filter((o) => {
      const matchEstado = filtroEstado === "todos" || o.estado === filtroEstado;
      const q = searchQuery.toLowerCase();
      const matchSearch = !q || o.nombre_envio?.toLowerCase().includes(q) || o.id.toLowerCase().includes(q) || o.telefono_envio?.toLowerCase().includes(q);
      return matchEstado && matchSearch;
    });
  }, [ordenes, filtroEstado, searchQuery]);

  const openDetalle = async (o: OrdenRow) => {
    const { data } = await supabase
      .from("items_orden")
      .select("*")
      .eq("orden_id", o.id);

    setSelectedOrden({
      ...o,
      items: (data ?? []).map((i) => ({ id: i.id, nombre: i.nombre, precio: i.precio, cantidad: i.cantidad, subtotal: i.subtotal })),
    });
    setDetalleOpen(true);
  };

  return (
    <AdminLayout pageTitle="Ordenes">
      <AdminToast toast={toast} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4" style={{ marginBottom: "1.5rem" }}>
        {/* Filtros de estado */}
        <div className="flex flex-wrap gap-2">
          {FILTROS.map((f) => {
            const isActive = filtroEstado === f.value;
            const st = f.value !== "todos" ? ESTADO_ORDEN_STYLES[f.value] : null;
            return (
              <button
                key={f.value}
                onClick={() => setFiltroEstado(f.value)}
                style={{
                  padding: "5px 14px",
                  borderRadius: "var(--radius-full)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--text-xs)",
                  fontWeight: 600,
                  border: "1px solid",
                  cursor: "pointer",
                  transition: "all 150ms",
                  backgroundColor: isActive ? (st?.bg ?? "rgba(200,168,74,0.18)") : "transparent",
                  color: isActive ? (st?.color ?? "var(--color-primary-dim)") : "var(--color-text-on-light-faint)",
                  borderColor: isActive ? (st?.color ?? "var(--color-primary-dim)") : "var(--color-border-light)",
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>
        <Button variant="accent" size="md" onClick={() => setNuevaOrdenOpen(true)}>
          <Plus size={15} style={{ marginRight: "0.3rem" }} /> Nueva orden
        </Button>
      </div>

      {/* Buscador */}
      <div style={{ position: "relative", marginBottom: "1.25rem", maxWidth: "360px" }}>
        <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-on-light-faint)" }} />
        <input
          style={{ ...selectStyle, paddingLeft: "2.2rem", width: "100%" }}
          placeholder="Buscar por cliente, telefono o ID..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
      </div>

      {loading ? (
        <LoadingState variant="light" />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchOrdenes} variant="light" />
      ) : ordenesFiltradas.length === 0 ? (
        <div className="flex flex-col items-center gap-4" style={{ paddingTop: "4rem", textAlign: "center" }}>
          <ShoppingBag size={48} style={{ color: "var(--color-text-on-light-faint)" }} />
          <p style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: "var(--text-xl)", color: "var(--color-text-on-light-faint)" }}>
            No hay ordenes que mostrar
          </p>
        </div>
      ) : (
        <div style={{ overflowX: "auto", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-border-light)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-body)", fontSize: "var(--text-sm)" }}>
            <thead>
              <tr style={{ backgroundColor: "var(--color-surface-light)", borderBottom: "1px solid var(--color-border-light)" }}>
                {["Referencia", "Fecha", "Cliente", "Productos", "Total", "Estado", ""].map((h) => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-on-light-faint)", fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ordenesFiltradas.map((o, i) => {
                const st = ESTADO_ORDEN_STYLES[o.estado];
                const fecha = new Date(o.created_at).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
                const hora = new Date(o.created_at).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
                return (
                  <tr key={o.id} style={{ borderBottom: i < ordenesFiltradas.length - 1 ? "1px solid var(--color-border-light)" : "none", backgroundColor: "white" }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--color-surface-light)"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "white"}
                  >
                    <td style={{ padding: "14px 16px", fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "var(--text-xs)", color: "var(--color-text-on-light)" }}>
                      #{o.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td style={{ padding: "14px 16px", color: "var(--color-text-on-light)" }}>
                      <div>{fecha}</div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", color: "var(--color-text-on-light-faint)", marginTop: "1px" }}>{hora}</div>
                    </td>
                    <td style={{ padding: "14px 16px", color: "var(--color-text-on-light)" }}>
                      <div style={{ fontWeight: 600 }}>{o.nombre_envio ?? "—"}</div>
                      {o.telefono_envio && <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", color: "var(--color-text-on-light-faint)", marginTop: "1px" }}>{o.telefono_envio}</div>}
                    </td>
                    <td style={{ padding: "14px 16px", color: "var(--color-text-on-light-faint)", fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)" }}>
                      {o.itemCount} {o.itemCount === 1 ? "item" : "items"}
                    </td>
                    <td style={{ padding: "14px 16px", fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--color-text-on-light)" }}>
                      {formatPrice(o.total)}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", padding: "3px 10px", borderRadius: "var(--radius-full)", backgroundColor: st.bg, color: st.color, fontFamily: "var(--font-mono)", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", whiteSpace: "nowrap" }}>
                        {st.label}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <button
                        onClick={() => openDetalle(o)}
                        style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", background: "none", border: "1px solid var(--color-border-light)", borderRadius: "var(--radius-lg)", padding: "6px 12px", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", fontWeight: 500, color: "var(--color-text-on-light)", transition: "all 150ms" }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--color-primary-dim)"; e.currentTarget.style.color = "white"; e.currentTarget.style.borderColor = "var(--color-primary-dim)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "var(--color-text-on-light)"; e.currentTarget.style.borderColor = "var(--color-border-light)"; }}
                      >
                        <Eye size={13} /> Ver
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <OrdenDetallePanel
        orden={selectedOrden}
        isOpen={detalleOpen}
        onClose={() => setDetalleOpen(false)}
        onSaved={() => { showToast("Orden actualizada correctamente.", "success"); fetchOrdenes(); }}
        onError={(msg) => showToast(msg, "error")}
      />

      <NuevaOrdenPanel
        isOpen={nuevaOrdenOpen}
        onClose={() => setNuevaOrdenOpen(false)}
        onSaved={() => { showToast("Orden presencial registrada.", "success"); fetchOrdenes(); }}
        onError={(msg) => showToast(msg, "error")}
      />
    </AdminLayout>
  );
}
