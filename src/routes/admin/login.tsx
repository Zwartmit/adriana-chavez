import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { signIn, resetPassword } from "@/lib/supabase/auth";

export const Route = createFileRoute("/admin/login")({
  component: AdminLoginPage,
  head: () => ({
    meta: [
      { title: "Iniciar sesión | Centro de Belleza Adriana Chávez" },
    ],
  }),
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isResetMode, setIsResetMode] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await signIn(email, password);

    if (error) {
      setError("Credenciales incorrectas. Verifica tu correo y contraseña.");
      setLoading(false);
      return;
    }

    // Guardar flag de sesión activa en la pestaña actual (sessionStorage)
    window.sessionStorage.setItem("admin_session_tab", "active");

    navigate({ to: "/admin" });
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Por favor ingresa tu correo electrónico.");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    const { error } = await resetPassword(email, `${window.location.origin}/admin/actualizar-password`);
    
    setLoading(false);
    
    if (error) {
      setError("Hubo un error al intentar enviar el correo. Por favor intenta más tarde.");
      return;
    }
    
    setSuccessMessage("Te hemos enviado un correo con un enlace para restablecer tu contraseña.");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--color-bg)",
        padding: "1.5rem",
      }}
    >
      <div
        style={{
          background: "linear-gradient(135deg, rgba(232,201,122,0.07) 0%, rgba(232,201,122,0.03) 100%)",
          border: "0.5px solid rgba(232,201,122,0.32)",
          boxShadow: "inset 0 1px 0 rgba(232,201,122,0.14), var(--shadow-lg)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderRadius: "var(--radius-2xl)",
          padding: "2.5rem",
          width: "100%",
          maxWidth: "400px",
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <p
            style={{
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontSize: "var(--text-2xl)",
              fontWeight: 600,
              color: "var(--color-primary)",
            }}
          >
            Adriana Chávez
          </p>
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--text-xs)",
              letterSpacing: "var(--tracking-widest)",
              textTransform: "uppercase",
              color: "var(--color-text-secondary)",
              marginTop: "0.25rem",
            }}
          >
            Panel de administración
          </p>
        </div>

        {/* Form */}
        <form onSubmit={isResetMode ? handleResetPassword : handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div>
            <label
              style={{
                fontFamily: "var(--font-body)",
                fontWeight: 600,
                fontSize: "var(--text-sm)",
                color: "var(--color-text-primary)",
                display: "block",
                marginBottom: "6px",
              }}
            >
              Correo electrónico
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 16px",
                backgroundColor: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-lg)",
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-base)",
                color: "var(--color-text-primary)",
                outline: "none",
                transition: "border-color var(--transition-base)",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-primary)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
            />
          </div>
          {!isResetMode && (
            <div>
              <label
                style={{
                  fontFamily: "var(--font-body)",
                  fontWeight: 600,
                  fontSize: "var(--text-sm)",
                  color: "var(--color-text-primary)",
                  display: "block",
                  marginBottom: "6px",
                }}
              >
                Contraseña
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 40px 12px 16px",
                    backgroundColor: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-lg)",
                    fontFamily: "var(--font-body)",
                    fontSize: "var(--text-base)",
                    color: "var(--color-text-primary)",
                    outline: "none",
                    transition: "border-color var(--transition-base)",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-primary)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--color-text-secondary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "4px"
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          )}

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

          {successMessage && (
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-sm)",
                color: "var(--color-success)",
                textAlign: "center",
                padding: "10px",
                backgroundColor: "rgba(76, 175, 128, 0.1)",
                borderRadius: "var(--radius-md)",
              }}
            >
              {successMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              marginTop: "0.5rem",
              backgroundColor: loading ? "var(--color-text-muted)" : "var(--color-primary)",
              color: "var(--color-text-inverse)",
              border: "none",
              borderRadius: "var(--radius-full)",
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "var(--font-body)",
              fontWeight: 600,
              fontSize: "var(--text-base)",
              letterSpacing: "var(--tracking-wide)",
              transition: "background-color var(--transition-base)",
              boxShadow: loading ? "none" : "var(--shadow-gold)",
            }}
          >
            {loading ? "Procesando..." : (isResetMode ? "Enviar enlace" : "Iniciar sesión →")}
          </button>
          
          <div style={{ textAlign: "center", marginTop: "0.5rem" }}>
            <button
              type="button"
              onClick={() => {
                setIsResetMode(!isResetMode);
                setError(null);
                setSuccessMessage(null);
              }}
              style={{
                background: "none",
                border: "none",
                color: "var(--color-primary)",
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-sm)",
                cursor: "pointer",
                textDecoration: "underline",
                textUnderlineOffset: "4px",
              }}
            >
              {isResetMode ? "Volver al inicio de sesión" : "¿Olvidaste tu contraseña?"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
