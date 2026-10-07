import { useCallback, useState } from "react";
import { X, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase/client";

interface NuevoProfesionalPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  onError: (message: string) => void;
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  backgroundColor: "var(--color-bg-alt)",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-lg)",
  fontFamily: "var(--font-body)",
  fontSize: "var(--text-sm)",
  color: "var(--color-text-primary)",
  outline: "none",
};

const labelStyle: React.CSSProperties = {
  fontFamily: "var(--font-body)",
  fontWeight: 600,
  fontSize: "var(--text-sm)",
  color: "var(--color-text-primary)",
  display: "block",
  marginBottom: "6px",
};

export function NuevoProfesionalPanel({ isOpen, onClose, onCreated, onError }: NuevoProfesionalPanelProps) {
  const [nombre, setNombre] = useState("");
  const [anosExperiencia, setAnosExperiencia] = useState<number>(0);
  const [bio, setBio] = useState("");
  const [colorCalendario, setColorCalendario] = useState("#1C3D35");
  const [especialidades, setEspecialidades] = useState<string[]>([]);
  const [nuevaEspecialidad, setNuevaEspecialidad] = useState("");
  
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setNombre("");
    setAnosExperiencia(0);
    setBio("");
    setColorCalendario("#1C3D35");
    setEspecialidades([]);
    setNuevaEspecialidad("");
    setFormError(null);
  }, []);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const addEspecialidad = () => {
    const val = nuevaEspecialidad.trim();
    if (val && !especialidades.includes(val)) {
      setEspecialidades((prev) => [...prev, val]);
    }
    setNuevaEspecialidad("");
  };

  const removeEspecialidad = (esp: string) => {
    setEspecialidades((prev) => prev.filter((e) => e !== esp));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!nombre.trim()) {
      setFormError("El nombre es obligatorio.");
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.from("profesionales").insert({
      perfil_id: null,
      nombre: nombre.trim(),
      especialidades,
      bio: bio.trim() || null,
      foto_url: null,
      anos_experiencia: anosExperiencia,
      color_calendario: colorCalendario,
      activo: true,
      orden: 999, // se actualizará en background si es necesario
    });

    setSubmitting(false);

    if (error) {
      console.error("[NuevoProfesionalPanel] error al crear profesional:", error.message);
      setFormError("No se pudo registrar profesional.");
      onError("No se pudo registrar profesional.");
      return;
    }

    resetForm();
    onCreated();
    onClose();
  };

  return (
    <>
      <div
        onClick={handleClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 69,
          backgroundColor: "rgba(0,0,0,0.6)",
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          transition: "opacity 350ms ease",
        }}
      />

      <aside
        className={`fixed top-0 right-0 bottom-0 z-70 flex flex-col bg-[var(--color-surface)] w-full sm:w-[440px] transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div
          className="flex items-center justify-between p-4 sm:p-6 shrink-0"
          style={{
            background: "linear-gradient(135deg, rgba(232,201,122,0.1) 0%, rgba(26,24,32,0.95) 100%)",
            borderBottom: "0.5px solid rgba(232,201,122,0.25)",
          }}
        >
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontSize: "var(--text-xl)",
              color: "white",
            }}
          >
            Registrar profesional
          </h2>
          <button type="button" aria-label="Cerrar" onClick={handleClose} style={{ color: "white" }}>
            <X size={22} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto flex flex-col gap-5 p-4 sm:p-6"
        >
          <div>
            <label style={labelStyle}>Nombre *</label>
            <input type="text" required placeholder="Ej. María Sánchez" value={nombre} onChange={(e) => setNombre(e.target.value)} style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Años de experiencia <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(opcional)</span></label>
            <input type="number" min="0" value={anosExperiencia} onChange={(e) => setAnosExperiencia(Number(e.target.value))} style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Biografía <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(opcional)</span></label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="Breve descripción del perfil profesional..."
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>

          <div>
            <label style={labelStyle}>Color para el calendario</label>
            <div className="flex gap-4 items-center">
              <input
                type="color"
                value={colorCalendario}
                onChange={(e) => setColorCalendario(e.target.value)}
                style={{
                  ...inputStyle,
                  width: "60px",
                  height: "40px",
                  padding: "4px",
                  cursor: "pointer",
                }}
              />
              <span className="font-mono text-sm text-[var(--color-text-primary)] uppercase">{colorCalendario}</span>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Especialidades <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(opcional)</span></label>
            <div className="flex flex-col gap-3">
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
                {especialidades.map(esp => (
                  <span key={esp} className="inline-flex items-center gap-1 px-3 py-1 bg-[rgba(232,201,122,0.15)] rounded-full text-sm font-mono text-[var(--color-primary)] border border-[rgba(232,201,122,0.3)]">
                    {esp}
                    <button type="button" onClick={() => removeEspecialidad(esp)} className="text-[var(--color-primary-dim)] hover:text-red-400 focus:outline-none" title="Eliminar">
                      <X size={14} />
                    </button>
                  </span>
                ))}
                {especialidades.length === 0 && (
                  <p className="text-sm text-[var(--color-text-muted)]">Sin especialidades añadidas.</p>
                )}
              </div>
            </div>
          </div>

          {formError && (
            <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--color-error)" }}>
              {formError}
            </p>
          )}

          <Button type="submit" variant="accent" size="lg" className="w-full" disabled={submitting}>
            {submitting ? "Registrando..." : "Registrar profesional"}
          </Button>
        </form>
      </aside>
    </>
  );
}
