import { useCallback, useEffect, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase/client";
import type { EstadoCita } from "@/lib/supabase/types";
import { NuevaCitaPanel } from "@/components/admin/NuevaCitaPanel";
import { CitaDetalleModal } from "@/components/admin/CitaDetalleModal";
import { DetalleDiaPanel } from "@/components/admin/DetalleDiaPanel";
import { AdminToast, type ToastState } from "@/components/admin/AdminToast";

export interface CitaUI {
  id: string;
  fechaHora: Date;
  duracionMin: number;
  estado: EstadoCita;
  notasCliente: string | null;
  clienteNombre: string;
  clienteTelefono: string | null;
  profesionalNombre: string;
  profesionalColor: string;
  servicioNombre: string;
}

interface CitaRow {
  id: string;
  fecha_hora: string;
  duracion_min: number;
  estado: EstadoCita;
  notas_cliente: string | null;
  clientes: { nombre: string; apellido: string | null; telefono: string | null } | null;
  profesionales: { nombre: string; color_calendario: string } | null;
  servicios: { nombre: string; duracion_min: number } | null;
}

const DIAS_SEMANA = ["L", "M", "X", "J", "V", "S", "D"];

function mapCita(row: CitaRow): CitaUI {
  const cliente = row.clientes;
  const fechaHora = parseISO(row.fecha_hora);

  // Auto-complete: si la hora de finalización ya pasó y la cita no fue cancelada/no_asistio,
  // la mostramos visualmente como "completada" sin tocar la BD.
  let estadoVisual: EstadoCita = row.estado;
  const estadosActivos: EstadoCita[] = ["pendiente", "confirmada", "en_proceso"];
  if (estadosActivos.includes(row.estado)) {
    const finalizacion = new Date(fechaHora.getTime() + row.duracion_min * 60_000);
    if (finalizacion < new Date()) {
      estadoVisual = "completada";
    }
  }

  return {
    id: row.id,
    fechaHora,
    duracionMin: row.duracion_min,
    estado: estadoVisual,
    notasCliente: row.notas_cliente,
    clienteNombre: cliente ? `${cliente.nombre} ${cliente.apellido ?? ""}`.trim() : "Clienta",
    clienteTelefono: cliente?.telefono ?? null,
    profesionalNombre: row.profesionales?.nombre ?? "Sin asignar",
    profesionalColor: row.profesionales?.color_calendario ?? "#E8C97A",
    servicioNombre: row.servicios?.nombre ?? "Servicio",
  };
}

export function CalendarioCitas() {
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [citas, setCitas] = useState<CitaUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [nuevaCitaOpen, setNuevaCitaOpen] = useState(false);
  const [diaPanelOpen, setDiaPanelOpen] = useState(false);
  const [panelDate, setPanelDate] = useState<Date | undefined>(undefined);
  const [selectedCita, setSelectedCita] = useState<CitaUI | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  const fetchCitas = useCallback(async (month: Date) => {
    setLoading(true);
    setError(null);
    const inicioDelMes = startOfMonth(month);
    const finDelMes = endOfMonth(month);

    const { data, error } = await supabase
      .from("citas")
      .select(
        `
        id, fecha_hora, duracion_min, estado, notas_cliente,
        clientes(nombre, apellido, telefono),
        profesionales(nombre, color_calendario),
        servicios(nombre, duracion_min)
      `,
      )
      .gte("fecha_hora", inicioDelMes.toISOString())
      .lte("fecha_hora", finDelMes.toISOString())
      .order("fecha_hora", { ascending: true });

    if (error) {
      console.error("[CalendarioCitas] error al cargar citas:", error.message);
      setError(error.message);
      setLoading(false);
      return;
    }

    setCitas((data as unknown as CitaRow[]).map(mapCita));
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCitas(currentMonth);
  }, [currentMonth, fetchCitas]);

  const showToast = (message: string, type: ToastState["type"] = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2000);
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const openDiaPanel = (date: Date) => {
    setPanelDate(date);
    setDiaPanelOpen(true);
  };

  const openNuevaCita = (date?: Date) => {
    setPanelDate(date);
    setNuevaCitaOpen(true);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4" style={{ marginBottom: "1.5rem" }}>
        <div className="flex items-center justify-between w-full md:w-auto md:justify-start gap-2 md:gap-4">
          <button
            type="button"
            aria-label="Mes anterior"
            onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
            style={{
              width: 36,
              height: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid var(--color-border-light)",
              borderRadius: "var(--radius-full)",
              background: "transparent",
              color: "var(--color-text-on-light-muted)",
              cursor: "pointer",
            }}
          >
            <ChevronLeft size={18} />
          </button>

          <h2
            className="capitalize text-center"
            style={{
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontWeight: 600,
              fontSize: "var(--text-xl)",
              color: "var(--color-text-on-light)",
              minWidth: "150px",
            }}
          >
            {format(currentMonth, "MMMM yyyy", { locale: es })}
          </h2>

          <button
            type="button"
            aria-label="Mes siguiente"
            onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
            style={{
              width: 36,
              height: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid var(--color-border-light)",
              borderRadius: "var(--radius-full)",
              background: "transparent",
              color: "var(--color-text-on-light-muted)",
              cursor: "pointer",
            }}
          >
            <ChevronRight size={18} />
          </button>
        </div>
        <div className="w-full md:w-auto">
          <Button variant="accent" size="md" className="w-full md:w-auto" onClick={() => openNuevaCita(undefined)}>
            Nueva cita +
          </Button>
        </div>
      </div>

      {error && (
        <p style={{ fontFamily: "var(--font-body)", color: "var(--color-error)", marginBottom: "1rem" }}>
          {error}
        </p>
      )}

      {/* Días de la semana */}
      <div
        className="grid grid-cols-7"
        style={{
          borderBottom: "1px solid var(--color-border-light)",
          marginBottom: "0.25rem",
        }}
      >
        {DIAS_SEMANA.map((d) => (
          <div
            key={d}
            className="text-center uppercase"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--text-xs)",
              color: "var(--color-text-on-light-faint)",
              padding: "0.5rem 0",
              letterSpacing: "var(--tracking-wider)",
            }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 42 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse min-h-[70px] md:min-h-[110px]"
              style={{
                backgroundColor: "var(--color-surface-light)",
                border: "1px solid var(--color-border-light)",
                borderRadius: "var(--radius-md)",
              }}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const citasDelDia = citas.filter((c) => isSameDay(c.fechaHora, day));
            const enMes = isSameMonth(day, currentMonth);
            const hoy = isToday(day);

            return (
              <div
                key={day.toISOString()}
                onClick={() => openDiaPanel(day)}
                className="min-h-[70px] md:min-h-[110px]"
                style={{
                  padding: "0.25rem",
                  backgroundColor: "var(--color-surface-light)",
                  border: "1px solid var(--color-border-light)",
                  borderRadius: "var(--radius-md)",
                  opacity: enMes ? 1 : 0.25,
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.3rem",
                  transition: "background-color var(--transition-fast)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-bg-light-alt)")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--color-surface-light)")}
              >
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "var(--text-sm)",
                      color: hoy ? "var(--color-text-inverse)" : "var(--color-text-on-light)",
                      backgroundColor: hoy ? "var(--color-primary)" : "transparent",
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {day.getDate()}
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                  {citasDelDia.map((cita) => (
                    <button
                      key={cita.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCita(cita);
                      }}
                      title={`${format(cita.fechaHora, "hh:mm a")} · ${cita.clienteNombre}`}
                      style={{
                        backgroundColor: cita.profesionalColor,
                        color: "var(--color-text-inverse)",
                        border: "none",
                        borderRadius: "var(--radius-sm)",
                        padding: "2px 6px",
                        fontFamily: "var(--font-body)",
                        fontWeight: 600,
                        fontSize: "11px",
                        textAlign: "left",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        cursor: "pointer",
                        opacity: cita.estado === "cancelada" ? 0.5 : 1,
                      }}
                    >
                      {format(cita.fechaHora, "hh:mm a")} {cita.clienteNombre}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <DetalleDiaPanel
        isOpen={diaPanelOpen}
        date={panelDate}
        citas={panelDate ? citas.filter((c) => isSameDay(c.fechaHora, panelDate)) : []}
        onClose={() => setDiaPanelOpen(false)}
        onNuevaCita={() => {
          setDiaPanelOpen(false);
          openNuevaCita(panelDate);
        }}
        onCitaClick={(cita) => setSelectedCita(cita)}
      />

      <NuevaCitaPanel
        isOpen={nuevaCitaOpen}
        onClose={() => setNuevaCitaOpen(false)}
        defaultDate={panelDate}
        onCreated={() => {
          fetchCitas(currentMonth);
          showToast("Cita creada correctamente");
        }}
        onError={(msg) => showToast(msg, "error")}
      />

      <CitaDetalleModal
        cita={selectedCita}
        onClose={() => setSelectedCita(null)}
        onUpdated={() => {
          fetchCitas(currentMonth);
          showToast("Cita actualizada correctamente");
        }}
        onError={(msg) => showToast(msg, "error")}
      />

      <AdminToast toast={toast} />
    </div>
  );
}

