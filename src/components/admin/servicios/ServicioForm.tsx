import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ImageUploader } from "@/components/admin/ImageUploader";

interface CategoriaOption {
  id: string;
  nombre: string;
}

export interface ServicioFormData {
  nombre: string;
  categoria_id: string;
  precio: number;
  precio_desde: boolean;
  duracion_min: number;
  descripcion: string;
  imagen_url: string | null;
  requiere_cita: boolean;
  destacado: boolean;
  activo: boolean;
}

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
    duracion_min: initialData?.duracion_min ?? 60,
    descripcion: initialData?.descripcion ?? "",
    imagen_url: initialData?.imagen_url ?? null,
    requiere_cita: initialData?.requiere_cita ?? true,
    destacado: initialData?.destacado ?? false,
    activo: initialData?.activo ?? true,
  });

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
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Información Básica */}
      <section>
        <h3 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: "var(--text-xl)", color: "var(--color-primary-dim)", marginBottom: "1rem" }}>
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
            <label style={labelStyle}>Precio *</label>
            <div className="flex gap-2 items-center">
              <input required type="number" min={0} name="precio" value={formData.precio} onChange={handleChange} style={{ ...inputStyle, flex: 1 }} />
            </div>
            <label className="flex items-center gap-2 mt-2 cursor-pointer">
              <input type="checkbox" name="precio_desde" checked={formData.precio_desde} onChange={handleChange} style={{ width: 16, height: 16, accentColor: "var(--color-primary)" }} />
              <span style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--color-text-on-light-muted)" }}>El precio es un "Desde" (variable)</span>
            </label>
          </div>
          <div>
            <label style={labelStyle}>Duración (minutos) *</label>
            <input required type="number" min={5} step={5} name="duracion_min" value={formData.duracion_min} onChange={handleChange} style={inputStyle} />
          </div>
        </div>
      </section>

      <div style={{ height: "1px", backgroundColor: "var(--color-border-light)", margin: "2rem 0" }} />

      {/* Descripción */}
      <section>
        <h3 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: "var(--text-xl)", color: "var(--color-primary-dim)", marginBottom: "1rem" }}>
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
        <h3 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: "var(--text-xl)", color: "var(--color-primary-dim)", marginBottom: "1rem" }}>
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
        <h3 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: "var(--text-xl)", color: "var(--color-primary-dim)", marginBottom: "1rem" }}>
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
