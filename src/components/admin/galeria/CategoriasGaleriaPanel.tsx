import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { LoadingState, ErrorState } from "@/components/ui/QueryState";
import { Button } from "@/components/ui/Button";
import { Plus, Trash2, Edit2, Check, X } from "lucide-react";

interface Categoria {
  id: string;
  nombre: string;
  slug: string;
  orden: number;
}

export function CategoriasGaleriaPanel() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [editOrden, setEditOrden] = useState(0);

  const [isAdding, setIsAdding] = useState(false);
  const [newNombre, setNewNombre] = useState("");
  const [newOrden, setNewOrden] = useState(0);

  const fetchCategorias = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("categorias_galeria")
      .select("*")
      .order("orden", { ascending: true });
      
    if (error) {
      setError(error.message);
    } else {
      setCategorias(data as Categoria[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCategorias();
  }, []);

  const handleCreate = async () => {
    if (!newNombre.trim()) return;
    
    // Generar slug basico
    const slug = newNombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-");
    
    const { error } = await supabase
      .from("categorias_galeria")
      .insert({ nombre: newNombre, slug, orden: newOrden });
      
    if (error) {
      alert("Error al crear categoría: " + error.message);
    } else {
      setIsAdding(false);
      setNewNombre("");
      setNewOrden(0);
      fetchCategorias();
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editNombre.trim()) return;
    
    const { error } = await supabase
      .from("categorias_galeria")
      .update({ nombre: editNombre, orden: editOrden })
      .eq("id", id);
      
    if (error) {
      alert("Error al actualizar: " + error.message);
    } else {
      setEditingId(null);
      fetchCategorias();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar esta categoría? Si hay imágenes asociadas, asegúrate de cambiarles la categoría antes.")) return;
    
    const { error } = await supabase
      .from("categorias_galeria")
      .delete()
      .eq("id", id);
      
    if (error) {
      alert("Error al eliminar: " + error.message);
    } else {
      fetchCategorias();
    }
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={fetchCategorias} />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-xl)", color: "var(--color-text-on-light)" }}>
          Filtros de Galería
        </h2>
        <Button onClick={() => setIsAdding(true)} variant="primary" className="flex items-center gap-2">
          <Plus size={16} /> Nueva Categoría
        </Button>
      </div>

      <div className="bg-[var(--color-surface-light)] border border-[var(--color-border-light)] rounded-xl overflow-hidden">
        <table className="w-full text-left" style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-sm)" }}>
          <thead>
            <tr className="border-b border-[var(--color-border-light)] bg-[rgba(0,0,0,0.02)]">
              <th className="p-4 font-medium text-[var(--color-text-on-light-muted)]">Nombre</th>
              <th className="p-4 font-medium text-[var(--color-text-on-light-muted)]">Slug</th>
              <th className="p-4 font-medium text-[var(--color-text-on-light-muted)]">Orden</th>
              <th className="p-4 font-medium text-[var(--color-text-on-light-muted)] text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isAdding && (
              <tr className="border-b border-[var(--color-border-light)] bg-[rgba(232,201,122,0.15)]">
                <td className="p-4">
                  <input
                    autoFocus
                    className="w-full bg-transparent border border-[var(--color-border-light)] rounded px-3 py-2 text-[var(--color-text-on-light)]"
                    placeholder="Nombre..."
                    value={newNombre}
                    onChange={(e) => setNewNombre(e.target.value)}
                  />
                </td>
                <td className="p-4 text-[var(--color-text-on-light-faint)] text-xs italic">
                  Se generará auto.
                </td>
                <td className="p-4">
                  <input
                    type="number"
                    className="w-20 bg-transparent border border-[var(--color-border-light)] rounded px-3 py-2 text-[var(--color-text-on-light)]"
                    value={newOrden}
                    onChange={(e) => setNewOrden(Number(e.target.value))}
                  />
                </td>
                <td className="p-4 text-right flex items-center justify-end gap-2">
                  <button onClick={handleCreate} className="p-2 bg-[var(--color-success)] text-white rounded hover:opacity-90 cursor-pointer">
                    <Check size={16} />
                  </button>
                  <button onClick={() => setIsAdding(false)} className="p-2 bg-[var(--color-bg-light-alt)] text-[var(--color-text-on-light)] rounded hover:opacity-90 cursor-pointer">
                    <X size={16} />
                  </button>
                </td>
              </tr>
            )}
            
            {categorias.length === 0 && !isAdding ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-[var(--color-text-on-light-faint)]">
                  No hay categorías registradas.
                </td>
              </tr>
            ) : (
              categorias.map((cat) => (
                <tr key={cat.id} className="border-b border-[var(--color-border-light)] hover:bg-[rgba(0,0,0,0.02)] transition-colors">
                  <td className="p-4">
                    {editingId === cat.id ? (
                      <input
                        className="w-full bg-transparent border border-[var(--color-border-light)] rounded px-3 py-2 text-[var(--color-text-on-light)]"
                        value={editNombre}
                        onChange={(e) => setEditNombre(e.target.value)}
                      />
                    ) : (
                      <span className="text-[var(--color-text-on-light)] font-medium">{cat.nombre}</span>
                    )}
                  </td>
                  <td className="p-4 text-[var(--color-text-on-light-faint)] font-mono text-xs">
                    {cat.slug}
                  </td>
                  <td className="p-4">
                    {editingId === cat.id ? (
                      <input
                        type="number"
                        className="w-20 bg-transparent border border-[var(--color-border-light)] rounded px-3 py-2 text-[var(--color-text-on-light)]"
                        value={editOrden}
                        onChange={(e) => setEditOrden(Number(e.target.value))}
                      />
                    ) : (
                      <span className="text-[var(--color-text-on-light-muted)]">{cat.orden}</span>
                    )}
                  </td>
                  <td className="p-4 text-right flex items-center justify-end gap-2">
                    {editingId === cat.id ? (
                      <>
                        <button onClick={() => handleUpdate(cat.id)} className="p-2 text-[var(--color-success)] hover:bg-[var(--color-bg-light-alt)] rounded transition-colors cursor-pointer">
                          <Check size={16} />
                        </button>
                        <button onClick={() => setEditingId(null)} className="p-2 text-[var(--color-text-on-light-faint)] hover:bg-[var(--color-bg-light-alt)] rounded transition-colors cursor-pointer">
                          <X size={16} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setEditingId(cat.id);
                            setEditNombre(cat.nombre);
                            setEditOrden(cat.orden);
                          }}
                          className="p-2 text-[var(--color-primary)] hover:bg-[var(--color-bg-light-alt)] rounded transition-colors cursor-pointer"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(cat.id)}
                          className="p-2 text-[var(--color-error)] hover:bg-[var(--color-bg-light-alt)] rounded transition-colors cursor-pointer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

