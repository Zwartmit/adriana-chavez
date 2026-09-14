import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { Trash2 } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminToast, type ToastState } from "@/components/admin/AdminToast";
import { ServicioForm, type ServicioFormData } from "@/components/admin/servicios/ServicioForm";
import { LoadingState, ErrorState } from "@/components/ui/QueryState";
import { supabase } from "@/lib/supabase/client";

export const Route = createFileRoute("/admin/servicios/$servicioId")({
  component: EditarServicioPage,
});

function EditarServicioPage() {
  const { servicioId } = Route.useParams();
  const navigate = useNavigate();

  const [categorias, setCategorias] = useState<{ id: string; nombre: string }[]>([]);
  const [initialData, setInitialData] = useState<Partial<ServicioFormData> | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [servicioRes, categoriasRes] = await Promise.all([
      supabase.from("servicios").select("*").eq("id", servicioId).single(),
      supabase.from("categorias_servicios").select("id, nombre").order("orden", { ascending: true })
    ]);

    if (servicioRes.error) {
      console.error("Error cargando servicio:", servicioRes.error);
      setError("No se pudo cargar el servicio o no existe.");
      setLoading(false);
      return;
    }

    setCategorias(categoriasRes.data ?? []);
    setInitialData({
      nombre: servicioRes.data.nombre,
      categoria_id: servicioRes.data.categoria_id,
      precio: servicioRes.data.precio,
      precio_desde: servicioRes.data.precio_desde,
      duracion_min: servicioRes.data.duracion_min,
      descripcion: servicioRes.data.descripcion || "",
      imagen_url: servicioRes.data.imagen_url,
      requiere_cita: servicioRes.data.requiere_cita,
      destacado: servicioRes.data.destacado,
      activo: servicioRes.data.activo,
    });
    setLoading(false);
  }, [servicioId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const showToast = (message: string, type: ToastState["type"] = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2000);
  };

  const handleSubmit = async (data: ServicioFormData) => {
    setIsSubmitting(true);
    
    const updateData = {
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
    };

    const { error } = await supabase
      .from("servicios")
      .update(updateData)
      .eq("id", servicioId);

    setIsSubmitting(false);

    if (error) {
      console.error("Error al actualizar servicio:", error);
      showToast("Error al guardar los cambios", "error");
    } else {
      showToast("Servicio actualizado con éxito");
      setTimeout(() => navigate({ to: "/admin/servicios" }), 1500);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("¿Seguro que deseas eliminar este servicio definitivamente?")) {
      return;
    }
    
    setIsDeleting(true);
    
    // Al intentar borrar, la db podría fallar por llaves foráneas si hay citas asociadas
    const { error } = await supabase.from("servicios").delete().eq("id", servicioId);
    
    if (error) {
      console.error("Error eliminando servicio:", error);
      if (error.code === "23503") {
        showToast("No se puede eliminar porque hay citas o registros asociados. Desactívalo.", "error");
      } else {
        showToast("Error al eliminar el servicio", "error");
      }
      setIsDeleting(false);
    } else {
      showToast("Servicio eliminado correctamente");
      setTimeout(() => navigate({ to: "/admin/servicios" }), 1500);
    }
  };

  return (
    <AdminLayout pageTitle="Editar servicio">
      <div style={{ maxWidth: "1000px", width: "100%", margin: "0 auto" }}>
        
        {loading ? (
          <LoadingState variant="light" />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchData} variant="light" />
        ) : initialData ? (
          <>
            <div className="flex justify-between items-center mb-6">
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--text-sm)",
                  color: "var(--color-text-on-light-faint)",
                }}
              >
                Modifica la información del servicio o elimínalo del sistema.
              </p>
              
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center gap-2"
                style={{
                  padding: "8px 16px",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "rgba(224,82,82,0.1)",
                  color: "var(--color-error)",
                  border: "none",
                  cursor: isDeleting ? "not-allowed" : "pointer",
                  fontFamily: "var(--font-body)",
                  fontWeight: 600,
                  fontSize: "var(--text-sm)",
                  opacity: isDeleting ? 0.5 : 1,
                  transition: "background-color 0.2s",
                }}
              >
                <Trash2 size={16} />
                {isDeleting ? "Eliminando..." : "Eliminar servicio"}
              </button>
            </div>

            <div
              style={{
                backgroundColor: "var(--color-surface-light)",
                border: "1px solid var(--color-border-light)",
                borderRadius: "var(--radius-xl)",
                padding: "2rem",
              }}
            >
              <ServicioForm
                initialData={initialData}
                categorias={categorias}
                isSubmitting={isSubmitting}
                onSubmit={handleSubmit}
                onCancel={() => navigate({ to: "/admin/servicios" })}
              />
            </div>
          </>
        ) : null}
      </div>
      <AdminToast toast={toast} />
    </AdminLayout>
  );
}
