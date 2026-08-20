import { useState } from "react";
import { CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase/client";

const SERVICIOS_OPTIONS = [
  { value: "", label: "Selecciona un servicio..." },
  { value: "corte", label: "Corte & Estilo" },
  { value: "coloracion", label: "Coloración" },
  { value: "balayage", label: "Balayage / Highlights" },
  { value: "tratamiento", label: "Tratamiento Capilar" },
  { value: "alisado", label: "Alisado Brasileño" },
  { value: "manopedi", label: "Manicure & Pedicure" },
  { value: "peinado", label: "Peinado para Evento" },
  { value: "otro", label: "Otro / No sé aún" },
];

const inputStyle: React.CSSProperties = {
  backgroundColor: "var(--color-surface)",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-lg)",
  padding: "14px 16px",
  fontFamily: "var(--font-body)",
  fontSize: "var(--text-base)",
  color: "var(--color-text-primary)",
  width: "100%",
  transition: "border var(--transition-base), box-shadow var(--transition-base)",
};

function handleFocus(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
  e.currentTarget.style.border = "2px solid var(--color-primary)";
  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(232,201,122,0.08)";
}

function handleBlur(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
  e.currentTarget.style.border = "1px solid var(--color-border)";
  e.currentTarget.style.boxShadow = "none";
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label
      className="block"
      style={{
        fontFamily: "var(--font-body)",
        fontWeight: 600,
        fontSize: "var(--text-sm)",
        color: "var(--color-text-primary)",
        marginBottom: "6px",
      }}
    >
      {children}
      {required && <span style={{ color: "var(--color-accent)" }}> *</span>}
    </label>
  );
}

export function ContactoForm() {
  const [formState, setFormState] = useState({
    nombre: "",
    telefono: "",
    email: "",
    servicio: "",
    mensaje: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.from("mensajes_contacto").insert({
      nombre: formState.nombre,
      telefono: formState.telefono,
      email: formState.email || null,
      servicio: formState.servicio || null,
      mensaje: formState.mensaje,
    });

    if (error) {
      console.error("[ContactoForm] error al enviar mensaje:", error.message);
      setError("Hubo un problema al enviar tu mensaje. Intenta de nuevo.");
      setLoading(false);
      return;
    }

    setLoading(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div style={{ textAlign: "center", padding: "3rem 2rem" }}>
        <CheckCircle size={48} color="var(--color-primary)" className="mx-auto" />
        <h3
          style={{
            fontFamily: "var(--font-display)",
            fontStyle: "italic",
            fontSize: "var(--text-2xl)",
            color: "var(--color-primary)",
            margin: "1rem 0 0.5rem",
          }}
        >
          ¡Mensaje recibido!
        </h3>
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-base)",
            color: "var(--color-text-secondary)",
          }}
        >
          Te responderemos en menos de 24 horas. También puedes escribirnos
          directamente por WhatsApp.
        </p>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setSubmitted(false)}
          style={{ marginTop: "1.5rem" }}
        >
          Enviar otro mensaje
        </Button>
      </div>
    );
  }

  return (
    <div>
      <span
        className="uppercase"
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "var(--text-xs)",
          letterSpacing: "var(--tracking-widest)",
          color: "var(--color-accent)",
        }}
      >
        Envíanos un mensaje
      </span>
      <h2
        style={{
          fontFamily: "var(--font-display)",
          fontStyle: "italic",
          fontWeight: 600,
          fontSize: "var(--text-3xl)",
          color: "var(--color-text-primary)",
          marginTop: "0.5rem",
        }}
      >
        Cuéntanos qué necesitas
      </h2>
      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "var(--text-base)",
          color: "var(--color-text-secondary)",
          marginTop: "0.5rem",
          marginBottom: "2rem",
        }}
      >
        Responderemos en menos de 24 horas.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <Label required>Nombre completo</Label>
            <input
              type="text"
              required
              placeholder="Tu nombre"
              value={formState.nombre}
              onChange={(e) => setFormState({ ...formState, nombre: e.target.value })}
              onFocus={handleFocus}
              onBlur={handleBlur}
              style={inputStyle}
            />
          </div>
          <div>
            <Label required>Teléfono / WhatsApp</Label>
            <input
              type="tel"
              required
              placeholder="+57 300 000 0000"
              value={formState.telefono}
              onChange={(e) => setFormState({ ...formState, telefono: e.target.value })}
              onFocus={handleFocus}
              onBlur={handleBlur}
              style={inputStyle}
            />
          </div>
        </div>

        <div>
          <Label required>Correo electrónico</Label>
          <input
            type="email"
            required
            placeholder="tu@correo.com"
            value={formState.email}
            onChange={(e) => setFormState({ ...formState, email: e.target.value })}
            onFocus={handleFocus}
            onBlur={handleBlur}
            style={inputStyle}
          />
        </div>

        <div>
          <Label>Servicio de interés</Label>
          <select
            value={formState.servicio}
            onChange={(e) => setFormState({ ...formState, servicio: e.target.value })}
            onFocus={handleFocus}
            onBlur={handleBlur}
            style={inputStyle}
          >
            {SERVICIOS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label>Mensaje</Label>
          <textarea
            rows={4}
            placeholder="Cuéntanos qué tienes en mente..."
            value={formState.mensaje}
            onChange={(e) => setFormState({ ...formState, mensaje: e.target.value })}
            onFocus={handleFocus}
            onBlur={handleBlur}
            style={{ ...inputStyle, resize: "none", minHeight: "120px" }}
          />
        </div>

        {error && (
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-sm)",
              color: "var(--color-error)",
              textAlign: "center",
            }}
          >
            {error}
          </p>
        )}

        <Button type="submit" variant="accent" size="lg" className="w-full" disabled={loading}>
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 size={18} className="animate-spin" />
              Enviando...
            </span>
          ) : (
            "Enviar mensaje →"
          )}
        </Button>
      </form>
    </div>
  );
}
