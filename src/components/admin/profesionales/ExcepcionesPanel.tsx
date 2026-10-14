import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale/es";
import { TZDate } from "@date-fns/tz";
import { Plus, Trash2, CalendarCheck } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/QueryState";
import { ConfirmModal } from "@/components/admin/ConfirmModal";
import { AdminToast, type ToastState } from "@/components/admin/AdminToast";

interface ExcepcionRow {
  id: string;
  profesional_id: string;
  fecha_desde: string; // yyyy-MM-dd
  fecha_hasta: string; // yyyy-MM-dd
  motivo: string | null;
}

interface ExcepcionesPanelProps {
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

/** "yyyy-MM-dd" -> Date local (sin corrimientos de zona horaria) */
function parseYmd(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatDia(ymd: string) {
  return format(parseYmd(ymd), "EEEE d 'de' MMMM", { locale: es });
}

function rangoTexto(desde: string, hasta: string) {
  return desde === hasta ? formatDia(desde) : `${formatDia(desde)} al ${formatDia(hasta)}`;
}

export function ExcepcionesPanel({ profesionalId }: ExcepcionesPanelProps) {
  const [excepciones, setExcepciones] = useState<ExcepcionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastState | null>(null);

  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [motivo, setMotivo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [toDelete, setToDelete] = useState<ExcepcionRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const hoy = format(new TZDate(new Date(), "America/Bogota"), "yyyy-MM-dd");

  const fetchExcepciones = useCallback(async () => {
    setLoading(true);
    const hoyBogota = format(new TZDate(new Date(), "America/Bogota"), "yyyy-MM-dd");
    // Vigentes y próximas: las que ya terminaron no se muestran
    const { data, error } = await supabase
      .from("excepciones_horario")
      .select("id, profesional_id, fecha_desde, fecha_hasta, motivo")
      .eq("profesional_id", profesionalId)
      .gte("fecha_hasta", hoyBogota)
      .order("fecha_desde", { ascending: true });

    if (error) {
      console.error("Error cargando excepciones:", error.message);
    } else {
      setExcepciones(data ?? []);
    }
    setLoading(false);
  }, [profesionalId]);

  useEffect(() => {
    fetchExcepciones();
  }, [fetchExcepciones]);

  const showToast = (message: string, type: ToastState["type"] = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!desde) {
      showToast("La fecha es obligatoria", "error");
      return;
    }
    const fin = hasta || desde;
    if (fin < desde) {
      showToast("La fecha final no puede ser anterior a la inicial", "error");
      return;
    }
    if (fin < hoy) {
      showToast("Esa fecha ya pasó", "error");
      return;
    }

    setIsSubmitting(true);
    const { data: userData } = await supabase.auth.getUser();

    const { error } = await supabase.from("excepciones_horario").insert({
      profesional_id: profesionalId,
      fecha_desde: desde,
      fecha_hasta: fin,
      motivo: motivo.trim() || null,
      created_by: userData.user?.id || null,
    });
    setIsSubmitting(false);

    if (error) {
      console.error("Error al guardar excepción:", error.message);
      showToast("Error al guardar la excepción", "error");
      return;
    }

    showToast("Excepción creada correctamente");
    setDesde("");
    setHasta("");
    setMotivo("");
    fetchExcepciones();
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    setIsDeleting(true);
    const { error } = await supabase.from("excepciones_horario").delete().eq("id", toDelete.id);
    setIsDeleting(false);
    setToDelete(null);

    if (error) {
      showToast("Error al eliminar", "error");
    } else {
      showToast("Excepción eliminada");
      fetchExcepciones();
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* Formulario */}
      <div className="w-full md:w-1/3">
        <h3 className="font-display italic text-xl text-[var(--color-text-on-light)] mb-4">Nueva excepción</h3>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 bg-[var(--color-surface-light)] p-4 rounded-xl border border-[var(--color-border-light)]"
        >
          <p className="text-xs text-[var(--color-text-on-light-muted)] font-body">
            Durante esos días se puede agendar a esta profesional fuera del horario del salón: días cerrados, antes de la
            apertura, a la hora del almuerzo o fuera de la ventana de inicio de un servicio. Nunca permite empalmar dos citas.
          </p>

          <div>
            <label className="block text-sm font-semibold text-[var(--color-text-on-light)] mb-1">Desde</label>
            <input
              type="date"
              value={desde}
              min={hoy}
              onChange={(e) => {
                setDesde(e.target.value);
                if (hasta && e.target.value > hasta) setHasta("");
              }}
              style={inputStyle}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[var(--color-text-on-light)] mb-1">
              Hasta <span className="font-normal text-[var(--color-text-on-light-muted)]">(opcional, si es un solo día)</span>
            </label>
            <input type="date" value={hasta} min={desde || hoy} onChange={(e) => setHasta(e.target.value)} style={inputStyle} />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[var(--color-text-on-light)] mb-1">Motivo (Opcional)</label>
            <input
              type="text"
              placeholder="Ej: Cliente especial, Jornada extra..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              style={inputStyle}
            />
          </div>

          <Button type="submit" variant="primary" className="w-full mt-2" disabled={isSubmitting}>
            <Plus size={18} className="mr-2" />
            {isSubmitting ? "Guardando..." : "Registrar excepción"}
          </Button>
        </form>
      </div>

      {/* Lista */}
      <div className="w-full md:w-2/3">
        <h3 className="font-display italic text-xl text-[var(--color-text-on-light)] mb-4">Excepciones vigentes y próximas</h3>
        {loading ? (
          <LoadingState label="Cargando excepciones..." />
        ) : excepciones.length === 0 ? (
          <div className="text-center p-8 bg-[var(--color-surface-light)] rounded-xl border border-[var(--color-border-light)]">
            <p className="text-[var(--color-text-on-light-muted)] font-body">No hay excepciones registradas.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {excepciones.map((x) => (
              <div
                key={x.id}
                className="flex items-center justify-between p-4 bg-[var(--color-surface-light)] rounded-xl border border-[var(--color-border-light)]"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1 text-[var(--color-text-on-light-muted)]">
                    <CalendarCheck size={18} />
                  </div>
                  <div>
                    <p className="font-body font-semibold text-[var(--color-text-on-light)] first-letter:uppercase">
                      {rangoTexto(x.fecha_desde, x.fecha_hasta)}
                    </p>
                    {x.motivo && <p className="text-sm text-[var(--color-text-on-light-muted)] mt-1">{x.motivo}</p>}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setToDelete(x)}
                  className="text-[var(--color-error)] hover:text-red-600 hover:bg-red-50"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {toDelete && (
        <ConfirmModal
          title="Eliminar excepción"
          message={`¿Eliminar la excepción de ${rangoTexto(toDelete.fecha_desde, toDelete.fecha_hasta)}? Las citas ya agendadas en esos días no se cancelan, pero no se podrán mover a horas fuera del horario del salón.`}
          confirmLabel={isDeleting ? "Eliminando..." : "Sí, eliminar"}
          loading={isDeleting}
          onConfirm={handleDelete}
          onCancel={() => setToDelete(null)}
        />
      )}

      <AdminToast toast={toast} />
    </div>
  );
}
