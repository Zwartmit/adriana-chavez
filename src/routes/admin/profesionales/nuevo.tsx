import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminToast, type ToastState } from "@/components/admin/AdminToast";
import { ProfesionalForm, type ProfesionalFormData } from "@/components/admin/profesionales/ProfesionalForm";
import { supabase } from "@/lib/supabase/client";

export const Route = createFileRoute("/admin/profesionales/nuevo")({
  component: NuevoProfesionalPage,
});

function NuevoProfesionalPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = (message: string, type: ToastState["type"] = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2000);
  };

  const handleSubmit = async (data: ProfesionalFormData) => {
    setIsSubmitting(true);
    
    // Validar nombre duplicado (entre los activos)
    const { data: existentes, error: errorCheck } = await supabase
      .from("profesionales")
      .select("id")
      .eq("nombre", data.nombre)
      .eq("activo", true);

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

    const { error } = await supabase.from("profesionales").insert({
      nombre: data.nombre,
      especialidades: data.especialidades,
      bio: data.bio,
      foto_url: data.foto_url,
      anos_experiencia: data.anos_experiencia,
      color_calendario: data.color_calendario,
      activo: data.activo,
      orden: 0,
    });

    setIsSubmitting(false);

    if (error) {
      console.error("[NuevoProfesional] error:", error.message);
      showToast(error.message, "error");
      return;
    }

    showToast("Profesional añadido correctamente");
    setTimeout(() => {
      navigate({ to: "/admin/profesionales" });
    }, 1000);
  };

  return (
    <AdminLayout pageTitle="Añadir Profesional">
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        <div className="bg-[var(--color-surface)] p-6 md:p-8 rounded-2xl border border-[var(--color-border-light)] shadow-sm">
          <ProfesionalForm
            onSubmit={handleSubmit}
            onCancel={() => navigate({ to: "/admin/profesionales" })}
            isSubmitting={isSubmitting}
            submitLabel="Crear Profesional"
          />
        </div>
      </div>
      <AdminToast toast={toast} />
    </AdminLayout>
  );
}
