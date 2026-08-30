import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase/client";
import type { EstadoCita } from "@/lib/supabase/types";
import type { CitaUI } from "@/components/admin/CalendarioCitas";

const ESTADO_STYLES: Record<EstadoCita, { label: string; bg: string; color: string }> = {
  pendiente: { label: "Pendiente", bg: "rgba(212,168,75,0.15)", color: "var(--color-warning)" },
  confirmada: { label: "Confirmada", bg: "var(--color-accent-lt)", color: "var(--color-primary)" },
  en_proceso: { label: "En proceso", bg: "rgba(232,201,122,0.15)", color: "var(--color-primary)" },
  completada: { label: "Completada", bg: "rgba(76,175,128,0.15)", color: "var(--color-success)" },
  cancelada: { label: "Cancelada", bg: "rgba(224,82,82,0.15)", color: "var(--color-error)" },
  no_asistio: { label: "No asistió", bg: "rgba(245,242,235,0.08)", color: "var(--color-text-muted)" },
};

interface CitaDetalleModalProps {
  cita: CitaUI | null;
  onClose: () => void;
  onUpdated: () => void;
  onError: (message: string) => void;
}

const rowLabel: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: "var(--text-xs)",
  textTransform: "uppercase",
  letterSpacing: "var(--tracking-wider)",
  color: "var(--color-text-muted)",
};

const rowValue: React.CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: "var(--text-base)",
  color: "var(--color-text-primary)",
};

export function CitaDetalleModal({ cita, onClose, onUpdated, onError }: CitaDetalleModalProps) {
  const [updating, setUpdating] = useState(false);

  if (!cita) return null;

  const handleUpdateEstado = async (estado: EstadoCita) => {
    setUpdating(true);
    const { error } = await supabase.from("citas").update({ estado } as any).eq("id", cita.id);
    setUpdating(false);

    if (error) {
      console.error("[CitaDetalleModal] error al actualizar:", error.message);
      onError("No se pudo actualizar la cita.");
      return;
    }

    onUpdated();
    onClose();
  };

  const estadoStyle = ESTADO_STYLES[cita.estado];

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 75,
        backgroundColor: "rgba(0,0,0,0.65)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass-frosted"
        style={{
          width: "100%",
          maxWidth: "440px",
          borderRadius: "var(--radius-2xl)",
          padding: "2rem",
          position: "relative",
        }}
      >
        <button
          type="button"
          aria-label="Cerrar"
          onClick={onClose}
          style={{
            position: "absolute",
            top: "1.25rem",
            right: "1.25rem",
            color: "var(--color-text-muted)",
          }}
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3" style={{ marginBottom: "1.5rem" }}>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontWeight: 600,
              fontSize: "var(--text-2xl)",
              color: "var(--color-text-primary)",
            }}
          >
            Detalle de cita
          </h2>
          <span
            style={{
              backgroundColor: estadoStyle.bg,
              color: estadoStyle.color,
              fontFamily: "var(--font-mono)",
              fontSize: "var(--text-xs)",
              textTransform: "uppercase",
              letterSpacing: "var(--tracking-wider)",
              padding: "4px 10px",
              borderRadius: "var(--radius-full)",
            }}
          >
            {estadoStyle.label}
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <p style={rowLabel}>Clienta</p>
            <p style={rowValue}>{cita.clienteNombre}</p>
            {cita.clienteTelefono && (
              <p style={{ ...rowValue, fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                {cita.clienteTelefono}
              </p>
            )}
          </div>

          <div style={{ borderTop: "1px solid var(--color-border)" }} />

          <div className="flex justify-between gap-4">
            <div>
              <p style={rowLabel}>Servicio</p>
              <p style={rowValue}>{cita.servicioNombre}</p>
            </div>
            <div>
              <p style={rowLabel}>Estilista</p>
              <div className="flex items-center gap-2">
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    backgroundColor: cita.estilistaColor,
                    display: "inline-block",
                  }}
                />
                <p style={rowValue}>{cita.estilistaNombre}</p>
              </div>
            </div>
          </div>

          <div style={{ borderTop: "1px solid var(--color-border)" }} />

          <div className="flex justify-between gap-4">
            <div>
              <p style={rowLabel}>Fecha y hora</p>
              <p style={rowValue}>
                {cita.fechaHora.toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })}
                {" · "}
                {cita.fechaHora.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
            <div>
              <p style={rowLabel}>Duración</p>
              <p style={rowValue}>{cita.duracionMin} min</p>
            </div>
          </div>

          {cita.notasCliente && (
            <>
              <div style={{ borderTop: "1px solid var(--color-border)" }} />
              <div>
                <p style={rowLabel}>Notas</p>
                <p style={{ ...rowValue, fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                  {cita.notasCliente}
                </p>
              </div>
            </>
          )}
        </div>

        <div className="flex flex-wrap gap-2" style={{ marginTop: "2rem" }}>
          <Button
            variant="accent"
            size="sm"
            disabled={updating || cita.estado === "confirmada"}
            onClick={() => handleUpdateEstado("confirmada")}
          >
            Confirmar
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={updating || cita.estado === "completada"}
            onClick={() => handleUpdateEstado("completada")}
          >
            Marcar completada
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={updating || cita.estado === "cancelada"}
            onClick={() => handleUpdateEstado("cancelada")}
          >
            Cancelar cita
          </Button>
        </div>
      </div>
    </div>
  );
}
