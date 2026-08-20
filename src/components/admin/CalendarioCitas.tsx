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
import { AdminToast, type ToastState } from "@/components/admin/AdminToast";

export interface CitaUI {
  id: string;
  fechaHora: Date;
  duracionMin: number;
  estado: EstadoCita;
  notasCliente: string | null;
  clienteNombre: string;
  clienteTelefono: string | null;
  estilistaNombre: string;
  estilistaColor: string;
  servicioNombre: string;
}

interface CitaRow {
  id: string;
  fecha_hora: string;
  duracion_min: number;
  estado: EstadoCita;
  notas_cliente: string | null;
  clientes: { nombre: string; apellido: string | null; telefono: string | null } | null;
  estilistas: { nombre: string; color_calendario: string } | null;
  servicios: { nombre: string; duracion_min: number } | null;
}

const DIAS_SEMANA = ["L", "M", "X", "J", "V", "S", "D"];

function mapCita(row: CitaRow): CitaUI {
  const cliente = row.clientes;
  return {
    id: row.id,
    fechaHora: parseISO(row.fecha_hora),
    duracionMin: row.duracion_min,
    estado: row.estado,
    notasCliente: row.notas_cliente,
    clienteNombre: cliente ? `${cliente.nombre} ${cliente.apellido ?? ""}`.trim() : "Cliente",
    clienteTelefono: cliente?.telefono ?? null,
    estilistaNombre: row.estilistas?.nombre ?? "Sin asignar",
    estilistaColor: row.estilistas?.color_calendario ?? "#E8C97A",
    servicioNombre: row.servicios?.nombre ?? "Servicio",
  };
}

export function CalendarioCitas() {
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [citas, setCitas] = useState<CitaUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [panelOpen, setPanelOpen] = useState(false);
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
        estilistas(nombre, color_calendario),
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

    console.log(`[CalendarioCitas] ${data.length} citas cargadas desde Supabase`);
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

  const openNuevaCita = (date?: Date) => {
    setPanelDate(date);
    setPanelOpen(true);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between" style={{ marginBottom: "1.5rem" }}>
        <div className="flex items-center gap-4">
          <h2
            className="capitalize"
            style={{
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontWeight: 600,
              fontSize: "var(--text-2xl)",
              color: "var(--color-text-primary)",
              minWidth: "220px",
            }}
          >
            {format(currentMonth, "MMMM yyyy", { locale: es })}
          </h2>
          <div className="flex items-center gap-2">
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
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-full)",
                background: "transparent",
                color: "var(--color-text-secondary)",
                cursor: "pointer",
              }}
            >
              <ChevronLeft size={18} />
            </button>
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
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-full)",
                background: "transparent",
                color: "var(--color-text-secondary)",
                cursor: "pointer",
              }}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
        <Button variant="accent" size="md" onClick={() => openNuevaCita(undefined)}>
          Nueva cita +
        </Button>
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
          borderBottom: "1px solid var(--color-border)",
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
              color: "var(--color-text-muted)",
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
              className="animate-pulse"
              style={{
                minHeight: "110px",
                backgroundColor: "var(--color-surface)",
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
                onClick={() => openNuevaCita(day)}
                style={{
                  minHeight: "110px",
                  padding: "0.5rem",
                  backgroundColor: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  opacity: enMes ? 1 : 0.25,
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.3rem",
                  transition: "background-color var(--transition-fast)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-surface-alt)")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--color-surface)")}
              >
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "var(--text-sm)",
                      color: hoy ? "var(--color-text-inverse)" : "var(--color-text-primary)",
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
                      title={`${format(cita.fechaHora, "HH:mm")} · ${cita.clienteNombre}`}
                      style={{
                        backgroundColor: cita.estilistaColor,
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
                      {format(cita.fechaHora, "HH:mm")} {cita.clienteNombre}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <NuevaCitaPanel
        isOpen={panelOpen}
        onClose={() => setPanelOpen(false)}
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
