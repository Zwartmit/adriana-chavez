import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminToast, type ToastState } from "@/components/admin/AdminToast";
import { ConfirmModal } from "@/components/admin/ConfirmModal";
import { InlineEditField } from "@/components/admin/clientes/InlineEditField";
import { LoadingState, ErrorState } from "@/components/ui/QueryState";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase/client";
import type { EstadoCita } from "@/lib/supabase/types";
import { formatPrice, estadoLabel } from "@/lib/utils";

export const Route = createFileRoute("/admin/clientes/$clienteId")({
  component: ClienteDetallePage,
});

interface ClienteRow {
  id: string;
  nombre: string;
  apellido: string | null;
  email: string | null;
  telefono: string | null;
  fecha_nacimiento: string | null;
  notas: string | null;
  alergias: string | null;
  preferencias: string | null;
  profesional_preferido_id: string | null;
  activo: boolean;
  profesionales: { nombre: string } | null;
}

interface ProfesionalOption {
  id: string;
  nombre: string;
}

interface CitaHistUI {
  id: string;
  fechaHora: Date;
  estado: EstadoCita;
  servicioNombre: string;
  profesionalNombre: string;
  precioCobrado: number | null;
}

interface CitaRow {
  id: string;
  fecha_hora: string;
  estado: EstadoCita;
  precio_cobrado: number | null;
  servicios: { nombre: string } | null;
  profesionales: { nombre: string } | null;
}

const ESTADO_STYLES: Record<EstadoCita, { label: string; bg: string; color: string }> = {
  pendiente: { label: "Pendiente", bg: "rgba(212,168,75,0.15)", color: "var(--color-warning)" },
  confirmada: { label: "Confirmada", bg: "var(--color-accent-lt)", color: "var(--color-primary)" },
  en_proceso: { label: "En proceso", bg: "rgba(232,201,122,0.15)", color: "var(--color-primary)" },
  completada: { label: "Completada", bg: "rgba(76,175,128,0.15)", color: "var(--color-success)" },
  cancelada: { label: "Cancelada", bg: "rgba(224,82,82,0.15)", color: "var(--color-error)" },
  no_asistio: { label: "No asistió", bg: "rgba(10,10,11,0.08)", color: "var(--color-text-on-light-faint)" },
};

function EstadoBadge({ estado }: { estado: EstadoCita }) {
  const s = ESTADO_STYLES[estado];
  return (
    <span
      style={{
        backgroundColor: s.bg,
        color: s.color,
        fontFamily: "var(--font-mono)",
        fontSize: "var(--text-xs)",
        textTransform: "uppercase",
        letterSpacing: "var(--tracking-wider)",
        padding: "3px 10px",
        borderRadius: "var(--radius-full)",
        whiteSpace: "nowrap",
      }}
    >
      {estadoLabel(estado)}
    </span>
  );
}

const cardStyle: React.CSSProperties = {
  borderRadius: "var(--radius-2xl)",
};

function ClienteDetallePage() {
  const { clienteId } = Route.useParams();
  const navigate = useNavigate();

  const [cliente, setCliente] = useState<ClienteRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [profesionales, setProfesionals] = useState<ProfesionalOption[]>([]);

  const [citas, setCitas] = useState<CitaHistUI[]>([]);
  const [citasLoading, setCitasLoading] = useState(true);

  const [filtroEstado, setFiltroEstado] = useState<"todas" | "completada" | "cancelada" | "no_asistio">("todas");
  const [busqueda, setBusqueda] = useState("");
  const [verTodoHistorial, setVerTodoHistorial] = useState(false);

  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [profesionalPreferidoId, setProfesionalPreferidoId] = useState("");
  const [savingDatos, setSavingDatos] = useState(false);

  const [notas, setNotas] = useState("");
  const [alergias, setAlergias] = useState("");
  const [preferencias, setPreferencias] = useState("");
  const [savingFicha, setSavingFicha] = useState(false);

  const [showDesactivarConfirm, setShowDesactivarConfirm] = useState(false);
  const [desactivando, setDesactivando] = useState(false);

  const [toast, setToast] = useState<ToastState | null>(null);
  const showToast = (message: string, type: ToastState["type"] = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2000);
  };

  const fetchCliente = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("clientes")
      .select("*, profesionales(nombre)")
      .eq("id", clienteId)
      .single();

    if (error) {
      console.error("[ClienteDetalle] error al cargar cliente:", error.message);
      setError(error.message);
      setLoading(false);
      return;
    }

    const row = data as unknown as ClienteRow;
    setCliente(row);
    setEmail(row.email ?? "");
    setTelefono(row.telefono ?? "");
    setFechaNacimiento(row.fecha_nacimiento ?? "");
    setProfesionalPreferidoId(row.profesional_preferido_id ?? "");
    setNotas(row.notas ?? "");
    setAlergias(row.alergias ?? "");
    setPreferencias(row.preferencias ?? "");
    setLoading(false);
  }, [clienteId]);

  const fetchCitas = useCallback(async () => {
    setCitasLoading(true);
    const { data, error } = await supabase
      .from("citas")
      .select("id, fecha_hora, estado, precio_cobrado, servicios(nombre), profesionales(nombre)")
      .eq("cliente_id", clienteId)
      .order("fecha_hora", { ascending: false });

    if (error) {
      console.error("[ClienteDetalle] error al cargar citas:", error.message);
      setCitasLoading(false);
      return;
    }

    const mapped: CitaHistUI[] = (data as unknown as CitaRow[]).map((c) => ({
      id: c.id,
      fechaHora: new Date(c.fecha_hora),
      estado: c.estado,
      servicioNombre: c.servicios?.nombre ?? "Servicio",
      profesionalNombre: c.profesionales?.nombre ?? "Sin asignar",
      precioCobrado: c.precio_cobrado,
    }));
    setCitas(mapped);
    setCitasLoading(false);
  }, [clienteId]);

  useEffect(() => {
    fetchCliente();
    fetchCitas();
    supabase
      .from("profesionales")
      .select("id, nombre")
      .eq("activo", true)
      .order("orden", { ascending: true })
      .then(({ data }) => setProfesionals(data ?? []));
  }, [fetchCliente, fetchCitas]);

  const handleGuardarDatos = async () => {
    setSavingDatos(true);
    const { error } = await supabase
      .from("clientes")
      .update({
        email: email.trim() || null,
        telefono: telefono.trim() || null,
        fecha_nacimiento: fechaNacimiento || null,
        profesional_preferido_id: profesionalPreferidoId || null,
      })
      .eq("id", clienteId);
    setSavingDatos(false);

    if (error) {
      console.error("[ClienteDetalle] error al guardar datos:", error.message);
      showToast("No se pudieron guardar los cambios.", "error");
      return;
    }

    fetchCliente();
    showToast("Cambios guardados correctamente");
  };

  const handleGuardarFicha = async () => {
    setSavingFicha(true);
    const { error } = await supabase
      .from("clientes")
      .update({
        notas: notas.trim() || null,
        alergias: alergias.trim() || null,
        preferencias: preferencias.trim() || null,
      })
      .eq("id", clienteId);
    setSavingFicha(false);

    if (error) {
      console.error("[ClienteDetalle] error al guardar ficha:", error.message);
      showToast("No se pudo guardar la ficha clínica.", "error");
      return;
    }

    showToast("Ficha clínica guardada correctamente");
  };

  const handleDesactivar = async () => {
    setDesactivando(true);
    const { error } = await supabase.from("clientes").update({ activo: false }).eq("id", clienteId);
    setDesactivando(false);
    setShowDesactivarConfirm(false);

    if (error) {
      console.error("[ClienteDetalle] error al desactivar:", error.message);
      showToast("No se pudo desactivar la clienta.", "error");
      return;
    }

    fetchCliente();
    showToast("Clienta desactivada");
  };

  const proximas = citas
    .filter((c) => c.estado === "pendiente" || c.estado === "confirmada" || c.estado === "en_proceso")
    .sort((a, b) => a.fechaHora.getTime() - b.fechaHora.getTime());

  const historialBase = citas.filter((c) => c.estado === "completada" || c.estado === "cancelada" || c.estado === "no_asistio");

  const normalizeStr = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const historialFiltrado = historialBase
    .filter((c) => filtroEstado === "todas" || c.estado === filtroEstado)
    .filter((c) => {
      if (!busqueda.trim()) return true;
      const q = normalizeStr(busqueda);
      return normalizeStr(c.servicioNombre).includes(q) || normalizeStr(c.profesionalNombre).includes(q);
    })
    .sort((a, b) => b.fechaHora.getTime() - a.fechaHora.getTime());

  const historialVisible = verTodoHistorial ? historialFiltrado : historialFiltrado.slice(0, 10);
  const historialTotal = historialFiltrado.reduce((sum, c) => sum + (c.estado === "completada" ? (c.precioCobrado ?? 0) : 0), 0);

  return (
    <AdminLayout pageTitle="Ficha de clienta">
      <button
        type="button"
        onClick={() => navigate({ to: "/admin/clientes" })}
        style={{
          background: "transparent",
          border: "none",
          cursor: "pointer",
          fontFamily: "var(--font-mono)",
          fontSize: "var(--text-sm)",
          color: "var(--color-text-on-light-faint)",
          marginBottom: "1.5rem",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-primary-dim)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-on-light-faint)")}
      >
        ← Volver a clientas
      </button>

      {loading ? (
        <LoadingState variant="light" />
      ) : error || !cliente ? (
        <ErrorState message={error ?? "Clienta no encontrada."} onRetry={fetchCliente} variant="light" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Columna izquierda — datos */}
          <div className="flex flex-col gap-6">
            <div
              className="p-5 md:p-7"
              style={{
                ...cardStyle,
                backgroundColor: "var(--color-surface-light)",
                border: "1px solid var(--color-border-light)",
                boxShadow: "0 2px 12px rgba(10,10,11,0.08)",
              }}
            >
              <div className="flex items-center gap-3" style={{ marginBottom: "1.5rem" }}>
                <h2
                  style={{
                    fontFamily: "var(--font-display)",
                    fontStyle: "italic",
                    fontWeight: 600,
                    fontSize: "var(--text-2xl)",
                    color: "var(--color-text-on-light)",
                  }}
                >
                  {cliente.nombre} {cliente.apellido ?? ""}
                </h2>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "var(--text-xs)",
                    textTransform: "uppercase",
                    letterSpacing: "var(--tracking-wider)",
                    padding: "3px 10px",
                    borderRadius: "var(--radius-full)",
                    color: cliente.activo ? "var(--color-primary-dim)" : "var(--color-text-on-light-faint)",
                    backgroundColor: cliente.activo ? "rgba(200,168,74,0.15)" : "rgba(10,10,11,0.06)",
                  }}
                >
                  {cliente.activo ? "Activa" : "Inactiva"}
                </span>
              </div>

              <div className="flex flex-col gap-4">
                <InlineEditField label="Email" value={email} onChange={setEmail} type="email" placeholder="Sin email" />
                <InlineEditField label="Teléfono" value={telefono} onChange={setTelefono} type="tel" placeholder="Sin teléfono" />
                <InlineEditField
                  label="Fecha de nacimiento"
                  value={fechaNacimiento}
                  onChange={setFechaNacimiento}
                  type="date"
                  displayValue={
                    fechaNacimiento
                      ? new Date(fechaNacimiento + "T00:00:00").toLocaleDateString("es-CO", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                      : "—"
                  }
                />
                <InlineEditField
                  label="Profesional preferida"
                  value={profesionalPreferidoId}
                  onChange={setProfesionalPreferidoId}
                  options={profesionales.map((e) => ({ value: e.id, label: e.nombre }))}
                  displayValue={profesionales.find((e) => e.id === profesionalPreferidoId)?.nombre ?? "Sin preferencia"}
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4" style={{ marginTop: "1.75rem" }}>
                <Button className="w-full sm:w-auto" variant="accent" size="sm" disabled={savingDatos} onClick={handleGuardarDatos}>
                  {savingDatos ? "Guardando..." : "Guardar cambios"}
                </Button>
                {cliente.activo && (
                  <Button
                    className="w-full sm:w-auto !text-[var(--color-error)] hover:!bg-[var(--color-error)] hover:!text-white hover:!border-[var(--color-error)]"
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowDesactivarConfirm(true)}
                    style={{ borderColor: "rgba(224,82,82,0.3)" }}
                  >
                    Desactivar clienta
                  </Button>
                )}
              </div>
            </div>

            <div
              className="p-5 md:p-7"
              style={{
                ...cardStyle,
                backgroundColor: "var(--color-surface-light)",
                border: "1px solid var(--color-border-light-gold)",
                boxShadow: "0 2px 12px rgba(10,10,11,0.08)",
              }}
            >
              <p
                className="uppercase"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--text-xs)",
                  letterSpacing: "var(--tracking-wider)",
                  color: "var(--color-primary-dim)",
                  marginBottom: "1.25rem",
                }}
              >
                Ficha clínica
              </p>

              <div className="flex flex-col gap-4">
                {[
                  { label: "Notas generales", value: notas, onChange: setNotas },
                  { label: "Alergias o sensibilidades", value: alergias, onChange: setAlergias },
                  { label: "Preferencias de productos o técnicas", value: preferencias, onChange: setPreferencias },
                ].map((f) => (
                  <div key={f.label}>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "6px",
                        fontFamily: "var(--font-body)",
                        fontWeight: 600,
                        fontSize: "var(--text-sm)",
                        color: "var(--color-text-on-light)",
                      }}
                    >
                      {f.label}
                    </label>
                    <textarea
                      value={f.value}
                      onChange={(e) => f.onChange(e.target.value)}
                      rows={3}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        backgroundColor: "var(--color-bg-light)",
                        border: "1px solid var(--color-border-light)",
                        borderRadius: "var(--radius-lg)",
                        fontFamily: "var(--font-body)",
                        fontSize: "var(--text-sm)",
                        color: "var(--color-text-on-light)",
                        outline: "none",
                        resize: "vertical",
                      }}
                    />
                  </div>
                ))}
              </div>

              <Button className="w-full sm:w-auto" variant="accent" size="sm" disabled={savingFicha} onClick={handleGuardarFicha} style={{ marginTop: "1.5rem" }}>
                {savingFicha ? "Guardando..." : "Guardar ficha"}
              </Button>
            </div>
          </div>

          {/* Columna derecha — historial */}
          <div className="flex flex-col gap-6">
            <div className="p-5 md:p-7" style={{ ...cardStyle, backgroundColor: "var(--color-surface-light)", border: "1px solid var(--color-border-light)", boxShadow: "0 2px 12px rgba(10,10,11,0.08)" }}>
              <h3
                style={{
                  fontFamily: "var(--font-display)",
                  fontStyle: "italic",
                  fontWeight: 600,
                  fontSize: "var(--text-xl)",
                  color: "var(--color-text-on-light)",
                  marginBottom: "1.25rem",
                }}
              >
                Próximas citas
              </h3>

              {citasLoading ? (
                <LoadingState variant="light" />
              ) : proximas.length === 0 ? (
                <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--color-text-on-light-faint)" }}>
                  No hay citas próximas
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {proximas.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between gap-3"
                      style={{
                        padding: "0.85rem 1rem",
                        backgroundColor: "var(--color-bg-light)",
                        borderRadius: "var(--radius-lg)",
                      }}
                    >
                      <div>
                        <p style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)", color: "var(--color-primary-dim)" }}>
                          {c.fechaHora.toLocaleDateString("es-CO", { day: "numeric", month: "short" })}
                          {" · "}
                          {c.fechaHora.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", hour12: true })}
                        </p>
                        <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--color-text-on-light)" }}>
                          {c.servicioNombre}
                        </p>
                        <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", color: "var(--color-text-on-light-faint)" }}>
                          {c.profesionalNombre}
                        </p>
                      </div>
                      <EstadoBadge estado={c.estado} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-5 md:p-7" style={{ ...cardStyle, backgroundColor: "var(--color-surface-light)", border: "1px solid var(--color-border-light)", boxShadow: "0 2px 12px rgba(10,10,11,0.08)" }}>
              <h3
                style={{
                  fontFamily: "var(--font-display)",
                  fontStyle: "italic",
                  fontWeight: 600,
                  fontSize: "var(--text-xl)",
                  color: "var(--color-text-on-light)",
                  marginBottom: "1.25rem",
                }}
              >
                Historial de citas
              </h3>

              {citasLoading ? (
                <LoadingState variant="light" />
              ) : historialBase.length === 0 ? (
                <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--color-text-on-light-faint)" }}>
                  Sin historial de citas
                </p>
              ) : (
                <>
                  <div className="flex flex-col sm:flex-row gap-3 mb-4">
                    <select
                      value={filtroEstado}
                      onChange={(e) => {
                        setFiltroEstado(e.target.value as any);
                        setVerTodoHistorial(false);
                      }}
                      style={{
                        padding: "0.5rem",
                        borderRadius: "var(--radius-md)",
                        border: "1px solid var(--color-border-light)",
                        backgroundColor: "var(--color-surface-light)",
                        fontFamily: "var(--font-body)",
                        fontSize: "var(--text-sm)",
                        color: "var(--color-text-on-light)",
                        outline: "none",
                      }}
                    >
                      <option value="todas">Todas</option>
                      <option value="completada">{estadoLabel("completada")}</option>
                      <option value="cancelada">{estadoLabel("cancelada")}</option>
                      <option value="no_asistio">{estadoLabel("no_asistio")}</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Buscar por servicio o profesional"
                      value={busqueda}
                      onChange={(e) => {
                        setBusqueda(e.target.value);
                        setVerTodoHistorial(false);
                      }}
                      style={{
                        flex: 1,
                        padding: "0.5rem 0.75rem",
                        borderRadius: "var(--radius-md)",
                        border: "1px solid var(--color-border-light)",
                        backgroundColor: "var(--color-surface-light)",
                        fontFamily: "var(--font-body)",
                        fontSize: "var(--text-sm)",
                        color: "var(--color-text-on-light)",
                        outline: "none",
                      }}
                    />
                  </div>

                  {historialFiltrado.length === 0 ? (
                    <div className="text-center py-4">
                      <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--color-text-on-light-faint)", marginBottom: "0.75rem" }}>
                        Ninguna cita coincide con tu búsqueda
                      </p>
                      <Button variant="secondary" size="sm" onClick={() => { setFiltroEstado("todas"); setBusqueda(""); setVerTodoHistorial(false); }}>
                        Limpiar filtros
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col gap-3">
                        {historialVisible.map((c) => (
                          <div
                            key={c.id}
                            className="flex items-center justify-between gap-3"
                            style={{
                              padding: "0.85rem 1rem",
                              backgroundColor: "var(--color-bg-light)",
                              borderRadius: "var(--radius-lg)",
                            }}
                          >
                            <div>
                              <p style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", color: "var(--color-text-on-light-faint)" }}>
                                {c.fechaHora.toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })}
                              </p>
                              <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--color-text-on-light)" }}>
                                {c.servicioNombre}
                              </p>
                              <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", color: "var(--color-text-on-light-faint)" }}>
                                {c.profesionalNombre}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <EstadoBadge estado={c.estado} />
                              <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)", color: "var(--color-text-on-light-muted)" }}>
                                {c.precioCobrado ? formatPrice(c.precioCobrado) : "—"}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {historialFiltrado.length > 10 && (
                        <div className="flex justify-center mt-3">
                          <button
                            type="button"
                            onClick={() => setVerTodoHistorial(!verTodoHistorial)}
                            style={{
                              background: "transparent",
                              border: "none",
                              cursor: "pointer",
                              fontFamily: "var(--font-body)",
                              fontSize: "var(--text-sm)",
                              fontWeight: 500,
                              color: "var(--color-primary-dim)",
                            }}
                          >
                            {verTodoHistorial ? "Ver menos" : "Ver más"}
                          </button>
                        </div>
                      )}

                      <p
                        style={{
                          marginTop: "1rem",
                          fontFamily: "var(--font-mono)",
                          fontSize: "var(--text-sm)",
                          color: "var(--color-text-on-light-faint)",
                        }}
                      >
                        {!verTodoHistorial && historialFiltrado.length > 10
                          ? `10 de ${historialFiltrado.length} citas · Total gastado: ${formatPrice(historialTotal)}`
                          : `${historialFiltrado.length} ${historialFiltrado.length === 1 ? "cita" : "citas"} · Total gastado: ${formatPrice(historialTotal)}`
                        }
                      </p>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {showDesactivarConfirm && (
        <ConfirmModal
          title="Desactivar clienta"
          message="¿Deseas desactivar esta clienta? Podrás reactivarla más adelante desde la base de datos."
          confirmLabel="Desactivar"
          loading={desactivando}
          onConfirm={handleDesactivar}
          onCancel={() => setShowDesactivarConfirm(false)}
        />
      )}

      <AdminToast toast={toast} />
    </AdminLayout>
  );
}

