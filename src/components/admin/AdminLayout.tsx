import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { getSession } from "@/lib/supabase/auth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

const HOY = new Date();
const FECHA_HOY = HOY.toLocaleDateString("es-CO", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const SIDEBAR_COLLAPSED_KEY = "admin-sidebar-collapsed";
const SIDEBAR_WIDTH_EXPANDED = 240;
const SIDEBAR_WIDTH_COLLAPSED = 64;

interface AdminLayoutProps {
  pageTitle: string;
  children: ReactNode;
}

export function AdminLayout({ pageTitle, children }: AdminLayoutProps) {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true";
  });

  useEffect(() => {
    getSession().then((session) => {
      if (!session) {
        navigate({ to: "/admin/login" });
        return;
      }
      setChecking(false);
    });
  }, []);

  useEffect(() => {
    window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(isCollapsed));
  }, [isCollapsed]);

  if (checking) {
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
  }

  const sidebarWidth = isCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--color-bg-light)" }}>
      <AdminSidebar isCollapsed={isCollapsed} onToggleCollapsed={() => setIsCollapsed((c) => !c)} />
      <div
        style={{
          marginLeft: `${sidebarWidth}px`,
          minHeight: "100vh",
          backgroundColor: "var(--color-bg-light)",
          transition: "margin-left 250ms ease",
        }}
      >
        <header
          className="flex items-center justify-between"
          style={{
            backgroundColor: "var(--color-surface-light)",
            borderBottom: "1px solid var(--color-border-light)",
            padding: "1.5rem 2rem",
          }}
        >
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontWeight: 600,
              fontSize: "var(--text-2xl)",
              color: "var(--color-text-on-light)",
              textTransform: "capitalize",
            }}
          >
            {pageTitle}
          </h1>
          <span
            className="capitalize"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--text-sm)",
              color: "var(--color-text-on-light-faint)",
            }}
          >
            {FECHA_HOY}
          </span>
        </header>
        <div style={{ padding: "2rem" }}>{children}</div>
      </div>
    </div>
  );
}
