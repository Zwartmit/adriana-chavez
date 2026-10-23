import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/QueryState";
import { supabase } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";

interface MovimientoSaldo {
  id: number;
  tipo: "anticipo_cancelacion" | "canje_productos" | "ajuste";
  monto: number;
  nota: string | null;
  creado_en: string;
}

interface SaldoFavorCardProps {
  clienteId: string;
  onToast: (message: string, type?: "success" | "error") => void;
}

const TIPO_LABEL: Record<MovimientoSaldo["tipo"], string> = {
  anticipo_cancelacion: "Anticipo de cita cancelada",
  canje_productos: "Canje en productos",
  ajuste: "Ajuste",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: "6px",
  fontFamily: "var(--font-mono)",
  fontSize: "var(--text-xs)",
  textTransform: "uppercase",
  letterSpacing: "var(--tracking-wider)",
  color: "var(--color-text-on-light-faint)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  backgroundColor: "var(--color-bg-light)",
  border: "1px solid var(--color-border-light)",
  borderRadius: "var(--radius-lg)",
  fontFamily: "var(--font-body)",
  fontSize: "var(--text-sm)",
  color: "var(--color-text-on-light)",
  outline: "none",
};

export function SaldoFavorCard({ clienteId, onToast }: SaldoFavorCardProps) {
  const [movimientos, setMovimientos] = useState<MovimientoSaldo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [modo, setModo] = useState<"canje" | "ajuste" | null>(null);
  const [monto, setMonto] = useState("");
  const [signo, setSigno] = useState<"suma" | "resta">("suma");
  const [nota, setNota] = useState("");
  const [saving, setSaving] = useState(false);
  const [verTodo, setVerTodo] = useState(false);

  const fetchMovimientos = useCallback(async () => {
    setLoading(true);
    setError(false);
    const { data, error } = await supabase
      .from("movimientos_saldo")
      .select("id, tipo, monto, nota, creado_en")
      .eq("cliente_id", clienteId)
      .order("creado_en", { ascending: false })
      .order("id", { ascending: false });
    if (error) {
      console.error("[SaldoFavor] error al cargar movimientos:", error.message);
      setError(true);
      setLoading(false);
      return;
    }
    setMovimientos(((data ?? []) as MovimientoSaldo[]).map((m) => ({ ...m, monto: Number(m.monto) })));
    setLoading(false);
  }, [clienteId]);

  useEffect(() => {
    fetchMovimientos();
  }, [fetchMovimientos]);

  const saldo = movimientos.reduce((sum, m) => sum + m.monto, 0);
  const valor = Number(monto.replace(/\D/g, ""));
  const visibles = verTodo ? movimientos : movimientos.slice(0, 5);

  const cerrarForm = () => {
    setModo(null);
    setMonto("");
    setNota("");
    setSigno("suma");
  };

  const handleGuardar = async () => {
    if (!modo || !valor) return;
    if (modo === "canje" && valor > saldo) {
      onToast("El canje supera el saldo a favor de la clienta.", "error");
      return;
    }
    if (modo === "ajuste" && !nota.trim()) {
      onToast("Escribe el motivo del ajuste.", "error");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("movimientos_saldo").insert({
      cliente_id: clienteId,
      tipo: modo === "canje" ? "canje_productos" : "ajuste",
      monto: modo === "canje" || signo === "resta" ? -valor : valor,
      nota: nota.trim() || null,
    });
    setSaving(false);
    if (error) {
      console.error("[SaldoFavor] error al registrar movimiento:", error.message);
      onToast(
        error.message.includes("no alcanza")
          ? "El saldo a favor de la clienta no alcanza."
          : "No se pudo registrar el movimiento.",
        "error",
      );
      return;
    }
    cerrarForm();
    fetchMovimientos();
    onToast(modo === "canje" ? "Canje registrado" : "Ajuste registrado");
  };

  return (
    <div
      className="p-5 md:p-7"
      style={{
        borderRadius: "var(--radius-2xl)",
        backgroundColor: "var(--color-surface-light)",
        border: "1px solid var(--color-border-light-gold)",
        boxShadow: "0 2px 12px rgba(10,10,11,0.08)",
      }}
    >
      <p
        className="uppercase"
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "var(--text-xs)",
          letterSpacing: "var(--tracking-wider)",
          color: "var(--color-gold-on-light)",
          marginBottom: "0.75rem",
        }}
      >
        Saldo a favor en productos
      </p>

      {loading ? (
        <LoadingState variant="light" />
      ) : error ? (
        <div>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--color-error)", marginBottom: "0.75rem" }}>
            No se pudo cargar el saldo.
          </p>
          <Button variant="outline" size="sm" onClick={fetchMovimientos}>
            Reintentar
          </Button>
        </div>
      ) : (
        <>
          <p
            style={{
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontWeight: 600,
              fontSize: "var(--text-3xl)",
              color: saldo > 0 ? "var(--color-text-on-light)" : "var(--color-text-on-light-faint)",
              lineHeight: 1.1,
            }}
          >
            {formatPrice(saldo)}
          </p>
          <p
            style={{
              marginTop: "6px",
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-xs)",
              color: "var(--color-text-on-light-faint)",
            }}
          >
            El anticipo no se devuelve en dinero: si la clienta cancela con 24 horas o más, su valor queda aquí para
            llevarse en productos (sin plazo). Con menos de 24 horas, el anticipo se pierde.
          </p>

          {modo === null ? (
            <div className="flex flex-col sm:flex-row gap-3" style={{ marginTop: "1.25rem" }}>
              <Button className="w-full sm:w-auto" variant="accent" size="sm" disabled={saldo <= 0} onClick={() => setModo("canje")}>
                Registrar canje en productos
              </Button>
              <Button className="w-full sm:w-auto" variant="outline" size="sm" onClick={() => setModo("ajuste")}>
                Hacer un ajuste
              </Button>
            </div>
          ) : (
            <div
              className="flex flex-col gap-3"
              style={{
                marginTop: "1.25rem",
                padding: "1rem",
                backgroundColor: "var(--color-bg-light)",
                borderRadius: "var(--radius-lg)",
              }}
            >
              <p style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "var(--text-sm)", color: "var(--color-text-on-light)" }}>
                {modo === "canje" ? "Canje en productos" : "Ajuste de saldo"}
              </p>
              {modo === "ajuste" && (
                <div>
                  <label style={labelStyle}>Tipo de ajuste</label>
                  <select value={signo} onChange={(e) => setSigno(e.target.value as "suma" | "resta")} style={inputStyle}>
                    <option value="suma">Sumar saldo (por ejemplo, cancela el salón con menos de 24 h)</option>
                    <option value="resta">Restar saldo (corrección)</option>
                  </select>
                </div>
              )}
              <div>
                <label style={labelStyle}>
                  {modo === "canje" ? "Valor de los productos que se lleva" : "Valor"}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={valor ? valor.toLocaleString("es-CO") : ""}
                  onChange={(e) => setMonto(e.target.value)}
                  placeholder="Ej. 50.000"
                  style={inputStyle}
                />
                {modo === "canje" && valor > saldo && (
                  <p style={{ marginTop: "4px", fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", color: "var(--color-error)" }}>
                    Supera el saldo disponible ({formatPrice(saldo)}).
                  </p>
                )}
              </div>
              <div>
                <label style={labelStyle}>{modo === "canje" ? "Productos (opcional)" : "Motivo"}</label>
                <input
                  type="text"
                  value={nota}
                  onChange={(e) => setNota(e.target.value)}
                  placeholder={modo === "canje" ? "Ej. Esmalte y aceite de cutícula" : "Ej. Adriana canceló la cita"}
                  style={inputStyle}
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  className="w-full sm:w-auto"
                  variant="accent"
                  size="sm"
                  disabled={saving || !valor || (modo === "canje" && valor > saldo)}
                  onClick={handleGuardar}
                >
                  {saving ? "Guardando..." : "Guardar"}
                </Button>
                <Button className="w-full sm:w-auto" variant="outline" size="sm" disabled={saving} onClick={cerrarForm}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          <div style={{ marginTop: "1.5rem" }}>
            <label style={labelStyle}>Movimientos</label>
            {movimientos.length === 0 ? (
              <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--color-text-on-light-faint)" }}>
                Todavía no tiene movimientos.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {visibles.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between gap-3"
                    style={{ padding: "0.65rem 0.9rem", backgroundColor: "var(--color-bg-light)", borderRadius: "var(--radius-lg)" }}
                  >
                    <div>
                      <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--color-text-on-light)" }}>
                        {TIPO_LABEL[m.tipo]}
                      </p>
                      <p style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", color: "var(--color-text-on-light-faint)" }}>
                        {new Date(m.creado_en).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })}
                        {m.nota ? ` · ${m.nota}` : ""}
                      </p>
                    </div>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "var(--text-sm)",
                        whiteSpace: "nowrap",
                        color: m.monto > 0 ? "var(--color-success)" : "var(--color-text-on-light-muted)",
                      }}
                    >
                      {m.monto > 0 ? "+" : "−"}
                      {formatPrice(Math.abs(m.monto))}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {movimientos.length > 5 && (
              <div className="flex justify-center mt-3">
                <button
                  type="button"
                  onClick={() => setVerTodo(!verTodo)}
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "var(--font-body)",
                    fontSize: "var(--text-sm)",
                    fontWeight: 500,
                    color: "var(--color-gold-on-light)",
                  }}
                >
                  {verTodo ? "Ver menos" : "Ver todos"}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
