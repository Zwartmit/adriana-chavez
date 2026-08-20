import { useCallback, useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase/client";

interface ProductoOption {
  id: string;
  nombre: string;
  marca: string;
}

interface PreselectedProducto {
  id: string;
  nombre: string;
  marca: string;
}

interface MovimientoPanelProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTipo: "entrada" | "salida";
  preselectedProducto?: PreselectedProducto | null;
  onSaved: () => void;
  onError: (message: string) => void;
}

const ENTRADA_ORIGENES = [
  { value: "compra", label: "Compra" },
  { value: "devolucion", label: "Devolución" },
  { value: "ajuste_manual", label: "Ajuste manual" },
];

const SALIDA_ORIGENES = [
  { value: "venta_online", label: "Venta online" },
  { value: "venta_fisica", label: "Venta física" },
  { value: "ajuste_manual", label: "Ajuste manual" },
];

// La "salida" y "entrada" afectan un campo de stock distinto según el
// origen: ventas/movimientos online tocan stock_virtual, todo lo demás
// (compras, devoluciones, ventas físicas, ajustes manuales) toca stock_fisico.
function campoAfectado(origen: string): "stock_virtual" | "stock_fisico" {
  return origen === "venta_online" ? "stock_virtual" : "stock_fisico";
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  backgroundColor: "var(--color-bg-alt)",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-lg)",
  fontFamily: "var(--font-body)",
  fontSize: "var(--text-sm)",
  color: "var(--color-text-primary)",
  outline: "none",
};

const labelStyle: React.CSSProperties = {
  fontFamily: "var(--font-body)",
  fontWeight: 600,
  fontSize: "var(--text-sm)",
  color: "var(--color-text-primary)",
  display: "block",
  marginBottom: "6px",
};

export function MovimientoPanel({
  isOpen,
  onClose,
  defaultTipo,
  preselectedProducto,
  onSaved,
  onError,
}: MovimientoPanelProps) {
  const [tipo, setTipo] = useState<"entrada" | "salida">(defaultTipo);
  const [productos, setProductos] = useState<ProductoOption[]>([]);
  const [productoQuery, setProductoQuery] = useState("");
  const [selectedProducto, setSelectedProducto] = useState<ProductoOption | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [origen, setOrigen] = useState("");
  const [cantidad, setCantidad] = useState("1");
  const [notas, setNotas] = useState("");
  const [stockActual, setStockActual] = useState<{ virtual: number; fisico: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const origenes = tipo === "entrada" ? ENTRADA_ORIGENES : SALIDA_ORIGENES;

  useEffect(() => {
    if (!isOpen) return;
    setTipo(defaultTipo);
    setOrigen("");
    if (preselectedProducto) {
      setSelectedProducto(preselectedProducto);
      setProductoQuery("");
    }
  }, [isOpen, defaultTipo, preselectedProducto]);

  useEffect(() => {
    if (!isOpen) return;
    supabase
      .from("productos")
      .select("id, nombre, marca")
      .eq("activo", true)
      .order("nombre", { ascending: true })
      .then(({ data }) => setProductos(data ?? []));
  }, [isOpen]);

  useEffect(() => {
    if (!selectedProducto) {
      setStockActual(null);
      return;
    }
    supabase
      .from("inventario")
      .select("stock_virtual, stock_fisico")
      .eq("producto_id", selectedProducto.id)
      .maybeSingle()
      .then(({ data }) => {
        setStockActual(data ? { virtual: data.stock_virtual, fisico: data.stock_fisico } : { virtual: 0, fisico: 0 });
      });
  }, [selectedProducto]);

  const resultados = useMemo(() => {
    const q = productoQuery.trim().toLowerCase();
    if (!q) return productos;
    return productos.filter((p) => p.nombre.toLowerCase().includes(q) || p.marca.toLowerCase().includes(q));
  }, [productos, productoQuery]);

  const cantidadNum = Number(cantidad) || 0;
  const stockActualTotal = stockActual ? stockActual.virtual + stockActual.fisico : null;
  const stockDespues =
    stockActualTotal === null ? null : tipo === "entrada" ? stockActualTotal + cantidadNum : stockActualTotal - cantidadNum;

  const resetForm = useCallback(() => {
    setProductoQuery("");
    setSelectedProducto(null);
    setOrigen("");
    setCantidad("1");
    setNotas("");
    setStockActual(null);
    setFormError(null);
  }, []);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedProducto || !origen || cantidadNum < 1) {
      setFormError("Completa todos los campos requeridos.");
      return;
    }

    setSubmitting(true);

    const { data: inventarioActual, error: fetchError } = await supabase
      .from("inventario")
      .select("stock_virtual, stock_fisico")
      .eq("producto_id", selectedProducto.id)
      .maybeSingle();

    if (fetchError || !inventarioActual) {
      console.error("[MovimientoPanel] error al leer inventario:", fetchError?.message);
      setFormError("No se pudo leer el inventario actual.");
      setSubmitting(false);
      return;
    }

    const stockAntesTotal = inventarioActual.stock_virtual + inventarioActual.stock_fisico;
    const campo = campoAfectado(origen);
    const valorActualCampo = campo === "stock_virtual" ? inventarioActual.stock_virtual : inventarioActual.stock_fisico;
    const delta = tipo === "entrada" ? cantidadNum : -cantidadNum;
    const nuevoValorCampo = valorActualCampo + delta;
    const stockDespuesTotal = stockAntesTotal + delta;

    const { error: updateError } = await supabase
      .from("inventario")
      .update({
        [campo]: nuevoValorCampo,
        ...(tipo === "entrada" ? { ultima_entrada: new Date().toISOString() } : { ultima_salida: new Date().toISOString() }),
      })
      .eq("producto_id", selectedProducto.id);

    if (updateError) {
      console.error("[MovimientoPanel] error al actualizar inventario:", updateError.message);
      setFormError("No se pudo actualizar el inventario.");
      setSubmitting(false);
      return;
    }

    const { error: movError } = await supabase.from("movimientos_inventario").insert({
      producto_id: selectedProducto.id,
      tipo,
      origen,
      cantidad: cantidadNum,
      stock_antes: stockAntesTotal,
      stock_despues: stockDespuesTotal,
      notas: notas.trim() || null,
    });

    setSubmitting(false);

    if (movError) {
      console.error("[MovimientoPanel] error al registrar movimiento:", movError.message);
      onError("El inventario se actualizó pero no se pudo registrar el movimiento.");
      resetForm();
      onSaved();
      onClose();
      return;
    }

    resetForm();
    onSaved();
    onClose();
  };

  return (
    <>
      <div
        onClick={handleClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 69,
          backgroundColor: "rgba(0,0,0,0.6)",
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          transition: "opacity 350ms ease",
        }}
      />

      <aside
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "min(440px, 95vw)",
          backgroundColor: "var(--color-surface)",
          zIndex: 70,
          display: "flex",
          flexDirection: "column",
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 350ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <div
          className="flex items-center justify-between"
          style={{
            background: "linear-gradient(135deg, rgba(232,201,122,0.1) 0%, rgba(26,24,32,0.95) 100%)",
            borderBottom: "0.5px solid rgba(232,201,122,0.25)",
            padding: "1.25rem 1.5rem",
            flexShrink: 0,
          }}
        >
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontSize: "var(--text-xl)",
              color: "white",
            }}
          >
            Registrar movimiento
          </h2>
          <button type="button" aria-label="Cerrar" onClick={handleClose} style={{ color: "white" }}>
            <X size={22} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem",
          }}
        >
          {/* Tipo */}
          <div>
            <label style={labelStyle}>Tipo *</label>
            <div className="flex gap-2">
              {(["entrada", "salida"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setTipo(t);
                    setOrigen("");
                  }}
                  style={{
                    flex: 1,
                    padding: "10px 0",
                    borderRadius: "var(--radius-lg)",
                    border: `1px solid ${tipo === t ? "var(--color-primary)" : "var(--color-border)"}`,
                    backgroundColor: tipo === t ? "var(--color-accent-lt)" : "transparent",
                    color: tipo === t ? "var(--color-primary)" : "var(--color-text-secondary)",
                    fontFamily: "var(--font-body)",
                    fontWeight: 600,
                    fontSize: "var(--text-sm)",
                    cursor: "pointer",
                    textTransform: "capitalize",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Producto */}
          <div style={{ position: "relative" }}>
            <label style={labelStyle}>Producto *</label>
            <input
              type="text"
              placeholder="Buscar producto..."
              value={selectedProducto ? `${selectedProducto.nombre} — ${selectedProducto.marca}` : productoQuery}
              onChange={(e) => {
                setSelectedProducto(null);
                setProductoQuery(e.target.value);
                setShowResults(true);
              }}
              onFocus={() => setShowResults(true)}
              style={inputStyle}
            />
            {showResults && !selectedProducto && resultados.length > 0 && (
              <div
                className="glass-obsidian"
                style={{
                  position: "absolute",
                  top: "calc(100% + 4px)",
                  left: 0,
                  right: 0,
                  zIndex: 10,
                  borderRadius: "var(--radius-lg)",
                  backgroundColor: "var(--color-bg-alt)",
                  maxHeight: "220px",
                  overflowY: "auto",
                }}
              >
                {resultados.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setSelectedProducto(p);
                      setShowResults(false);
                    }}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      padding: "10px 14px",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      fontFamily: "var(--font-body)",
                      fontSize: "var(--text-sm)",
                      color: "var(--color-text-primary)",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--glass-champagne-bg)")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    {p.nombre}
                    <span style={{ color: "var(--color-text-muted)", marginLeft: 8, fontSize: "var(--text-xs)" }}>
                      {p.marca}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Origen */}
          <div>
            <label style={labelStyle}>Origen *</label>
            <select value={origen} onChange={(e) => setOrigen(e.target.value)} style={inputStyle}>
              <option value="">Selecciona un origen</option>
              {origenes.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* Cantidad */}
          <div>
            <label style={labelStyle}>Cantidad *</label>
            <input
              type="number"
              min={1}
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Notas */}
          <div>
            <label style={labelStyle}>Notas (opcional)</label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={3}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>

          {/* Preview */}
          {stockActualTotal !== null && (
            <div
              style={{
                padding: "0.85rem 1rem",
                borderRadius: "var(--radius-lg)",
                backgroundColor: "var(--color-bg-alt)",
                border: "1px solid var(--color-border)",
              }}
            >
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                Stock actual: <strong style={{ color: "var(--color-text-primary)" }}>{stockActualTotal}</strong>
                {" → "}
                Stock después:{" "}
                <strong style={{ color: stockDespues !== null && stockDespues <= 0 ? "var(--color-error)" : "var(--color-primary)" }}>
                  {stockDespues}
                </strong>
              </p>
              {stockDespues !== null && stockDespues <= 0 && (
                <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", color: "var(--color-error)", marginTop: 6 }}>
                  Esta salida dejará el producto sin stock.
                </p>
              )}
            </div>
          )}

          {formError && (
            <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--color-error)" }}>
              {formError}
            </p>
          )}

          <Button type="submit" variant="accent" size="lg" className="w-full" disabled={submitting}>
            {submitting ? "Guardando..." : "Registrar movimiento"}
          </Button>
        </form>
      </aside>
    </>
  );
}
