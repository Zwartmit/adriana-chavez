import { useState } from "react";
import { Save, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ImageUploader } from "@/components/admin/ImageUploader";

export interface ProfesionalFormData {
  nombre: string;
  especialidades: string[];
  bio: string | null;
  foto_url: string | null;
  anos_experiencia: number;
  color_calendario: string;
  activo: boolean;
}

interface ProfesionalFormProps {
  initialData?: Partial<ProfesionalFormData>;
  onSubmit: (data: ProfesionalFormData) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  submitLabel?: string;
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

const labelStyle = {
  fontFamily: "var(--font-body)",
  fontWeight: 600,
  fontSize: "var(--text-sm)",
  color: "var(--color-text-on-light)",
  display: "block",
  marginBottom: "6px",
};

export function ProfesionalForm({ initialData, onSubmit, onCancel, isSubmitting, submitLabel = "Guardar" }: ProfesionalFormProps) {
  const [formData, setFormData] = useState<ProfesionalFormData>({
    nombre: initialData?.nombre || "",
    especialidades: initialData?.especialidades || [],
    bio: initialData?.bio || "",
    foto_url: initialData?.foto_url || null,
    anos_experiencia: initialData?.anos_experiencia || 0,
    color_calendario: initialData?.color_calendario || "#1C3D35",
    activo: initialData?.activo ?? true,
  });

  const [nuevaEspecialidad, setNuevaEspecialidad] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre.trim()) {
      alert("El nombre es obligatorio");
      return;
    }
    onSubmit(formData);
  };

  const addEspecialidad = () => {
    const val = nuevaEspecialidad.trim();
    if (val && !formData.especialidades.includes(val)) {
      setFormData(prev => ({ ...prev, especialidades: [...prev.especialidades, val] }));
    }
    setNuevaEspecialidad("");
  };

  const removeEspecialidad = (esp: string) => {
    setFormData(prev => ({ ...prev, especialidades: prev.especialidades.filter(e => e !== esp) }));
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: "var(--color-surface-light)",
    border: "1px solid var(--color-border-light)",
    borderRadius: "var(--radius-xl)",
    boxShadow: "0 2px 12px rgba(10,10,11,0.08)",
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Columna Izquierda */}
      <div className="flex flex-col gap-6">
        <section className="p-5 md:p-7" style={cardStyle}>
          <h3 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: "var(--text-xl)", color: "var(--color-text-on-light)", marginBottom: "1.5rem" }}>
            Información principal
          </h3>
          <div className="flex flex-col gap-4">
            <div>
              <label style={labelStyle}>Nombre *</label>
              <input
                type="text"
                required
                value={formData.nombre}
                onChange={(e) => setFormData((prev) => ({ ...prev, nombre: e.target.value }))}
                style={inputStyle}
                placeholder="Ej. María Sánchez"
              />
            </div>
            <div>
              <label style={labelStyle}>Años de experiencia</label>
              <input
                type="number"
                min="0"
                value={formData.anos_experiencia}
                onChange={(e) => setFormData((prev) => ({ ...prev, anos_experiencia: Number(e.target.value) }))}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Biografía</label>
              <textarea
                value={formData.bio || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
                style={{ ...inputStyle, minHeight: "100px", resize: "vertical" }}
                placeholder="Breve descripción del perfil profesional..."
              />
            </div>
          </div>
        </section>
      </div>

      {/* Columna Derecha */}
      <div className="flex flex-col gap-6">
        <section className="p-5 md:p-7" style={cardStyle}>
          <h3 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: "var(--text-xl)", color: "var(--color-text-on-light)", marginBottom: "1.5rem" }}>
            Especialidades
          </h3>
          <div className="flex flex-col gap-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={nuevaEspecialidad}
                onChange={(e) => setNuevaEspecialidad(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addEspecialidad();
                  }
                }}
                style={inputStyle}
                placeholder="Ej. Colorimetría"
              />
              <Button type="button" variant="secondary" onClick={addEspecialidad}>
                <Plus size={18} />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.especialidades.map(esp => (
                <span key={esp} className="inline-flex items-center gap-1 px-3 py-1 bg-[rgba(232,201,122,0.15)] rounded-full text-sm font-mono text-[var(--color-primary)] border border-[rgba(232,201,122,0.3)]">
                  {esp}
                  <button type="button" onClick={() => removeEspecialidad(esp)} className="text-[var(--color-primary-dim)] hover:text-red-400 focus:outline-none" title="Eliminar">
                    <X size={14} />
                  </button>
                </span>
              ))}
              {formData.especialidades.length === 0 && (
                <p className="text-sm text-[var(--color-text-on-light-muted)]">Sin especialidades añadidas.</p>
              )}
            </div>
          </div>
        </section>

        <section className="p-5 md:p-7" style={{ ...cardStyle, border: "1px solid var(--color-border-light-gold)" }}>
          <h3 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: "var(--text-xl)", color: "var(--color-text-on-light)", marginBottom: "1.5rem" }}>
            Apariencia
          </h3>
          <div className="flex flex-col gap-6">
            <div>
              <label style={labelStyle}>Color en calendario</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formData.color_calendario}
                  onChange={(e) => setFormData((prev) => ({ ...prev, color_calendario: e.target.value }))}
                  style={{ width: "50px", height: "40px", padding: "0", border: "none", borderRadius: "8px", cursor: "pointer" }}
                />
                <span className="font-mono text-sm text-[var(--color-text-on-light-muted)] uppercase">{formData.color_calendario}</span>
              </div>
            </div>
            <div>
              <label style={labelStyle}>Foto de Perfil</label>
              <ImageUploader
                bucket="galeria"
                value={formData.foto_url ? [formData.foto_url] : []}
                onChange={(urls) => setFormData((prev) => ({ ...prev, foto_url: urls.length > 0 ? urls[0] : null }))}
                maxImages={1}
              />
            </div>
          </div>
        </section>

        {/* Acciones */}
        <div className="flex items-center gap-3 sm:gap-4 mt-2">
          <Button type="button" className="w-full sm:w-auto" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" className="w-full sm:w-auto" variant="accent" disabled={isSubmitting}>
            <Save size={18} className="mr-2" />
            {isSubmitting ? "Guardando..." : submitLabel}
          </Button>
        </div>
      </div>
    </form>
  );
}
