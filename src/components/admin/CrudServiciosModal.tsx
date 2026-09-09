import { useEffect, useState } from "react";
import { X, Plus } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

interface CrudServiciosModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

interface ServicioItem {
  id: string;
  nombre: string;
  duracion_min: number;
  precio: number;
  activo: boolean;
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  backgroundColor: "#FFFFFF",
  border: "1px solid #D1D5DB",
  borderRadius: "var(--radius-md)",
  fontFamily: "var(--font-body)",
  fontSize: "var(--text-sm)",
  color: "#111827",
  outline: "none",
};

export function CrudServiciosModal({ isOpen, onClose, onUpdated }: CrudServiciosModalProps) {
  const [servicios, setServicios] = useState<ServicioItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [nombre, setNombre] = useState("");
  const [duracion, setDuracion] = useState("60");
  const [precio, setPrecio] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  useEffect(() => {
    if (isOpen) fetchServicios();
  }, [isOpen]);

  const fetchServicios = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("servicios")
      .select("id, nombre, duracion_min, precio, activo")
      .order("nombre", { ascending: true });
    
    if (error) {
      console.error("Error fetching servicios:", error);
      setError("No pudimos cargar la lista de servicios. Intenta de nuevo más tarde.");
    } else {
      setServicios(data ?? []);
    }
    setLoading(false);
  };

  const generateSlug = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !precio || !duracion) return;

    setSubmitting(true);
    setError(null);

    const { error: insertError } = await supabase.from("servicios").insert({
      nombre,
      slug: generateSlug(nombre),
      duracion_min: parseInt(duracion, 10),
      precio: parseFloat(precio),
      precio_desde: false,
      requiere_cita: true,
      activo: true,
      destacado: false,
      orden: 99,
    });

    setSubmitting(false);

    if (insertError) {
      console.error("Error creating servicio:", insertError);
      setError("Ocurrió un error al guardar el servicio. Verifica los datos e intenta de nuevo.");
    } else {
      setNombre("");
      setPrecio("");
      setDuracion("60");
      fetchServicios();
      onUpdated();
    }
  };

  const handleToggleActivo = async (id: string, currentActivo: boolean) => {
    const { error } = await supabase.from("servicios").update({ activo: !currentActivo }).eq("id", id);
    if (error) {
      console.error("Error toggling servicio status:", error);
      setError("No se pudo actualizar el estado del servicio.");
    } else {
      fetchServicios();
      onUpdated();
    }
  };

  if (!isOpen) return null;

  const filteredServicios = servicios.filter((s) => {
    const matchesSearch = s.nombre.toLowerCase().includes(searchQuery.toLowerCase());
    if (statusFilter === "active") return matchesSearch && s.activo;
    if (statusFilter === "inactive") return matchesSearch && !s.activo;
    return matchesSearch;
  });

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 80, backgroundColor: "rgba(0,0,0,0.6)" }} />
      <div
        className="fixed top-[5%] left-[5%] right-[5%] bottom-[5%] sm:top-[10%] sm:bottom-[10%] sm:left-1/2 sm:-translate-x-1/2 sm:w-[600px] flex flex-col shadow-2xl"
        style={{ zIndex: 81, borderRadius: "var(--radius-xl)", border: "1px solid var(--color-border)", backgroundColor: "#F5F0E8" }}
      >
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[#D1D5DB] shrink-0">
          <h2 className="font-display italic text-2xl text-[#111827]">Gestionar servicios</h2>
          <button onClick={onClose} className="text-[#6B7280] hover:text-[#111827]">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-6">
          {error && <p className="text-red-500 text-sm">{error}</p>}
          
          <form onSubmit={handleCreate} className="flex flex-col gap-3 p-4 rounded-lg bg-[#FFFFFF] border border-[#D1D5DB] shadow-sm">
            <h3 className="font-body font-semibold text-sm text-[#111827]">Añadir nuevo servicio</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Nombre del servicio *"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                style={inputStyle}
                required
              />
              <input
                type="number"
                placeholder="Precio ($) *"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                style={inputStyle}
                required
              />
              <select value={duracion} onChange={(e) => setDuracion(e.target.value)} style={inputStyle}>
                <option value="15">15 min</option>
                <option value="30">30 min</option>
                <option value="45">45 min</option>
                <option value="60">1 hora</option>
                <option value="90">1.5 horas</option>
                <option value="120">2 horas</option>
                <option value="180">3 horas</option>
                <option value="240">4 horas</option>
              </select>
              <Button type="submit" variant="accent" disabled={submitting}>
                <Plus size={16} className="mr-2" /> Añadir
              </Button>
            </div>
          </form>

          <div className="flex flex-col gap-2">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-2">
              <h3 className="font-body font-semibold text-sm text-[#4B5563]">Servicios existentes</h3>
              <div className="flex gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ ...inputStyle, padding: "4px 8px", fontSize: "12px", width: "100%", maxWidth: "150px" }}
                />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  style={{ ...inputStyle, padding: "4px 8px", fontSize: "12px", width: "auto" }}
                >
                  <option value="all">Todos</option>
                  <option value="active">Activos</option>
                  <option value="inactive">Inactivos</option>
                </select>
              </div>
            </div>
            
            {loading ? (
              <p className="text-sm text-center py-4 text-[#4B5563]">Cargando...</p>
            ) : filteredServicios.length === 0 ? (
              <p className="text-sm text-center py-4 text-[#4B5563]">No se encontraron servicios.</p>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {filteredServicios.map((s) => (
                  <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-[#FFFFFF] border border-[#E5E7EB] shadow-sm">
                    <div className="flex flex-col">
                      <span className={`font-semibold text-sm ${!s.activo ? "line-through text-[#9CA3AF]" : "text-[#111827]"}`}>{s.nombre}</span>
                      <span className="text-xs text-[#6B7280]">{s.duracion_min} min • ${s.precio}</span>
                    </div>
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      onClick={() => handleToggleActivo(s.id, s.activo)}
                      style={{ padding: "4px 8px", height: "auto", borderColor: "#D1D5DB", color: "#111827", backgroundColor: "#FFFFFF" }}
                    >
                      {s.activo ? "Desactivar" : "Activar"}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

