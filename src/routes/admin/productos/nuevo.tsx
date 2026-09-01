import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminToast, type ToastState } from "@/components/admin/AdminToast";
import { ProductoForm, type ProductoFormData } from "@/components/admin/productos/ProductoForm";
import { supabase } from "@/lib/supabase/client";

export const Route = createFileRoute("/admin/productos/nuevo")({
  component: NuevoProductoPage,
});

function generarSlug(nombre: string) {
  return nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function NuevoProductoPage() {
  const navigate = useNavigate();
  const [categorias, setCategorias] = useState<{ id: string; nombre: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    supabase
      .from("categorias_productos")
      .select("id, nombre")
      .order("orden", { ascending: true })
      .then(({ data }) => setCategorias(data ?? []));
  }, []);

  const showToast = (message: string, type: ToastState["type"] = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2000);
  };

  const handleSubmit = async (data: ProductoFormData) => {
    setIsSubmitting(true);
    
    // Generar slug base
    const baseSlug = generarSlug(data.nombre);
    const slug = `${baseSlug}-${Math.floor(Math.random() * 10000)}`;

    const insertData = {
      nombre: data.nombre,
      marca: data.marca,
      categoria_id: data.categoria_id,
      precio: data.precio,
      precio_original: data.precio_original,
      descripcion: data.descripcion,
      descripcion_larga: data.descripcion_larga,
      caracteristicas: data.caracteristicas,
      imagenes: data.imagenes, // Podrían agregarse luego con un uploader
      destacado: data.destacado,
      es_nuevo: data.es_nuevo,
      activo: data.activo,
      slug,
      orden: 0,
    };

    const { error } = await supabase.from("productos").insert([insertData]);

    setIsSubmitting(false);

    if (error) {
      console.error("Error al crear producto:", error);
      showToast(
        error.message.includes("slug") 
          ? "Error: el nombre generado ya existe. Intenta con otro." 
          : "Error al crear el producto", 
        "error"
      );
    } else {
      showToast("Producto creado con éxito");
      setTimeout(() => navigate({ to: "/admin/productos" }), 1500);
    }
  };

  return (
    <AdminLayout pageTitle="Nuevo producto">
      <div style={{ maxWidth: "1000px", width: "100%", margin: "0 auto" }}>
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-sm)",
            color: "var(--color-text-on-light-faint)",
            marginBottom: "2rem",
          }}
        >
          Completa la información para agregar un nuevo producto al catálogo.
        </p>

        <div
          style={{
            backgroundColor: "var(--color-surface-light)",
            border: "1px solid var(--color-border-light)",
            borderRadius: "var(--radius-xl)",
            padding: "2rem",
          }}
        >
          <ProductoForm
            categorias={categorias}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
            onCancel={() => navigate({ to: "/admin/productos" })}
          />
        </div>
      </div>
      <AdminToast toast={toast} />
    </AdminLayout>
  );
}
