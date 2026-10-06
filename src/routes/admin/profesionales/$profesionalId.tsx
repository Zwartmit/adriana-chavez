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
    <AdminLayout pageTitle="Editar Profesional">
      <div className="max-w-5xl mx-auto flex flex-col gap-6">
        <div>
          <h1 className="font-display italic font-semibold text-2xl text-[var(--color-text-on-light)]">
            Editar Profesional
          </h1>
          <p className="font-body text-sm text-[var(--color-text-on-light-muted)] mt-1">
            Modifica la información o gestiona los bloqueos de horario.
          </p>
        </div>

        {/* Pestañas */}
        <div className="flex border-b border-[var(--color-border-light)] gap-6">
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
            Bloqueos de Horario
          </button>
        </div>

        <div className="bg-[var(--color-surface)] p-6 md:p-8 rounded-2xl border border-[var(--color-border-light)] shadow-sm">
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
