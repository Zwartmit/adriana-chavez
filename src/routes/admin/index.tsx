import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getSession, signOut } from "@/lib/supabase/auth";

export const Route = createFileRoute("/admin/")({
  component: AdminPage,
});

function AdminPage() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    getSession().then((session) => {
      if (!session) navigate({ to: "/admin/login" });
      setChecking(false);
    });
  }, []);

  if (checking)
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "var(--color-bg)",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-display)",
            fontStyle: "italic",
            fontSize: "var(--text-xl)",
            color: "var(--color-text-muted)",
          }}
        >
          Verificando sesión...
        </p>
      </div>
    );

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--color-bg)", padding: "4rem 2rem", textAlign: "center" }}>
      <p
        style={{
          fontFamily: "var(--font-display)",
          fontStyle: "italic",
          fontSize: "var(--text-3xl)",
          color: "var(--color-primary)",
        }}
      >
        Panel de Administración — Brandon
      </p>
      <p style={{ fontFamily: "var(--font-body)", color: "var(--color-text-secondary)", marginTop: "1rem" }}>
        El panel completo se construirá en Antigravity.
      </p>
      <button
        onClick={() => signOut().then(() => navigate({ to: "/admin/login" }))}
        style={{
          marginTop: "2rem",
          padding: "10px 24px",
          backgroundColor: "var(--color-primary)",
          color: "var(--color-text-inverse)",
          border: "none",
          borderRadius: "var(--radius-full)",
          cursor: "pointer",
          fontFamily: "var(--font-body)",
          fontWeight: 600,
        }}
      >
        Cerrar sesión
      </button>
    </div>
  );
}
