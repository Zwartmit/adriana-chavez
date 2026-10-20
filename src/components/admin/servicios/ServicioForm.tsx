import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { generarSlots, format12h } from "@/lib/horario";

interface CategoriaOption {
  id: string;
  nombre: string;
}

export interface ServicioFormData {
  nombre: string;
  categoria_id: string;
  precio: number;
  precio_desde: boolean;
  precio_hasta: number | null;
  duracion_min: number;
  /** Días en que se recomienda el retoque; null = sin retoque */
  dias_retoque: number | null;
  descripcion: string;
  imagen_url: string | null;
  requiere_cita: boolean;
  destacado: boolean;
  activo: boolean;
  /** Reglas de horario (se guardan en inicio_desde, inicio_hasta y puede_cruzar_almuerzo) */
  ventana_inicio: boolean;
  inicio_desde: string; // "HH:MM"
  inicio_hasta: string; // "HH:MM"
  puede_cruzar_almuerzo: boolean;
}

/** Columnas de horario del servicio listas para insert/update en la base. */
export function horarioServicioPayload(data: ServicioFormData) {
  return {
    inicio_desde: data.ventana_inicio ? data.inicio_desde : null,
    inicio_hasta: data.ventana_inicio ? data.inicio_hasta : null,
    puede_cruzar_almuerzo: data.puede_cruzar_almuerzo,
  };
}

const SLOTS_VENTANA = generarSlots("05:00", "22:00");

interface ServicioFormProps {
  initialData?: Partial<ServicioFormData>;
  categorias: CategoriaOption[];
  isSubmitting: boolean;
  onSubmit: (data: ServicioFormData) => void;
  onCancel: () => void;
}

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
  transition: "border-color var(--transition-fast)",
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

export function ServicioForm({ initialData, categorias, isSubmitting, onSubmit, onCancel }: ServicioFormProps) {
  const [formData, setFormData] = useState<ServicioFormData>({
    nombre: initialData?.nombre ?? "",
    categoria_id: initialData?.categoria_id ?? "",
    precio: initialData?.precio ?? 0,
    precio_desde: initialData?.precio_desde ?? false,
    precio_hasta: initialData?.precio_hasta ?? null,
    duracion_min: initialData?.duracion_min ?? 60,
    dias_retoque: initialData?.dias_retoque ?? null,
    descripcion: initialData?.descripcion ?? "",
    imagen_url: initialData?.imagen_url ?? null,
    requiere_cita: initialData?.requiere_cita ?? true,
    destacado: initialData?.destacado ?? false,
    activo: initialData?.activo ?? true,
    ventana_inicio: initialData?.ventana_inicio ?? false,
    inicio_desde: initialData?.inicio_desde ?? "",
    inicio_hasta: initialData?.inicio_hasta ?? "",
    puede_cruzar_almuerzo: initialData?.puede_cruzar_almuerzo ?? false,
  });
  // Precio y duración se editan como texto para que los campos nuevos aparezcan vacíos (sin "0").
  const [precioTxt, setPrecioTxt] = useState(initialData?.precio ? String(initialData.precio) : "");
  const [horasTxt, setHorasTxt] = useState(
    initialData?.duracion_min ? String(Math.floor(initialData.duracion_min / 60)) : "",
  );
  const [minutosTxt, setMinutosTxt] = useState(
    initialData?.duracion_min ? String(initialData.duracion_min % 60) : "",
  );
  const [formError, setFormError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let finalValue: any = value;
    
    if (type === "checkbox") {
      finalValue = (e.target as HTMLInputElement).checked;
    } else if (type === "number") {
      finalValue = value === "" ? null : Number(value);
    }
    
    setFormData((prev) => ({ ...prev, [name]: finalValue }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const precio = Number(precioTxt);
    const duracion = (Number(horasTxt) || 0) * 60 + (Number(minutosTxt) || 0);
    if (precioTxt.trim() === "" || !Number.isFinite(precio) || precio < 0) {
      setFormError('Escribe el precio "desde".');
      return;
    }
    if (duracion < 5) {
      setFormError("La duración debe ser de al menos 5 minutos.");
      return;
    }
    if (formData.precio_hasta != null && formData.precio_hasta < precio) {
      setFormError('El precio "hasta" no puede ser menor que el precio "desde".');
      return;
    }
    if (formData.dias_retoque != null && (!Number.isInteger(formData.dias_retoque) || formData.dias_retoque < 1 || formData.dias_retoque > 365)) {
      setFormError("Los días de retoque deben ser un número entero entre 1 y 365 (o déjalo vacío si no tiene retoque).");
      return;
    }
    if (formData.ventana_inicio) {
      if (!formData.inicio_desde || !formData.inicio_hasta) {
        setFormError("Elige la hora desde y hasta de la franja de inicio.");
        return;
      }
      if (formData.inicio_desde > formData.inicio_hasta) {
        setFormError("En la franja de inicio, la hora \"hasta\" debe ser igual o posterior a \"desde\".");
        return;
      }
    }
    onSubmit({ ...formData, precio, duracion_min: duracion });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Información Básica */}
      <section>
        <h3 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: "var(--text-xl)", color: "var(--color-text-on-light)", marginBottom: "1rem" }}>
          Información básica
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label style={labelStyle}>Nombre del servicio *</label>
            <input required type="text" name="nombre" value={formData.nombre} onChange={handleChange} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Categoría *</label>
            <select required name="categoria_id" value={formData.categoria_id} onChange={handleChange} style={inputStyle}>
              <option value="">Selecciona una categoría</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Precio desde *</label>
            <div className="flex gap-2 items-center">
              <input required type="number" min={0} name="precio" value={precioTxt} onChange={(e) => setPrecioTxt(e.target.value)} placeholder="Ej: 60000" style={{ ...inputStyle, flex: 1 }} />
            </div>
            <label className="flex items-center gap-2 mt-2 cursor-pointer">
              <input type="checkbox" name="precio_desde" checked={formData.precio_desde} onChange={handleChange} style={{ width: 16, height: 16, accentColor: "var(--color-primary)" }} />
              <span style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--color-text-on-light-muted)" }}>El precio es un "Desde" (variable)</span>
            </label>
          </div>
          <div>
            <label style={labelStyle}>Precio hasta <span style={{ fontWeight: 400, color: "var(--color-text-on-light-muted)" }}>(opcional)</span></label>
            <input type="number" min={0} name="precio_hasta" value={formData.precio_hasta ?? ""} onChange={handleChange} placeholder="Déjalo vacío si no hay rango" style={inputStyle} />
            <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", color: "var(--color-text-on-light-muted)", marginTop: 6 }}>
              Si lo llenas, el servicio se muestra y se informa como rango (desde – hasta).
            </p>
          </div>
          <div>
            <label style={labelStyle}>Duración *</label>
            <div className="flex gap-3 items-center">
              <input type="number" min={0} max={12} step={1} aria-label="Horas" value={horasTxt} onChange={(e) => setHorasTxt(e.target.value)} placeholder="0" style={{ ...inputStyle, flex: 1 }} />
              <span style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--color-text-on-light-muted)" }}>h</span>
              <input type="number" min={0} max={59} step={5} aria-label="Minutos" value={minutosTxt} onChange={(e) => setMinutosTxt(e.target.value)} placeholder="0" style={{ ...inputStyle, flex: 1 }} />
              <span style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--color-text-on-light-muted)" }}>min</span>
            </div>
          </div>
          <div>
            <label style={labelStyle}>Retoque a los (días) <span style={{ fontWeight: 400, color: "var(--color-text-on-light-muted)" }}>(opcional)</span></label>
            <input type="number" min={1} max={365} step={1} name="dias_retoque" value={formData.dias_retoque ?? ""} onChange={handleChange} placeholder="Ej: 21. Vacío si no tiene retoque" style={inputStyle} />
            <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", color: "var(--color-text-on-light-muted)", marginTop: 6 }}>
              Cada cuántos días se recomienda volver (uñas 21, cejas y pestañas 15). El asistente de WhatsApp lo usa para orientar a las clientas.
            </p>
          </div>
        </div>
      </section>

      <div style={{ height: "1px", backgroundColor: "var(--color-border-light)", margin: "2rem 0" }} />

      {/* Horario del servicio */}
      <section>
        <h3 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: "var(--text-xl)", color: "var(--color-text-on-light)", marginBottom: "0.5rem" }}>
          Horario del servicio
        </h3>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--color-text-on-light-muted)", marginBottom: "1rem" }}>
          Reglas para agendar este servicio. Las citas que ya existen no se mueven ni se cancelan al cambiarlas.
        </p>
        <div className="flex flex-col gap-4">
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="ventana_inicio" checked={formData.ventana_inicio} onChange={handleChange} style={{ width: 18, height: 18, accentColor: "var(--color-primary)" }} />
              <span style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--color-text-on-light)" }}>
                Solo puede empezar dentro de una franja del día
              </span>
            </label>
            {formData.ventana_inicio && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3" style={{ maxWidth: 420 }}>
                <div>
                  <label style={labelStyle}>Puede empezar desde</label>
                  <select name="inicio_desde" value={formData.inicio_desde} onChange={handleChange} style={inputStyle}>
                    <option value="">--:--</option>
                    {SLOTS_VENTANA.map((slot) => (
                      <option key={slot} value={slot}>{format12h(slot)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Hasta</label>
                  <select name="inicio_hasta" value={formData.inicio_hasta} onChange={handleChange} style={inputStyle}>
                    <option value="">--:--</option>
                    {SLOTS_VENTANA.map((slot) => (
                      <option key={slot} value={slot}>{format12h(slot)}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" name="puede_cruzar_almuerzo" checked={formData.puede_cruzar_almuerzo} onChange={handleChange} style={{ width: 18, height: 18, accentColor: "var(--color-primary)" }} />
            <span style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--color-text-on-light)" }}>
              Puede cruzar la hora de almuerzo
            </span>
          </label>
        </div>
      </section>

      <div style={{ height: "1px", backgroundColor: "var(--color-border-light)", margin: "2rem 0" }} />

      {/* Descripción */}
      <section>
        <h3 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: "var(--text-xl)", color: "var(--color-text-on-light)", marginBottom: "1rem" }}>
          Detalles
        </h3>
        <div>
          <label style={labelStyle}>Descripción corta</label>
          <textarea name="descripcion" value={formData.descripcion} onChange={handleChange} style={{ ...inputStyle, minHeight: 80 }} placeholder="En qué consiste el servicio..." />
        </div>
      </section>

      <div style={{ height: "1px", backgroundColor: "var(--color-border-light)", margin: "2rem 0" }} />

      {/* Imagen */}
      <section>
        <h3 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: "var(--text-xl)", color: "var(--color-text-on-light)", marginBottom: "1rem" }}>
          Imagen representativa
        </h3>
        <ImageUploader
          bucket="servicios"
          value={formData.imagen_url ? [formData.imagen_url] : []}
          onChange={(urls) => setFormData((prev) => ({ ...prev, imagen_url: urls.length > 0 ? urls[0] : null }))}
          maxImages={1}
        />
      </section>

      <div style={{ height: "1px", backgroundColor: "var(--color-border-light)", margin: "2rem 0" }} />

      {/* Opciones y Visibilidad */}
      <section>
        <h3 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: "var(--text-xl)", color: "var(--color-text-on-light)", marginBottom: "1rem" }}>
          Visibilidad y Etiquetas
        </h3>
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" name="activo" checked={formData.activo} onChange={handleChange} style={{ width: 18, height: 18, accentColor: "var(--color-primary)" }} />
            <span style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--color-text-on-light)" }}>Servicio Activo</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" name="requiere_cita" checked={formData.requiere_cita} onChange={handleChange} style={{ width: 18, height: 18, accentColor: "var(--color-primary)" }} />
            <span style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--color-text-on-light)" }}>Requiere cita previa</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" name="destacado" checked={formData.destacado} onChange={handleChange} style={{ width: 18, height: 18, accentColor: "var(--color-primary)" }} />
            <span style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--color-text-on-light)" }}>Destacado (Recomendado)</span>
          </label>
        </div>
      </section>

      {formError && (
        <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--color-error)" }}>
          {formError}
        </p>
      )}

      <div className="flex items-center justify-end gap-3 pt-6">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          style={{
            padding: "10px 24px",
            borderRadius: "var(--radius-full)",
            border: "2px solid var(--color-primary-dim)",
            backgroundColor: "transparent",
            color: "var(--color-primary)",
            fontFamily: "var(--font-body)",
            fontWeight: 600,
            fontSize: "var(--text-sm)",
            cursor: isSubmitting ? "not-allowed" : "pointer",
            opacity: isSubmitting ? 0.5 : 1,
          }}
        >
          Cancelar
        </button>
        <Button type="submit" variant="accent" size="md" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : "Guardar Servicio"}
        </Button>
      </div>
    </form>
  );
}
