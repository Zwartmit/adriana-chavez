import { useEffect, useState } from "react";
import { X, Plus } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

interface CrudProfesionalesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

interface ProfesionalItem {
  id: string;
  nombre: string;
  cargo: string;
  color_calendario: string;
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

export function CrudProfesionalesModal({ isOpen, onClose, onUpdated }: CrudProfesionalesModalProps) {
  const [profesionales, setProfesionals] = useState<ProfesionalItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [nombre, setNombre] = useState("");
  const [cargo, setCargo] = useState("Profesional");
  const [anosExperiencia, setAnosExperiencia] = useState("1");
  const [colorCalendario, setColorCalendario] = useState("#E8C97A");
  const [submitting, setSubmitting] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  useEffect(() => {
    if (isOpen) fetchProfesionals();
  }, [isOpen]);

  const fetchProfesionals = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profesionales")
      .select("id, nombre, cargo, color_calendario, activo")
      .order("nombre", { ascending: true });
    
    if (error) {
      console.error("Error fetching profesionales:", error);
      setError("No pudimos cargar la lista de profesionales. Intenta de nuevo más tarde.");
    } else {
      setProfesionals(data ?? []);
    }
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !cargo) return;

    setSubmitting(true);
    setError(null);

    const { error: insertError } = await supabase.from("profesionales").insert({
      nombre,
      cargo,
      anos_experiencia: parseInt(anosExperiencia, 10) || 1,
      color_calendario: colorCalendario,
      especialidades: [],
      activo: true,
      orden: 99,
    });

    setSubmitting(false);

    if (insertError) {
      console.error("Error creating profesional:", insertError);
      setError("Ocurrió un error al guardar la profesional. Verifica los datos e intenta de nuevo.");
    } else {
      setNombre("");
      setCargo("Profesional");
      setAnosExperiencia("1");
      setColorCalendario("#E8C97A");
      fetchProfesionals();
      onUpdated();
    }
  };

  const handleToggleActivo = async (id: string, currentActivo: boolean) => {
    const { error } = await supabase.from("profesionales").update({ activo: !currentActivo }).eq("id", id);
    if (error) {
      console.error("Error toggling profesional status:", error);
      setError("No se pudo actualizar el estado de la profesional.");
    } else {
      fetchProfesionals();
      onUpdated();
    }
  };

  if (!isOpen) return null;

  const filteredProfesionals = profesionales.filter((e) => {
    const matchesSearch = e.nombre.toLowerCase().includes(searchQuery.toLowerCase()) || e.cargo.toLowerCase().includes(searchQuery.toLowerCase());
    if (statusFilter === "active") return matchesSearch && e.activo;
    if (statusFilter === "inactive") return matchesSearch && !e.activo;
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
          <h2 className="font-display italic text-2xl text-[#111827]">Gestionar profesionales</h2>
          <button onClick={onClose} className="text-[#6B7280] hover:text-[#111827]">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-6">
          {error && <p className="text-red-500 text-sm">{error}</p>}
          
          <form onSubmit={handleCreate} className="flex flex-col gap-3 p-4 rounded-lg bg-[#FFFFFF] border border-[#D1D5DB] shadow-sm">
            <h3 className="font-body font-semibold text-sm text-[#111827]">Añadir nueva profesional</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Nombre *"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                style={inputStyle}
                required
              />
              <input
                type="text"
                placeholder="Cargo *"
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
                style={inputStyle}
                required
              />
              <input
                type="number"
                placeholder="Años exp. *"
                value={anosExperiencia}
                onChange={(e) => setAnosExperiencia(e.target.value)}
                style={inputStyle}
                required
                min="0"
              />
              <div className="flex items-center gap-2" style={{ width: "100%", padding: "8px 12px", backgroundColor: "#FFFFFF", border: "1px solid #D1D5DB", borderRadius: "var(--radius-md)" }}>
                <span className="text-sm text-[#6B7280] shrink-0 font-body">Color</span>
                <input
                  type="color"
                  value={colorCalendario}
                  onChange={(e) => setColorCalendario(e.target.value)}
                  className="w-full h-6 cursor-pointer rounded border-0 p-0"
                />
              </div>
              <Button type="submit" variant="accent" disabled={submitting} className="sm:col-span-2">
                <Plus size={16} className="mr-2" /> Añadir
              </Button>
            </div>
          </form>

          <div className="flex flex-col gap-2">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-2">
              <h3 className="font-body font-semibold text-sm text-[#4B5563]">Profesionals existentes</h3>
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
            ) : filteredProfesionals.length === 0 ? (
              <p className="text-sm text-center py-4 text-[#4B5563]">No se encontraron profesionales.</p>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {filteredProfesionals.map((e) => (
                  <div key={e.id} className="flex items-center justify-between p-3 rounded-lg bg-[#FFFFFF] border border-[#E5E7EB] shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: e.color_calendario }} />
                      <div className="flex flex-col">
                        <span className={`font-semibold text-sm ${!e.activo ? "line-through text-[#9CA3AF]" : "text-[#111827]"}`}>{e.nombre}</span>
                        <span className="text-xs text-[#6B7280]">{e.cargo}</span>
                      </div>
                    </div>
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      onClick={() => handleToggleActivo(e.id, e.activo)}
                      style={{ padding: "4px 8px", height: "auto", borderColor: "#D1D5DB", color: "#111827", backgroundColor: "#FFFFFF" }}
                    >
                      {e.activo ? "Desactivar" : "Activar"}
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


