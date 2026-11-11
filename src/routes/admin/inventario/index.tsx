import { createFileRoute } from "@tanstack/react-router";
import { InventarioView } from "@/components/admin/inventario/InventarioView";

export const Route = createFileRoute("/admin/inventario/")({
  component: () => <InventarioView modo="venta" />,
});
