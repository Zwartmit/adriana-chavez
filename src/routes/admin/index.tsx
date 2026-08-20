import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { CalendarioCitas } from "@/components/admin/CalendarioCitas";

export const Route = createFileRoute("/admin/")({
  component: AdminPage,
});

function AdminPage() {
  return (
    <AdminLayout pageTitle="Calendario">
      <CalendarioCitas />
    </AdminLayout>
  );
}
