import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase/client";

interface ProfesionalOption {
  id: string;
  nombre: string;
}

interface NuevaClientaPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  onError: (message: string) => void;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

export function NuevaClientaPanel({ isOpen, onClose, onCreated, onError }: NuevaClientaPanelProps) {
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [profesionales, setProfesionals] = useState<ProfesionalOption[]>([]);
  const [profesionalId, setProfesionalId] = useState("");
  const [notas, setNotas] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    supabase
      .from("profesionales")
      .select("id, nombre")
      .eq("activo", true)
      .order("orden", { ascending: true })
      .then(({ data }) => setProfesionals(data ?? []));
  }, [isOpen]);

  const resetForm = useCallback(() => {
    setNombre("");
    setApellido("");
    setEmail("");
    setTelefono("");
    setFechaNacimiento("");
    setProfesionalId("");
    setNotas("");
    setFormError(null);
    setEmailError(null);
  }, []);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setEmailError(null);

    if (!nombre.trim() || !telefono.trim()) {
      setFormError("Completa todos los campos requeridos.");
      return;
    }

    if (email.trim() && !EMAIL_REGEX.test(email.trim())) {
      setEmailError("Ingresa un correo electrónico válido.");
      return;
    }

    setSubmitting(true);

    if (email.trim()) {
      const { data: existing } = await supabase
        .from("clientes")
        .select("id")
        .eq("email", email.trim())
        .maybeSingle();

      if (existing) {
        setEmailError("Ya existe una clienta con ese correo.");
        setSubmitting(false);
        return;
      }
    }

    const { error } = await supabase.from("clientes").insert({
      perfil_id: null,
      nombre: nombre.trim(),
      apellido: apellido.trim() || null,
      email: email.trim() || null,
      telefono: telefono.trim(),
      fecha_nacimiento: fechaNacimiento || null,
      profesional_preferido_id: profesionalId || null,
      notas: notas.trim() || null,
      alergias: null,
      preferencias: null,
      // El sistema asume automáticamente la aceptación del tratamiento de datos
      acepta_datos: true,
      fecha_acepta: new Date().toISOString(),
      activo: true,
    });
    setSubmitting(false);

    if (error) {
      console.error("[NuevaClientaPanel] error al crear clienta:", error.message);
      setFormError("No se pudo registrar la clienta.");
      onError("No se pudo registrar la clienta.");
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
            Nueva clienta
          </h2>
          <button type="button" aria-label="Cerrar" onClick={handleClose} style={{ color: "white" }}>
            <X size={22} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto flex flex-col gap-5 p-4 sm:p-6"
        >
          <div className="flex flex-col sm:flex-row gap-5 sm:gap-3">
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Nombre *</label>
              <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Apellido <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(opcional)</span></label>
              <input type="text" value={apellido} onChange={(e) => setApellido(e.target.value)} style={inputStyle} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Email <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(opcional)</span></label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError(null);
              }}
              style={inputStyle}
            />
            {emailError && (
              <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", color: "var(--color-error)", marginTop: 6 }}>
                {emailError}
              </p>
            )}
          </div>

          <div>
            <label style={labelStyle}>Teléfono *</label>
            <input type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Fecha de nacimiento <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(opcional)</span></label>
            <input
              type="date"
              value={fechaNacimiento}
              onChange={(e) => setFechaNacimiento(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Profesional preferida <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(opcional)</span></label>
            <select value={profesionalId} onChange={(e) => setProfesionalId(e.target.value)} style={inputStyle}>
              <option value="">Sin preferencia</option>
              {profesionales.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Observaciones <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(opcional)</span></label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={3}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>

          {formError && (
            <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--color-error)" }}>
              {formError}
            </p>
          )}

          <Button type="submit" variant="accent" size="lg" className="w-full" disabled={submitting}>
            {submitting ? "Registrando..." : "Registrar clienta"}
          </Button>
        </form>
      </aside>
    </>
  );
}

