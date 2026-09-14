import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminToast, type ToastState } from "@/components/admin/AdminToast";
import { ServicioForm, type ServicioFormData } from "@/components/admin/servicios/ServicioForm";
import { supabase } from "@/lib/supabase/client";

export const Route = createFileRoute("/admin/servicios/nuevo")({
  component: NuevoServicioPage,
});

function generarSlug(nombre: string) {
  return nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function NuevoServicioPage() {
  const navigate = useNavigate();
  const [categorias, setCategorias] = useState<{ id: string; nombre: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    supabase
      .from("categorias_servicios")
      .select("id, nombre")
      .order("orden", { ascending: true })
      .then(({ data }) => setCategorias(data ?? []));
  }, []);

  const showToast = (message: string, type: ToastState["type"] = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2000);
  };

  const handleSubmit = async (data: ServicioFormData) => {
    setIsSubmitting(true);
    
    // Generar slug base
    const baseSlug = generarSlug(data.nombre);
    const slug = `${baseSlug}-${Math.floor(Math.random() * 10000)}`;

    const insertData = {
      nombre: data.nombre,
      categoria_id: data.categoria_id,
      precio: data.precio,
      precio_desde: data.precio_desde,
      duracion_min: data.duracion_min,
      descripcion: data.descripcion,
      imagen_url: data.imagen_url,
      requiere_cita: data.requiere_cita,
      destacado: data.destacado,
      activo: data.activo,
      slug,
      orden: 0,
    };

    const { error } = await supabase.from("servicios").insert([insertData]);

    setIsSubmitting(false);

    if (error) {
      console.error("Error al crear servicio:", error);
      showToast(
        error.message.includes("slug") 
          ? "Error: el nombre generado ya existe. Intenta con otro." 
          : "Error al crear el servicio", 
        "error"
      );
    } else {
      showToast("Servicio creado con éxito");
      setTimeout(() => navigate({ to: "/admin/servicios" }), 1500);
    }
  };

  return (
    <AdminLayout pageTitle="Nuevo servicio">
      <div style={{ maxWidth: "1000px", width: "100%", margin: "0 auto" }}>
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-sm)",
            color: "var(--color-text-on-light-faint)",
            marginBottom: "2rem",
          }}
        >
          Completa la información para agregar un nuevo servicio.
        </p>

        <div
          style={{
            backgroundColor: "var(--color-surface-light)",
            border: "1px solid var(--color-border-light)",
            borderRadius: "var(--radius-xl)",
            padding: "2rem",
          }}
        >
          <ServicioForm
            categorias={categorias}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
            onCancel={() => navigate({ to: "/admin/servicios" })}
          />
        </div>
      </div>
      <AdminToast toast={toast} />
    </AdminLayout>
  );
}
