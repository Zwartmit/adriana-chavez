import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ShoppingBag, Trash2, Minus, Plus, ArrowLeft } from "lucide-react";
import { useCart } from "@/lib/cart/CartContext";
import { formatPrice } from "@/lib/utils";
import { supabase } from "@/lib/supabase/client";

export const Route = createFileRoute("/tienda/carrito")({
  component: CheckoutPage,
});

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "11px 14px",
  backgroundColor: "var(--color-bg-light-alt)",
  border: "1px solid var(--color-border-light)",
  borderRadius: "var(--radius-lg)",
  fontFamily: "var(--font-body)",
  fontSize: "var(--text-sm)",
  color: "var(--color-text-on-light)",
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 200ms",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontFamily: "var(--font-body)",
  fontWeight: 600,
  fontSize: "var(--text-sm)",
  color: "var(--color-text-on-light-muted)",
  marginBottom: "6px",
};

function CheckoutPage() {
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem, clearCart, totalPrice } = useCart();

  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [notas, setNotas] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setFormError(null);
    if (!nombre.trim()) return setFormError("El nombre es obligatorio.");
    if (!telefono.trim()) return setFormError("El teléfono es obligatorio.");
    if (!direccion.trim()) return setFormError("La dirección es obligatoria.");
    if (!ciudad.trim()) return setFormError("La ciudad es obligatoria.");
    if (items.length === 0) return setFormError("El carrito está vacío.");

    setSubmitting(true);

    try {
      const { data: orden, error: ordenError } = await supabase
        .from("ordenes")
        .insert({
          estado: "pendiente",
          subtotal: totalPrice,
          costo_envio: 0,
          total: totalPrice,
          nombre_envio: nombre.trim(),
          telefono_envio: telefono.trim(),
          direccion_envio: direccion.trim(),
          ciudad_envio: ciudad.trim(),
          notas_cliente: notas.trim() || null,
        })
        .select("id")
        .single();

      if (ordenError || !orden) throw new Error(ordenError?.message ?? "Error al crear la orden.");

      const itemsOrden = items.map((item) => ({
        orden_id: orden.id,
        producto_id: item.id,
        nombre: item.name,
        precio: item.price,
        cantidad: item.quantity,
        subtotal: item.price * item.quantity,
      }));

      const { error: itemsError } = await supabase.from("items_orden").insert(itemsOrden);
      if (itemsError) throw new Error(itemsError.message);

      for (const item of items) {
        const { data: inv } = await supabase
          .from("inventario")
          .select("stock_virtual")
          .eq("producto_id", item.id)
          .single();

        const stockAntes = inv?.stock_virtual ?? 0;
        const stockDespues = Math.max(0, stockAntes - item.quantity);

        await supabase
          .from("inventario")
          .update({ stock_virtual: stockDespues, ultima_salida: new Date().toISOString() })
          .eq("producto_id", item.id);

        await supabase.from("movimientos_inventario").insert({
          producto_id: item.id,
          tipo: "salida",
          origen: "venta_online",
          cantidad: item.quantity,
          stock_antes: stockAntes,
          stock_despues: stockDespues,
          notas: `Orden #${orden.id.slice(0, 8).toUpperCase()}`,
          referencia_id: orden.id,
        });
      }

      clearCart();
      navigate({ to: "/tienda/orden-confirmada", search: { id: orden.id } });
    } catch (err) {
      setFormError((err as Error).message ?? "Ocurrió un error al procesar tu pedido.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--color-bg-light)", color: "var(--color-text-on-light)", paddingTop: "6rem", paddingBottom: "4rem" }}>
      <div className="mx-auto" style={{ maxWidth: "1100px", padding: "0 1.5rem" }}>
        <a href="/tienda" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)", color: "var(--color-text-on-light-muted)", textDecoration: "none", marginBottom: "2rem", transition: "color 200ms" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-primary)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-on-light-muted)")}>
          <ArrowLeft size={14} /> Volver a la tienda
        </a>

        <h1 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 600, fontSize: "clamp(1.75rem, 3vw, 2.5rem)", marginBottom: "2.5rem", color: "var(--color-text-on-light)" }}>
          Finalizar compra
        </h1>

        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-6" style={{ paddingTop: "4rem", textAlign: "center" }}>
            <ShoppingBag size={56} style={{ color: "var(--color-text-on-light-faint)" }} />
            <p style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: "var(--text-2xl)", color: "var(--color-text-on-light-muted)" }}>Tu carrito está vacío</p>
            <a href="/tienda"><button style={{ padding: "12px 28px", backgroundColor: "var(--color-primary)", color: "var(--color-text-inverse)", border: "none", borderRadius: "var(--radius-full)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "var(--text-sm)", cursor: "pointer" }}>Explorar productos</button></a>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 items-start">
            <div>
              <h2 style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "var(--text-lg)", marginBottom: "1.25rem", color: "var(--color-text-on-light)" }}>
                Tu pedido ({items.length} {items.length === 1 ? "producto" : "productos"})
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                {items.map((item) => (
                  <div key={item.id} style={{ display: "flex", gap: "1rem", alignItems: "center", padding: "1rem", borderRadius: "var(--radius-xl)", backgroundColor: "var(--color-surface-light)", border: "1px solid var(--color-border-light)" }}>
                    {item.image ? (
                       <img src={item.image} alt={item.name} style={{ width: 68, height: 68, objectFit: "cover", borderRadius: "var(--radius-lg)", flexShrink: 0, border: "1px solid var(--color-border-light)" }} />
                    ) : (
                       <div style={{ width: 68, height: 68, borderRadius: "var(--radius-lg)", backgroundColor: "var(--color-bg-light-alt)", flexShrink: 0 }} />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "var(--text-sm)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "var(--color-text-on-light)" }}>{item.name}</p>
                      <p style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", color: "var(--color-text-on-light-muted)", marginTop: "2px" }}>{item.brand}</p>
                      <p style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)", color: "var(--color-primary)", fontWeight: 600, marginTop: "4px" }}>{formatPrice(item.price)}</p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)} style={{ background: "none", border: "1px solid var(--color-border-light)", borderRadius: "50%", width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--color-text-on-light-muted)" }}><Minus size={11} /></button>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)", minWidth: "18px", textAlign: "center", color: "var(--color-text-on-light)" }}>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)} style={{ background: "none", border: "1px solid var(--color-border-light)", borderRadius: "50%", width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--color-text-on-light-muted)" }}><Plus size={11} /></button>
                    </div>
                    <p style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "var(--text-sm)", minWidth: "80px", textAlign: "right", color: "var(--color-text-on-light)" }}>{formatPrice(item.price * item.quantity)}</p>
                    <button onClick={() => removeItem(item.id)} style={{ background: "none", border: "none", color: "var(--color-error)", cursor: "pointer", padding: "4px", flexShrink: 0 }}><Trash2 size={15} /></button>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: "1.5rem", borderTop: "1px solid var(--color-border-light)", paddingTop: "1.25rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <div className="flex justify-between"><span style={{ fontFamily: "var(--font-body)", color: "var(--color-text-on-light-muted)", fontSize: "var(--text-sm)" }}>Subtotal</span><span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)", color: "var(--color-text-on-light)" }}>{formatPrice(totalPrice)}</span></div>
                <div className="flex justify-between"><span style={{ fontFamily: "var(--font-body)", color: "var(--color-text-on-light-muted)", fontSize: "var(--text-sm)" }}>Costo de envío</span><span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)", color: "var(--color-text-on-light-faint)" }}>A confirmar</span></div>
                <div className="flex justify-between" style={{ borderTop: "1px solid var(--color-border-light)", paddingTop: "0.75rem", marginTop: "0.25rem" }}>
                  <span style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "var(--text-base)", color: "var(--color-text-on-light)" }}>Total productos</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "var(--text-lg)", color: "var(--color-primary)" }}>{formatPrice(totalPrice)}</span>
                </div>
              </div>
            </div>

            <div style={{ backgroundColor: "var(--color-surface-light)", border: "1px solid var(--color-border-light)", borderRadius: "var(--radius-2xl)", padding: "1.75rem", position: "sticky", top: "6rem", boxShadow: "0 10px 40px -10px rgba(0,0,0,0.04)" }}>
              <h2 style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "var(--text-lg)", marginBottom: "1.5rem", color: "var(--color-text-on-light)" }}>Datos de envío</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div><label style={labelStyle}>Nombre completo *</label><input style={inputStyle} placeholder="Ej: María García" value={nombre} onChange={(e) => setNombre(e.target.value)} /></div>
                <div><label style={labelStyle}>Teléfono / WhatsApp *</label><input style={inputStyle} placeholder="Ej: 300 123 4567" value={telefono} onChange={(e) => setTelefono(e.target.value)} type="tel" /></div>
                <div><label style={labelStyle}>Dirección *</label><input style={inputStyle} placeholder="Ej: Calle 10 #25-30, Apto 3B" value={direccion} onChange={(e) => setDireccion(e.target.value)} /></div>
                <div><label style={labelStyle}>Ciudad *</label><input style={inputStyle} placeholder="Ej: Medellín" value={ciudad} onChange={(e) => setCiudad(e.target.value)} /></div>
                <div><label style={labelStyle}>Notas adicionales</label><textarea style={{ ...inputStyle, resize: "vertical", minHeight: "76px" }} placeholder="Instrucciones especiales para la entrega..." value={notas} onChange={(e) => setNotas(e.target.value)} /></div>
                {formError && (<p style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--color-error)", backgroundColor: "rgba(224,82,82,0.08)", padding: "10px 14px", borderRadius: "var(--radius-lg)", border: "1px solid rgba(224,82,82,0.2)" }}>{formError}</p>)}
                <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", color: "var(--color-text-on-light-muted)", lineHeight: 1.6 }}>Un asesor se pondrá en contacto contigo para coordinar el pago y confirmar el envío.</p>
                <button onClick={handleConfirm} disabled={submitting} style={{ width: "100%", padding: "14px 20px", backgroundColor: submitting ? "var(--color-text-on-light-faint)" : "var(--color-primary)", color: "var(--color-text-inverse)", border: "none", borderRadius: "var(--radius-full)", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "var(--text-sm)", cursor: submitting ? "not-allowed" : "pointer", transition: "background-color 200ms", letterSpacing: "0.02em", marginTop: "0.5rem" }}>
                  {submitting ? "Procesando..." : "Confirmar pedido ->"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
