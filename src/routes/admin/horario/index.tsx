import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale/es";
import { TZDate } from "@date-fns/tz";
import { Save } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminToast, type ToastState } from "@/components/admin/AdminToast";
import { ConfirmModal } from "@/components/admin/ConfirmModal";
import { Button } from "@/components/ui/Button";
import { LoadingState, ErrorState } from "@/components/ui/QueryState";
import { supabase } from "@/lib/supabase/client";
import { DIAS_ISO, format12h, generarSlots, recortarHora } from "@/lib/horario";

export const Route = createFileRoute("/admin/horario/")({
  component: HorarioSalonPage,
});

interface HorarioForm {
  apertura: string;
  cierre: string;
  almuerzoInicio: string;
  almuerzoFin: string;
  dias: number[];
}

interface CitaFuera {
  id: string;
  texto: string;
}

const SLOTS = generarSlots("05:00", "23:00");

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  backgroundColor: "transparent",
  border: "1px solid rgba(10, 10, 11, 0.2)",
  borderRadius: "var(--radius-lg)",
  fontFamily: "var(--font-body)",
  fontSize: "var(--text-base)",
  color: "var(--color-text-on-light)",
  outline: "none",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontFamily: "var(--font-body)",
  fontSize: "var(--text-xs)",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "var(--tracking-wide)",
  color: "var(--color-text-on-light)",
  marginBottom: "0.5rem",
};

const sectionTitle: React.CSSProperties = {
  fontFamily: "var(--font-display)",
  fontStyle: "italic",
  fontSize: "var(--text-xl)",
  color: "var(--color-text-on-light)",
  marginBottom: "0.5rem",
};

const helpText: React.CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: "var(--text-sm)",
  color: "var(--color-text-on-light-muted)",
  marginBottom: "1rem",
};

function aMinutos(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/** Devuelve el motivo si el horario no es válido (mismas reglas que la base), o null. */
function validar(f: HorarioForm): string | null {
  if (f.apertura >= f.cierre) return "La apertura debe ser antes del cierre.";
  if (f.almuerzoInicio >= f.almuerzoFin) return "El almuerzo debe empezar antes de terminar.";
  if (f.almuerzoInicio < f.apertura || f.almuerzoFin > f.cierre) {
    return "El almuerzo debe quedar dentro del horario del salón.";
  }
  if (f.dias.length === 0) return "Elige al menos un día de atención.";
  return null;
}

function HorarioSalonPage() {
  const [original, setOriginal] = useState<HorarioForm | null>(null);
  const [form, setForm] = useState<HorarioForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [citasFuera, setCitasFuera] = useState<CitaFuera[] | null>(null);

  const showToast = (message: string, type: ToastState["type"] = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2000);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.from("configuracion_horario").select("*").eq("id", 1).single();
    if (error || !data) {
      console.error("Error cargando el horario del salón:", error?.message);
      setError("No se pudo cargar el horario del salón.");
      setLoading(false);
      return;
    }
    const cargado: HorarioForm = {
      apertura: recortarHora(data.hora_apertura),
      cierre: recortarHora(data.hora_cierre),
      almuerzoInicio: recortarHora(data.almuerzo_inicio),
      almuerzoFin: recortarHora(data.almuerzo_fin),
      dias: [...(data.dias_atencion as number[])].sort(),
    };
    setOriginal(cargado);
    setForm(cargado);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const hayCambios = useMemo(
    () => !!form && !!original && JSON.stringify(form) !== JSON.stringify(original),
    [form, original],
  );

  const setCampo = (campo: keyof Omit<HorarioForm, "dias">, valor: string) => {
    setForm((prev) => (prev ? { ...prev, [campo]: valor } : prev));
    setFormError(null);
  };

  const toggleDia = (iso: number) => {
    setForm((prev) => {
      if (!prev) return prev;
      const dias = prev.dias.includes(iso) ? prev.dias.filter((d) => d !== iso) : [...prev.dias, iso].sort();
      return { ...prev, dias };
    });
    setFormError(null);
  };

  /** Busca citas futuras que quedarían fuera del nuevo horario (no se tocan, solo se avisa). */
  const buscarCitasFuera = async (f: HorarioForm): Promise<CitaFuera[]> => {
    const hoy = format(new TZDate(new Date(), "America/Bogota"), "yyyy-MM-dd");
    const [{ data: citas }, { data: excepciones }] = await Promise.all([
      supabase
        .from("citas")
        .select(
          "id, fecha_hora, duracion_min, profesional_id, clientes(nombre, apellido), servicios(nombre, puede_cruzar_almuerzo)",
        )
        .in("estado", ["pendiente", "confirmada"])
        .gt("fecha_hora", new Date().toISOString())
        .order("fecha_hora", { ascending: true })
        .limit(500),
      supabase.from("excepciones_horario").select("profesional_id, fecha_desde, fecha_hasta").gte("fecha_hasta", hoy),
    ]);

    const apertura = aMinutos(f.apertura);
    const cierre = aMinutos(f.cierre);
    const almIni = aMinutos(f.almuerzoInicio);
    const almFin = aMinutos(f.almuerzoFin);

    const fuera: CitaFuera[] = [];
    for (const c of (citas ?? []) as any[]) {
      const inicio = new TZDate(c.fecha_hora, "America/Bogota");
      const ymd = format(inicio, "yyyy-MM-dd");
      const exenta = ((excepciones ?? []) as any[]).some(
        (x) => x.profesional_id === c.profesional_id && ymd >= x.fecha_desde && ymd <= x.fecha_hasta,
      );
      if (exenta) continue;

      const iso = inicio.getDay() === 0 ? 7 : inicio.getDay();
      const ini = inicio.getHours() * 60 + inicio.getMinutes();
      const fin = ini + (c.duracion_min ?? 60);
      const cruza = !!c.servicios?.puede_cruzar_almuerzo;

      const incumple =
        !f.dias.includes(iso) || ini < apertura || fin > cierre || (!cruza && ini < almFin && fin > almIni);
      if (incumple) {
        const cliente = `${c.clientes?.nombre ?? "Clienta"} ${c.clientes?.apellido ?? ""}`.trim();
        fuera.push({
          id: c.id,
          texto: `${format(inicio, "EEEE d 'de' MMMM, h:mm a", { locale: es })} · ${cliente} · ${c.servicios?.nombre ?? "Servicio"}`,
        });
      }
    }
    return fuera;
  };

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    const motivo = validar(form);
    if (motivo) {
      setFormError(motivo);
      return;
    }
    setChecking(true);
    const fuera = await buscarCitasFuera(form);
    setChecking(false);
    setCitasFuera(fuera);
  };

  const confirmarGuardado = async () => {
    if (!form) return;
    setSaving(true);
    const { error } = await supabase
      .from("configuracion_horario")
      .update({
        hora_apertura: form.apertura,
        hora_cierre: form.cierre,
        almuerzo_inicio: form.almuerzoInicio,
        almuerzo_fin: form.almuerzoFin,
        dias_atencion: form.dias,
      })
      .eq("id", 1);
    setSaving(false);
    setCitasFuera(null);

    if (error) {
      console.error("Error al guardar el horario:", error.message);
      setFormError("No se pudo guardar el horario. Intenta de nuevo.");
      return;
    }
    setOriginal(form);
    showToast("Horario del salón actualizado");
  };

  return (
    <AdminLayout pageTitle="Horario del salón">
      <div style={{ maxWidth: "800px", width: "100%", margin: "0 auto" }}>
        {loading ? (
          <LoadingState variant="light" />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchData} variant="light" />
        ) : form ? (
          <form
            onSubmit={handleGuardar}
            className="space-y-8"
            style={{
              backgroundColor: "var(--color-surface-light)",
              border: "1px solid var(--color-border-light)",
              borderRadius: "var(--radius-xl)",
              padding: "2rem",
            }}
          >
            <section>
              <h3 style={sectionTitle}>Apertura y cierre</h3>
              <p style={helpText}>
                Ninguna cita puede empezar antes de abrir ni terminar después de cerrar. El agente de WhatsApp y el panel
                usan este horario.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label style={labelStyle}>Abre</label>
                  <select value={form.apertura} onChange={(e) => setCampo("apertura", e.target.value)} style={inputStyle}>
                    {SLOTS.map((s) => (
                      <option key={s} value={s}>{format12h(s)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Cierra</label>
                  <select value={form.cierre} onChange={(e) => setCampo("cierre", e.target.value)} style={inputStyle}>
                    {SLOTS.map((s) => (
                      <option key={s} value={s}>{format12h(s)}</option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            <div style={{ height: "1px", backgroundColor: "var(--color-border-light)" }} />

            <section>
              <h3 style={sectionTitle}>Almuerzo</h3>
              <p style={helpText}>
                Ninguna cita puede cruzar esta hora, salvo los servicios marcados como "puede cruzar la hora de almuerzo".
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label style={labelStyle}>Empieza</label>
                  <select value={form.almuerzoInicio} onChange={(e) => setCampo("almuerzoInicio", e.target.value)} style={inputStyle}>
                    {SLOTS.map((s) => (
                      <option key={s} value={s}>{format12h(s)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Termina</label>
                  <select value={form.almuerzoFin} onChange={(e) => setCampo("almuerzoFin", e.target.value)} style={inputStyle}>
                    {SLOTS.map((s) => (
                      <option key={s} value={s}>{format12h(s)}</option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            <div style={{ height: "1px", backgroundColor: "var(--color-border-light)" }} />

            <section>
              <h3 style={sectionTitle}>Días de atención</h3>
              <p style={helpText}>
                Los días que no estén marcados el salón no atiende. Una profesional con una excepción de horario sí puede
                recibir citas esos días.
              </p>
              <div className="flex flex-wrap gap-2">
                {DIAS_ISO.map((d) => {
                  const activo = form.dias.includes(d.iso);
                  return (
                    <button
                      key={d.iso}
                      type="button"
                      onClick={() => toggleDia(d.iso)}
                      aria-pressed={activo}
                      title={d.largo}
                      style={{
                        minWidth: 92,
                        padding: "10px 14px",
                        borderRadius: "var(--radius-full)",
                        border: `2px solid ${activo ? "var(--color-primary)" : "var(--color-border-light)"}`,
                        backgroundColor: activo ? "var(--color-primary)" : "transparent",
                        color: activo ? "var(--color-text-inverse)" : "var(--color-text-on-light-muted)",
                        fontFamily: "var(--font-body)",
                        fontWeight: 600,
                        fontSize: "var(--text-sm)",
                        cursor: "pointer",
                      }}
                    >
                      {d.largo}
                    </button>
                  );
                })}
              </div>
            </section>

            <p style={{ ...helpText, marginBottom: 0 }}>
              Las citas que ya están agendadas no se mueven ni se cancelan cuando cambias el horario: solo afecta a las citas
              nuevas y a las que se reprogramen. Al guardar te avisamos si alguna queda fuera.
            </p>

            {formError && (
              <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--color-error)" }}>
                {formError}
              </p>
            )}

            <div className="flex items-center justify-end gap-3">
              <Button type="button" variant="secondary" size="md" disabled={!hayCambios || checking || saving} onClick={() => { setForm(original); setFormError(null); }}>
                Descartar cambios
              </Button>
              <Button type="submit" variant="accent" size="md" disabled={!hayCambios || checking || saving}>
                <Save size={18} className="mr-2" />
                {checking ? "Revisando citas..." : "Guardar horario"}
              </Button>
            </div>
          </form>
        ) : null}
      </div>

      {citasFuera && (
        <ConfirmModal
          title="Guardar horario"
          confirmLabel={saving ? "Guardando..." : "Sí, guardar"}
          loading={saving}
          onConfirm={confirmarGuardado}
          onCancel={() => setCitasFuera(null)}
          message={
            <div className="text-left font-body text-sm text-[var(--color-text-secondary)] space-y-3 flex flex-col items-center">
              <p className="text-center">Se guardará el nuevo horario del salón.</p>
              {citasFuera.length === 0 ? (
                <p className="text-center">No hay citas agendadas que queden fuera del nuevo horario.</p>
              ) : (
                <div className="bg-[rgba(212,168,75,0.15)] text-[var(--color-warning)] p-3 rounded-lg border border-[var(--color-warning)] w-full">
                  <p className="font-semibold mb-2">
                    {citasFuera.length === 1
                      ? "Hay 1 cita agendada fuera del nuevo horario"
                      : `Hay ${citasFuera.length} citas agendadas fuera del nuevo horario`}
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    {citasFuera.slice(0, 8).map((c) => (
                      <li key={c.id}>{c.texto}</li>
                    ))}
                  </ul>
                  {citasFuera.length > 8 && <p className="mt-2">y {citasFuera.length - 8} más.</p>}
                  <p className="mt-3 text-xs italic opacity-90">Estas citas NO se cancelan ni se mueven automáticamente.</p>
                </div>
              )}
            </div>
          }
        />
      )}

      <AdminToast toast={toast} />
    </AdminLayout>
  );
}
