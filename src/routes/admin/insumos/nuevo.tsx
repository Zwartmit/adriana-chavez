import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { duracionAviso, explicarError } from "@/lib/errores";
import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminToast, type ToastState } from "@/components/admin/AdminToast";
import { InsumoForm, type InsumoFormData } from "@/components/admin/inventario/InsumoForm";
import { supabase } from "@/lib/supabase/client";

export const Route = createFileRoute("/admin/insumos/nuevo")({
  component: NuevoInsumoPage,
});

function generarSlug(nombre: string) {
  return nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function NuevoInsumoPage() {
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
    setTimeout(() => setToast(null), duracionAviso(type));
  };

  const handleSubmit = async (data: InsumoFormData) => {
    setIsSubmitting(true);
    const slug = `insumo-${generarSlug(data.nombre)}-${Math.floor(Math.random() * 100000)}`;

    const { data: nuevo, error } = await supabase
      .from("productos")
      .insert([
        {
          nombre: data.nombre,
          marca: data.marca,
          categoria_id: data.categoria_id,
          precio: 0,
          slug,
          activo: true,
          uso_interno: true,
        } as never,
      ])
      .select("id")
      .single();

    if (error || !nuevo) {
      setIsSubmitting(false);
      console.error("Error al crear insumo:", error);
      showToast(explicarError(error ?? { message: "No se pudo crear el insumo." }, "crear el insumo"), "error");
      return;
    }

    const { error: invError } = await supabase.from("inventario").insert([
      {
        producto_id: nuevo.id,
        stock_virtual: 0,
        stock_fisico: data.stock_inicial,
        umbral_alerta: data.umbral_alerta,
        unidad: data.unidad,
      },
    ]);

    if (!invError && data.stock_inicial > 0) {
      await supabase.from("movimientos_inventario").insert({
        producto_id: nuevo.id,
        tipo: "ajuste",
        origen: "ajuste_manual",
        cantidad: data.stock_inicial,
        stock_antes: 0,
        stock_despues: data.stock_inicial,
        notas: "Stock inicial",
      });
    }

    setIsSubmitting(false);

    if (invError) {
      console.error("Error al crear inventario del insumo:", invError);
      showToast(explicarError(invError, "crear el inventario del insumo"), "error");
      return;
    }
    showToast("Insumo creado con éxito");
    setTimeout(() => navigate({ to: "/admin/insumos" }), 1200);
  };

  return (
    <AdminLayout pageTitle="Nuevo insumo">
      <div style={{ maxWidth: "800px", width: "100%", margin: "0 auto" }}>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--color-text-on-light-faint)", marginBottom: "2rem" }}>
          Producto de uso interno del salón. No se vende ni aparece en la tienda.
        </p>
        <div
          style={{
            backgroundColor: "var(--color-surface-light)",
            border: "1px solid var(--color-border-light)",
            borderRadius: "var(--radius-xl)",
            padding: "2rem",
          }}
        >
          <InsumoForm
            esNuevo
            categorias={categorias}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
            onCancel={() => navigate({ to: "/admin/insumos" })}
          />
        </div>
      </div>
      <AdminToast toast={toast} />
    </AdminLayout>
  );
}
