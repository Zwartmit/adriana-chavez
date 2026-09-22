import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useState } from "react";
import { CategoriasGaleriaPanel } from "@/components/admin/galeria/CategoriasGaleriaPanel";
import { ImagenesGaleriaPanel } from "@/components/admin/galeria/ImagenesGaleriaPanel";

export const Route = createFileRoute("/admin/galeria/")({
  component: AdminGaleriaPage,
});

function AdminGaleriaPage() {
  const [activeTab, setActiveTab] = useState<"imagenes" | "categorias">("imagenes");

  return (
    <AdminLayout pageTitle="Galería">
      <div className="flex gap-4 border-b border-[var(--color-border-light)] mb-6">
        <button
          onClick={() => setActiveTab("imagenes")}
          className={`pb-3 px-1 text-sm font-medium transition-colors border-b-2 ${
            activeTab === "imagenes"
              ? "border-[var(--color-primary)] text-[var(--color-primary)]"
              : "border-transparent text-[var(--color-text-on-light-muted)] hover:text-[var(--color-text-on-light)]"
          }`}
          style={{ fontFamily: "var(--font-body)" }}
        >
          Imágenes
        </button>
        <button
          onClick={() => setActiveTab("categorias")}
          className={`pb-3 px-1 text-sm font-medium transition-colors border-b-2 ${
            activeTab === "categorias"
              ? "border-[var(--color-primary)] text-[var(--color-primary)]"
              : "border-transparent text-[var(--color-text-on-light-muted)] hover:text-[var(--color-text-on-light)]"
          }`}
          style={{ fontFamily: "var(--font-body)" }}
        >
          Categorías
        </button>
      </div>

      <div className="mt-4">
        {activeTab === "imagenes" && <ImagenesGaleriaPanel />}
        {activeTab === "categorias" && <CategoriasGaleriaPanel />}
      </div>
    </AdminLayout>
  );
}
