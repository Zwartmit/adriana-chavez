import { useCallback, useEffect, useMemo, useState } from "react";
import { X, Plus, Minus, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";

interface ProductoOption {
  id: string;
  nombre: string;
  marca: string;
  precio: number;
  stock_fisico: number;
}

interface LineaItem {
  producto_id: string;
  nombre: string;
  marca: string;
  precio: number;
  cantidad: number;
}

interface NuevaOrdenPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  onError: (msg: string) => void;
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "9px 12px",
  backgroundColor: "var(--color-bg-alt)",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-lg)",
  fontFamily: "var(--font-body)", fontSize: "var(--text-sm)",
  color: "var(--color-text-primary)", outline: "none",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block", fontFamily: "var(--font-body)", fontWeight: 600,
  fontSize: "var(--text-sm)", color: "var(--color-text-on-light)", marginBottom: "5px",
};

const sectionTitle: React.CSSProperties = {
  fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)",
  textTransform: "uppercase", letterSpacing: "0.1em",
  color: "var(--color-text-on-light-faint)", marginBottom: "0.75rem",
};

export function NuevaOrdenPanel({ isOpen, onClose, onSaved, onError }: NuevaOrdenPanelProps) {
  const [productos, setProductos] = useState<ProductoOption[]>([]);
  const [query, setQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [lineas, setLineas] = useState<LineaItem[]>([]);

  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [costoEnvio, setCostoEnvio] = useState("0");
  const [notas, setNotas] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchProductos = useCallback(async () => {
    const { data } = await supabase
      .from("inventario_completo")
      .select("producto_id, producto_nombre, producto_marca, stock_fisico")
      .neq("stock_fisico", 0)
      .order("producto_nombre");
    if (data) {
      const ids = data.map((d) => d.producto_id);
      const { data: precios } = await supabase.from("productos").select("id, precio").in("id", ids).eq("activo", true);
      const precioMap = Object.fromEntries((precios ?? []).map((p) => [p.id, p.precio]));
      setProductos(data.map((d) => ({
        id: d.producto_id,
        nombre: d.producto_nombre,
        marca: d.producto_marca,
        precio: precioMap[d.producto_id] ?? 0,
        stock_fisico: d.stock_fisico,
      })));
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchProductos();
      setLineas([]);
      setNombre(""); setTelefono(""); setDireccion(""); setCiudad("");
      setCostoEnvio("0"); setNotas(""); setFormError(null); setQuery("");
    }
  }, [isOpen, fetchProductos]);

  const filtered = useMemo(() =>
    query.length < 2 ? [] : productos.filter((p) =>
      p.nombre.toLowerCase().includes(query.toLowerCase()) || p.marca.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 8),
    [query, productos]
  );

  const addProducto = (p: ProductoOption) => {
    setLineas((prev) => {
      const exist = prev.find((l) => l.producto_id === p.id);
      if (exist) return prev.map((l) => l.producto_id === p.id ? { ...l, cantidad: l.cantidad + 1 } : l);
      return [...prev, { producto_id: p.id, nombre: p.nombre, marca: p.marca, precio: p.precio, cantidad: 1 }];
    });
    setQuery(""); setShowResults(false);
  };

  const updateCantidad = (id: string, delta: number) => {
    setLineas((prev) => prev
      .map((l) => l.producto_id === id ? { ...l, cantidad: l.cantidad + delta } : l)
      .filter((l) => l.cantidad > 0)
    );
  };

  const subtotal = lineas.reduce((s, l) => s + l.precio * l.cantidad, 0);
  const envio = parseInt(costoEnvio, 10) || 0;
  const total = subtotal + envio;

  const handleSave = async () => {
    setFormError(null);
    if (!nombre.trim()) return setFormError("El nombre es obligatorio.");
    if (lineas.length === 0) return setFormError("Agrega al menos un producto.");
    setSaving(true);
    try {
      const { data: orden, error: ordenErr } = await supabase
        .from("ordenes")
        .insert({
          estado: "pagada",
          subtotal,
          costo_envio: envio,
          total,
          nombre_envio: nombre.trim(),
          telefono_envio: telefono.trim() || null,
          direccion_envio: direccion.trim() || null,
          ciudad_envio: ciudad.trim() || null,
          notas_cliente: notas.trim() || null,
        })
        .select("id")
        .single();
      if (ordenErr || !orden) throw new Error(ordenErr?.message ?? "Error al crear la orden.");

      const { error: itemsErr } = await supabase.from("items_orden").insert(
        lineas.map((l) => ({ orden_id: orden.id, producto_id: l.producto_id, nombre: l.nombre, precio: l.precio, cantidad: l.cantidad, subtotal: l.precio * l.cantidad }))
      );
      if (itemsErr) throw new Error(itemsErr.message);

      for (const l of lineas) {
        const { data: inv } = await supabase.from("inventario").select("stock_fisico").eq("producto_id", l.producto_id).single();
        const antes = inv?.stock_fisico ?? 0;
        const despues = Math.max(0, antes - l.cantidad);
        await supabase.from("inventario").update({ stock_fisico: despues, ultima_salida: new Date().toISOString() }).eq("producto_id", l.producto_id);
        await supabase.from("movimientos_inventario").insert({ producto_id: l.producto_id, tipo: "salida", origen: "venta_fisica", cantidad: l.cantidad, stock_antes: antes, stock_despues: despues, notas: `Orden presencial #${orden.id.slice(0, 8).toUpperCase()}`, referencia_id: orden.id });
      }

      onSaved(); onClose();
    } catch (err) {
      onError((err as Error).message ?? "Error al guardar la orden.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 49, backgroundColor: "rgba(0,0,0,0.5)", opacity: isOpen ? 1 : 0, pointerEvents: isOpen ? "auto" : "none", transition: "opacity 300ms" }} />
      <aside style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "min(540px, 95vw)", backgroundColor: "var(--color-bg-light)", zIndex: 50, display: "flex", flexDirection: "column", transform: isOpen ? "translateX(0)" : "translateX(100%)", transition: "transform 350ms cubic-bezier(0.16, 1, 0.3, 1)", overflow: "hidden" }}>
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--color-border-light)", display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "var(--color-surface-light)" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 600, fontSize: "var(--text-xl)", color: "var(--color-text-on-light)" }}>Nueva orden presencial</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-on-light-faint)" }}><X size={20} /></button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Buscador de productos */}
          <div>
            <p style={sectionTitle}>Agregar productos</p>
            <div style={{ position: "relative" }}>
              <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-on-light-faint)" }} />
              <input
                style={{ ...inputStyle, paddingLeft: "2rem" }}
                placeholder="Buscar producto por nombre o marca..."
                value={query}
                onChange={(e) => { setQuery(e.target.value); setShowResults(true); }}
                onFocus={() => setShowResults(true)}
                onBlur={() => setTimeout(() => setShowResults(false), 200)}
              />
              {showResults && filtered.length > 0 && (
                <div style={{ position: "absolute", top: "100%", left: 0, right: 0, backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", zIndex: 10, maxHeight: "220px", overflowY: "auto", marginTop: "4px" }}>
                  {filtered.map((p) => (
                    <button key={p.id} onMouseDown={() => addProducto(p)}
                      style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", padding: "10px 14px", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--color-text-primary)", textAlign: "left" }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--color-border)"}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                    >
                      <span><span style={{ fontWeight: 600 }}>{p.nombre}</span> <span style={{ color: "var(--color-text-muted)", fontSize: "var(--text-xs)" }}>{p.marca}</span></span>
                      <span style={{ fontFamily: "var(--font-mono)", color: "var(--color-primary)", fontWeight: 600 }}>{formatPrice(p.precio)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Lineas */}
          {lineas.length > 0 && (
            <div>
              <p style={sectionTitle}>Productos en la orden</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {lineas.map((l) => (
                  <div key={l.producto_id} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem", backgroundColor: "var(--color-surface-light)", border: "1px solid var(--color-border-light)", borderRadius: "var(--radius-lg)" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "var(--text-sm)", color: "var(--color-text-on-light)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{l.nombre}</p>
                      <p style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", color: "var(--color-text-on-light-faint)" }}>{formatPrice(l.precio)} c/u</p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                      <button onClick={() => updateCantidad(l.producto_id, -1)} style={{ background: "none", border: "1px solid var(--color-border-light)", borderRadius: "50%", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--color-text-on-light-faint)" }}><Minus size={10} /></button>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)", minWidth: "16px", textAlign: "center", color: "var(--color-text-on-light)", fontWeight: 600 }}>{l.cantidad}</span>
                      <button onClick={() => updateCantidad(l.producto_id, 1)} style={{ background: "none", border: "1px solid var(--color-border-light)", borderRadius: "50%", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--color-text-on-light-faint)" }}><Plus size={10} /></button>
                    </div>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--color-text-on-light)", minWidth: "72px", textAlign: "right" }}>{formatPrice(l.precio * l.cantidad)}</span>
                    <button onClick={() => setLineas((p) => p.filter((x) => x.producto_id !== l.producto_id))} style={{ background: "none", border: "none", color: "var(--color-error)", cursor: "pointer" }}><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid var(--color-border-light)" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "var(--text-sm)", color: "var(--color-text-on-light)" }}>Total</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "var(--text-base)", color: "var(--color-primary-dim)" }}>{formatPrice(total)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Datos del cliente */}
          <div>
            <p style={sectionTitle}>Datos del cliente</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
              <div><label style={labelStyle}>Nombre *</label><input style={inputStyle} value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre del cliente" /></div>
              <div><label style={labelStyle}>Telefono</label><input style={inputStyle} value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="Opcional" /></div>
              <div><label style={labelStyle}>Direccion de envio</label><input style={inputStyle} value={direccion} onChange={(e) => setDireccion(e.target.value)} placeholder="Opcional si es presencial" /></div>
              <div><label style={labelStyle}>Ciudad</label><input style={inputStyle} value={ciudad} onChange={(e) => setCiudad(e.target.value)} placeholder="Opcional" /></div>
              <div><label style={labelStyle}>Costo de envio (COP)</label><input style={inputStyle} type="number" min="0" value={costoEnvio} onChange={(e) => setCostoEnvio(e.target.value)} /></div>
              <div><label style={labelStyle}>Notas</label><textarea style={{ ...inputStyle, resize: "vertical", minHeight: "70px" }} value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Observaciones..." /></div>
            </div>
          </div>

          {formError && <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--color-error)", backgroundColor: "rgba(224,82,82,0.1)", padding: "10px 14px", borderRadius: "var(--radius-lg)", border: "1px solid rgba(224,82,82,0.3)" }}>{formError}</p>}
        </div>

        <div style={{ padding: "1.25rem 1.5rem", borderTop: "1px solid var(--color-border-light)", backgroundColor: "var(--color-surface-light)" }}>
          <Button variant="accent" size="md" className="w-full" onClick={handleSave} disabled={saving}>
            {saving ? "Guardando..." : "Registrar orden presencial"}
          </Button>
        </div>
      </aside>
    </>
  );
}
