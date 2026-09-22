import { useEffect, useState } from "react";
import { X, Package, User, MapPin, CreditCard, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";

export type EstadoOrden = "pendiente" | "pagada" | "en_preparacion" | "enviada" | "entregada" | "cancelada" | "reembolsada";

export interface OrdenDetalle {
  id: string;
  estado: EstadoOrden;
  subtotal: number;
  costo_envio: number;
  total: number;
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
  items: {
    id: string;
    nombre: string;
    precio: number;
    cantidad: number;
    subtotal: number;
  }[];
}

interface OrdenDetallePanelProps {
  orden: OrdenDetalle | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  onError: (msg: string) => void;
}

export const ESTADO_ORDEN_STYLES: Record<EstadoOrden, { label: string; bg: string; color: string }> = {
  pendiente:      { label: "Pendiente",      bg: "rgba(200,168,74,0.18)",  color: "var(--color-primary-dim)" },
  pagada:         { label: "Pagada",         bg: "rgba(76,175,128,0.15)",  color: "#3D8F66" },
  en_preparacion: { label: "En preparacion", bg: "rgba(59,130,246,0.15)",  color: "#3B82F6" },
  enviada:        { label: "Enviada",        bg: "rgba(139,92,246,0.15)",  color: "#8B5CF6" },
  entregada:      { label: "Entregada",      bg: "rgba(34,197,94,0.15)",   color: "#22C55E" },
  cancelada:      { label: "Cancelada",      bg: "rgba(224,82,82,0.15)",   color: "var(--color-error)" },
  reembolsada:    { label: "Reembolsada",    bg: "rgba(156,163,175,0.2)",  color: "var(--color-text-muted)" },
};

const ESTADOS_SECUENCIA: EstadoOrden[] = ["pendiente","pagada","en_preparacion","enviada","entregada","cancelada","reembolsada"];

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "9px 12px",
  backgroundColor: "var(--color-surface-light)",
  border: "1px solid var(--color-border-light)",
  borderRadius: "var(--radius-lg)",
  fontFamily: "var(--font-body)", fontSize: "var(--text-sm)",
  color: "var(--color-text-on-light)", outline: "none",
};

const sectionTitle: React.CSSProperties = {
  fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)",
  textTransform: "uppercase", letterSpacing: "0.1em",
  color: "var(--color-text-on-light-faint)", marginBottom: "0.75rem",
};

export function OrdenDetallePanel({ orden, isOpen, onClose, onSaved, onError }: OrdenDetallePanelProps) {
  const [estado, setEstado] = useState<EstadoOrden>("pendiente");
  const [costoEnvio, setCostoEnvio] = useState("0");
  const [notasInternas, setNotasInternas] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (orden) {
      setEstado(orden.estado);
      setCostoEnvio(String(orden.costo_envio ?? 0));
      setNotasInternas(orden.notas_internas ?? "");
    }
  }, [orden]);

  const handleSave = async () => {
    if (!orden) return;
    setSaving(true);
    try {
      const nuevoEnvio = parseInt(costoEnvio, 10) || 0;
      const nuevoTotal = (orden.subtotal ?? 0) + nuevoEnvio;
      const { error } = await supabase
        .from("ordenes")
        .update({
          estado,
          costo_envio: nuevoEnvio,
          total: nuevoTotal,
          notas_internas: notasInternas.trim() || null,
          fecha_pago: estado === "pagada" && !orden.fecha_pago ? new Date().toISOString() : undefined,
        })
        .eq("id", orden.id);

      if (error) throw error;
      onSaved();
      onClose();
    } catch (err) {
      onError((err as Error).message ?? "Error al guardar cambios.");
    } finally {
      setSaving(false);
    }
  };

  const shortId = orden ? `#${orden.id.slice(0, 8).toUpperCase()}` : "";
  const fecha = orden ? new Date(orden.created_at).toLocaleString("es-CO", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "";

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 49, backgroundColor: "rgba(0,0,0,0.5)", opacity: isOpen ? 1 : 0, pointerEvents: isOpen ? "auto" : "none", transition: "opacity 300ms" }} />
      <aside style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "min(520px, 95vw)", backgroundColor: "var(--color-bg-light)", zIndex: 50, display: "flex", flexDirection: "column", transform: isOpen ? "translateX(0)" : "translateX(100%)", transition: "transform 350ms cubic-bezier(0.16, 1, 0.3, 1)", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--color-border-light)", display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "var(--color-surface-light)" }}>
          <div>
            <h2 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 600, fontSize: "var(--text-xl)", color: "var(--color-text-on-light)" }}>
              Orden {shortId}
            </h2>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", color: "var(--color-text-on-light-faint)" }}>{fecha}</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-on-light-faint)", padding: "4px" }}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem" }}>
          {orden && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>

              {/* Estado actual */}
              <div>
                <p style={sectionTitle}>Estado actual</p>
                {(() => { const st = ESTADO_ORDEN_STYLES[orden.estado]; return (
                  <span style={{ display: "inline-flex", alignItems: "center", padding: "4px 12px", borderRadius: "var(--radius-full)", backgroundColor: st.bg, color: st.color, fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", fontWeight: 700, textTransform: "uppercase" }}>{st.label}</span>
                ); })()}
              </div>

              {/* Productos */}
              <div>
                <p style={{ ...sectionTitle, display: "flex", alignItems: "center", gap: "0.4rem" }}><Package size={13} /> Productos</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {orden.items.map((item) => (
                    <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.6rem 0.875rem", backgroundColor: "var(--color-surface-light)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border-light)" }}>
                      <span style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--color-text-on-light)" }}>
                        {item.nombre} <span style={{ color: "var(--color-text-on-light-faint)" }}>x{item.cantidad}</span>
                      </span>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text-on-light)" }}>{formatPrice(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid var(--color-border-light)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                    <span style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--color-text-on-light-faint)" }}>Subtotal</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)" }}>{formatPrice(orden.subtotal)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                    <span style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--color-text-on-light-faint)" }}>Envio</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)" }}>{formatPrice(orden.costo_envio)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "var(--text-sm)" }}>Total</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "var(--text-base)", color: "var(--color-primary-dim)" }}>{formatPrice(orden.total)}</span>
                  </div>
                </div>
              </div>

              {/* Cliente */}
              <div>
                <p style={{ ...sectionTitle, display: "flex", alignItems: "center", gap: "0.4rem" }}><User size={13} /> Cliente</p>
                <div style={{ backgroundColor: "var(--color-surface-light)", border: "1px solid var(--color-border-light)", borderRadius: "var(--radius-lg)", padding: "0.875rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <p style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "var(--text-sm)", color: "var(--color-text-on-light)" }}>{orden.nombre_envio}</p>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", color: "var(--color-text-on-light-faint)" }}>{orden.telefono_envio}</p>
                </div>
              </div>

              {/* Envio */}
              <div>
                <p style={{ ...sectionTitle, display: "flex", alignItems: "center", gap: "0.4rem" }}><MapPin size={13} /> Direccion de envio</p>
                <div style={{ backgroundColor: "var(--color-surface-light)", border: "1px solid var(--color-border-light)", borderRadius: "var(--radius-lg)", padding: "0.875rem" }}>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--color-text-on-light)" }}>{orden.direccion_envio}</p>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--color-text-on-light-faint)", marginTop: "2px" }}>{orden.ciudad_envio}</p>
                  {orden.notas_cliente && <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", color: "var(--color-text-on-light-faint)", marginTop: "8px", fontStyle: "italic" }}>"{orden.notas_cliente}"</p>}
                </div>
              </div>

              {/* Pago Wompi (placeholder) */}
              {(orden.wompi_referencia || orden.fecha_pago) && (
                <div>
                  <p style={{ ...sectionTitle, display: "flex", alignItems: "center", gap: "0.4rem" }}><CreditCard size={13} /> Pago</p>
                  <div style={{ backgroundColor: "var(--color-surface-light)", border: "1px solid var(--color-border-light)", borderRadius: "var(--radius-lg)", padding: "0.875rem" }}>
                    {orden.wompi_referencia && <p style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)" }}>Ref. Wompi: {orden.wompi_referencia}</p>}
                    {orden.fecha_pago && <p style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", marginTop: "4px" }}>Fecha pago: {new Date(orden.fecha_pago).toLocaleString("es-CO")}</p>}
                  </div>
                </div>
              )}

              {/* Editar estado */}
              <div>
                <p style={sectionTitle}>Cambiar estado</p>
                <select
                  value={estado}
                  onChange={(e) => setEstado(e.target.value as EstadoOrden)}
                  style={inputStyle}
                >
                  {ESTADOS_SECUENCIA.map((s) => (
                    <option key={s} value={s}>{ESTADO_ORDEN_STYLES[s].label}</option>
                  ))}
                </select>
              </div>

              {/* Costo de envio */}
              <div>
                <p style={sectionTitle}>Costo de envio (COP)</p>
                <input
                  type="number"
                  min="0"
                  style={inputStyle}
                  value={costoEnvio}
                  onChange={(e) => setCostoEnvio(e.target.value)}
                  placeholder="0"
                />
              </div>

              {/* Notas internas */}
              <div>
                <p style={sectionTitle}>Notas internas</p>
                <textarea
                  style={{ ...inputStyle, resize: "vertical", minHeight: "80px" }}
                  placeholder="Notas privadas del equipo..."
                  value={notasInternas}
                  onChange={(e) => setNotasInternas(e.target.value)}
                />
              </div>

            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "1.25rem 1.5rem", borderTop: "1px solid var(--color-border-light)", backgroundColor: "var(--color-surface-light)" }}>
          <Button variant="accent" size="md" className="w-full" onClick={handleSave} disabled={saving}>
            <Save size={15} style={{ marginRight: "0.4rem" }} />
            {saving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </aside>
    </>
  );
}
