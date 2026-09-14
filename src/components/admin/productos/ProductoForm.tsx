import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ImageUploader } from "@/components/admin/ImageUploader";

interface CategoriaOption {
  id: string;
  nombre: string;
}

export interface ProductoFormData {
  nombre: string;
  marca: string;
  categoria_id: string;
  precio: number;
  descripcion: string;
  descripcion_larga: string;
  caracteristicas: { label: string; valor: string }[];
  imagenes: string[];
  destacado: boolean;
  es_nuevo: boolean;
  activo: boolean;
}

interface ProductoFormProps {
  initialData?: Partial<ProductoFormData>;
  categorias: CategoriaOption[];
  isSubmitting: boolean;
  onSubmit: (data: ProductoFormData) => void;
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

export function ProductoForm({ initialData, categorias, isSubmitting, onSubmit, onCancel }: ProductoFormProps) {
  const [formData, setFormData] = useState<ProductoFormData>({
    nombre: initialData?.nombre ?? "",
    marca: initialData?.marca ?? "",
    categoria_id: initialData?.categoria_id ?? "",
    precio: initialData?.precio ?? 0,
    descripcion: initialData?.descripcion ?? "",
    descripcion_larga: initialData?.descripcion_larga ?? "",
    caracteristicas: Array.isArray(initialData?.caracteristicas) ? initialData.caracteristicas : [],
    imagenes: Array.isArray(initialData?.imagenes) ? initialData.imagenes : [],
    destacado: initialData?.destacado ?? false,
    es_nuevo: initialData?.es_nuevo ?? false,
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

  const handleAddCaracteristica = () => {
    setFormData((prev) => ({
      ...prev,
      caracteristicas: [...prev.caracteristicas, { label: "", valor: "" }]
    }));
  };

  const handleUpdateCaracteristica = (index: number, field: "label" | "valor", value: string) => {
    setFormData((prev) => {
      const newCaracs = [...prev.caracteristicas];
      newCaracs[index] = { ...newCaracs[index], [field]: value };
      return { ...prev, caracteristicas: newCaracs };
    });
  };

  const handleRemoveCaracteristica = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      caracteristicas: prev.caracteristicas.filter((_, i) => i !== index)
    }));
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
            <label style={labelStyle}>Nombre del producto *</label>
            <input required type="text" name="nombre" value={formData.nombre} onChange={handleChange} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Marca *</label>
            <input required type="text" name="marca" value={formData.marca} onChange={handleChange} style={inputStyle} />
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
            <input required type="number" min={0} name="precio" value={formData.precio} onChange={handleChange} style={inputStyle} />
          </div>
        </div>
      </section>

      <div style={{ height: "1px", backgroundColor: "var(--color-border-light)", margin: "2rem 0" }} />

      {/* Descripciones */}
      <section>
        <h3 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: "var(--text-xl)", color: "var(--color-primary-dim)", marginBottom: "1rem" }}>
          Detalles del producto
        </h3>
        <div className="space-y-4">
          <div>
            <label style={labelStyle}>Descripción corta *</label>
            <textarea required name="descripcion" value={formData.descripcion} onChange={handleChange} style={{ ...inputStyle, minHeight: 80 }} placeholder="Resumen corto para la tarjeta del producto" />
          </div>
          <div>
            <label style={labelStyle}>Descripción larga (opcional)</label>
            <textarea name="descripcion_larga" value={formData.descripcion_larga} onChange={handleChange} style={{ ...inputStyle, minHeight: 150 }} placeholder="Descripción completa del producto..." />
          </div>
        </div>
      </section>

      <div style={{ height: "1px", backgroundColor: "var(--color-border-light)", margin: "2rem 0" }} />

      {/* Imágenes */}
      <section>
        <h3 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: "var(--text-xl)", color: "var(--color-primary-dim)", marginBottom: "1rem" }}>
          Imágenes del Producto
        </h3>
        <ImageUploader
          bucket="productos"
          value={formData.imagenes}
          onChange={(urls) => setFormData((prev) => ({ ...prev, imagenes: urls }))}
          maxImages={4}
        />
      </section>

      <div style={{ height: "1px", backgroundColor: "var(--color-border-light)", margin: "2rem 0" }} />

      {/* Características */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: "var(--text-xl)", color: "var(--color-primary-dim)" }}>
            Características (Ficha técnica)
          </h3>
          <button type="button" onClick={handleAddCaracteristica} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: "var(--radius-full)", backgroundColor: "rgba(200,168,74,0.1)", color: "var(--color-primary-dim)", border: "none", cursor: "pointer", fontFamily: "var(--font-body)", fontWeight: 500, fontSize: "var(--text-xs)" }}>
            <Plus size={14} /> Añadir
          </button>
        </div>
        <div className="space-y-3">
          {formData.caracteristicas.length === 0 && (
            <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--color-text-on-light-faint)", fontStyle: "italic" }}>No hay características añadidas.</p>
          )}
          {formData.caracteristicas.map((carac, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input type="text" placeholder="Propiedad (ej. Volumen)" value={carac.label} onChange={(e) => handleUpdateCaracteristica(i, "label", e.target.value)} style={{ ...inputStyle, flex: 1 }} />
              <input type="text" placeholder="Valor (ej. 250ml)" value={carac.valor} onChange={(e) => handleUpdateCaracteristica(i, "valor", e.target.value)} style={{ ...inputStyle, flex: 2 }} />
              <button type="button" onClick={() => handleRemoveCaracteristica(i)} style={{ padding: "8px", color: "var(--color-error)", background: "rgba(224,82,82,0.1)", borderRadius: "var(--radius-md)", border: "none", cursor: "pointer" }}>
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
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
            <span style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--color-text-on-light)" }}>Producto Activo</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" name="destacado" checked={formData.destacado} onChange={handleChange} style={{ width: 18, height: 18, accentColor: "var(--color-primary)" }} />
            <span style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--color-text-on-light)" }}>Destacado (Recomendado)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" name="es_nuevo" checked={formData.es_nuevo} onChange={handleChange} style={{ width: 18, height: 18, accentColor: "var(--color-primary)" }} />
            <span style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--color-text-on-light)" }}>Etiqueta "Nuevo"</span>
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
          {isSubmitting ? "Guardando..." : "Guardar Producto"}
        </Button>
      </div>
    </form>
  );
}
