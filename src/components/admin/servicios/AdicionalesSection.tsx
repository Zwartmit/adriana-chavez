import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pencil, Plus, Trash2, Unlink } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase/client";
import { formatDuration, formatPriceRange } from "@/lib/utils";

interface Adicional {
  id: string;
  nombre: string;
  descripcion: string | null;
  duracion_min: number;
  precio: number;
  precio_hasta: number | null;
  precio_desde: boolean;
  dias_retoque: number | null;
  activo: boolean;
}

interface ServicioOption {
  id: string;
  nombre: string;
}

interface AdicionalesSectionProps {
  servicioId: string;
  servicioNombre: string;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
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

const mutedText: React.CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: "var(--text-sm)",
  color: "var(--color-text-on-light-muted)",
};

const smallButton: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "6px 12px",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--color-border-light)",
  backgroundColor: "transparent",
  color: "var(--color-text-on-light)",
  fontFamily: "var(--font-body)",
  fontSize: "var(--text-sm)",
  fontWeight: 600,
  cursor: "pointer",
};

interface FormState {
  id: string | null;
  nombre: string;
  precioTxt: string;
  precioHastaTxt: string;
  precioDesde: boolean;
  horasTxt: string;
  minutosTxt: string;
  retoqueTxt: string;
  descripcion: string;
  activo: boolean;
  servicios: string[];
}

function textoErrorAdicional(code: string | undefined, message: string | undefined): string {
  if (code === "23505") return 'Ya existe un adicional con ese nombre. Usa "Agregar existente" para ponerlo en este servicio.';
  if (code === "23514") return 'Revisa los valores: el precio "hasta" no puede ser menor que el "desde".';
  return message ? `No se pudo guardar: ${message}` : "No se pudo guardar el adicional.";
}

export function AdicionalesSection({ servicioId, servicioNombre, onError, onSuccess }: AdicionalesSectionProps) {
  const [loading, setLoading] = useState(true);
  const [vinculados, setVinculados] = useState<Adicional[]>([]);
  const [todos, setTodos] = useState<Adicional[]>([]);
  const [servicios, setServicios] = useState<ServicioOption[]>([]);
  const [vinculos, setVinculos] = useState<{ servicio_id: string; adicional_id: string }[]>([]);
  const [form, setForm] = useState<FormState | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [existenteId, setExistenteId] = useState("");
  // Los avisos del padre cambian en cada render: se guardan en una referencia para no recargar en bucle.
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const cargar = useCallback(async () => {
    setLoading(true);
    const [adRes, vinRes, srvRes] = await Promise.all([
      supabase.from("adicionales").select("*").order("nombre", { ascending: true }),
      supabase.from("servicio_adicionales").select("servicio_id, adicional_id, orden").order("orden", { ascending: true }),
      supabase.from("servicios").select("id, nombre").order("nombre", { ascending: true }),
    ]);
    if (adRes.error || vinRes.error || srvRes.error) {
      console.error("[AdicionalesSection] error al cargar:", adRes.error ?? vinRes.error ?? srvRes.error);
      onErrorRef.current("No se pudieron cargar los adicionales.");
      setLoading(false);
      return;
    }
    const lista = (adRes.data ?? []) as Adicional[];
    const links = (vinRes.data ?? []) as { servicio_id: string; adicional_id: string }[];
    const ids = new Set(links.filter((l) => l.servicio_id === servicioId).map((l) => l.adicional_id));
    setTodos(lista);
    setVinculos(links);
    setVinculados(lista.filter((a) => ids.has(a.id)));
    setServicios((srvRes.data ?? []) as ServicioOption[]);
    setLoading(false);
  }, [servicioId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const usoPorAdicional = useMemo(() => {
    const m = new Map<string, number>();
    vinculos.forEach((l) => m.set(l.adicional_id, (m.get(l.adicional_id) ?? 0) + 1));
    return m;
  }, [vinculos]);

  const disponibles = useMemo(
    () => todos.filter((a) => !vinculados.some((v) => v.id === a.id)),
    [todos, vinculados],
  );

  const abrirCrear = () => {
    setFormError(null);
    setForm({
      id: null,
      nombre: "",
      precioTxt: "",
      precioHastaTxt: "",
      precioDesde: false,
      horasTxt: "",
      minutosTxt: "",
      retoqueTxt: "",
      descripcion: "",
      activo: true,
      servicios: [servicioId],
    });
  };

  const abrirEditar = (a: Adicional) => {
    setFormError(null);
    setForm({
      id: a.id,
      nombre: a.nombre,
      precioTxt: String(a.precio),
      precioHastaTxt: a.precio_hasta != null ? String(a.precio_hasta) : "",
      precioDesde: a.precio_desde,
      horasTxt: a.duracion_min >= 60 ? String(Math.floor(a.duracion_min / 60)) : "",
      minutosTxt: a.duracion_min % 60 ? String(a.duracion_min % 60) : "",
      retoqueTxt: a.dias_retoque != null ? String(a.dias_retoque) : "",
      descripcion: a.descripcion ?? "",
      activo: a.activo,
      servicios: vinculos.filter((l) => l.adicional_id === a.id).map((l) => l.servicio_id),
    });
  };

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setFormError(null);

    const nombre = form.nombre.trim();
    const precio = Number(form.precioTxt);
    const precioHasta = form.precioHastaTxt.trim() === "" ? null : Number(form.precioHastaTxt);
    const duracion = (Number(form.horasTxt) || 0) * 60 + (Number(form.minutosTxt) || 0);

    if (!nombre) return setFormError("Escribe el nombre del adicional.");
    if (form.precioTxt.trim() === "" || !Number.isFinite(precio) || precio < 0) return setFormError('Escribe el precio "desde".');
    if (precioHasta != null && (!Number.isFinite(precioHasta) || precioHasta < precio)) {
      return setFormError('El precio "hasta" no puede ser menor que el precio "desde".');
    }
    if (duracion > 600) return setFormError("La duración no puede ser mayor a 10 horas.");
    const diasRetoque = form.retoqueTxt.trim() === "" ? null : Number(form.retoqueTxt);
    if (diasRetoque != null && (!Number.isInteger(diasRetoque) || diasRetoque < 1 || diasRetoque > 365)) {
      return setFormError("Los días de retoque deben ser un número entero entre 1 y 365 (o déjalo vacío).");
    }

    const payload = {
      nombre,
      descripcion: form.descripcion.trim() || null,
      precio,
      precio_hasta: precioHasta,
      precio_desde: precioHasta != null && precioHasta > precio ? false : form.precioDesde,
      duracion_min: duracion,
      dias_retoque: diasRetoque,
      activo: form.activo,
    };

    setSaving(true);
    let adicionalId = form.id;
    if (adicionalId) {
      const { error } = await supabase.from("adicionales").update(payload).eq("id", adicionalId);
      if (error) {
        setSaving(false);
        return setFormError(textoErrorAdicional(error.code, error.message));
      }
    } else {
      const { data, error } = await supabase.from("adicionales").insert(payload).select("id").single();
      if (error || !data) {
        setSaving(false);
        return setFormError(textoErrorAdicional(error?.code, error?.message));
      }
      adicionalId = data.id as string;
    }

    // Sincroniza los servicios donde aparece
    const actuales = new Set(vinculos.filter((l) => l.adicional_id === adicionalId).map((l) => l.servicio_id));
    const deseados = new Set(form.servicios);
    const agregar = [...deseados].filter((s) => !actuales.has(s));
    const quitar = [...actuales].filter((s) => !deseados.has(s));

    if (agregar.length > 0) {
      const { error } = await supabase
        .from("servicio_adicionales")
        .insert(agregar.map((s) => ({ servicio_id: s, adicional_id: adicionalId })));
      if (error) {
        setSaving(false);
        return setFormError("El adicional se guardó, pero no se pudo agregar a todos los servicios. Revisa e intenta de nuevo.");
      }
    }
    if (quitar.length > 0) {
      const { error } = await supabase
        .from("servicio_adicionales")
        .delete()
        .eq("adicional_id", adicionalId)
        .in("servicio_id", quitar);
      if (error) {
        setSaving(false);
        return setFormError("El adicional se guardó, pero no se pudo quitar de algunos servicios. Intenta de nuevo.");
      }
    }

    setSaving(false);
    setForm(null);
    onSuccess(form.id ? "Adicional actualizado" : "Adicional creado");
    cargar();
  };

  const quitarDeEsteServicio = async (a: Adicional) => {
    if (!window.confirm(`¿Quitar "${a.nombre}" de ${servicioNombre}? Seguirá disponible en los demás servicios donde esté.`)) return;
    const { error } = await supabase
      .from("servicio_adicionales")
      .delete()
      .eq("servicio_id", servicioId)
      .eq("adicional_id", a.id);
    if (error) {
      console.error("[AdicionalesSection] error al quitar:", error.message);
      onError("No se pudo quitar el adicional.");
      return;
    }
    onSuccess("Adicional quitado de este servicio");
    cargar();
  };

  const eliminar = async (a: Adicional) => {
    const n = usoPorAdicional.get(a.id) ?? 0;
    const aviso =
      n > 1
        ? `¿Eliminar "${a.nombre}" definitivamente? Se quitará de los ${n} servicios donde aparece. Las citas que ya lo tienen conservan su registro.`
        : `¿Eliminar "${a.nombre}" definitivamente? Las citas que ya lo tienen conservan su registro.`;
    if (!window.confirm(aviso)) return;
    const { error } = await supabase.from("adicionales").delete().eq("id", a.id);
    if (error) {
      console.error("[AdicionalesSection] error al eliminar:", error.message);
      onError("No se pudo eliminar el adicional. Prueba desactivarlo.");
      return;
    }
    setForm(null);
    onSuccess("Adicional eliminado");
    cargar();
  };

  const agregarExistente = async () => {
    if (!existenteId) return;
    const { error } = await supabase
      .from("servicio_adicionales")
      .insert({ servicio_id: servicioId, adicional_id: existenteId });
    if (error) {
      console.error("[AdicionalesSection] error al agregar existente:", error.message);
      onError("No se pudo agregar el adicional a este servicio.");
      return;
    }
    setExistenteId("");
    onSuccess("Adicional agregado a este servicio");
    cargar();
  };

  const toggleServicio = (id: string) => {
    setForm((prev) => {
      if (!prev) return prev;
      const has = prev.servicios.includes(id);
      return { ...prev, servicios: has ? prev.servicios.filter((s) => s !== id) : [...prev.servicios, id] };
    });
  };

  return (
    <div
      style={{
        backgroundColor: "var(--color-surface-light)",
        border: "1px solid var(--color-border-light)",
        borderRadius: "var(--radius-xl)",
        padding: "2rem",
        marginTop: "1.5rem",
      }}
    >
      <div className="flex items-start justify-between gap-4 flex-wrap" style={{ marginBottom: "1rem" }}>
        <div>
          <h3 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: "var(--text-xl)", color: "var(--color-text-on-light)" }}>
            Adicionales
          </h3>
          <p style={{ ...mutedText, marginTop: 4, maxWidth: 560 }}>
            Extras que la clienta puede sumar a este servicio (por ejemplo, diseño de uñas). Suman precio y duración a la cita,
            se muestran en la web y el asistente de WhatsApp se los ofrece al agendar.
          </p>
        </div>
        {!form && (
          <button type="button" onClick={abrirCrear} style={{ ...smallButton, backgroundColor: "var(--color-primary)", color: "var(--color-text-inverse)", border: "none" }}>
            <Plus size={16} /> Crear adicional
          </button>
        )}
      </div>

      {loading ? (
        <p style={mutedText}>Cargando adicionales...</p>
      ) : (
        <>
          {vinculados.length === 0 && !form && (
            <p style={{ ...mutedText, fontStyle: "italic" }}>Este servicio todavía no tiene adicionales.</p>
          )}

          {vinculados.length > 0 && (
            <ul className="flex flex-col gap-3" style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {vinculados.map((a) => {
                const n = usoPorAdicional.get(a.id) ?? 1;
                return (
                  <li
                    key={a.id}
                    className="flex items-center justify-between gap-3 flex-wrap"
                    style={{
                      padding: "0.9rem 1rem",
                      border: "1px solid var(--color-border-light)",
                      borderRadius: "var(--radius-lg)",
                      opacity: a.activo ? 1 : 0.6,
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontFamily: "var(--font-body)", fontWeight: 600, color: "var(--color-text-on-light)" }}>
                        {a.nombre}
                        {!a.activo && (
                          <span style={{ ...mutedText, marginLeft: 8, fontWeight: 400 }}>(inactivo)</span>
                        )}
                      </p>
                      <p style={mutedText}>
                        {formatPriceRange(a.precio, a.precio_hasta, a.precio_desde)} ·{" "}
                        {a.duracion_min > 0 ? `+${formatDuration(a.duracion_min)}` : "no suma tiempo"}
                        {a.dias_retoque != null ? ` · retoque a los ${a.dias_retoque} días` : ""}
                        {n > 1 ? ` · también en ${n - 1} ${n - 1 === 1 ? "servicio más" : "servicios más"}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <button type="button" onClick={() => abrirEditar(a)} style={smallButton}>
                        <Pencil size={14} /> Editar
                      </button>
                      <button type="button" onClick={() => quitarDeEsteServicio(a)} style={smallButton}>
                        <Unlink size={14} /> Quitar de este servicio
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {!form && disponibles.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap" style={{ marginTop: "1.25rem" }}>
              <select
                value={existenteId}
                onChange={(e) => setExistenteId(e.target.value)}
                aria-label="Agregar un adicional que ya existe"
                style={{ ...inputStyle, maxWidth: 340 }}
              >
                <option value="">Agregar un adicional que ya existe...</option>
                {disponibles.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nombre} ({formatPriceRange(a.precio, a.precio_hasta, a.precio_desde)})
                  </option>
                ))}
              </select>
              <button type="button" onClick={agregarExistente} disabled={!existenteId} style={{ ...smallButton, opacity: existenteId ? 1 : 0.5 }}>
                Agregar
              </button>
            </div>
          )}

          {form && (
            <form onSubmit={guardar} style={{ marginTop: "1.25rem", paddingTop: "1.25rem", borderTop: "1px solid var(--color-border-light)" }} className="flex flex-col gap-4">
              <h4 style={{ fontFamily: "var(--font-body)", fontWeight: 600, color: "var(--color-text-on-light)" }}>
                {form.id ? "Editar adicional" : "Nuevo adicional"}
              </h4>
              {form.id && (usoPorAdicional.get(form.id) ?? 0) > 1 && (
                <p style={{ ...mutedText, fontStyle: "italic" }}>
                  Los cambios de nombre, precio y duración se aplican en todos los servicios donde aparece este adicional.
                </p>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label style={labelStyle}>Nombre del adicional *</label>
                  <input required type="text" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Diseño de uñas" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Duración que suma</label>
                  <div className="flex gap-3 items-center">
                    <input type="number" min={0} max={10} step={1} aria-label="Horas" value={form.horasTxt} onChange={(e) => setForm({ ...form, horasTxt: e.target.value })} placeholder="0" style={{ ...inputStyle, flex: 1 }} />
                    <span style={mutedText}>h</span>
                    <input type="number" min={0} max={59} step={5} aria-label="Minutos" value={form.minutosTxt} onChange={(e) => setForm({ ...form, minutosTxt: e.target.value })} placeholder="0" style={{ ...inputStyle, flex: 1 }} />
                    <span style={mutedText}>min</span>
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Precio desde *</label>
                  <input required type="number" min={0} value={form.precioTxt} onChange={(e) => setForm({ ...form, precioTxt: e.target.value })} placeholder="Ej: 10000" style={inputStyle} />
                  {Number(form.precioHastaTxt) > Number(form.precioTxt) ? (
                    <p style={{ ...mutedText, marginTop: 8 }}>Con "Precio hasta" se muestra como rango; no hace falta marcar "Desde".</p>
                  ) : (
                    <label className="flex items-center gap-2 mt-2 cursor-pointer">
                      <input type="checkbox" checked={form.precioDesde} onChange={(e) => setForm({ ...form, precioDesde: e.target.checked })} style={{ width: 16, height: 16, accentColor: "var(--color-primary)" }} />
                      <span style={mutedText}>El precio es un "Desde" (sin tope)</span>
                    </label>
                  )}
                </div>
                <div>
                  <label style={labelStyle}>Precio hasta <span style={{ fontWeight: 400 }}>(opcional)</span></label>
                  <input type="number" min={0} value={form.precioHastaTxt} onChange={(e) => setForm({ ...form, precioHastaTxt: e.target.value })} placeholder="Déjalo vacío si no hay rango" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Retoque a los (días) <span style={{ fontWeight: 400 }}>(opcional)</span></label>
                  <input type="number" value={form.retoqueTxt} onChange={(e) => setForm({ ...form, retoqueTxt: e.target.value })} placeholder="Vacío si no cambia el retoque del servicio" style={inputStyle} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Descripción corta <span style={{ fontWeight: 400 }}>(opcional)</span></label>
                <textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} style={{ ...inputStyle, minHeight: 64 }} />
              </div>
              <div>
                <label style={labelStyle}>Disponible en estos servicios</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2" style={{ maxHeight: 220, overflowY: "auto", padding: "4px 2px" }}>
                  {servicios.map((s) => {
                    const esEste = s.id === servicioId;
                    return (
                      <label key={s.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.servicios.includes(s.id)}
                          disabled={esEste}
                          onChange={() => toggleServicio(s.id)}
                          style={{ width: 16, height: 16, accentColor: "var(--color-primary)" }}
                        />
                        <span style={{ ...mutedText, color: "var(--color-text-on-light)" }}>
                          {s.nombre}
                          {esEste ? " (este servicio)" : ""}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.activo} onChange={(e) => setForm({ ...form, activo: e.target.checked })} style={{ width: 18, height: 18, accentColor: "var(--color-primary)" }} />
                <span style={{ ...mutedText, color: "var(--color-text-on-light)" }}>Adicional activo (se muestra y se ofrece)</span>
              </label>

              {formError && (
                <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--color-error)" }}>{formError}</p>
              )}

              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  {form.id && (
                    <button
                      type="button"
                      onClick={() => {
                        const a = todos.find((x) => x.id === form.id);
                        if (a) eliminar(a);
                      }}
                      style={{ ...smallButton, color: "var(--color-error)", border: "none", backgroundColor: "rgba(224,82,82,0.1)" }}
                    >
                      <Trash2 size={14} /> Eliminar adicional
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setForm(null)}
                    disabled={saving}
                    style={{
                      padding: "10px 24px",
                      borderRadius: "var(--radius-full)",
                      border: "2px solid var(--color-primary-dim)",
                      backgroundColor: "transparent",
                      color: "var(--color-primary)",
                      fontFamily: "var(--font-body)",
                      fontWeight: 600,
                      fontSize: "var(--text-sm)",
                      cursor: saving ? "not-allowed" : "pointer",
                      opacity: saving ? 0.5 : 1,
                    }}
                  >
                    Cancelar
                  </button>
                  <Button type="submit" variant="accent" size="md" disabled={saving}>
                    {saving ? "Guardando..." : "Guardar adicional"}
                  </Button>
                </div>
              </div>
            </form>
          )}
        </>
      )}
    </div>
  );
}
