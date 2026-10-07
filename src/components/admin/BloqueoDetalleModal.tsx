import { useState } from "react";
import { X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/admin/ConfirmModal";
import { supabase } from "@/lib/supabase/client";
import type { BloqueoUI } from "@/components/admin/CalendarioCitas";

interface BloqueoDetalleModalProps {
  bloqueo: BloqueoUI | null;
  onClose: () => void;
  onDeleted: () => void;
  onError: (message: string) => void;
}

const rowLabel: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: "var(--text-xs)",
  textTransform: "uppercase",
  letterSpacing: "var(--tracking-wider)",
  color: "var(--color-text-on-light-faint)",
};

const rowValue: React.CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: "var(--text-base)",
  color: "var(--color-text-on-light)",
};

export function BloqueoDetalleModal({ bloqueo, onClose, onDeleted, onError }: BloqueoDetalleModalProps) {
  const [updating, setUpdating] = useState(false);
  const [confirmAction, setConfirmAction] = useState<boolean>(false);

  if (!bloqueo) return null;

  const handleDelete = async () => {
    setUpdating(true);
    const { error } = await supabase.from("bloqueos_horario").delete().eq("id", bloqueo.id);
    setUpdating(false);
    setConfirmAction(false);

    if (error) {
      console.error("[BloqueoDetalleModal] error al eliminar:", error.message);
      onError("No se pudo eliminar el bloqueo.");
      return;
    }

    onDeleted();
    onClose();
  };

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
        className="bg-[var(--color-surface-light)]"
        style={{
          width: "100%",
          maxWidth: "400px",
          borderRadius: "var(--radius-2xl)",
          padding: "2rem",
          position: "relative",
          boxShadow: "var(--shadow-xl)",
          border: "1px solid var(--color-border-light)",
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
            color: "var(--color-text-on-light-muted)",
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
              color: "var(--color-text-on-light)",
            }}
          >
            Detalle del bloqueo
          </h2>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <p style={rowLabel}>Profesional</p>
            <p style={rowValue}>{bloqueo.profesionalNombre}</p>
          </div>

          <div style={{ borderTop: "1px solid var(--color-border-light)" }} />

          <div>
            <p style={rowLabel}>Fecha</p>
            <p style={rowValue}>
              {bloqueo.fechaInicio.toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>

          <div className="flex justify-between gap-4">
            <div>
              <p style={rowLabel}>Hora Inicio</p>
              <p style={rowValue}>
                {bloqueo.fechaInicio.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", hour12: true })}
              </p>
            </div>
            <div>
              <p style={rowLabel}>Hora Fin</p>
              <p style={rowValue}>
                {bloqueo.fechaFin.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", hour12: true })}
              </p>
            </div>
          </div>

          {bloqueo.motivo && (
            <>
              <div style={{ borderTop: "1px solid var(--color-border-light)" }} />
              <div>
                <p style={rowLabel}>Motivo</p>
                <p style={{ ...rowValue, fontSize: "var(--text-sm)" }}>
                  {bloqueo.motivo}
                </p>
              </div>
            </>
          )}
        </div>

        <div className="flex gap-2 w-full" style={{ marginTop: "2rem" }}>
          <Button
            variant="secondary"
            size="sm"
            className="flex-1 !text-[var(--color-error)] hover:!bg-[var(--color-error)] hover:!text-white hover:!border-[var(--color-error)] flex items-center justify-center gap-2"
            disabled={updating}
            onClick={() => setConfirmAction(true)}
            style={{ borderColor: "rgba(224,82,82,0.3)" }}
          >
            <Trash2 size={16} />
            Eliminar bloqueo
          </Button>
        </div>
      </div>

      {confirmAction && (
        <ConfirmModal
          title="Eliminar bloqueo"
          message="¿Estás segura de querer eliminar este bloqueo de horario? Esta acción no se puede deshacer."
          confirmLabel="Sí, eliminar"
          loading={updating}
          onConfirm={handleDelete}
          onCancel={() => setConfirmAction(false)}
        />
      )}
    </div>
  );
}
