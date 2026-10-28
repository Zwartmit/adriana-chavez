import { createFileRoute } from "@tanstack/react-router";
import { duracionAviso, explicarError } from "@/lib/errores";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Save, X } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminToast, type ToastState } from "@/components/admin/AdminToast";
import { Button } from "@/components/ui/Button";
import { LoadingState, ErrorState } from "@/components/ui/QueryState";
import { supabase } from "@/lib/supabase/client";
import { format12h, generarSlots, recortarHora } from "@/lib/horario";

export const Route = createFileRoute("/admin/avisos/")({
  component: AvisosPage,
});

interface AvisoForm {
  aviso: string;
  nombre: string;
  descripcion: string;
  permiteVarias: boolean;
  activo: boolean;
  horas: string[];
}

const SLOTS = generarSlots("05:00", "23:45", 15);
const MAX_HORAS = 2;

const selectStyle: React.CSSProperties = {
  padding: "10px 12px",
  backgroundColor: "transparent",
  border: "1px solid rgba(10, 10, 11, 0.2)",
  borderRadius: "var(--radius-lg)",
  fontFamily: "var(--font-body)",
  fontSize: "var(--text-base)",
  color: "var(--color-text-on-light)",
  outline: "none",
};

const helpText: React.CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: "var(--text-sm)",
  color: "var(--color-text-on-light-muted)",
};

const tituloAviso: React.CSSProperties = {
  fontFamily: "var(--font-display)",
  fontStyle: "italic",
  fontSize: "var(--text-xl)",
  color: "var(--color-text-on-light)",
  marginBottom: "0.25rem",
};

function ordenar(horas: string[]): string[] {
  return [...horas].sort();
}

function firma(a: AvisoForm): string {
  return JSON.stringify([a.activo, ordenar(a.horas)]);
}

/** Devuelve el motivo si los avisos no son válidos (mismas reglas que la base), o null. */
function validar(avisos: AvisoForm[]): string | null {
  for (const a of avisos) {
    if (a.activo && a.horas.length === 0) return `Elige una hora para "${a.nombre}" o desactívalo.`;
    if (new Set(a.horas).size !== a.horas.length) return `"${a.nombre}" tiene la misma hora repetida.`;
  }
  const rev = avisos.find((a) => a.aviso === "revision");
  const cierre = avisos.find((a) => a.aviso === "cierre");
  if (rev && cierre && rev.horas[0] && cierre.horas[0] && rev.horas[0] >= cierre.horas[0]) {
    return "La revisión de citas debe salir antes del cierre del día.";
  }
  return null;
}

function AvisosPage() {
  const [original, setOriginal] = useState<AvisoForm[]>([]);
  const [avisos, setAvisos] = useState<AvisoForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = (message: string, type: ToastState["type"] = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), duracionAviso(type));
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [resAvisos, resHoras] = await Promise.all([
      supabase.from("avisos_programados").select("*").order("orden", { ascending: true }),
      supabase.from("horarios_avisos").select("aviso, hora").order("hora", { ascending: true }),
    ]);
    if (resAvisos.error || resHoras.error || !resAvisos.data) {
      console.error("Error cargando los avisos:", resAvisos.error?.message ?? resHoras.error?.message);
      setError("No se pudo cargar el horario de los avisos.");
      setLoading(false);
      return;
    }
    const horasPorAviso = new Map<string, string[]>();
    for (const h of (resHoras.data ?? []) as { aviso: string; hora: string }[]) {
      const lista = horasPorAviso.get(h.aviso) ?? [];
      lista.push(recortarHora(h.hora));
      horasPorAviso.set(h.aviso, lista);
    }
    const cargados: AvisoForm[] = (resAvisos.data as Record<string, unknown>[]).map((r) => ({
      aviso: r.aviso as string,
      nombre: r.nombre as string,
      descripcion: r.descripcion as string,
      permiteVarias: !!r.permite_varias,
      activo: !!r.activo,
      horas: horasPorAviso.get(r.aviso as string) ?? [],
    }));
    setOriginal(cargados);
    setAvisos(cargados);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const cambiados = useMemo(
    () =>
      avisos.filter((a) => {
        const o = original.find((x) => x.aviso === a.aviso);
        return !o || firma(o) !== firma(a);
      }),
    [avisos, original],
  );

  const actualizar = (aviso: string, cambio: (a: AvisoForm) => AvisoForm) => {
    setAvisos((prev) => prev.map((a) => (a.aviso === aviso ? cambio(a) : a)));
    setFormError(null);
  };

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    const motivo = validar(avisos);
    if (motivo) {
      setFormError(motivo);
      return;
    }
    setSaving(true);
    // Si cambian la revisión y el cierre a la vez, la base valida cada cambio contra el estado
    // actual: se guarda primero el que no rompe el orden (cierre más tarde antes que revisión, y al revés).
    const pendientes = [...cambiados];
    const orden = (a: AvisoForm) => {
      const o = original.find((x) => x.aviso === a.aviso);
      const nueva = a.horas[0] ?? "";
      const vieja = o?.horas[0] ?? "";
      if (a.aviso === "cierre") return nueva >= vieja ? 0 : 2;
      if (a.aviso === "revision") return nueva >= vieja ? 2 : 0;
      return 1;
    };
    pendientes.sort((x, y) => orden(x) - orden(y));
    let fallo: string | null = null;
    for (const a of pendientes) {
      const { data, error } = await supabase.rpc("guardar_horarios_aviso", {
        p_aviso: a.aviso,
        p_horas: ordenar(a.horas),
        p_activo: a.activo,
      });
      if (error) {
        console.error("Error al guardar el aviso", a.aviso, error.message);
        fallo = explicarError(error, `guardar el aviso "${a.nombre}"`);
        break;
      }
      const fila = Array.isArray(data) ? data[0] : data;
      if (fila && fila.ok === false) {
        fallo = (fila.error as string) || `No se pudo guardar "${a.nombre}".`;
        break;
      }
    }
    setSaving(false);
    if (fallo) {
      setFormError(fallo);
      await fetchData();
      return;
    }
    await fetchData();
    showToast("Horarios de los avisos actualizados");
  };

  return (
    <AdminLayout pageTitle="Avisos automáticos">
      <div style={{ maxWidth: "800px", width: "100%", margin: "0 auto" }}>
        {loading ? (
          <LoadingState variant="light" />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchData} variant="light" />
        ) : (
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
            <p style={helpText}>
              Son los avisos que te llegan solos por Telegram. Elige a qué hora sale cada uno. Si pones una hora que ya
              pasó hoy, el aviso sale mañana. También se puede cambiar por Telegram.
            </p>

            {avisos.map((a, i) => (
              <div key={a.aviso} className="space-y-3">
                {i > 0 && <div style={{ height: "1px", backgroundColor: "var(--color-border-light)", marginBottom: "1.5rem" }} />}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 style={tituloAviso}>{a.nombre}</h3>
                    <p style={helpText}>{a.descripcion}</p>
                  </div>
                  <label className="flex items-center gap-2" style={{ ...helpText, whiteSpace: "nowrap", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={a.activo}
                      onChange={(e) => actualizar(a.aviso, (x) => ({ ...x, activo: e.target.checked }))}
                    />
                    Activo
                  </label>
                </div>

                {a.activo && (
                  <div className="flex flex-wrap items-center gap-3">
                    {a.horas.map((h, idx) => (
                      <div key={idx} className="flex items-center gap-1">
                        <select
                          aria-label={`Hora de ${a.nombre}`}
                          value={h}
                          onChange={(e) =>
                            actualizar(a.aviso, (x) => ({
                              ...x,
                              horas: x.horas.map((v, k) => (k === idx ? e.target.value : v)),
                            }))
                          }
                          style={selectStyle}
                        >
                          {!SLOTS.includes(h) && <option value={h}>{h ? format12h(h) : "Elige hora"}</option>}
                          {SLOTS.map((s) => (
                            <option key={s} value={s}>
                              {format12h(s)}
                            </option>
                          ))}
                        </select>
                        {a.permiteVarias && a.horas.length > 1 && (
                          <button
                            type="button"
                            aria-label="Quitar esta hora"
                            onClick={() => actualizar(a.aviso, (x) => ({ ...x, horas: x.horas.filter((_, k) => k !== idx) }))}
                            style={{ padding: "6px", cursor: "pointer", color: "var(--color-text-on-light-muted)" }}
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                    {a.horas.length === 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="md"
                        onClick={() => actualizar(a.aviso, (x) => ({ ...x, horas: ["08:00"] }))}
                      >
                        Elegir hora
                      </Button>
                    )}
                    {a.permiteVarias && a.horas.length > 0 && a.horas.length < MAX_HORAS && (
                      <Button
                        type="button"
                        variant="outline"
                        size="md"
                        onClick={() => {
                          const libre = SLOTS.find((s) => !a.horas.includes(s) && s >= "14:00") ?? SLOTS[0];
                          actualizar(a.aviso, (x) => ({ ...x, horas: [...x.horas, libre] }));
                        }}
                      >
                        <Plus size={16} className="mr-1" />
                        Otra hora
                      </Button>
                    )}
                  </div>
                )}
                {!a.activo && <p style={helpText}>Este aviso está apagado: no te llegará.</p>}
              </div>
            ))}

            {formError && (
              <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--color-error)" }}>
                {formError}
              </p>
            )}

            <div className="flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                size="md"
                disabled={cambiados.length === 0 || saving}
                onClick={() => {
                  setAvisos(original);
                  setFormError(null);
                }}
              >
                Descartar cambios
              </Button>
              <Button type="submit" variant="accent" size="md" disabled={cambiados.length === 0 || saving}>
                <Save size={18} className="mr-2" />
                {saving ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </form>
        )}
      </div>

      <AdminToast toast={toast} />
    </AdminLayout>
  );
}
