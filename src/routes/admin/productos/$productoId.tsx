import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminToast, type ToastState } from "@/components/admin/AdminToast";
import { ProductoForm, type ProductoFormData } from "@/components/admin/productos/ProductoForm";
import { LoadingState, ErrorState } from "@/components/ui/QueryState";
import { supabase } from "@/lib/supabase/client";

export const Route = createFileRoute("/admin/productos/$productoId")({
  component: EditarProductoPage,
});

function EditarProductoPage() {
  const { productoId } = Route.useParams();
  const navigate = useNavigate();
  
  const [producto, setProducto] = useState<ProductoFormData | null>(null);
  const [categorias, setCategorias] = useState<{ id: string; nombre: string }[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    const [prodRes, catRes] = await Promise.all([
      supabase.from("productos").select("*").eq("id", productoId).single(),
      supabase.from("categorias_productos").select("id, nombre").order("orden", { ascending: true })
    ]);

    if (prodRes.error) {
      setError(prodRes.error.message);
      setLoading(false);
      return;
    }

    setCategorias(catRes.data ?? []);
    setProducto(prodRes.data as ProductoFormData);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [productoId]);

  const showToast = (message: string, type: ToastState["type"] = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2000);
  };

  const handleSubmit = async (data: ProductoFormData) => {
    setIsSubmitting(true);
    
    const updateData = {
      nombre: data.nombre,
      marca: data.marca,
      categoria_id: data.categoria_id,
      precio: data.precio,
      precio_original: data.precio_original,
      descripcion: data.descripcion,
      descripcion_larga: data.descripcion_larga,
      caracteristicas: data.caracteristicas,
      imagenes: data.imagenes,
      destacado: data.destacado,
      es_nuevo: data.es_nuevo,
      activo: data.activo,
    };

    const { error } = await supabase.from("productos").update(updateData).eq("id", productoId);

    setIsSubmitting(false);

    if (error) {
      console.error("Error al actualizar producto:", error);
      showToast("Error al actualizar el producto", "error");
    } else {
      showToast("Producto actualizado con éxito");
      setTimeout(() => navigate({ to: "/admin/productos" }), 1500);
    }
  };

  return (
    <AdminLayout pageTitle="Editar producto">
      <div style={{ maxWidth: "1000px", width: "100%", margin: "0 auto" }}>
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-sm)",
            color: "var(--color-text-on-light-faint)",
            marginBottom: "2rem",
          }}
        >
          Actualiza la información del producto.
        </p>

        <div
          style={{
            backgroundColor: "var(--color-surface-light)",
            border: "1px solid var(--color-border-light)",
            borderRadius: "var(--radius-xl)",
            padding: "2rem",
          }}
        >
          {loading ? (
            <LoadingState variant="light" />
          ) : error ? (
            <ErrorState message={error} onRetry={fetchData} variant="light" />
          ) : producto ? (
            <ProductoForm
              initialData={producto}
              categorias={categorias}
              isSubmitting={isSubmitting}
              onSubmit={handleSubmit}
              onCancel={() => navigate({ to: "/admin/productos" })}
            />
          ) : null}
        </div>
      </div>
      <AdminToast toast={toast} />
    </AdminLayout>
  );
}
