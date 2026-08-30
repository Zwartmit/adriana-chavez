import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Edit, Eye, Search, Users } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminToast, type ToastState } from "@/components/admin/AdminToast";
import { NuevaClientaPanel } from "@/components/admin/clientes/NuevaClientaPanel";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase/client";

export const Route = createFileRoute("/admin/clientes/")({
  component: ClientesPage,
});

const PAGE_SIZE = 20;

interface ClienteRow {
  id: string;
  nombre: string;
  apellido: string | null;
  email: string | null;
  telefono: string | null;
  activo: boolean;
  estilistas: { nombre: string } | null;
}

interface ClienteUI {
  id: string;
  nombreCompleto: string;
  telefono: string | null;
  email: string | null;
  estilistaNombre: string | null;
  totalCitas: number;
  ultimaCita: Date | null;
  activo: boolean;
}

function ClientesPage() {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState<ClienteUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [panelOpen, setPanelOpen] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearchQuery(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const fetchClientes = useCallback(async (query: string) => {
    setLoading(true);
    setError(null);

    let clientesQuery = supabase
      .from("clientes")
      .select("id, nombre, apellido, email, telefono, activo, estilistas(nombre)")
      .order("created_at", { ascending: false });

    if (query) {
      clientesQuery = clientesQuery.or(
        `nombre.ilike.%${query}%,apellido.ilike.%${query}%,email.ilike.%${query}%,telefono.ilike.%${query}%`,
      );
    }

    const [{ data: clientesData, error: clientesError }, { data: citasData, error: citasError }] = await Promise.all([
      clientesQuery,
      supabase.from("citas").select("cliente_id, fecha_hora"),
    ]);

    if (clientesError) {
      console.error("[ClientesPage] error al cargar clientes:", clientesError.message);
      setError(clientesError.message);
      setLoading(false);
      return;
    }
    if (citasError) {
      console.error("[ClientesPage] error al cargar citas:", citasError.message);
    }

    console.log(`[ClientesPage] ${clientesData.length} clientes cargados desde Supabase`);

    const citasPorCliente = new Map<string, { total: number; ultima: Date | null }>();
    for (const c of citasData ?? []) {
      const entry = citasPorCliente.get(c.cliente_id) ?? { total: 0, ultima: null };
      entry.total += 1;
      const fecha = new Date(c.fecha_hora);
      if (!entry.ultima || fecha > entry.ultima) entry.ultima = fecha;
      citasPorCliente.set(c.cliente_id, entry);
    }

    const mapped: ClienteUI[] = (clientesData as unknown as ClienteRow[]).map((c) => {
      const stats = citasPorCliente.get(c.id);
      return {
        id: c.id,
        nombreCompleto: `${c.nombre} ${c.apellido ?? ""}`.trim(),
        telefono: c.telefono,
        email: c.email,
        estilistaNombre: c.estilistas?.nombre ?? null,
        totalCitas: stats?.total ?? 0,
        ultimaCita: stats?.ultima ?? null,
        activo: c.activo,
      };
    });

    setClientes(mapped);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchClientes(searchQuery);
  }, [searchQuery, fetchClientes]);

  const totalPages = Math.max(1, Math.ceil(clientes.length / PAGE_SIZE));
  const clientesPagina = useMemo(
    () => clientes.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [clientes, page],
  );

  const showToast = (message: string, type: ToastState["type"] = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2000);
  };

  return (
    <AdminLayout pageTitle="Clientas">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4" style={{ marginBottom: "0.5rem" }}>
        <div>
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--text-sm)",
              color: "var(--color-text-on-light-faint)",
              marginTop: "0.25rem",
            }}
          >
            {clientes.length} {clientes.length === 1 ? "clienta registrada" : "clientas registradas"}
          </p>
        </div>
        <div className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto" variant="accent" size="md" onClick={() => setPanelOpen(true)}>
            Nueva clienta +
          </Button>
        </div>
      </div>

      {/* Buscador */}
      <div className="relative w-full sm:w-auto sm:max-w-[360px]" style={{ margin: "1.5rem 0" }}>
        <Search
          size={18}
          style={{
            position: "absolute",
            left: 14,
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--color-text-on-light-faint)",
          }}
        />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Buscar clienta..."
          style={{
            width: "100%",
            padding: "10px 14px 10px 42px",
            backgroundColor: "var(--color-surface-light)",
            border: "1px solid var(--color-border-light)",
            borderRadius: "var(--radius-lg)",
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-sm)",
            color: "var(--color-text-on-light)",
            outline: "none",
          }}
        />
      </div>

      {error && (
        <p style={{ fontFamily: "var(--font-body)", color: "var(--color-error)", marginBottom: "1rem" }}>{error}</p>
      )}

      <div
        className="overflow-x-auto w-full"
        style={{
          borderRadius: "var(--radius-xl)",
          border: "1px solid var(--color-border-light)",
        }}
      >
        <table className="w-full min-w-[800px]" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#0A0A0B" }}>
              {["Nombre", "Teléfono", "Email", "Estilista preferida", "Última cita", "Total citas", "Acciones"].map(
                (h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      padding: "12px 16px",
                      fontFamily: "var(--font-mono)",
                      fontSize: "var(--text-xs)",
                      textTransform: "uppercase",
                      letterSpacing: "var(--tracking-wider)",
                      color: "var(--color-primary)",
                    }}
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "var(--color-surface-light)" : "var(--color-bg-light)" }}>
                  <td colSpan={7} style={{ padding: "16px" }}>
                    <div
                      className="animate-pulse"
                      style={{ height: 16, borderRadius: "var(--radius-sm)", backgroundColor: "var(--color-bg-light-alt)" }}
                    />
                  </td>
                </tr>
              ))
            ) : clientesPagina.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className="flex flex-col items-center gap-3" style={{ padding: "4rem 0" }}>
                    <Users size={40} color="var(--color-text-on-light-faint)" />
                    <p
                      style={{
                        fontFamily: "var(--font-display)",
                        fontStyle: "italic",
                        fontSize: "var(--text-xl)",
                        color: "var(--color-text-on-light-faint)",
                      }}
                    >
                      Aún no hay clientas registradas
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              clientesPagina.map((c, i) => (
                <tr
                  key={c.id}
                  style={{
                    backgroundColor: i % 2 === 0 ? "var(--color-surface-light)" : "var(--color-bg-light)",
                    transition: "background-color var(--transition-fast)",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-bg-light-alt)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = i % 2 === 0 ? "var(--color-surface-light)" : "var(--color-bg-light)")}
                >
                  <td style={{ padding: "14px 16px" }}>
                    <button
                      type="button"
                      onClick={() => navigate({ to: "/admin/clientes/$clienteId", params: { clienteId: c.id } })}
                      style={{
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        fontFamily: "var(--font-body)",
                        fontWeight: 600,
                        fontSize: "var(--text-sm)",
                        color: "var(--color-text-on-light)",
                        textDecoration: "none",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-primary-dim)")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-on-light)")}
                    >
                      {c.nombreCompleto}
                    </button>
                    {!c.activo && (
                      <span
                        style={{
                          marginLeft: 8,
                          fontFamily: "var(--font-mono)",
                          fontSize: "var(--text-xs)",
                          color: "var(--color-text-on-light-faint)",
                        }}
                      >
                        (inactiva)
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "14px 16px", fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--color-text-on-light-muted)" }}>
                    {c.telefono ?? "—"}
                  </td>
                  <td style={{ padding: "14px 16px", fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--color-text-on-light-muted)" }}>
                    {c.email ?? "—"}
                  </td>
                  <td style={{ padding: "14px 16px", fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--color-text-on-light-muted)" }}>
                    {c.estilistaNombre ?? "—"}
                  </td>
                  <td style={{ padding: "14px 16px", fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)", color: "var(--color-text-on-light-muted)" }}>
                    {c.ultimaCita ? c.ultimaCita.toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                  </td>
                  <td style={{ padding: "14px 16px", fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)", color: "var(--color-text-on-light-muted)" }}>
                    {c.totalCitas}
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <div className="flex items-center justify-start gap-3">
                      <button
                        type="button"
                        aria-label="Editar"
                        onClick={() => navigate({ to: "/admin/clientes/$clienteId", params: { clienteId: c.id } })}
                        style={{ color: "var(--color-text-on-light-faint)", background: "transparent", border: "none", cursor: "pointer" }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-primary-dim)")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-on-light-faint)")}
                      >
                        <Edit size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {!loading && clientes.length > PAGE_SIZE && (
        <div className="flex items-center justify-center gap-2" style={{ marginTop: "1.5rem" }}>
          <button
            type="button"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            style={{
              padding: "8px 16px",
              borderRadius: "var(--radius-full)",
              border: "1px solid var(--color-border-light)",
              backgroundColor: "transparent",
              color: page === 1 ? "var(--color-text-on-light-faint)" : "var(--color-text-on-light-muted)",
              fontFamily: "var(--font-mono)",
              fontSize: "var(--text-sm)",
              cursor: page === 1 ? "not-allowed" : "pointer",
            }}
          >
            ← Anterior
          </button>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--text-sm)",
              color: "var(--color-text-on-light-faint)",
              padding: "0 0.5rem",
            }}
          >
            {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            style={{
              padding: "8px 16px",
              borderRadius: "var(--radius-full)",
              border: "1px solid var(--color-border-light)",
              backgroundColor: "transparent",
              color: page === totalPages ? "var(--color-text-on-light-faint)" : "var(--color-text-on-light-muted)",
              fontFamily: "var(--font-mono)",
              fontSize: "var(--text-sm)",
              cursor: page === totalPages ? "not-allowed" : "pointer",
            }}
          >
            Siguiente →
          </button>
        </div>
      )}

      <NuevaClientaPanel
        isOpen={panelOpen}
        onClose={() => setPanelOpen(false)}
        onCreated={() => {
          fetchClientes(searchQuery);
          showToast("Clienta registrada correctamente");
        }}
        onError={(msg) => showToast(msg, "error")}
      />

      <AdminToast toast={toast} />
    </AdminLayout>
  );
}
