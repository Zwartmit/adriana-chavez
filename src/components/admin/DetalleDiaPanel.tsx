import { X, Plus, Clock, User, Scissors } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/Button";
import { estadoLabel } from "@/lib/utils";
import type { CitaUI, BloqueoUI } from "./CalendarioCitas";

interface DetalleDiaPanelProps {
  isOpen: boolean;
  date: Date | undefined;
  citas: CitaUI[];
  bloqueos?: BloqueoUI[];
  onClose: () => void;
  onNuevaCita: () => void;
  onCitaClick: (cita: CitaUI) => void;
}

export function DetalleDiaPanel({
  isOpen,
  date,
  citas,
  bloqueos = [],
  onClose,
  onNuevaCita,
  onCitaClick,
}: DetalleDiaPanelProps) {
  if (!date) return null;

  // Format the time as 12h
  const formatTime = (date: Date) => format(date, "hh:mm a");

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 65,
          backgroundColor: "rgba(0,0,0,0.6)",
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          transition: "opacity 350ms ease",
        }}
      />

      {/* Slide-over Panel */}
      <aside
        className={`fixed top-0 right-0 bottom-0 z-[66] flex flex-col bg-[var(--color-surface)] w-full sm:w-[440px] transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div
          className="flex items-center justify-between p-4 sm:p-6 shrink-0"
          style={{
            background: "linear-gradient(135deg, rgba(232,201,122,0.1) 0%, rgba(26,24,32,0.95) 100%)",
            borderBottom: "0.5px solid rgba(232,201,122,0.25)",
          }}
        >
          <div className="flex flex-col">
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontStyle: "italic",
                fontSize: "var(--text-xl)",
                color: "white",
              }}
            >
              Agenda del día
            </h2>
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-sm)",
                color: "var(--color-text-secondary)",
              }}
            >
              {format(date, "EEEE, d 'de' MMMM", { locale: es })}
            </span>
          </div>
          <button type="button" aria-label="Cerrar" onClick={onClose} style={{ color: "white" }}>
            <X size={22} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-4">
          <Button variant="accent" size="md" className="w-full flex items-center justify-center gap-2" onClick={onNuevaCita}>
            <Plus size={18} /> Nueva cita
          </Button>

          <div className="flex flex-col gap-3 mt-2">
            {citas.length === 0 && bloqueos.length === 0 ? (
              <div
                className="text-center p-8"
                style={{
                  border: "1px dashed var(--color-border)",
                  borderRadius: "var(--radius-lg)",
                  backgroundColor: "var(--color-bg-alt)",
                }}
              >
                <p style={{ fontFamily: "var(--font-body)", color: "var(--color-text-muted)" }}>
                  No hay citas ni bloqueos agendados para este día.
                </p>
              </div>
            ) : (
              [
                ...citas.map(c => ({ type: "cita" as const, data: c, time: c.fechaHora.getTime() })),
                ...bloqueos.map(b => ({ type: "bloqueo" as const, data: b, time: b.fechaInicio.getTime() }))
              ]
                .sort((a, b) => a.time - b.time)
                .map((item) => {
                  if (item.type === "cita") {
                    const cita = item.data as CitaUI;
                    return (
                      <button
                        key={`cita-${cita.id}`}
                        onClick={() => onCitaClick(cita)}
                        className="flex flex-col gap-2 p-4 text-left transition-colors"
                        style={{
                          border: "1px solid var(--color-border)",
                          borderRadius: "var(--radius-lg)",
                          backgroundColor: "var(--color-bg-alt)",
                          borderLeft: `4px solid ${cita.profesionalColor}`,
                          opacity: cita.estado === "cancelada" || cita.estado === "no_asistio" ? 0.6 : 1,
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-surface-alt)")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--color-bg-alt)")}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontWeight: 600,
                              fontSize: "var(--text-md)",
                              color: "var(--color-text-primary)",
                            }}
                          >
                            {formatTime(cita.fechaHora)}
                          </span>
                          <span
                            style={{
                              fontFamily: "var(--font-body)",
                              fontSize: "var(--text-xs)",
                              fontWeight: 600,
                              padding: "2px 8px",
                              borderRadius: "var(--radius-full)",
                              backgroundColor: cita.estado === "completada" 
                                ? "rgba(46, 204, 113, 0.15)"
                                : cita.estado === "cancelada"
                                ? "rgba(231, 76, 60, 0.15)"
                                : cita.estado === "no_asistio"
                                ? "rgba(149, 165, 166, 0.15)"
                                : "var(--glass-champagne-bg)",
                              color: cita.estado === "completada"
                                ? "#2ecc71"
                                : cita.estado === "cancelada"
                                ? "#e74c3c"
                                : cita.estado === "no_asistio"
                                ? "#95a5a6"
                                : "var(--color-primary-dim)",
                            }}
                          >
                            {estadoLabel(cita.estado)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mt-1">
                          <User size={14} style={{ color: "var(--color-text-muted)" }} />
                          <span
                            style={{
                              fontFamily: "var(--font-body)",
                              fontSize: "var(--text-sm)",
                              fontWeight: 500,
                              color: "var(--color-text-primary)",
                            }}
                          >
                            {cita.clienteNombre}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 mt-1">
                          <div className="flex items-center gap-1">
                            <Scissors size={14} style={{ color: "var(--color-text-muted)" }} />
                            <span
                              style={{
                                fontFamily: "var(--font-body)",
                                fontSize: "var(--text-sm)",
                                color: "var(--color-text-secondary)",
                              }}
                            >
                              {cita.servicioNombre}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock size={14} style={{ color: "var(--color-text-muted)" }} />
                            <span
                              style={{
                                fontFamily: "var(--font-body)",
                                fontSize: "var(--text-sm)",
                                color: "var(--color-text-secondary)",
                              }}
                            >
                              {cita.duracionMin} min
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  } else {
                    const bloqueo = item.data as BloqueoUI;
                    return (
                      <div
                        key={`bloqueo-${bloqueo.id}`}
                        className="flex flex-col gap-2 p-4 text-left"
                        style={{
                          border: "1px dashed var(--color-border)",
                          borderRadius: "var(--radius-lg)",
                          backgroundColor: "rgba(0,0,0,0.02)",
                          borderLeft: `4px solid var(--color-border-light)`,
                        }}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontWeight: 600,
                              fontSize: "var(--text-md)",
                              color: "var(--color-text-secondary)",
                            }}
                          >
                            {formatTime(bloqueo.fechaInicio)} – {formatTime(bloqueo.fechaFin)}
                          </span>
                          <span
                            style={{
                              fontFamily: "var(--font-body)",
                              fontSize: "var(--text-xs)",
                              fontWeight: 600,
                              padding: "2px 8px",
                              borderRadius: "var(--radius-full)",
                              backgroundColor: "var(--color-bg-alt)",
                              color: "var(--color-text-muted)",
                            }}
                          >
                            Bloqueo
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mt-1">
                          <User size={14} style={{ color: "var(--color-text-muted)" }} />
                          <span
                            style={{
                              fontFamily: "var(--font-body)",
                              fontSize: "var(--text-sm)",
                              fontWeight: 500,
                              color: "var(--color-text-secondary)",
                            }}
                          >
                            {bloqueo.profesionalNombre}
                          </span>
                        </div>
                        
                        {bloqueo.motivo && (
                          <div className="mt-1 flex items-start gap-1">
                            <span
                              style={{
                                fontFamily: "var(--font-body)",
                                fontSize: "var(--text-sm)",
                                color: "var(--color-text-muted)",
                              }}
                            >
                              {bloqueo.motivo}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  }
                })
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

