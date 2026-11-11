import { useState } from "react";
import { Button } from "@/components/ui/Button";

export interface InsumoFormData {
  nombre: string;
  marca: string;
  categoria_id: string;
  unidad: string;
  umbral_alerta: number;
  stock_inicial: number;
}

interface InsumoFormProps {
  initialData?: Partial<InsumoFormData>;
  categorias: { id: string; nombre: string }[];
  esNuevo: boolean;
  isSubmitting: boolean;
  onSubmit: (data: InsumoFormData) => void;
  onCancel: () => void;
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  backgroundColor: "transparent",
  border: "1px solid rgba(10, 10, 11, 0.2)",
  borderRadius: "var(--radius-lg)",
  fontFamily: "var(--font-body)",
  fontSize: "var(--text-base)",
  color: "var(--color-text-on-light)",
  outline: "none",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontFamily: "var(--font-body)",
  fontSize: "var(--text-xs)",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "var(--tracking-wide)",
  color: "var(--color-text-on-light)",
  marginBottom: "0.5rem",
};

const ayudaStyle: React.CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: "var(--text-xs)",
  color: "var(--color-text-on-light-faint)",
  marginTop: 6,
};

export function InsumoForm({ initialData, categorias, esNuevo, isSubmitting, onSubmit, onCancel }: InsumoFormProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const [nombre, setNombre] = useState(initialData?.nombre ?? "");
  const [marca, setMarca] = useState(initialData?.marca ?? "");
  const [categoriaId, setCategoriaId] = useState(initialData?.categoria_id ?? "");
  const [unidad, setUnidad] = useState(initialData?.unidad ?? "unidad");
  const [umbral, setUmbral] = useState(String(initialData?.umbral_alerta ?? 2));
  const [stockInicial, setStockInicial] = useState("0");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const umbralNum = Number(umbral);
    const stockNum = Number(stockInicial);
    if (!nombre.trim()) return setFormError("Escribe el nombre del insumo (por ejemplo, Koleston 7/1).");
    if (!marca.trim()) return setFormError("Escribe la marca.");
    if (!categoriaId) return setFormError("Elige la categoría.");
    if (!unidad.trim()) return setFormError("Escribe la unidad (tubo, frasco, caja…).");
    if (!Number.isInteger(umbralNum) || umbralNum < 0) return setFormError("El nivel bajo debe ser un número entero de 0 o más.");
    if (esNuevo && (!Number.isInteger(stockNum) || stockNum < 0)) return setFormError("El stock inicial debe ser un número entero de 0 o más.");
    setFormError(null);
    onSubmit({
      nombre: nombre.trim(),
      marca: marca.trim(),
      categoria_id: categoriaId,
      unidad: unidad.trim(),
      umbral_alerta: umbralNum,
      stock_inicial: esNuevo ? stockNum : 0,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label style={labelStyle}>Nombre del insumo *</label>
          <input required type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} style={inputStyle} maxLength={120} />
        </div>
        <div>
          <label style={labelStyle}>Marca *</label>
          <input required type="text" value={marca} onChange={(e) => setMarca(e.target.value)} style={inputStyle} maxLength={80} />
        </div>
        <div>
          <label style={labelStyle}>Categoría *</label>
          <select required value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)} style={inputStyle}>
            <option value="">Selecciona una categoría</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Unidad *</label>
          <input required type="text" value={unidad} onChange={(e) => setUnidad(e.target.value)} style={inputStyle} maxLength={30} placeholder="tubo, frasco, caja…" />
        </div>
        <div>
          <label style={labelStyle}>Nivel bajo</label>
          <input type="number" min={0} step={1} value={umbral} onChange={(e) => setUmbral(e.target.value)} style={inputStyle} />
          <p style={ayudaStyle}>Con esta cantidad o menos, el insumo se marca como crítico en la lista.</p>
        </div>
        {esNuevo && (
          <div>
            <label style={labelStyle}>Cantidad que hay ahora</label>
            <input type="number" min={0} step={1} value={stockInicial} onChange={(e) => setStockInicial(e.target.value)} style={inputStyle} />
            <p style={ayudaStyle}>Queda anotada como el stock inicial.</p>
          </div>
        )}
      </div>

      {formError && (
        <p role="alert" className="text-sm rounded-lg p-3" style={{ color: "#B91C1C", backgroundColor: "#FEF2F2", border: "1px solid #FECACA" }}>
          {formError}
        </p>
      )}

      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          style={{
            padding: "10px 24px",
            borderRadius: "var(--radius-full)",
            border: "2px solid var(--color-primary-dim)",
            backgroundColor: "transparent",
            color: "var(--color-primary)",
            fontFamily: "var(--font-body)",
            fontWeight: 600,
            fontSize: "var(--text-sm)",
            cursor: isSubmitting ? "not-allowed" : "pointer",
            opacity: isSubmitting ? 0.5 : 1,
          }}
        >
          Cancelar
        </button>
        <Button type="submit" variant="accent" size="md" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : "Guardar insumo"}
        </Button>
      </div>
    </form>
  );
}
