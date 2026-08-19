import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { signIn } from "@/lib/supabase/auth";

export const Route = createFileRoute("/admin/login")({
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

    navigate({ to: "/admin" });
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
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
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
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            {loading ? "Iniciando sesión..." : "Iniciar sesión →"}
          </button>
        </form>
      </div>
    </div>
  );
}
