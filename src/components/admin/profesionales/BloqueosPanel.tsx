import { useState, useEffect, useCallback, ReactNode } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale/es";
import { TZDate } from "@date-fns/tz";
import { Plus, Trash2, Clock, Pencil, X } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/QueryState";
import { ConfirmModal } from "@/components/admin/ConfirmModal";
import { AdminToast, type ToastState } from "@/components/admin/AdminToast";

interface BloqueoRow {
  id: string;
  profesional_id: string;
  fecha_inicio: string;
  fecha_fin: string;
  motivo: string | null;
  created_by: string | null;
}

interface BloqueosPanelProps {
  profesionalId: string;
}

const inputStyle = {
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

function generarSlots(): string[] {
  const slots: string[] = [];
  for (let h = 0; h <= 23; h++) {
    for (const m of [0, 30]) {
      slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return slots;
}

const SLOTS = generarSlots();

function format12h(time24: string) {
  const [h, m] = time24.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

export function BloqueosPanel({ profesionalId }: BloqueosPanelProps) {
  const [bloqueos, setBloqueos] = useState<BloqueoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastState | null>(null);

  // Form states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [fecha, setFecha] = useState("");
  const [todoElDia, setTodoElDia] = useState(false);
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFin, setHoraFin] = useState("");
  const [motivo, setMotivo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete state
  const [bloqueoToDelete, setBloqueoToDelete] = useState<BloqueoRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Confirm Save State
  const [confirmSaveData, setConfirmSaveData] = useState<{
    startTz: TZDate;
    endTz: TZDate;
    hi: string;
    hf: string;
    outOfBounds: boolean;
    citas: any[];
  } | null>(null);

  const fetchBloqueos = useCallback(async () => {
    setLoading(true);
    const ahoraUTC = new Date().toISOString();
    
    // Traemos bloqueos futuros (fecha_fin > ahora) ordenados por fecha_inicio
    const { data, error } = await supabase
      .from("bloqueos_horario")
      .select("*")
      .eq("profesional_id", profesionalId)
      .gt("fecha_fin", ahoraUTC)
      .order("fecha_inicio", { ascending: true });

    if (error) {
      console.error("Error cargando bloqueos:", error.message);
    } else {
      setBloqueos(data ?? []);
    }
    setLoading(false);
  }, [profesionalId]);

  useEffect(() => {
    fetchBloqueos();
  }, [fetchBloqueos]);

  const showToast = (message: string, type: ToastState["type"] = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2000);
  };

  const handleEdit = (b: BloqueoRow) => {
    const sTz = new TZDate(b.fecha_inicio, "America/Bogota");
    const eTz = new TZDate(b.fecha_fin, "America/Bogota");
    
    setFecha(format(sTz, "yyyy-MM-dd"));
    setHoraInicio(format(sTz, "HH:mm"));
    setHoraFin(format(eTz, "HH:mm"));
    setMotivo(b.motivo || "");
    setEditingId(b.id);
    
    if (format(sTz, "HH:mm") === "08:00" && format(eTz, "HH:mm") === "18:00") {
      setTodoElDia(true);
    } else {
      setTodoElDia(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFecha("");
    setHoraInicio("");
    setHoraFin("");
    setMotivo("");
    setTodoElDia(false);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fecha) {
      showToast("La fecha es obligatoria", "error");
      return;
    }
    
    let hi = horaInicio;
    let hf = horaFin;

    if (todoElDia) {
      hi = "08:00";
      hf = "18:00";
    } else if (!hi || !hf) {
      showToast("La hora de inicio y fin son obligatorias", "error");
      return;
    }

    if (hi >= hf) {
      showToast("La hora de fin debe ser mayor a la hora de inicio", "error");
      return;
    }

    setIsSubmitting(true);

    const [yyyy, mm, dd] = fecha.split("-").map(Number);
    const [h1, m1] = hi.split(":").map(Number);
    const [h2, m2] = hf.split(":").map(Number);

    const startTz = new TZDate(yyyy, mm - 1, dd, h1, m1, 0, 0, "America/Bogota");
    const endTz = new TZDate(yyyy, mm - 1, dd, h2, m2, 0, 0, "America/Bogota");

    const outOfBounds = hi < "07:00" || hf > "20:00";

    const dayStartUTC = new Date(startTz.getTime() - 24 * 3600_000).toISOString();
    const dayEndUTC = new Date(endTz.getTime() + 24 * 3600_000).toISOString();

    const { data: citasOver } = await supabase
      .from("citas")
      .select("id, fecha_hora, duracion_min, clientes(nombre, apellido)")
      .eq("profesional_id", profesionalId)
      .in("estado", ["pendiente", "confirmada"])
      .gte("fecha_hora", dayStartUTC)
      .lte("fecha_hora", dayEndUTC);

    const overlapping = (citasOver || []).filter(c => {
      const cStart = new Date(c.fecha_hora);
      const cEnd = new Date(cStart.getTime() + c.duracion_min * 60_000);
      return cStart < endTz && cEnd > startTz;
    });

    setConfirmSaveData({
      startTz,
      endTz,
      hi,
      hf,
      outOfBounds,
      citas: overlapping
    });
    setIsSubmitting(false);
  };

  const executeSave = async () => {
    if (!confirmSaveData) return;
    setIsSubmitting(true);

    const { data: userData } = await supabase.auth.getUser();

    const payload = {
      profesional_id: profesionalId,
      fecha_inicio: confirmSaveData.startTz.toISOString(),
      fecha_fin: confirmSaveData.endTz.toISOString(),
      motivo: motivo.trim() || null,
      created_by: userData.user?.id || null
    };

    let error;
    if (editingId) {
      const res = await supabase.from("bloqueos_horario").update(payload).eq("id", editingId);
      error = res.error;
    } else {
      const res = await supabase.from("bloqueos_horario").insert(payload);
      error = res.error;
    }

    setIsSubmitting(false);
    setConfirmSaveData(null);

    if (error) {
      showToast("Error al guardar el bloqueo", "error");
      console.error(error);
      return;
    }

    showToast(editingId ? "Bloqueo actualizado correctamente" : "Bloqueo creado correctamente");
    handleCancelEdit();
    fetchBloqueos();
  };

  const handleDelete = async () => {
    if (!bloqueoToDelete) return;
    setIsDeleting(true);

    const { error } = await supabase
      .from("bloqueos_horario")
      .delete()
      .eq("id", bloqueoToDelete.id);

    setIsDeleting(false);
    setBloqueoToDelete(null);

    if (error) {
      showToast("Error al eliminar", "error");
    } else {
      showToast("Bloqueo eliminado");
      fetchBloqueos();
    }
  };

  const formatHora = (isoStr: string) => {
    return format(new TZDate(isoStr, "America/Bogota"), "hh:mm a");
  };
  const formatFecha = (isoStr: string) => {
    return format(new TZDate(isoStr, "America/Bogota"), "dd/MM/yyyy");
  };

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* Formulario Crear Bloqueo */}
      <div className="w-full md:w-1/3">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display italic text-xl text-[var(--color-text-on-light)]">{editingId ? "Editar bloqueo" : "Nuevo bloqueo"}</h3>
          {editingId && (
            <Button type="button" variant="ghost" size="sm" onClick={handleCancelEdit} className="text-sm">
              <X size={16} className="mr-1"/> Cancelar
            </Button>
          )}
        </div>
        <form onSubmit={handleSubmitForm} className="flex flex-col gap-4 bg-[var(--color-surface-light)] p-4 rounded-xl border border-[var(--color-border-light)]">
          <div>
            <label className="block text-sm font-semibold text-[var(--color-text-on-light)] mb-1">Fecha</label>
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} style={inputStyle} required />
          </div>

          <label className="flex items-center gap-2 cursor-pointer mt-1">
            <input type="checkbox" checked={todoElDia} onChange={(e) => setTodoElDia(e.target.checked)} className="accent-[var(--color-primary)]" />
            <span className="text-sm text-[var(--color-text-on-light)] font-medium">Todo el día (08:00 AM - 06:00 PM)</span>
          </label>

          {!todoElDia && (
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-[var(--color-text-on-light)] mb-1">Inicio</label>
                <select value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} style={inputStyle} required={!todoElDia}>
                  <option value="">--:--</option>
                  {SLOTS.map((slot) => (
                    <option key={slot} value={slot}>
                      {format12h(slot)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-semibold text-[var(--color-text-on-light)] mb-1">Fin</label>
                <select value={horaFin} onChange={(e) => setHoraFin(e.target.value)} style={inputStyle} required={!todoElDia}>
                  <option value="">--:--</option>
                  {SLOTS.map((slot) => (
                    <option key={slot} value={slot}>
                      {format12h(slot)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-[var(--color-text-on-light)] mb-1">Motivo (Opcional)</label>
            <input type="text" placeholder="Ej: Cita médica, Vacaciones..." value={motivo} onChange={(e) => setMotivo(e.target.value)} style={inputStyle} />
          </div>

          <Button type="submit" variant="primary" className="w-full mt-2" disabled={isSubmitting}>
            {editingId ? <Pencil size={18} className="mr-2" /> : <Plus size={18} className="mr-2" />}
            {isSubmitting ? "Procesando..." : (editingId ? "Guardar cambios" : "Registrar bloqueo")}
          </Button>
        </form>
      </div>

      {/* Lista de Bloqueos registrados */}
      <div className="w-full md:w-2/3">
        <h3 className="font-display italic text-xl text-[var(--color-text-on-light)] mb-4">Bloqueos registrados</h3>
        {loading ? (
          <LoadingState label="Cargando bloqueos..." />
        ) : bloqueos.length === 0 ? (
          <div className="text-center p-8 bg-[var(--color-surface-light)] rounded-xl border border-[var(--color-border-light)]">
            <p className="text-[var(--color-text-on-light-muted)] font-body">No hay bloqueos registrados.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {bloqueos.map(b => (
              <div key={b.id} className={`flex items-center justify-between p-4 bg-[var(--color-surface-light)] rounded-xl border ${editingId === b.id ? 'border-[var(--color-primary)]' : 'border-[var(--color-border-light)]'}`}>
                <div className="flex items-start gap-3">
                  <div className="mt-1 text-[var(--color-text-on-light-muted)]">
                    <Clock size={18} />
                  </div>
                  <div>
                    <p className="font-body font-semibold text-[var(--color-text-on-light)]">
                      {formatFecha(b.fecha_inicio)} • {formatHora(b.fecha_inicio)} - {formatHora(b.fecha_fin)}
                    </p>
                    {b.motivo && (
                      <p className="text-sm text-[var(--color-text-on-light-muted)] mt-1">{b.motivo}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(b)} className="text-[var(--color-text-on-light-muted)] hover:text-[var(--color-primary)] hover:bg-[rgba(232,201,122,0.15)]">
                    <Pencil size={16} />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setBloqueoToDelete(b)} className="text-[var(--color-error)] hover:text-red-600 hover:bg-red-50">
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {bloqueoToDelete && (
        <ConfirmModal
          title="Eliminar bloqueo"
          message={`¿Estás segura de que quieres eliminar el bloqueo del día ${formatFecha(bloqueoToDelete.fecha_inicio)}?`}
          confirmLabel={isDeleting ? "Eliminando..." : "Sí, eliminar"}
          loading={isDeleting}
          onConfirm={handleDelete}
          onCancel={() => setBloqueoToDelete(null)}
        />
      )}

      {confirmSaveData && (
        <ConfirmModal
          title={editingId ? "Guardar cambios" : "Confirmar bloqueo"}
          confirmLabel={isSubmitting ? "Guardando..." : "Sí, confirmar"}
          loading={isSubmitting}
          onConfirm={executeSave}
          onCancel={() => setConfirmSaveData(null)}
          message={
            <div className="text-left font-body text-sm text-[var(--color-text-secondary)] space-y-4 flex flex-col items-center">
              <p className="text-center">
                Se bloqueará <strong>{format(confirmSaveData.startTz, "dd 'de' MMMM", { locale: es })}</strong> de <strong>{format12h(confirmSaveData.hi)}</strong> a <strong>{format12h(confirmSaveData.hf)}</strong>.
              </p>
              
              {confirmSaveData.outOfBounds && (
                <div className="bg-[rgba(212,168,75,0.15)] text-[var(--color-warning)] p-3 rounded-lg border border-[var(--color-warning)] mt-2">
                  <p className="font-semibold mb-1">Horario inusual</p>
                  <p>Este bloqueo incluye horas fuera del horario habitual (07:00 AM - 08:00 PM). ¿Seguro que es correcto?</p>
                </div>
              )}

              {confirmSaveData.citas.length > 0 && (
                <div className="bg-[rgba(224,82,82,0.1)] text-[var(--color-error)] p-3 rounded-lg border border-[var(--color-error)] mt-2 w-full">
                  <p className="font-semibold mb-2">¡Espera! Hay citas existentes</p>
                  <p className="mb-2">Existen citas activas en este rango de horario:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    {confirmSaveData.citas.map((c: any) => (
                      <li key={c.id}>
                        {format(new TZDate(c.fecha_hora, "America/Bogota"), "hh:mm a")} - {c.clientes?.nombre} {c.clientes?.apellido || ""} ({c.duracion_min} min)
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-xs italic opacity-90">Estas citas NO se cancelarán automáticamente.</p>
                </div>
              )}
            </div>
          }
        />
      )}
      
      <AdminToast toast={toast} />
    </div>
  );
}
