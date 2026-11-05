import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";

interface PagoPorValidar {
  id: number;
  telefono: string;
  monto: number;
  inicio: string;
  comprobante_en: string | null;
  creada_en: string;
  metodo: string | null;
  clienta: string;
  servicio: string;
  profesional: string;
}

type FilaSolicitud = {
  id: number;
  telefono: string;
  monto: number | string;
  inicio: string;
  comprobante_en: string | null;
  creada_en: string;
  metodo: string | null;
  clientes: { nombre: string | null; apellido: string | null } | null;
  servicios: { nombre: string | null } | null;
  profesionales: { nombre: string | null } | null;
};

const ZONA = "America/Bogota";

function fechaCita(iso: string): string {
  const d = new Date(iso);
  const dia = new Intl.DateTimeFormat("es-CO", { weekday: "short", day: "numeric", month: "short", timeZone: ZONA }).format(d);
  const hora = new Intl.DateTimeFormat("es-CO", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: ZONA }).format(d);
  return `${dia}, ${hora}`;
}

function haceCuanto(iso: string): string {
  const min = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 48) return `hace ${h} h`;
  return `hace ${Math.floor(h / 24)} días`;
}

const celda: React.CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: "var(--text-sm)",
  color: "var(--color-text-on-light)",
};

const tenue: React.CSSProperties = { ...celda, color: "var(--color-text-on-light-muted)" };

export function PagosPorValidar() {
  const [pagos, setPagos] = useState<PagoPorValidar[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    const { data, error } = await supabase
      .from("solicitudes_anticipo")
      .select(
        "id, telefono, monto, inicio, comprobante_en, creada_en, metodo, clientes(nombre, apellido), servicios(nombre), profesionales(nombre)",
      )
      .eq("estado", "por_confirmar")
      .order("inicio", { ascending: true });
    if (error) {
      console.error("Error cargando los pagos por validar:", error.message);
      setError("No se pudieron cargar los pagos por validar.");
      setCargando(false);
      return;
    }
    setPagos(
      ((data ?? []) as unknown as FilaSolicitud[]).map((s) => ({
        id: s.id,
        telefono: s.telefono,
        monto: Number(s.monto),
        inicio: s.inicio,
        comprobante_en: s.comprobante_en,
        creada_en: s.creada_en,
        metodo: s.metodo,
        clienta: [s.clientes?.nombre, s.clientes?.apellido].filter(Boolean).join(" ") || s.telefono,
        servicio: s.servicios?.nombre ?? "Servicio",
        profesional: s.profesionales?.nombre ?? "",
      })),
    );
    setCargando(false);
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const total = (pagos ?? []).reduce((suma, p) => suma + p.monto, 0);

  return (
    <section
      style={{
        backgroundColor: "var(--color-surface-light)",
        border: "1px solid var(--color-border-light)",
        borderRadius: "var(--radius-xl)",
        padding: "2rem",
        marginBottom: "1.5rem",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3
            style={{
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontSize: "var(--text-xl)",
              color: "var(--color-text-on-light)",
              marginBottom: "0.5rem",
            }}
          >
            Pagos por validar
          </h3>
          <p style={{ ...tenue, marginBottom: "1rem" }}>
            Comprobantes que las clientas ya enviaron y que faltan por confirmar. La cita ya está agendada y queda
            pendiente hasta que respondas Recibido o No recibido en el aviso de Telegram. Esta lista solo se consulta;
            para validar, usa los botones del aviso (si no lo encuentras, pídele al asistente que te lo reenvíe).
          </p>
        </div>
        <button
          type="button"
          onClick={cargar}
          disabled={cargando}
          aria-label="Actualizar la lista"
          title="Actualizar"
          style={{ background: "none", border: "none", cursor: "pointer", padding: "0.25rem", color: "var(--color-text-on-light)" }}
        >
          <RefreshW spinning={cargando} />
        </button>
      </div>

      {error ? (
        <p style={{ ...celda, color: "var(--color-error)" }}>{error}</p>
      ) : pagos === null ? (
        <p style={tenue}>Cargando…</p>
      ) : pagos.length === 0 ? (
        <p style={tenue}>No hay pagos por validar.</p>
      ) : (
        <>
          <div className="space-y-3">
            {pagos.map((p) => {
              const pasada = new Date(p.inicio).getTime() < Date.now();
              return (
                <div
                  key={p.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                  style={{
                    border: "1px solid var(--color-border-light)",
                    borderRadius: "var(--radius-lg)",
                    padding: "0.875rem 1rem",
                  }}
                >
                  <div>
                    <div style={{ ...celda, fontWeight: 600 }}>{p.clienta}</div>
                    <div style={tenue}>
                      {p.servicio}
                      {p.profesional ? ` con ${p.profesional}` : ""}
                    </div>
                    <div style={tenue}>
                      Cita: {fechaCita(p.inicio)}
                      {pasada ? " (ya pasó)" : ""} · Comprobante {haceCuanto(p.comprobante_en ?? p.creada_en)}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span style={{ ...celda, fontWeight: 600 }}>{formatPrice(p.monto)}</span>
                    <a
                      href={`https://wa.me/${p.telefono.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ ...celda, textDecoration: "underline" }}
                    >
                      WhatsApp
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
          <p style={{ ...tenue, marginTop: "0.75rem" }}>
            {pagos.length} {pagos.length === 1 ? "pago" : "pagos"} · {formatPrice(total)} por confirmar
          </p>
        </>
      )}
    </section>
  );
}

function RefreshW({ spinning }: { spinning: boolean }) {
  return <RefreshCw size={18} className={spinning ? "animate-spin" : undefined} />;
}
