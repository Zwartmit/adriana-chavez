import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { getSession } from "@/lib/supabase/auth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

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

  useEffect(() => {
    document.title = `${pageTitle} | Centro de Belleza Adriana Chávez`;
  }, [pageTitle]);

  const pathname = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => {
    if (window.innerWidth < 768) {
      setIsCollapsed(true);
    }
  }, [pathname]);

  const [fechas, setFechas] = useState(() => {
    const d = new Date();
    return {
      fecha: d.toLocaleDateString("es-CO", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      hora: d.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }),
    };
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const d = new Date();
      setFechas({
        fecha: d.toLocaleDateString("es-CO", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
        hora: d.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }),
      });
    }, 60000);
    return () => clearInterval(timer);
  }, []);

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
      {/* Overlay para móvil cuando el sidebar está expandido */}
      {!isCollapsed && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setIsCollapsed(true)}
          aria-hidden="true"
        />
      )}
      <AdminSidebar isCollapsed={isCollapsed} onToggleCollapsed={() => setIsCollapsed((c) => !c)} />
      <div
        className="ml-0 md:ml-[var(--sidebar-width)] transition-[margin] duration-250 ease"
        style={{
          "--sidebar-width": `${sidebarWidth}px`,
          minHeight: "100vh",
          backgroundColor: "var(--color-bg-light)",
        } as React.CSSProperties}
      >
        <header
          className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-4"
          style={{
            backgroundColor: "var(--color-surface-light)",
            borderBottom: "1px solid var(--color-border-light)",
            padding: "1.5rem",
          }}
        >
          <div className="flex items-center gap-3">
            <button
              className="md:hidden"
              onClick={() => setIsCollapsed(false)}
              style={{ background: "transparent", border: "none", color: "var(--color-text-on-light)", cursor: "pointer", padding: 0 }}
            >
              <Menu size={24} />
            </button>
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
          </div>
          <div
            className="capitalize flex flex-col items-start md:items-end"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--text-xs)",
              color: "var(--color-text-on-light-muted)",
            }}
          >
            <span>{fechas.fecha}</span>
            <span style={{ fontSize: "11px", opacity: 0.8 }}>{fechas.hora}</span>
          </div>
        </header>
        <div className="p-4 md:p-8 overflow-hidden w-full" style={{ maxWidth: "100%" }}>{children}</div>
      </div>
    </div>
  );
}
