import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Mail, MessageCircle, MessageSquare, Phone, X } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminToast, type ToastState } from "@/components/admin/AdminToast";
import { Button } from "@/components/ui/Button";
import { LoadingState, ErrorState } from "@/components/ui/QueryState";
import { supabase } from "@/lib/supabase/client";

export const Route = createFileRoute("/admin/mensajes/" as any)({
  component: MensajesPage,
});

interface MensajeUI {
  id: string;
  nombre: string;
  telefono: string;
  email: string | null;
  servicio: string | null;
  mensaje: string;
  leido: boolean;
  createdAt: Date;
}

const th: React.CSSProperties = {
  textAlign: "left",
  padding: "12px 16px",
  fontFamily: "var(--font-mono)",
  fontSize: "var(--text-xs)",
  textTransform: "uppercase",
  letterSpacing: "var(--tracking-wider)",
  color: "var(--color-primary)",
  whiteSpace: "nowrap",
};

function truncar(texto: string, max: number) {
  return texto.length > max ? `${texto.slice(0, max)}…` : texto;
}

function MensajesPage() {
  const [mensajes, setMensajes] = useState<MensajeUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seleccionado, setSeleccionado] = useState<MensajeUI | null>(null);
  const [marcandoTodo, setMarcandoTodo] = useState(false);

  const [toast, setToast] = useState<ToastState | null>(null);
  const showToast = (message: string, type: ToastState["type"] = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2000);
  };

  const fetchMensajes = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("mensajes_contacto")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[MensajesPage] error al cargar mensajes:", error.message);
      setError("No se pudieron cargar los mensajes. Intenta de nuevo más tarde.");
      setLoading(false);
      return;
    }

    setMensajes(
      data.map((m) => ({
        id: m.id,
        nombre: m.nombre,
        telefono: m.telefono,
        email: m.email,
        servicio: m.servicio,
        mensaje: m.mensaje,
        leido: m.leido,
        createdAt: new Date(m.created_at),
      })),
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMensajes();
  }, [fetchMensajes]);

  const sinLeer = mensajes.filter((m) => !m.leido).length;

  const handleAbrirMensaje = async (m: MensajeUI) => {
    setSeleccionado(m);
    if (m.leido) return;

    const { error } = await supabase.from("mensajes_contacto").update({ leido: true }).eq("id", m.id);
    if (error) {
      console.error("[MensajesPage] error al marcar como leído:", error.message);
      return;
    }
    setMensajes((prev) => prev.map((x) => (x.id === m.id ? { ...x, leido: true } : x)));
    window.dispatchEvent(new Event("mensajes:actualizado"));
  };

  const handleMarcarTodoLeido = async () => {
    setMarcandoTodo(true);
    const { error } = await supabase.from("mensajes_contacto").update({ leido: true }).eq("leido", false);
    setMarcandoTodo(false);

    if (error) {
      console.error("[MensajesPage] error al marcar todo como leído:", error.message);
      showToast("No se pudo marcar todo como leído.", "error");
      return;
    }

    setMensajes((prev) => prev.map((m) => ({ ...m, leido: true })));
    window.dispatchEvent(new Event("mensajes:actualizado"));
    showToast("Todos los mensajes fueron marcados como leídos");
  };

  return (
    <AdminLayout pageTitle="Mensajes">
      <div className="flex items-center justify-between flex-wrap gap-3" style={{ marginBottom: "1.5rem" }}>
        <div>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontWeight: 600,
              fontSize: "var(--text-2xl)",
              color: "var(--color-text-on-light)",
            }}
          >
            Mensajes
          </h2>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)", color: "var(--color-text-on-light-faint)", marginTop: "0.25rem" }}>
            {sinLeer} {sinLeer === 1 ? "mensaje sin leer" : "mensajes sin leer"}
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          disabled={marcandoTodo || sinLeer === 0}
          onClick={handleMarcarTodoLeido}
          style={{ borderColor: "var(--color-primary-dim)", color: "var(--color-primary-dim)" }}
        >
          {marcandoTodo ? "Marcando..." : "Marcar todo como leído"}
        </Button>
      </div>

      {loading ? (
        <LoadingState variant="light" />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchMensajes} variant="light" />
      ) : (
        <div style={{ borderRadius: "var(--radius-xl)", overflow: "hidden", border: "1px solid var(--color-border-light)", backgroundColor: "var(--color-surface-light)" }}>
          <table className="w-full" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#0A0A0B" }}>
                <th style={th} />
                <th style={th}>Fecha</th>
                <th style={th}>Nombre</th>
                <th style={th}>Teléfono</th>
                <th style={th}>Email</th>
                <th style={th}>Servicio</th>
                <th style={th}>Mensaje</th>
                <th style={th}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {mensajes.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="flex flex-col items-center gap-3" style={{ padding: "4rem 0" }}>
                      <MessageSquare size={40} color="var(--color-text-on-light-faint)" />
                      <p style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: "var(--text-xl)", color: "var(--color-text-on-light-faint)" }}>
                        Aún no hay mensajes recibidos
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                mensajes.map((m, i) => (
                  <tr
                    key={m.id}
                    onClick={() => handleAbrirMensaje(m)}
                    style={{
                      backgroundColor: i % 2 === 0 ? "var(--color-surface-light)" : "var(--color-bg-light)",
                      cursor: "pointer",
                      opacity: m.leido ? 0.65 : 1,
                      transition: "background-color var(--transition-fast)",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-bg-light-alt)")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = i % 2 === 0 ? "var(--color-surface-light)" : "var(--color-bg-light)")}
                  >
                    <td style={{ padding: "12px 0 12px 16px", width: 20 }}>
                      {!m.leido && (
                        <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", backgroundColor: "var(--color-primary-dim)" }} />
                      )}
                    </td>
                    <td style={{ padding: "12px 16px", fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", color: "var(--color-text-on-light-faint)", whiteSpace: "nowrap" }}>
                      {m.createdAt.toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td
                      style={{
                        padding: "12px 16px",
                        fontFamily: "var(--font-body)",
                        fontWeight: m.leido ? 400 : 600,
                        fontSize: "var(--text-sm)",
                        color: "var(--color-text-on-light)",
                      }}
                    >
                      {m.nombre}
                    </td>
                    <td style={{ padding: "12px 16px", fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--color-text-on-light-muted)" }}>
                      {m.telefono}
                    </td>
                    <td style={{ padding: "12px 16px", fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--color-text-on-light-muted)" }}>
                      {m.email ?? "—"}
                    </td>
                    <td style={{ padding: "12px 16px", fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--color-text-on-light-muted)" }}>
                      {m.servicio ?? "—"}
                    </td>
                    <td style={{ padding: "12px 16px", fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--color-text-on-light-muted)", maxWidth: 260 }}>
                      {truncar(m.mensaje, 60)}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span
                        style={{
                          backgroundColor: m.leido ? "rgba(10,10,11,0.06)" : "rgba(200,168,74,0.15)",
                          color: m.leido ? "var(--color-text-on-light-faint)" : "var(--color-primary-dim)",
                          fontFamily: "var(--font-mono)",
                          fontSize: "var(--text-xs)",
                          textTransform: "uppercase",
                          letterSpacing: "var(--tracking-wider)",
                          padding: "3px 10px",
                          borderRadius: "var(--radius-full)",
                        }}
                      >
                        {m.leido ? "Leído" : "Nuevo"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {seleccionado && (
        <div
          onClick={() => setSeleccionado(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 75,
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
              maxWidth: "480px",
              borderRadius: "var(--radius-2xl)",
              padding: "2rem",
              position: "relative",
            }}
          >
            <button
              type="button"
              aria-label="Cerrar"
              onClick={() => setSeleccionado(null)}
              style={{ position: "absolute", top: "1.25rem", right: "1.25rem", color: "var(--color-text-muted)" }}
            >
              <X size={20} />
            </button>

            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontStyle: "italic",
                fontWeight: 600,
                fontSize: "var(--text-2xl)",
                color: "var(--color-text-primary)",
                marginBottom: "1.5rem",
                paddingRight: "1.5rem",
              }}
            >
              {seleccionado.nombre}
            </h2>

            <div className="flex flex-col gap-3" style={{ marginBottom: "1.5rem" }}>
              <div className="flex justify-between gap-4">
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", textTransform: "uppercase", color: "var(--color-text-muted)" }}>
                  Teléfono
                </span>
                <span style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--color-text-primary)" }}>
                  {seleccionado.telefono}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", textTransform: "uppercase", color: "var(--color-text-muted)" }}>
                  Email
                </span>
                <span style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--color-text-primary)" }}>
                  {seleccionado.email ?? "—"}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", textTransform: "uppercase", color: "var(--color-text-muted)" }}>
                  Servicio
                </span>
                <span style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--color-text-primary)" }}>
                  {seleccionado.servicio ?? "—"}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", textTransform: "uppercase", color: "var(--color-text-muted)" }}>
                  Recibido
                </span>
                <span style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--color-text-primary)" }}>
                  {seleccionado.createdAt.toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })}
                  {" · "}
                  {seleccionado.createdAt.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", hour12: true })}
                </span>
              </div>

              <div style={{ borderTop: "1px solid var(--color-border)", margin: "0.25rem 0" }} />

              <div>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", textTransform: "uppercase", color: "var(--color-text-muted)" }}>
                  Mensaje
                </span>
                <p
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "var(--text-sm)",
                    color: "var(--color-text-on-light-muted)",
                    lineHeight: "var(--leading-relaxed)",
                    marginTop: "0.4rem",
                  }}
                >
                  {seleccionado.mensaje}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <a href={`tel:${seleccionado.telefono}`}>
                <Button variant="secondary" size="sm">
                  <Phone size={14} style={{ marginRight: 6 }} />
                  Llamar
                </Button>
              </a>
              <a
                href={`https://wa.me/57${seleccionado.telefono.replace(/\D/g, "")}`}
                target="_blank"
                rel="noreferrer"
              >
                <Button variant="accent" size="sm">
                  <MessageCircle size={14} style={{ marginRight: 6 }} />
                  WhatsApp
                </Button>
              </a>
              {seleccionado.email && (
                <a href={`mailto:${seleccionado.email}`}>
                  <Button variant="ghost" size="sm">
                    <Mail size={14} style={{ marginRight: 6 }} />
                    Responder por email
                  </Button>
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      <AdminToast toast={toast} />
    </AdminLayout>
  );
}
