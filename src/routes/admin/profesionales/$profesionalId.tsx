import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminToast, type ToastState } from "@/components/admin/AdminToast";
import { ProfesionalForm, type ProfesionalFormData } from "@/components/admin/profesionales/ProfesionalForm";
import { BloqueosPanel } from "@/components/admin/profesionales/BloqueosPanel";
import { LoadingState, ErrorState } from "@/components/ui/QueryState";
import { supabase } from "@/lib/supabase/client";

export const Route = createFileRoute("/admin/profesionales/$profesionalId")({
  component: EditarProfesionalPage,
});

function EditarProfesionalPage() {
  const { profesionalId } = Route.useParams();
  const navigate = useNavigate();

  const [initialData, setInitialData] = useState<Partial<ProfesionalFormData> | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  
  const [activeTab, setActiveTab] = useState<"info" | "bloqueos">("info");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.from("profesionales").select("*").eq("id", profesionalId).single();

    if (error) {
      console.error("Error cargando profesional:", error);
      setError("No se pudo cargar la profesional o no existe.");
      setLoading(false);
      return;
    }

    setInitialData({
      nombre: data.nombre,
      especialidades: data.especialidades,
      bio: data.bio || "",
      foto_url: data.foto_url,
      anos_experiencia: data.anos_experiencia,
      color_calendario: data.color_calendario,
      activo: data.activo,
    });
    setLoading(false);
  }, [profesionalId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const showToast = (message: string, type: ToastState["type"] = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2000);
  };

  const handleSubmit = async (data: ProfesionalFormData) => {
    setIsSubmitting(true);
    
    // Validar nombre duplicado
    if (data.nombre !== initialData?.nombre) {
      const { data: existentes, error: errorCheck } = await supabase
        .from("profesionales")
        .select("id")
        .eq("nombre", data.nombre)
        .eq("activo", true)
        .neq("id", profesionalId);

      if (errorCheck) {
        showToast("Error al verificar duplicados", "error");
        setIsSubmitting(false);
        return;
      }

      if (existentes && existentes.length > 0) {
        showToast("Ya existe un(a) profesional activo(a) con ese nombre", "error");
        setIsSubmitting(false);
        return;
      }
    }

    const { error } = await supabase
      .from("profesionales")
      .update({
        nombre: data.nombre,
        especialidades: data.especialidades,
        bio: data.bio,
        foto_url: data.foto_url,
        anos_experiencia: data.anos_experiencia,
        color_calendario: data.color_calendario,
        activo: data.activo,
      })
      .eq("id", profesionalId);

    setIsSubmitting(false);

    if (error) {
      console.error("[EditarProfesional] error:", error.message);
      showToast(error.message, "error");
      return;
    }

    showToast("Cambios guardados correctamente");
    setTimeout(() => {
      navigate({ to: "/admin/profesionales" });
    }, 1000);
  };

  return (
    <AdminLayout pageTitle={initialData?.nombre ?? "Cargando profesional..."}>
      <button
        type="button"
        onClick={() => navigate({ to: "/admin/profesionales" })}
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
        ← Volver a profesionales
      </button>

      <div className="max-w-5xl mx-auto flex flex-col gap-6">
        {/* Pestañas */}
        <div className="flex border-b border-[var(--color-border-light)] gap-6" style={{ marginBottom: "1rem" }}>
          <button
            onClick={() => setActiveTab("info")}
            className={`pb-3 font-semibold font-body text-sm transition-colors ${
              activeTab === "info" 
                ? "text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]" 
                : "text-[var(--color-text-on-light-muted)] hover:text-[var(--color-text-on-light)]"
            }`}
          >
            Información principal
          </button>
          <button
            onClick={() => setActiveTab("bloqueos")}
            className={`pb-3 font-semibold font-body text-sm transition-colors ${
              activeTab === "bloqueos" 
                ? "text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]" 
                : "text-[var(--color-text-on-light-muted)] hover:text-[var(--color-text-on-light)]"
            }`}
          >
            Bloqueos de horario
          </button>
        </div>

        <div>
          {loading ? (
            <LoadingState label="Cargando información..." />
          ) : error ? (
            <ErrorState message={error} onRetry={fetchData} />
          ) : activeTab === "info" && initialData ? (
            <ProfesionalForm
              initialData={initialData}
              onSubmit={handleSubmit}
              onCancel={() => navigate({ to: "/admin/profesionales" })}
              isSubmitting={isSubmitting}
              submitLabel="Guardar Cambios"
            />
          ) : activeTab === "bloqueos" ? (
            <BloqueosPanel profesionalId={profesionalId} />
          ) : null}
        </div>
      </div>
      <AdminToast toast={toast} />
    </AdminLayout>
  );
}
