import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase/client";

interface EstilistaOption {
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
  const [estilistas, setEstilistas] = useState<EstilistaOption[]>([]);
  const [estilistaId, setEstilistaId] = useState("");
  const [notas, setNotas] = useState("");
  const [aceptaDatos, setAceptaDatos] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    supabase
      .from("estilistas")
      .select("id, nombre")
      .eq("activo", true)
      .order("orden", { ascending: true })
      .then(({ data }) => setEstilistas(data ?? []));
  }, [isOpen]);

  const resetForm = useCallback(() => {
    setNombre("");
    setApellido("");
    setEmail("");
    setTelefono("");
    setFechaNacimiento("");
    setEstilistaId("");
    setNotas("");
    setAceptaDatos(false);
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

    if (!nombre.trim() || !telefono.trim() || !aceptaDatos) {
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
      nombre: nombre.trim(),
      apellido: apellido.trim() || null,
      email: email.trim() || null,
      telefono: telefono.trim(),
      fecha_nacimiento: fechaNacimiento || null,
      estilista_preferido_id: estilistaId || null,
      notas: notas.trim() || null,
      acepta_datos: aceptaDatos,
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
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "min(440px, 95vw)",
          backgroundColor: "var(--color-surface)",
          zIndex: 70,
          display: "flex",
          flexDirection: "column",
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 350ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <div
          className="flex items-center justify-between"
          style={{
            background: "linear-gradient(135deg, rgba(232,201,122,0.1) 0%, rgba(26,24,32,0.95) 100%)",
            borderBottom: "0.5px solid rgba(232,201,122,0.25)",
            padding: "1.25rem 1.5rem",
            flexShrink: 0,
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
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem",
          }}
        >
          <div className="flex gap-3">
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Nombre *</label>
              <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Apellido</label>
              <input type="text" value={apellido} onChange={(e) => setApellido(e.target.value)} style={inputStyle} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Email</label>
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
            <label style={labelStyle}>Fecha de nacimiento</label>
            <input
              type="date"
              value={fechaNacimiento}
              onChange={(e) => setFechaNacimiento(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Estilista preferida</label>
            <select value={estilistaId} onChange={(e) => setEstilistaId(e.target.value)} style={inputStyle}>
              <option value="">Sin preferencia</option>
              {estilistas.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Notas iniciales</label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={3}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>

          <label className="flex items-start gap-2" style={{ cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={aceptaDatos}
              onChange={(e) => setAceptaDatos(e.target.checked)}
              style={{ marginTop: 3 }}
            />
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-sm)",
                color: "var(--color-text-secondary)",
              }}
            >
              Acepta tratamiento de datos personales (Ley 1581) *
            </span>
          </label>

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
