import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { TZDate } from "@date-fns/tz";
import { Plus, Trash2, Clock } from "lucide-react";
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
  const [fecha, setFecha] = useState("");
  const [todoElDia, setTodoElDia] = useState(false);
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFin, setHoraFin] = useState("");
  const [motivo, setMotivo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete state
  const [bloqueoToDelete, setBloqueoToDelete] = useState<BloqueoRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleCreate = async (e: React.FormEvent) => {
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

    const { data: userData } = await supabase.auth.getUser();

    const { error } = await supabase.from("bloqueos_horario").insert({
      profesional_id: profesionalId,
      fecha_inicio: startTz.toISOString(),
      fecha_fin: endTz.toISOString(),
      motivo: motivo.trim() || null,
      created_by: userData.user?.id || null
    });

    setIsSubmitting(false);

    if (error) {
      showToast("Error al crear el bloqueo", "error");
      console.error(error);
      return;
    }

    showToast("Bloqueo creado correctamente");
    setFecha("");
    setHoraInicio("");
    setHoraFin("");
    setMotivo("");
    setTodoElDia(false);
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
        <h3 className="font-display italic text-xl text-[var(--color-text-on-light)] mb-4">Nuevo bloqueo</h3>
        <form onSubmit={handleCreate} className="flex flex-col gap-4 bg-[var(--color-surface-light)] p-4 rounded-xl border border-[var(--color-border-light)]">
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
            <Plus size={18} className="mr-2" />
            {isSubmitting ? "Registrando..." : "Registrar bloqueo"}
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
              <div key={b.id} className="flex items-center justify-between p-4 bg-[var(--color-surface-light)] rounded-xl border border-[var(--color-border-light)]">
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
                <Button variant="ghost" size="sm" onClick={() => setBloqueoToDelete(b)} className="text-[var(--color-error)] hover:text-red-600 hover:bg-red-50">
                  <Trash2 size={16} />
                </Button>
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
      
      <AdminToast toast={toast} />
    </div>
  );
}
