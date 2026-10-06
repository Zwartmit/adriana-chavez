import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, Star, Edit, Trash, AlertTriangle } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminToast, type ToastState } from "@/components/admin/AdminToast";
import { Button } from "@/components/ui/Button";
import { LoadingState, ErrorState } from "@/components/ui/QueryState";
import { ConfirmModal } from "@/components/admin/ConfirmModal";
import { supabase } from "@/lib/supabase/client";

export const Route = createFileRoute("/admin/profesionales/")({
  component: ProfesionalesAdminPage,
});

interface ProfesionalRow {
  id: string;
  nombre: string;
  foto_url: string | null;
  especialidades: string[];
  color_calendario: string;
  activo: boolean;
  orden: number;
}

function ProfesionalesAdminPage() {
  const navigate = useNavigate();
  const [profesionales, setProfesionales] = useState<ProfesionalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [toast, setToast] = useState<ToastState | null>(null);
  
  // Para activar/desactivar
  const [actionProf, setActionProf] = useState<ProfesionalRow | null>(null);
  const [futureCitasCount, setFutureCitasCount] = useState<number>(0);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [checkingCitas, setCheckingCitas] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearchQuery(searchInput.trim());
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("profesionales")
      .select("id, nombre, foto_url, especialidades, color_calendario, activo, orden")
      .order("orden", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[ProfesionalesAdminPage] error:", error.message);
      setError(error.message);
      setLoading(false);
      return;
    }

    setProfesionales(data as unknown as ProfesionalRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtrado = useMemo(() => {
    const filtered = profesionales.filter((p) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return p.nombre.toLowerCase().includes(q) || p.especialidades.some(e => e.toLowerCase().includes(q));
      }
      return true;
    });
    return filtered;
  }, [profesionales, searchQuery]);

  const showToast = (message: string, type: ToastState["type"] = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2000);
  };

  const handleToggleEstadoRequest = async (profesional: ProfesionalRow) => {
    if (!profesional.activo) {
      // Activar no tiene riesgo
      await toggleEstado(profesional);
      return;
    }

    // Si va a desactivar, abrir modal inmediatamente y verificar citas
    setActionProf(profesional);
    setIsConfirmOpen(true);
    setCheckingCitas(true);
    setFutureCitasCount(0);

    const { count, error } = await supabase
      .from("citas")
      .select("*", { count: 'exact', head: true })
      .eq("profesional_id", profesional.id)
      .neq("estado", "cancelada")
      .gte("fecha_hora", new Date().toISOString());

    setCheckingCitas(false);

    if (error) {
      showToast("Error al verificar citas futuras", "error");
      setIsConfirmOpen(false);
      setActionProf(null);
      return;
    }

    if (count !== null) {
      setFutureCitasCount(count);
    }
  };

  const toggleEstado = async (profesional: ProfesionalRow) => {
    const newState = !profesional.activo;
    const { error } = await supabase
      .from("profesionales")
      .update({ activo: newState })
      .eq("id", profesional.id);

    if (error) {
      showToast("No se pudo cambiar el estado", "error");
    } else {
      showToast(`Profesional ${newState ? "activado" : "desactivado"} correctamente`);
      fetchData();
    }
    setIsConfirmOpen(false);
    setActionProf(null);
  };

  const moverOrden = async (id: string, delta: number) => {
    const currentIndex = profesionales.findIndex(p => p.id === id);
    if (currentIndex < 0) return;
    const current = profesionales[currentIndex];
    
    // Calculate new index
    let newIndex = currentIndex + delta;
    if (newIndex < 0) newIndex = 0;
    if (newIndex >= profesionales.length) newIndex = profesionales.length - 1;
    if (newIndex === currentIndex) return;

    const swap = profesionales[newIndex];

    // Optimistic UI
    const nuevos = [...profesionales];
    nuevos[currentIndex] = { ...current, orden: swap.orden };
    nuevos[newIndex] = { ...swap, orden: current.orden };
    nuevos.sort((a, b) => a.orden - b.orden);
    setProfesionales(nuevos);

    // Save
    await supabase.from("profesionales").update({ orden: swap.orden }).eq("id", current.id);
    await supabase.from("profesionales").update({ orden: current.orden }).eq("id", swap.id);
  };

  return (
    <AdminLayout pageTitle="Profesionales">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "var(--radius-xl)",
                backgroundColor: "rgba(232,201,122,0.15)",
                color: "var(--color-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Star size={24} />
            </div>
            <div>
              <h1 className="font-display italic font-semibold text-2xl text-[var(--color-text-on-light)]">Profesionales</h1>
              <p className="font-body text-sm text-[var(--color-text-on-light-muted)]">
                Gestiona el equipo de trabajo y sus especialidades
              </p>
            </div>
          </div>
          <Button variant="accent" size="lg" onClick={() => navigate({ to: "/admin/profesionales/nuevo" })}>
            + Añadir Profesional
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-on-light-muted)]" />
            <input
              type="text"
              placeholder="Buscar por nombre o especialidad..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px 10px 40px",
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
        </div>

        {loading ? (
          <LoadingState label="Cargando profesionales..." />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchData} />
        ) : (
          <div
            className="overflow-x-auto"
            style={{
              backgroundColor: "var(--color-surface-light)",
              borderRadius: "var(--radius-2xl)",
              border: "1px solid var(--color-border-light)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            {filtrado.length === 0 ? (
              <div className="p-8 text-center">
                <p className="font-body text-[var(--color-text-on-light-muted)]">No hay profesionales que coincidan con la búsqueda.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--color-border-light)" }}>
                    <th className="p-4 font-mono text-xs uppercase tracking-wider text-[var(--color-text-on-light-muted)]">Orden</th>
                    <th className="p-4 font-mono text-xs uppercase tracking-wider text-[var(--color-text-on-light-muted)]">Profesional</th>
                    <th className="p-4 font-mono text-xs uppercase tracking-wider text-[var(--color-text-on-light-muted)]">Especialidades</th>
                    <th className="p-4 font-mono text-xs uppercase tracking-wider text-[var(--color-text-on-light-muted)]">Color</th>
                    <th className="p-4 font-mono text-xs uppercase tracking-wider text-[var(--color-text-on-light-muted)]">Estado</th>
                    <th className="p-4 font-mono text-xs uppercase tracking-wider text-[var(--color-text-on-light-muted)] text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrado.map((p, index) => (
                    <tr
                      key={p.id}
                      style={{ borderBottom: "1px solid var(--color-border-light)", transition: "background-color 0.2s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-bg-light-alt)")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                          <button onClick={() => moverOrden(p.id, -1)} disabled={index === 0} className="text-[var(--color-text-on-light-muted)] hover:text-[var(--color-primary)] disabled:opacity-30">▲</button>
                          <button onClick={() => moverOrden(p.id, 1)} disabled={index === profesionales.length - 1} className="text-[var(--color-text-on-light-muted)] hover:text-[var(--color-primary)] disabled:opacity-30">▼</button>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {p.foto_url ? (
                            <img src={p.foto_url} alt={p.nombre} className="w-10 h-10 object-cover rounded-full" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-[var(--color-bg-light-alt)] flex items-center justify-center text-[var(--color-text-on-light-muted)]">
                              <Star size={16} />
                            </div>
                          )}
                          <span className="font-body font-semibold text-[var(--color-text-on-light)]">{p.nombre}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {p.especialidades.map(e => (
                            <span key={e} className="px-2 py-1 text-[10px] uppercase tracking-wider font-mono bg-[var(--color-bg-light-alt)] text-[var(--color-text-on-light)] rounded-full">
                              {e}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="w-6 h-6 rounded-full shadow-sm" style={{ backgroundColor: p.color_calendario }} title={p.color_calendario} />
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => handleToggleEstadoRequest(p)}
                          className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                            p.activo
                              ? "bg-[rgba(76,175,128,0.15)] text-[var(--color-success)]"
                              : "bg-[rgba(224,82,82,0.15)] text-[var(--color-error)]"
                          }`}
                        >
                          {p.activo ? "Activo" : "Inactivo"}
                        </button>
                      </td>
                      <td className="p-4 text-right">
                        <Button variant="ghost" size="sm" onClick={() => navigate({ to: `/admin/profesionales/${p.id}` })}>
                          <Edit size={16} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {isConfirmOpen && actionProf && (
        <ConfirmModal
          title="Desactivar Profesional"
          message={
            checkingCitas
              ? "Verificando citas futuras..."
              : `${actionProf.nombre} tiene ${futureCitasCount} cita(s) futura(s) pendiente(s) o confirmada(s). Al desactivarla, no podrá recibir nuevas citas, pero las citas actuales seguirán existiendo. ¿Estás segura de querer continuar?`
          }
          confirmLabel={checkingCitas ? "..." : "Sí, desactivar"}
          loading={checkingCitas}
          onConfirm={() => {
            toggleEstado(actionProf);
          }}
          onCancel={() => {
            setIsConfirmOpen(false);
            setActionProf(null);
          }}
        />
      )}

      <AdminToast toast={toast} />
    </AdminLayout>
  );
}
