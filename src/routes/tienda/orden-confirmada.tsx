import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, ShoppingBag, Clock, Package, Truck, CheckCheck, XCircle } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";

export const Route = createFileRoute("/tienda/orden-confirmada")({
  validateSearch: (search: Record<string, unknown>) => ({
    id: typeof search.id === "string" ? search.id : "",
  }),
  component: OrdenConfirmadaPage,
});

interface ItemResumen {
  nombre: string;
  cantidad: number;
  precio: number;
  subtotal: number;
}

interface OrdenResumen {
  id: string;
  estado: string;
  nombre_envio: string;
  total: number;
  subtotal: number;
  costo_envio: number;
  created_at: string;
  wompi_referencia: string | null;
  wompi_estado: string | null;
  fecha_pago: string | null;
  items: ItemResumen[];
}

const ESTADO_CONFIG: Record<string, { label: string; icon: typeof Clock; color: string; bg: string }> = {
  pendiente:      { label: "Pendiente de pago",  icon: Clock,        color: "#C8A84A", bg: "rgba(200,168,74,0.15)"  },
  pagada:         { label: "Pago confirmado",     icon: CheckCheck,   color: "#3D8F66", bg: "rgba(76,175,128,0.15)" },
  en_preparacion: { label: "En preparacion",      icon: Package,      color: "#3B82F6", bg: "rgba(59,130,246,0.15)" },
  enviada:        { label: "En camino",           icon: Truck,        color: "#8B5CF6", bg: "rgba(139,92,246,0.15)" },
  entregada:      { label: "Entregada",           icon: CheckCircle2, color: "#22C55E", bg: "rgba(34,197,94,0.15)"  },
  cancelada:      { label: "Cancelada",           icon: XCircle,      color: "#E05252", bg: "rgba(224,82,82,0.15)"  },
};

function OrdenConfirmadaPage() {
  const { id } = Route.useSearch();
  const [orden, setOrden] = useState<OrdenResumen | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return setLoading(false);
    async function load() {
      // Usa la función RPC segura — cualquiera con el UUID exacto ve SU orden.
      // Nadie puede listar las órdenes de otros sin tener el UUID.
      const { data, error } = await supabase.rpc("get_orden_publica", { orden_id: id });
      if (!error && data) {
        setOrden(data as OrdenResumen);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  const shortId = id ? id.slice(0, 8).toUpperCase() : "";
  const estadoCfg = orden ? (ESTADO_CONFIG[orden.estado] ?? ESTADO_CONFIG["pendiente"]) : null;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--color-bg)", color: "var(--color-text-primary)", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <div style={{ maxWidth: "520px", width: "100%", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 80, height: 80, borderRadius: "50%", backgroundColor: "rgba(76,175,128,0.15)", border: "2px solid rgba(76,175,128,0.4)", marginBottom: "1.5rem" }}>
          <CheckCircle2 size={40} style={{ color: "#4CAF80" }} />
        </div>

        <h1 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 600, fontSize: "clamp(1.75rem, 4vw, 2.5rem)", marginBottom: "0.75rem" }}>
          Pedido recibido
        </h1>

        {shortId && (
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)", color: "var(--color-text-muted)", marginBottom: "0.5rem" }}>
            Referencia: <span style={{ color: "var(--color-primary)", fontWeight: 700 }}>#{shortId}</span>
          </p>
        )}

        {/* Badge de estado — el cliente puede recargar la página para ver el estado actual */}
        {estadoCfg && orden && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "5px 14px", borderRadius: "var(--radius-full)", backgroundColor: estadoCfg.bg, marginBottom: "1.25rem" }}>
            <estadoCfg.icon size={14} style={{ color: estadoCfg.color }} />
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", fontWeight: 700, color: estadoCfg.color, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {estadoCfg.label}
            </span>
          </div>
        )}

        <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-base)", color: "var(--color-text-muted)", lineHeight: 1.7, marginBottom: "2rem" }}>
          Gracias por tu pedido. Un asesor se pondra en contacto contigo pronto para coordinar el pago y los detalles del envio.
        </p>

        {loading && (
          <div style={{ marginBottom: "2rem", color: "var(--color-text-muted)", fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)" }}>
            Cargando resumen...
          </div>
        )}

        {!loading && orden && (
          <div style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-2xl)", padding: "1.5rem", marginBottom: "2rem", textAlign: "left" }}>
            <h2 style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "var(--text-base)", marginBottom: "1rem" }}>
              Resumen del pedido
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1rem" }}>
              {(orden.items ?? []).map((item, i) => (
                <div key={i} className="flex justify-between">
                  <span style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
                    {item.nombre} x{item.cantidad}
                  </span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)" }}>
                    {formatPrice(item.subtotal)}
                  </span>
                </div>
              ))}
            </div>
            <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.3rem" }}>
              <div className="flex justify-between">
                <span style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>Subtotal</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)" }}>{formatPrice(orden.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>Envio</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)", color: orden.costo_envio > 0 ? "var(--color-text-primary)" : "var(--color-text-muted)" }}>
                  {orden.costo_envio > 0 ? formatPrice(orden.costo_envio) : "A confirmar"}
                </span>
              </div>
              <div className="flex justify-between" style={{ borderTop: "1px solid var(--color-border)", paddingTop: "0.5rem", marginTop: "0.15rem" }}>
                <span style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "var(--text-sm)" }}>Total</span>
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "var(--text-base)", color: "var(--color-primary)" }}>{formatPrice(orden.total)}</span>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem", alignItems: "center" }}>
          <a href="/tienda">
            <button style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "12px 28px", backgroundColor: "var(--color-primary)", color: "var(--color-text-inverse)", border: "none", borderRadius: "var(--radius-full)", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "var(--text-sm)", cursor: "pointer" }}>
              <ShoppingBag size={16} /> Seguir comprando
            </button>
          </a>
          <a href="/" style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)", color: "var(--color-text-muted)", textDecoration: "none" }}>
            Volver al inicio
          </a>
        </div>
      </div>
    </div>
  );
}
