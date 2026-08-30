import { useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ComponentType } from "react";
import {
  ArrowLeft,
  BarChart3,
  Calendar,
  ChevronLeft,
  ChevronRight,
  LogOut,
  MessageSquare,
  Package,
  Users,
} from "lucide-react";
import { signOut } from "@/lib/supabase/auth";
import { supabase } from "@/lib/supabase/client";

const NAV_ITEMS = [
  { label: "Calendario", href: "/admin", icon: Calendar },
  { label: "Clientas", href: "/admin/clientes", icon: Users },
  { label: "Inventario", href: "/admin/inventario", icon: Package },
  { label: "Reportes", href: "/admin/reportes", icon: BarChart3 },
];

const COLOR_ACTIVE = "var(--color-primary)";
const COLOR_INACTIVE = "rgba(245,242,235,0.6)";
const COLOR_HOVER = "var(--color-text-primary)";

interface AdminSidebarProps {
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
}

interface SidebarLinkProps {
  href: string;
  label: string;
  icon: ComponentType<{ size?: number; style?: React.CSSProperties }>;
  active: boolean;
  isCollapsed: boolean;
  hovered: boolean;
  onHoverChange: (hovered: boolean) => void;
  badge?: number;
}

function SidebarBadge({ count, style }: { count: number; style?: React.CSSProperties }) {
  return (
    <span
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: "18px",
        height: "18px",
        padding: "0 4px",
        backgroundColor: "var(--color-accent)",
        color: "var(--color-text-inverse)",
        borderRadius: "50%",
        fontSize: "10px",
        fontWeight: 700,
        fontFamily: "var(--font-mono)",
        ...style,
      }}
    >
      {count > 9 ? "9+" : count}
    </span>
  );
}

function SidebarLink({ href, label, icon: Icon, active, isCollapsed, hovered, onHoverChange, badge }: SidebarLinkProps) {
  const color = active ? COLOR_ACTIVE : hovered ? COLOR_HOVER : COLOR_INACTIVE;
  const hasBadge = !!badge && badge > 0;

  return (
    <div style={{ position: "relative" }} onMouseEnter={() => onHoverChange(true)} onMouseLeave={() => onHoverChange(false)}>
      <a
        href={href}
        className={active ? "glass-champagne" : ""}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: isCollapsed ? "center" : "flex-start",
          gap: isCollapsed ? 0 : "0.75rem",
          padding: isCollapsed ? "0.75rem" : "0.75rem 1rem",
          width: "100%",
          borderRadius: "var(--radius-lg)",
          fontFamily: "var(--font-body)",
          fontWeight: 500,
          fontSize: "var(--text-sm)",
          color,
          textDecoration: "none",
          transition: "all 250ms ease",
          position: "relative",
        }}
      >
        <Icon size={22} style={{ color, flexShrink: 0 }} />
        <span
          style={{
            opacity: isCollapsed ? 0 : 1,
            width: isCollapsed ? 0 : "auto",
            overflow: "hidden",
            whiteSpace: "nowrap",
            transition: "opacity 200ms ease, width 200ms ease",
          }}
        >
          {label}
        </span>
        {hasBadge && !isCollapsed && <SidebarBadge count={badge!} style={{ marginLeft: "auto" }} />}
        {hasBadge && isCollapsed && (
          <SidebarBadge count={badge!} style={{ position: "absolute", top: 4, right: 4 }} />
        )}
      </a>
      {isCollapsed && hovered && (
        <span
          className="glass-obsidian"
          style={{
            position: "absolute",
            left: "calc(100% + 10px)",
            top: "50%",
            transform: "translateY(-50%)",
            padding: "6px 12px",
            borderRadius: "var(--radius-md)",
            backgroundColor: "var(--color-surface)",
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-sm)",
            color: "var(--color-text-primary)",
            whiteSpace: "nowrap",
            zIndex: 100,
            pointerEvents: "none",
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
}

export function AdminSidebar({ isCollapsed, onToggleCollapsed }: AdminSidebarProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [hoveredHref, setHoveredHref] = useState<string | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const handleConfirmSignOut = async () => {
    setSigningOut(true);
    await signOut();
    window.location.href = "/admin/login";
  };

  const toggleHovered = hoveredHref === "toggle";

  return (
    <>
      <aside
        className={`fixed top-0 left-0 bottom-0 z-40 flex flex-col transition-all duration-250 ease-in-out ${
          isCollapsed ? "-translate-x-full md:translate-x-0 w-[240px] md:w-[64px]" : "translate-x-0 w-[240px]"
        }`}
        style={{
          backgroundColor: "var(--color-bg-alt)",
          borderRight: "1px solid var(--color-border)",
          padding: "1.75rem 1rem",
        }}
      >
        {/* Logo */}
        <div style={{ padding: isCollapsed ? "0" : "0 0.5rem", marginBottom: "2.5rem", overflow: "hidden" }}>
          {isCollapsed ? (
            <p
              style={{
                fontFamily: "var(--font-display)",
                fontStyle: "italic",
                fontWeight: 600,
                fontSize: "var(--text-xl)",
                color: "var(--color-primary)",
                textAlign: "center",
              }}
            >
              AC
            </p>
          ) : (
            <>
              <p
                style={{
                  fontFamily: "var(--font-display)",
                  fontStyle: "italic",
                  fontWeight: 600,
                  fontSize: "var(--text-xl)",
                  color: "var(--color-primary)",
                  whiteSpace: "nowrap",
                }}
              >
                Adriana Chávez
              </p>
              <p
                className="uppercase"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--text-xs)",
                  letterSpacing: "var(--tracking-wider)",
                  color: "var(--color-text-muted)",
                  marginTop: "0.15rem",
                  whiteSpace: "nowrap",
                }}
              >
                Panel admin
              </p>
            </>
          )}
        </div>

        {/* Navegación */}
        <nav style={{ display: "flex", flexDirection: "column", gap: "0.25rem", flex: 1 }}>
          {NAV_ITEMS.map((item) => {
            const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
            return (
              <SidebarLink
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                active={active}
                isCollapsed={isCollapsed}
                hovered={hoveredHref === item.href}
                onHoverChange={(hovered) => setHoveredHref(hovered ? item.href : null)}
              />
            );
          })}

          <div style={{ borderTop: "1px solid var(--color-border)", margin: "0.75rem 0.25rem" }} />

          <SidebarLink
            href="/"
            label="Volver al sitio"
            icon={ArrowLeft}
            active={false}
            isCollapsed={isCollapsed}
            hovered={hoveredHref === "/"}
            onHoverChange={(hovered) => setHoveredHref(hovered ? "/" : null)}
          />

          <div style={{ borderTop: "1px solid var(--color-border)", margin: "0.75rem 0.25rem" }} />

          {/* Botón colapsar/expandir */}
          <div
            style={{ position: "relative" }}
            onMouseEnter={() => setHoveredHref("toggle")}
            onMouseLeave={() => setHoveredHref(null)}
          >
            <button
              type="button"
              aria-label={isCollapsed ? "Expandir menú" : "Contraer menú"}
              onClick={onToggleCollapsed}
              className={toggleHovered ? "glass-obsidian" : ""}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: isCollapsed ? "center" : "flex-start",
                gap: isCollapsed ? 0 : "0.75rem",
                padding: isCollapsed ? "0.75rem" : "0.75rem 1rem",
                width: "100%",
                minWidth: 36,
                minHeight: 36,
                borderRadius: "var(--radius-lg)",
                border: "none",
                background: toggleHovered ? undefined : "transparent",
                fontFamily: "var(--font-body)",
                fontWeight: 500,
                fontSize: "var(--text-sm)",
                color: "var(--color-primary)",
                cursor: "pointer",
                transition: "all 250ms ease",
              }}
            >
              {isCollapsed ? (
                <ChevronRight size={22} style={{ color: "var(--color-primary)", flexShrink: 0 }} />
              ) : (
                <ChevronLeft size={22} style={{ color: "var(--color-primary)", flexShrink: 0 }} />
              )}
              <span
                style={{
                  opacity: isCollapsed ? 0 : 1,
                  width: isCollapsed ? 0 : "auto",
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  transition: "opacity 200ms ease, width 200ms ease",
                }}
              >
                Contraer menú
              </span>
            </button>
            {isCollapsed && toggleHovered && (
              <span
                className="glass-obsidian"
                style={{
                  position: "absolute",
                  left: "calc(100% + 10px)",
                  top: "50%",
                  transform: "translateY(-50%)",
                  padding: "6px 12px",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "var(--color-surface)",
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--text-sm)",
                  color: "var(--color-text-primary)",
                  whiteSpace: "nowrap",
                  zIndex: 100,
                  pointerEvents: "none",
                }}
              >
                Expandir menú
              </span>
            )}
          </div>
        </nav>

        {/* Cerrar sesión */}
        <div
          style={{ position: "relative" }}
          onMouseEnter={() => setHoveredHref("logout")}
          onMouseLeave={() => setHoveredHref(null)}
        >
          <button
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: isCollapsed ? "center" : "flex-start",
              gap: isCollapsed ? 0 : "0.75rem",
              width: "100%",
              padding: isCollapsed ? "0.75rem" : "0.75rem 1rem",
              marginTop: "0.75rem",
              paddingTop: "1.25rem",
              background: "transparent",
              border: "none",
              borderTop: "1px solid var(--color-border)",
              fontFamily: "var(--font-body)",
              fontWeight: 500,
              fontSize: "var(--text-sm)",
              color: hoveredHref === "logout" ? "var(--color-error)" : "var(--color-text-secondary)",
              cursor: "pointer",
              transition: "all 250ms ease",
              textAlign: "left",
            }}
          >
            <LogOut
              size={22}
              style={{
                color: hoveredHref === "logout" ? "var(--color-error)" : "rgba(245,242,235,0.6)",
                flexShrink: 0,
              }}
            />
            <span
              style={{
                opacity: isCollapsed ? 0 : 1,
                width: isCollapsed ? 0 : "auto",
                overflow: "hidden",
                whiteSpace: "nowrap",
                transition: "opacity 200ms ease, width 200ms ease",
              }}
            >
              Cerrar sesión
            </span>
          </button>
          {isCollapsed && hoveredHref === "logout" && (
            <span
              className="glass-obsidian"
              style={{
                position: "absolute",
                left: "calc(100% + 10px)",
                bottom: 10,
                padding: "6px 12px",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--color-surface)",
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-sm)",
                color: "var(--color-text-primary)",
                whiteSpace: "nowrap",
                zIndex: 100,
                pointerEvents: "none",
              }}
            >
              Cerrar sesión
            </span>
          )}
        </div>
      </aside>

      {/* Modal de confirmación de cierre de sesión */}
      {showLogoutConfirm && (
        <div
          onClick={() => !signingOut && setShowLogoutConfirm(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 90,
            backgroundColor: "rgba(0,0,0,0.65)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.5rem",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="glass-frosted"
            style={{
              width: "100%",
              maxWidth: "380px",
              borderRadius: "var(--radius-2xl)",
              padding: "2rem",
              textAlign: "center",
            }}
          >
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontStyle: "italic",
                fontWeight: 600,
                fontSize: "var(--text-2xl)",
                color: "var(--color-text-primary)",
                marginBottom: "0.75rem",
              }}
            >
              Cerrar sesión
            </h2>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-sm)",
                color: "var(--color-text-secondary)",
                marginBottom: "1.75rem",
              }}
            >
              ¿Deseas cerrar sesión?
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                disabled={signingOut}
                onClick={() => setShowLogoutConfirm(false)}
                style={{
                  padding: "10px 24px",
                  borderRadius: "var(--radius-full)",
                  border: "2px solid var(--color-primary-dim)",
                  backgroundColor: "transparent",
                  color: "var(--color-primary)",
                  fontFamily: "var(--font-body)",
                  fontWeight: 600,
                  fontSize: "var(--text-sm)",
                  cursor: signingOut ? "not-allowed" : "pointer",
                  opacity: signingOut ? 0.5 : 1,
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={signingOut}
                onClick={handleConfirmSignOut}
                style={{
                  padding: "10px 24px",
                  borderRadius: "var(--radius-full)",
                  border: "none",
                  backgroundColor: "var(--color-primary)",
                  color: "var(--color-text-inverse)",
                  fontFamily: "var(--font-body)",
                  fontWeight: 600,
                  fontSize: "var(--text-sm)",
                  cursor: signingOut ? "not-allowed" : "pointer",
                  opacity: signingOut ? 0.7 : 1,
                }}
              >
                {signingOut ? "Cerrando..." : "Cerrar sesión"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
