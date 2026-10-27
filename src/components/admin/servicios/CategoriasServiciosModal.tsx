import { useCallback, useEffect, useState } from "react";
import { Check, Edit2, Plus, Trash2, X } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/admin/ConfirmModal";

interface CategoriaServicio {
  id: string;
  nombre: string;
  slug: string;
  orden: number | null;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** Se llama después de crear, renombrar, reordenar o borrar, para que la lista de servicios se vuelva a cargar. */
  onUpdated: (mensaje: string) => void;
}

const MAX_NOMBRE = 40;

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

const normalizar = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
const slugDe = (t: string) => normalizar(t).replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

/** Traduce un error de Supabase a un mensaje claro para Adriana. */
function mensajeDeError(e: { code?: string; message: string }, accion: string): string {
  if (e.code === "23505") return "Ya existe una categoría con ese nombre.";
  if (e.code === "23503") return "No se puede borrar: todavía hay servicios en esta categoría. Cámbiales la categoría primero.";
  if (e.code === "42501") return "Tu usuario no tiene permiso para " + accion + ". Entra con la cuenta de administración.";
  return "No se pudo " + accion + ": " + e.message;
}

export function CategoriasServiciosModal({ isOpen, onClose, onUpdated }: Props) {
  const [categorias, setCategorias] = useState<CategoriaServicio[]>([]);
  const [usos, setUsos] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoOrden, setNuevoOrden] = useState("");
  const [guardando, setGuardando] = useState(false);

  const [editId, setEditId] = useState<string | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [editOrden, setEditOrden] = useState("");

  const [aBorrar, setABorrar] = useState<CategoriaServicio | null>(null);
  const [borrando, setBorrando] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    const [catsRes, sersRes] = await Promise.all([
      supabase.from("categorias_servicios").select("id, nombre, slug, orden").order("orden", { ascending: true }).order("nombre", { ascending: true }),
      supabase.from("servicios").select("categoria_id"),
    ]);
    if (catsRes.error || sersRes.error) {
      setError("No se pudo cargar la lista de categorías. Revisa tu conexión e intenta de nuevo.");
    } else {
      setCategorias(catsRes.data as CategoriaServicio[]);
      const conteo: Record<string, number> = {};
      for (const s of sersRes.data ?? []) {
        if (s.categoria_id) conteo[s.categoria_id] = (conteo[s.categoria_id] ?? 0) + 1;
      }
      setUsos(conteo);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setEditId(null);
      cargar();
    }
  }, [isOpen, cargar]);

  /** Valida nombre y orden. Devuelve el mensaje de error o null si todo está bien. */
  const validar = (nombre: string, orden: string, idActual?: string): string | null => {
    const limpio = nombre.trim();
    if (!limpio) return "Escribe el nombre de la categoría.";
    if (limpio.length > MAX_NOMBRE) return `El nombre es muy largo (máximo ${MAX_NOMBRE} caracteres).`;
    if (!slugDe(limpio)) return "El nombre debe tener al menos una letra o un número.";
    if (orden.trim() !== "" && (!/^\d+$/.test(orden.trim()))) return "El orden debe ser un número entero (0 o más).";
    const repetida = categorias.some((c) => c.id !== idActual && normalizar(c.nombre) === normalizar(limpio));
    if (repetida) return "Ya existe una categoría con ese nombre.";
    return null;
  };

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    const problema = validar(nuevoNombre, nuevoOrden);
    if (problema) {
      setError(problema);
      return;
    }
    setError(null);
    setGuardando(true);
    const nombre = nuevoNombre.trim();
    const ultimo = categorias.reduce((m, c) => Math.max(m, c.orden ?? 0), 0);
    const orden = nuevoOrden.trim() === "" ? ultimo + 1 : parseInt(nuevoOrden.trim(), 10);
    const { error: err } = await supabase.from("categorias_servicios").insert({ nombre, slug: slugDe(nombre), orden });
    setGuardando(false);
    if (err) {
      setError(mensajeDeError(err, "crear la categoría"));
      return;
    }
    setNuevoNombre("");
    setNuevoOrden("");
    await cargar();
    onUpdated(`Categoría "${nombre}" creada`);
  };

  const empezarEdicion = (c: CategoriaServicio) => {
    setError(null);
    setEditId(c.id);
    setEditNombre(c.nombre);
    setEditOrden(String(c.orden ?? 0));
  };

  const handleGuardarEdicion = async (c: CategoriaServicio) => {
    const problema = validar(editNombre, editOrden, c.id);
    if (problema) {
      setError(problema);
      return;
    }
    setError(null);
    setGuardando(true);
    const nombre = editNombre.trim();
    const orden = editOrden.trim() === "" ? 0 : parseInt(editOrden.trim(), 10);
    // El slug no cambia al renombrar: así los enlaces y filtros ya publicados siguen funcionando.
    const { error: err } = await supabase.from("categorias_servicios").update({ nombre, orden }).eq("id", c.id);
    setGuardando(false);
    if (err) {
      setError(mensajeDeError(err, "guardar los cambios"));
      return;
    }
    setEditId(null);
    await cargar();
    onUpdated(`Categoría "${nombre}" actualizada`);
  };

  const handleBorrar = async () => {
    if (!aBorrar) return;
    setBorrando(true);
    const { error: err } = await supabase.from("categorias_servicios").delete().eq("id", aBorrar.id);
    setBorrando(false);
    const nombre = aBorrar.nombre;
    setABorrar(null);
    if (err) {
      setError(mensajeDeError(err, "borrar la categoría"));
      return;
    }
    setError(null);
    await cargar();
    onUpdated(`Categoría "${nombre}" eliminada`);
  };

  const pedirBorrado = (c: CategoriaServicio) => {
    const n = usos[c.id] ?? 0;
    if (n > 0) {
      setError(`No se puede borrar "${c.nombre}": tiene ${n} ${n === 1 ? "servicio" : "servicios"}. Cámbiales la categoría primero.`);
      return;
    }
    setError(null);
    setABorrar(c);
  };

  if (!isOpen) return null;

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 80, backgroundColor: "rgba(0,0,0,0.6)" }} />
      <div
        className="fixed top-[5%] left-[5%] right-[5%] bottom-[5%] sm:top-[10%] sm:bottom-[10%] sm:left-1/2 sm:-translate-x-1/2 sm:w-[600px] flex flex-col shadow-2xl"
        style={{ zIndex: 81, borderRadius: "var(--radius-xl)", border: "1px solid var(--color-border)", backgroundColor: "#F5F0E8" }}
      >
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[#D1D5DB] shrink-0">
          <h2 className="font-display italic text-2xl text-[#111827]">Categorías de servicios</h2>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="text-[#6B7280] hover:text-[#111827]">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-5">
          {error && (
            <p role="alert" className="text-sm rounded-lg p-3" style={{ color: "#B91C1C", backgroundColor: "#FEF2F2", border: "1px solid #FECACA" }}>
              {error}
            </p>
          )}

          <form onSubmit={handleCrear} noValidate className="flex flex-col gap-3 p-4 rounded-lg bg-[#FFFFFF] border border-[#D1D5DB] shadow-sm">
            <h3 className="font-body font-semibold text-sm text-[#111827]">Nueva categoría</h3>
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_110px_auto] gap-3 items-end">
              <label className="flex flex-col gap-1 text-xs text-[#4B5563]">
                Nombre *
                <input type="text" value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)} maxLength={MAX_NOMBRE} placeholder="Ej: Cejas y pestañas" style={inputStyle} />
              </label>
              <label className="flex flex-col gap-1 text-xs text-[#4B5563]">
                Orden (opcional)
                <input type="number" min={0} value={nuevoOrden} onChange={(e) => setNuevoOrden(e.target.value)} placeholder="Al final" style={inputStyle} />
              </label>
              <Button type="submit" variant="accent" disabled={guardando}>
                <Plus size={16} className="mr-2" /> Añadir
              </Button>
            </div>
            <p className="text-xs text-[#6B7280]">El orden define cómo se ven las categorías en el sitio y en los filtros (el número más bajo va primero).</p>
          </form>

          <div className="flex flex-col gap-2">
            <h3 className="font-body font-semibold text-sm text-[#4B5563]">Categorías existentes</h3>
            {loading ? (
              <p className="text-sm text-center py-4 text-[#4B5563]">Cargando...</p>
            ) : categorias.length === 0 ? (
              <p className="text-sm text-center py-4 text-[#4B5563]">Todavía no hay categorías. Crea la primera arriba.</p>
            ) : (
              categorias.map((c) => {
                const n = usos[c.id] ?? 0;
                const editando = editId === c.id;
                return (
                  <div key={c.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-[#FFFFFF] border border-[#E5E7EB] shadow-sm">
                    {editando ? (
                      <div className="flex flex-1 gap-2">
                        <input type="text" value={editNombre} onChange={(e) => setEditNombre(e.target.value)} maxLength={MAX_NOMBRE} aria-label="Nombre de la categoría" style={inputStyle} autoFocus />
                        <input type="number" min={0} value={editOrden} onChange={(e) => setEditOrden(e.target.value)} aria-label="Orden" style={{ ...inputStyle, width: 90 }} />
                      </div>
                    ) : (
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm text-[#111827]">{c.nombre}</span>
                        <span className="text-xs text-[#6B7280]">
                          Orden {c.orden ?? 0} · {n} {n === 1 ? "servicio" : "servicios"}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-1 shrink-0">
                      {editando ? (
                        <>
                          <button type="button" aria-label="Guardar" disabled={guardando} onClick={() => handleGuardarEdicion(c)} className="p-2 rounded hover:bg-[#F3F4F6] cursor-pointer" style={{ color: "#15803D" }}>
                            <Check size={16} />
                          </button>
                          <button type="button" aria-label="Cancelar" onClick={() => { setEditId(null); setError(null); }} className="p-2 rounded hover:bg-[#F3F4F6] cursor-pointer" style={{ color: "#6B7280" }}>
                            <X size={16} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button type="button" aria-label={`Editar ${c.nombre}`} onClick={() => empezarEdicion(c)} className="p-2 rounded hover:bg-[#F3F4F6] cursor-pointer" style={{ color: "#6B7280" }}>
                            <Edit2 size={16} />
                          </button>
                          <button type="button" aria-label={`Borrar ${c.nombre}`} onClick={() => pedirBorrado(c)} className="p-2 rounded hover:bg-[#F3F4F6] cursor-pointer" style={{ color: n > 0 ? "#D1D5DB" : "#B91C1C" }}>
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {aBorrar && (
        <ConfirmModal
          title="Borrar categoría"
          message={<>Se borrará la categoría <strong>{aBorrar.nombre}</strong>. No tiene servicios, así que no afecta a ninguno.</>}
          confirmLabel="Borrar"
          loading={borrando}
          onConfirm={handleBorrar}
          onCancel={() => setABorrar(null)}
        />
      )}
    </>
  );
}
