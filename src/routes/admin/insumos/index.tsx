import { createFileRoute } from "@tanstack/react-router";
import { InventarioView } from "@/components/admin/inventario/InventarioView";

export const Route = createFileRoute("/admin/insumos/")({
  component: () => <InventarioView modo="insumos" />,
});
