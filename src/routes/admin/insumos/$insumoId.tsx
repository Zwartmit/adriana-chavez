import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { duracionAviso, explicarError } from "@/lib/errores";
import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminToast, type ToastState } from "@/components/admin/AdminToast";
import { InsumoForm, type InsumoFormData } from "@/components/admin/inventario/InsumoForm";
import { LoadingState, ErrorState } from "@/components/ui/QueryState";
import { supabase } from "@/lib/supabase/client";

export const Route = createFileRoute("/admin/insumos/$insumoId")({
  component: EditarInsumoPage,
});

function EditarInsumoPage() {
  const { insumoId } = Route.useParams();
  const navigate = useNavigate();
  const [inicial, setInicial] = useState<Partial<InsumoFormData> | null>(null);
  const [categorias, setCategorias] = useState<{ id: string; nombre: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    const [prodRes, invRes, catRes] = await Promise.all([
      supabase.from("productos").select("nombre, marca, categoria_id, uso_interno").eq("id", insumoId).single(),
      supabase.from("inventario").select("unidad, umbral_alerta").eq("producto_id", insumoId).maybeSingle(),
      supabase.from("categorias_productos").select("id, nombre").order("orden", { ascending: true }),
    ]);
    if (prodRes.error || !prodRes.data) {
      setError(prodRes.error?.message ?? "No se encontró el insumo.");
      setLoading(false);
      return;
    }
    if (!prodRes.data.uso_interno) {
      setError("Este producto es de venta. Edítalo desde Productos.");
      setLoading(false);
      return;
    }
    setCategorias(catRes.data ?? []);
    setInicial({
      nombre: prodRes.data.nombre,
      marca: prodRes.data.marca,
      categoria_id: prodRes.data.categoria_id ?? "",
      unidad: invRes.data?.unidad ?? "unidad",
      umbral_alerta: invRes.data?.umbral_alerta ?? 2,
    });
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [insumoId]);

  const showToast = (message: string, type: ToastState["type"] = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), duracionAviso(type));
  };

  const handleSubmit = async (data: InsumoFormData) => {
    setIsSubmitting(true);
    const { error: prodError } = await supabase
      .from("productos")
      .update({ nombre: data.nombre, marca: data.marca, categoria_id: data.categoria_id })
      .eq("id", insumoId);
    const { error: invError } = prodError
      ? { error: null }
      : await supabase.from("inventario").update({ unidad: data.unidad, umbral_alerta: data.umbral_alerta }).eq("producto_id", insumoId);
    setIsSubmitting(false);
    const fallo = prodError ?? invError;
    if (fallo) {
      console.error("Error al actualizar insumo:", fallo);
      showToast(explicarError(fallo, "guardar los cambios del insumo"), "error");
      return;
    }
    showToast("Insumo actualizado con éxito");
    setTimeout(() => navigate({ to: "/admin/insumos" }), 1200);
  };

  return (
    <AdminLayout pageTitle="Editar insumo">
      <div style={{ maxWidth: "800px", width: "100%", margin: "0 auto" }}>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--color-text-on-light-faint)", marginBottom: "2rem" }}>
          La cantidad se cambia con "Registrar movimiento" en la lista de insumos.
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
          ) : inicial ? (
            <InsumoForm
              esNuevo={false}
              initialData={inicial}
              categorias={categorias}
              isSubmitting={isSubmitting}
              onSubmit={handleSubmit}
              onCancel={() => navigate({ to: "/admin/insumos" })}
            />
          ) : null}
        </div>
      </div>
      <AdminToast toast={toast} />
    </AdminLayout>
  );
}
