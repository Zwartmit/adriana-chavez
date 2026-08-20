import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase/client";

interface AjustarUmbralesModalProps {
  productoId: string;
  productoNombre: string;
  stockVirtual: number;
  stockFisico: number;
  umbralAlerta: number;
  onClose: () => void;
  onSaved: () => void;
  onError: (message: string) => void;
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

export function AjustarUmbralesModal({
  productoId,
  productoNombre,
  stockVirtual,
  stockFisico,
  umbralAlerta,
  onClose,
  onSaved,
  onError,
}: AjustarUmbralesModalProps) {
  const [virtual, setVirtual] = useState(String(stockVirtual));
  const [fisico, setFisico] = useState(String(stockFisico));
  const [umbral, setUmbral] = useState(String(umbralAlerta));
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setVirtual(String(stockVirtual));
    setFisico(String(stockFisico));
    setUmbral(String(umbralAlerta));
  }, [productoId, stockVirtual, stockFisico, umbralAlerta]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const virtualNum = Number(virtual);
    const fisicoNum = Number(fisico);
    const umbralNum = Number(umbral);

    if (Number.isNaN(virtualNum) || Number.isNaN(fisicoNum) || Number.isNaN(umbralNum) || umbralNum < 1) {
      setFormError("Verifica los valores ingresados.");
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from("inventario")
      .update({ stock_virtual: virtualNum, stock_fisico: fisicoNum, umbral_alerta: umbralNum })
      .eq("producto_id", productoId);
    setSaving(false);

    if (error) {
      console.error("[AjustarUmbralesModal] error al guardar:", error.message);
      onError("No se pudieron guardar los umbrales.");
      return;
    }

    onSaved();
    onClose();
  };

  return (
    <div
      onClick={() => !saving && onClose()}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 75,
        backgroundColor: "rgba(0,0,0,0.65)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass-frosted"
        style={{
          width: "100%",
          maxWidth: "400px",
          borderRadius: "var(--radius-2xl)",
          padding: "2rem",
          position: "relative",
        }}
      >
        <button
          type="button"
          aria-label="Cerrar"
          onClick={onClose}
          style={{ position: "absolute", top: "1.25rem", right: "1.25rem", color: "var(--color-text-muted)" }}
        >
          <X size={20} />
        </button>

        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontStyle: "italic",
            fontWeight: 600,
            fontSize: "var(--text-xl)",
            color: "var(--color-text-primary)",
            marginBottom: "1.5rem",
            paddingRight: "1.5rem",
          }}
        >
          {productoNombre}
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label style={labelStyle}>Stock virtual</label>
            <input type="number" min={0} value={virtual} onChange={(e) => setVirtual(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Stock físico</label>
            <input type="number" min={0} value={fisico} onChange={(e) => setFisico(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Umbral de alerta</label>
            <input type="number" min={1} value={umbral} onChange={(e) => setUmbral(e.target.value)} style={inputStyle} />
          </div>

          {formError && (
            <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--color-error)" }}>
              {formError}
            </p>
          )}

          <Button type="submit" variant="accent" size="md" className="w-full" disabled={saving}>
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </form>
      </div>
    </div>
  );
}
