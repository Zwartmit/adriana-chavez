import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { es } from "react-day-picker/locale";
import "react-day-picker/style.css";
import { TZDate } from "@date-fns/tz";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/admin/ConfirmModal";
import { supabase } from "@/lib/supabase/client";
import type { EstadoCita } from "@/lib/supabase/types";
import type { CitaUI } from "@/components/admin/CalendarioCitas";
import { estadoLabel } from "@/lib/utils";

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
  color: "var(--color-text-on-light-faint)",
};

const rowValue: React.CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: "var(--text-base)",
  color: "var(--color-text-on-light)",
};

const fieldLabel: React.CSSProperties = {
  ...rowLabel,
  display: "block",
  marginBottom: "6px",
};

const fieldInput: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  backgroundColor: "var(--color-surface-light)",
  border: "1px solid var(--color-border-light)",
  borderRadius: "var(--radius-lg)",
  fontFamily: "var(--font-body)",
  fontSize: "var(--text-sm)",
  color: "var(--color-text-on-light)",
  outline: "none",
};

const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

function format12h(time24: string) {
  const [h, m] = time24.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toYmd(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** Texto para WhatsApp: "jueves 15 de octubre a las 3:00 pm" */
function textoFechaHora(fecha: Date, hora24: string) {
  return `${DIAS[fecha.getDay()]} ${fecha.getDate()} de ${MESES[fecha.getMonth()]} a las ${format12h(hora24).toLowerCase()}`;
}

/** Deja solo dígitos y agrega 57 (Colombia) a los celulares de 10 dígitos. */
function telefonoWhatsapp(telefono: string | null) {
  if (!telefono) return null;
  const digits = telefono.replace(/\D/g, "");
  if (digits.length === 10) return `57${digits}`;
  if (digits.length >= 11) return digits;
  return null;
}

interface ProfesionalOption {
  id: string;
  nombre: string;
}

interface CitaMovida {
  fecha: Date;
  hora: string;
  profesionalNombre: string;
}

export function CitaDetalleModal({ cita, onClose, onUpdated, onError }: CitaDetalleModalProps) {
  const [updating, setUpdating] = useState(false);
  const [confirmAction, setConfirmAction] = useState<EstadoCita | null>(null);

  // Reprogramación
  const [vista, setVista] = useState<"detalle" | "reprogramar" | "movida">("detalle");
  const [profesionales, setProfesionales] = useState<ProfesionalOption[]>([]);
  const [nuevaFecha, setNuevaFecha] = useState<Date | undefined>(undefined);
  const [nuevaProfesionalId, setNuevaProfesionalId] = useState("");
  const [nuevaHora, setNuevaHora] = useState("");
  const [horasLibres, setHorasLibres] = useState<string[]>([]);
  const [loadingHoras, setLoadingHoras] = useState(false);
  const [horasError, setHorasError] = useState<string | null>(null);
  const [moveError, setMoveError] = useState<string | null>(null);
  const [moving, setMoving] = useState(false);
  const [movida, setMovida] = useState<CitaMovida | null>(null);

  const citaId = cita?.id;

  // Cada vez que se abre otra cita, se vuelve a la vista de detalle
  useEffect(() => {
    setVista("detalle");
    setMovida(null);
    setMoveError(null);
    setConfirmAction(null);
  }, [citaId]);

  // Horas libres para la profesional y el día elegidos (la propia cita no cuenta como ocupada)
  useEffect(() => {
    if (vista !== "reprogramar" || !cita || !nuevaFecha || !nuevaProfesionalId) {
      setHorasLibres([]);
      return;
    }
    let cancelled = false;
    setLoadingHoras(true);
    setHorasError(null);
    supabase
      .rpc("horarios_libres", {
        p_servicio: cita.servicioId,
        p_fecha: toYmd(nuevaFecha),
        p_profesional: nuevaProfesionalId,
        p_incluir_pasadas: false,
        p_excluir_cita: cita.id,
      })
      .then(({ data, error }: { data: { inicio_local: string }[] | null; error: { message: string } | null }) => {
        if (cancelled) return;
        setLoadingHoras(false);
        if (error) {
          console.error("[CitaDetalleModal] error al cargar horas libres:", error.message);
          setHorasLibres([]);
          setHorasError("No se pudieron cargar las horas libres. Intenta de nuevo.");
          return;
        }
        const horas = (data ?? []).map((r) => r.inicio_local);
        setHorasLibres(horas);
        setNuevaHora((prev) => (horas.includes(prev) ? prev : ""));
      });
    return () => {
      cancelled = true;
    };
  }, [vista, cita, nuevaFecha, nuevaProfesionalId]);

  if (!cita) return null;

  const puedeReprogramar =
    ["pendiente", "confirmada", "en_proceso"].includes(cita.estadoReal) && cita.fechaFin > new Date();

  const abrirReprogramar = async () => {
    setMoveError(null);
    setHorasError(null);
    // fechaHora es un TZDate de Bogotá: sus getters devuelven la fecha y hora de Bogotá
    setNuevaFecha(new Date(cita.fechaHora.getFullYear(), cita.fechaHora.getMonth(), cita.fechaHora.getDate()));
    setNuevaProfesionalId(cita.profesionalId);
    setNuevaHora(`${pad2(cita.fechaHora.getHours())}:${pad2(cita.fechaHora.getMinutes())}`);
    setVista("reprogramar");
    const { data } = await supabase
      .from("profesionales")
      .select("id, nombre")
      .eq("activo", true)
      .order("orden", { ascending: true });
    setProfesionales((data as ProfesionalOption[] | null) ?? []);
  };

  const horaActual = `${pad2(cita.fechaHora.getHours())}:${pad2(cita.fechaHora.getMinutes())}`;
  const sinCambios =
    !!nuevaFecha &&
    toYmd(nuevaFecha) === toYmd(new Date(cita.fechaHora.getFullYear(), cita.fechaHora.getMonth(), cita.fechaHora.getDate())) &&
    nuevaProfesionalId === cita.profesionalId &&
    nuevaHora === horaActual;

  const handleReprogramar = async () => {
    setMoveError(null);
    if (!nuevaFecha || !nuevaProfesionalId || !nuevaHora) {
      setMoveError("Elige profesional, fecha y hora.");
      return;
    }
    const [hh, mm] = nuevaHora.split(":").map(Number);
    // Forzamos Bogotá sin importar la zona horaria del computador
    const fechaHora = new TZDate(
      nuevaFecha.getFullYear(), nuevaFecha.getMonth(), nuevaFecha.getDate(), hh, mm, 0, 0, "America/Bogota",
    );

    setMoving(true);
    // Al mover la cita se reinician los recordatorios para que se envíen según la nueva hora
    const { error } = await supabase
      .from("citas")
      .update({
        fecha_hora: fechaHora.toISOString(),
        profesional_id: nuevaProfesionalId,
        recordatorio_24h_enviado: false,
        recordatorio_2h_enviado: false,
        seguimiento_enviado: false,
      } as any)
      .eq("id", cita.id);
    setMoving(false);

    if (error) {
      console.error("[CitaDetalleModal] error al reprogramar:", error.message);
      setMoveError(error.code === "23P01" ? error.message : "No se pudo reprogramar la cita. Intenta de nuevo.");
      return;
    }

    setMovida({
      fecha: nuevaFecha,
      hora: nuevaHora,
      profesionalNombre: profesionales.find((p) => p.id === nuevaProfesionalId)?.nombre ?? cita.profesionalNombre,
    });
    setVista("movida");
    onUpdated();
  };

  const waNumero = telefonoWhatsapp(cita.clienteTelefono);
  const waUrl =
    movida && waNumero
      ? `https://wa.me/${waNumero}?text=${encodeURIComponent(
          `Hola ${cita.clienteNombre.split(" ")[0]}! Te escribimos del salón de Adriana Chávez. Tu cita de ${cita.servicioNombre} quedó reprogramada para el ${textoFechaHora(movida.fecha, movida.hora)}. Si no te funciona, avísanos y la cambiamos. Un abrazo!`,
        )}`
      : null;

  const handleUpdateEstado = async (estado: EstadoCita) => {
    setUpdating(true);
    const { error } = await supabase.from("citas").update({ estado } as any).eq("id", cita.id);
    setUpdating(false);

    if (error) {
      console.error("[CitaDetalleModal] error al actualizar:", error.message);
      onError("No se pudo actualizar la cita.");
      setConfirmAction(null);
      return;
    }

    setConfirmAction(null);
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
        className="bg-[var(--color-surface-light)]"
        style={{
          width: "100%",
          maxWidth: "440px",
          borderRadius: "var(--radius-2xl)",
          padding: "2rem",
          position: "relative",
          boxShadow: "var(--shadow-xl)",
          border: "1px solid var(--color-border-light)",
          maxHeight: "calc(100vh - 3rem)",
          overflowY: "auto",
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
            {vista === "reprogramar" ? "Reprogramar cita" : vista === "movida" ? "Cita reprogramada" : "Detalle de cita"}
          </h2>
          {vista === "detalle" && <span
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
            {estadoLabel(cita.estado)}
          </span>}
        </div>

        {vista === "detalle" && (<>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <p style={rowLabel}>Clienta</p>
            <p style={rowValue}>{cita.clienteNombre}</p>
            {cita.clienteTelefono && (
              <p style={{ ...rowValue, fontSize: "var(--text-sm)", color: "var(--color-text-on-light-muted)" }}>
                {cita.clienteTelefono}
              </p>
            )}
          </div>

          <div style={{ borderTop: "1px solid var(--color-border-light)" }} />

          <div className="flex justify-between gap-4">
            <div>
              <p style={rowLabel}>Servicio</p>
              <p style={rowValue}>{cita.servicioNombre}</p>
              {cita.adicionales.length > 0 && (
                <p style={{ ...rowValue, fontSize: "var(--text-sm)", color: "var(--color-text-on-light-muted)" }}>
                  + {cita.adicionales.join(", ")}
                </p>
              )}
            </div>
            <div>
              <p style={rowLabel}>Profesional</p>
              <div className="flex items-center gap-2">
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    backgroundColor: cita.profesionalColor,
                    display: "inline-block",
                  }}
                />
                <p style={rowValue}>{cita.profesionalNombre}</p>
              </div>
            </div>
          </div>

          <div style={{ borderTop: "1px solid var(--color-border-light)" }} />

          <div className="flex justify-between gap-4">
            <div>
              <p style={rowLabel}>Fecha y hora</p>
              <p style={rowValue}>
                {cita.fechaHora.toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })}
                {" · "}
                {cita.fechaHora.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", hour12: true })}
                {" – "}
                {cita.fechaFin.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", hour12: true })}
              </p>
            </div>
            <div>
              <p style={rowLabel}>Duración</p>
              <p style={rowValue}>{cita.duracionMin} min</p>
            </div>
          </div>

          {cita.anticipoMonto != null && (
            <>
              <div style={{ borderTop: "1px solid var(--color-border-light)" }} />
              <div>
                <p style={rowLabel}>Anticipo recibido</p>
                <p style={rowValue}>${cita.anticipoMonto.toLocaleString("es-CO")}</p>
              </div>
            </>
          )}

          {cita.notasCliente && (
            <>
              <div style={{ borderTop: "1px solid var(--color-border-light)" }} />
              <div>
                <p style={rowLabel}>Notas</p>
                <p style={{ ...rowValue, fontSize: "var(--text-sm)", color: "var(--color-text-on-light-muted)" }}>
                  {cita.notasCliente}
                </p>
              </div>
            </>
          )}
        </div>

        <div className="flex flex-wrap gap-2 w-full" style={{ marginTop: "2rem" }}>
          {puedeReprogramar && (
            <Button
              variant="secondary"
              size="sm"
              className="flex-1"
              disabled={updating}
              onClick={abrirReprogramar}
            >
              Reprogramar
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            className="flex-1 !text-[var(--color-error)] hover:!bg-[var(--color-error)] hover:!text-white hover:!border-[var(--color-error)]"
            disabled={updating || cita.estadoReal === "cancelada" || cita.estadoReal === "no_asistio"}
            onClick={() => setConfirmAction("cancelada")}
            style={{ borderColor: "rgba(224,82,82,0.3)" }}
          >
            Cancelar cita
          </Button>

          {cita.fechaHora < new Date() && cita.estadoReal !== "no_asistio" && cita.estadoReal !== "cancelada" && (
            <Button
              variant="secondary"
              size="sm"
              className="flex-1 hover:!bg-black/5"
              disabled={updating}
              onClick={() => setConfirmAction("no_asistio")}
              style={{ 
                color: "var(--color-text-on-light-muted)",
                borderColor: "rgba(0,0,0,0.15)"
              }}
            >
              No asistió
            </Button>
          )}
        </div>
        </>)}

        {vista === "reprogramar" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div>
              <p style={rowLabel}>Clienta · Servicio</p>
              <p style={rowValue}>
                {cita.clienteNombre} · {cita.servicioNombre} ({cita.duracionMin} min)
              </p>
            </div>

            <div>
              <label style={fieldLabel}>Profesional</label>
              <select
                value={nuevaProfesionalId}
                onChange={(e) => setNuevaProfesionalId(e.target.value)}
                style={fieldInput}
              >
                {profesionales.length === 0 && <option value={cita.profesionalId}>{cita.profesionalNombre}</option>}
                {profesionales.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={fieldLabel}>Nueva fecha</label>
              <div
                className="flex justify-center overflow-x-auto w-full"
                style={{
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-lg)",
                  backgroundColor: "var(--color-bg-alt)",
                  padding: "0.5rem",
                }}
              >
                <DayPicker
                  className="admin-daypicker"
                  mode="single"
                  locale={es}
                  selected={nuevaFecha}
                  onSelect={(d) => d && setNuevaFecha(d)}
                  weekStartsOn={1}
                />
              </div>
            </div>

            <div>
              <label style={fieldLabel}>Nueva hora</label>
              <select
                value={nuevaHora}
                onChange={(e) => setNuevaHora(e.target.value)}
                disabled={loadingHoras}
                style={fieldInput}
              >
                <option value="">
                  {loadingHoras
                    ? "Buscando horas..."
                    : horasLibres.length === 0
                      ? "No hay horas libres ese día"
                      : "Selecciona una hora"}
                </option>
                {horasLibres.map((slot) => (
                  <option key={slot} value={slot}>
                    {format12h(slot)}
                  </option>
                ))}
              </select>
              {horasError && (
                <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", color: "var(--color-error)", marginTop: 6 }}>
                  {horasError}
                </p>
              )}
            </div>

            {moveError && (
              <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--color-error)" }}>
                {moveError}
              </p>
            )}

            <div className="flex gap-2 w-full">
              <Button
                variant="secondary"
                size="sm"
                className="flex-1"
                disabled={moving}
                onClick={() => setVista("detalle")}
              >
                Volver
              </Button>
              <Button
                variant="accent"
                size="sm"
                className="flex-1"
                disabled={moving || !nuevaHora || sinCambios}
                onClick={handleReprogramar}
              >
                {moving ? "Guardando..." : "Guardar cambio"}
              </Button>
            </div>
          </div>
        )}

        {vista === "movida" && movida && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div>
              <p style={rowLabel}>Nuevo horario</p>
              <p style={rowValue}>
                {textoFechaHora(movida.fecha, movida.hora)} · {movida.profesionalNombre}
              </p>
              <p style={{ ...rowValue, fontSize: "var(--text-sm)", color: "var(--color-text-on-light-muted)", marginTop: 4 }}>
                Los recordatorios se enviarán según la nueva hora. A la clienta no se le ha avisado todavía.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 w-full">
              {waUrl ? (
                <a href={waUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
                  <Button variant="accent" size="sm" className="w-full">
                    Avisar a la clienta
                  </Button>
                </a>
              ) : (
                <p style={{ ...rowValue, fontSize: "var(--text-sm)", color: "var(--color-text-on-light-muted)" }}>
                  Esta clienta no tiene un teléfono válido para avisarle por WhatsApp.
                </p>
              )}
              <Button variant="secondary" size="sm" className="flex-1" onClick={onClose}>
                Listo
              </Button>
            </div>
          </div>
        )}
      </div>

      {confirmAction && (
        <ConfirmModal
          title={confirmAction === "cancelada" ? "Cancelar cita" : "Marcar inasistencia"}
          message={
            confirmAction === "cancelada"
              ? cita.estadoReal === "completada"
                ? "Esta cita ya figura como completada. Al cancelarla dejará de contar en el cierre de caja."
                : "¿Deseas cancelar esta cita? Quedará guardada en el historial."
              : "¿Marcar como no asistió? Esta cita dejará de contar en el cierre de caja."
          }
          confirmLabel={confirmAction === "cancelada" ? "Sí, cancelar" : "Sí, marcar no asistió"}
          loading={updating}
          onConfirm={() => handleUpdateEstado(confirmAction)}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
}

