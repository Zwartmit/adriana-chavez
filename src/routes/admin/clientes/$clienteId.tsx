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
import { formatPrice } from "@/lib/utils";

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
  estilista_preferido_id: string | null;
  activo: boolean;
  estilistas: { nombre: string } | null;
}

interface EstilistaOption {
  id: string;
  nombre: string;
}

interface CitaHistUI {
  id: string;
  fechaHora: Date;
  estado: EstadoCita;
  servicioNombre: string;
  estilistaNombre: string;
  precioCobrado: number | null;
}

interface CitaRow {
  id: string;
  fecha_hora: string;
  estado: EstadoCita;
  precio_cobrado: number | null;
  servicios: { nombre: string } | null;
  estilistas: { nombre: string } | null;
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
      {s.label}
    </span>
  );
}

const cardStyle: React.CSSProperties = {
  borderRadius: "var(--radius-2xl)",
  padding: "1.75rem",
};

function ClienteDetallePage() {
  const { clienteId } = Route.useParams();
  const navigate = useNavigate();

  const [cliente, setCliente] = useState<ClienteRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [estilistas, setEstilistas] = useState<EstilistaOption[]>([]);

  const [citas, setCitas] = useState<CitaHistUI[]>([]);
  const [citasLoading, setCitasLoading] = useState(true);

  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [estilistaPreferidoId, setEstilistaPreferidoId] = useState("");
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
      .select("*, estilistas(nombre)")
      .eq("id", clienteId)
      .single();

    if (error) {
      console.error("[ClienteDetalle] error al cargar cliente:", error.message);
      setError(error.message);
      setLoading(false);
      return;
    }

    const row = data as unknown as ClienteRow;
    console.log("[ClienteDetalle] cliente cargado desde Supabase");
    setCliente(row);
    setEmail(row.email ?? "");
    setTelefono(row.telefono ?? "");
    setFechaNacimiento(row.fecha_nacimiento ?? "");
    setEstilistaPreferidoId(row.estilista_preferido_id ?? "");
    setNotas(row.notas ?? "");
    setAlergias(row.alergias ?? "");
    setPreferencias(row.preferencias ?? "");
    setLoading(false);
  }, [clienteId]);

  const fetchCitas = useCallback(async () => {
    setCitasLoading(true);
    const { data, error } = await supabase
      .from("citas")
      .select("id, fecha_hora, estado, precio_cobrado, servicios(nombre), estilistas(nombre)")
      .eq("cliente_id", clienteId)
      .order("fecha_hora", { ascending: false });

    if (error) {
      console.error("[ClienteDetalle] error al cargar citas:", error.message);
      setCitasLoading(false);
      return;
    }

    console.log(`[ClienteDetalle] ${data.length} citas cargadas desde Supabase`);
    const mapped: CitaHistUI[] = (data as unknown as CitaRow[]).map((c) => ({
      id: c.id,
      fechaHora: new Date(c.fecha_hora),
      estado: c.estado,
      servicioNombre: c.servicios?.nombre ?? "Servicio",
      estilistaNombre: c.estilistas?.nombre ?? "Sin asignar",
      precioCobrado: c.precio_cobrado,
    }));
    setCitas(mapped);
    setCitasLoading(false);
  }, [clienteId]);

  useEffect(() => {
    fetchCliente();
    fetchCitas();
    supabase
      .from("estilistas")
      .select("id, nombre")
      .eq("activo", true)
      .order("orden", { ascending: true })
      .then(({ data }) => setEstilistas(data ?? []));
  }, [fetchCliente, fetchCitas]);

  const handleGuardarDatos = async () => {
    setSavingDatos(true);
    const { error } = await supabase
      .from("clientes")
      .update({
        email: email.trim() || null,
        telefono: telefono.trim() || null,
        fecha_nacimiento: fechaNacimiento || null,
        estilista_preferido_id: estilistaPreferidoId || null,
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
    .filter((c) => c.estado === "pendiente" || c.estado === "confirmada")
    .sort((a, b) => a.fechaHora.getTime() - b.fechaHora.getTime());

  const historial = citas.filter((c) => c.estado === "completada" || c.estado === "cancelada").slice(0, 10);
  const historialTotal = historial.reduce((sum, c) => sum + (c.precioCobrado ?? 0), 0);

  return (
    <AdminLayout pageTitle={cliente ? `${cliente.nombre} ${cliente.apellido ?? ""}`.trim() : "Cliente"}>
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
        ← Volver a clientes
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
                  label="Estilista preferida"
                  value={estilistaPreferidoId}
                  onChange={setEstilistaPreferidoId}
                  options={estilistas.map((e) => ({ value: e.id, label: e.nombre }))}
                  displayValue={estilistas.find((e) => e.id === estilistaPreferidoId)?.nombre ?? "Sin preferencia"}
                />
              </div>

              <div className="flex items-center gap-3" style={{ marginTop: "1.75rem" }}>
                <Button variant="accent" size="sm" disabled={savingDatos} onClick={handleGuardarDatos}>
                  {savingDatos ? "Guardando..." : "Guardar cambios"}
                </Button>
                {cliente.activo && (
                  <Button variant="ghost" size="sm" onClick={() => setShowDesactivarConfirm(true)}>
                    Desactivar cliente
                  </Button>
                )}
              </div>
            </div>

            <div
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

              <Button variant="accent" size="sm" disabled={savingFicha} onClick={handleGuardarFicha} style={{ marginTop: "1.5rem" }}>
                {savingFicha ? "Guardando..." : "Guardar ficha"}
              </Button>
            </div>
          </div>

          {/* Columna derecha — historial */}
          <div className="flex flex-col gap-6">
            <div style={{ ...cardStyle, backgroundColor: "var(--color-surface-light)", border: "1px solid var(--color-border-light)", boxShadow: "0 2px 12px rgba(10,10,11,0.08)" }}>
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
                          {c.fechaHora.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                        <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--color-text-on-light)" }}>
                          {c.servicioNombre}
                        </p>
                        <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", color: "var(--color-text-on-light-faint)" }}>
                          {c.estilistaNombre}
                        </p>
                      </div>
                      <EstadoBadge estado={c.estado} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ ...cardStyle, backgroundColor: "var(--color-surface-light)", border: "1px solid var(--color-border-light)", boxShadow: "0 2px 12px rgba(10,10,11,0.08)" }}>
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
              ) : historial.length === 0 ? (
                <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--color-text-on-light-faint)" }}>
                  Sin historial de citas
                </p>
              ) : (
                <>
                  <div className="flex flex-col gap-3">
                    {historial.map((c) => (
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
                            {c.estilistaNombre}
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
                  <p
                    style={{
                      marginTop: "1rem",
                      fontFamily: "var(--font-mono)",
                      fontSize: "var(--text-sm)",
                      color: "var(--color-text-on-light-faint)",
                    }}
                  >
                    {historial.length} {historial.length === 1 ? "cita" : "citas"} · Total: {formatPrice(historialTotal)}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {showDesactivarConfirm && (
        <ConfirmModal
          title="Desactivar cliente"
          message="¿Estás seguro que deseas desactivar esta clienta? Podrás reactivarla más adelante desde la base de datos."
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
