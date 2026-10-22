import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Save } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminToast, type ToastState } from "@/components/admin/AdminToast";
import { Button } from "@/components/ui/Button";
import { LoadingState, ErrorState } from "@/components/ui/QueryState";
import { supabase } from "@/lib/supabase/client";

export const Route = createFileRoute("/admin/anticipos/")({
  component: AnticiposPage,
});

interface AnticiposForm {
  porcentaje: string;
  horasPago: string;
  datos: string;
}

const MAX_DATOS = 1000;

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

const sectionTitle: React.CSSProperties = {
  fontFamily: "var(--font-display)",
  fontStyle: "italic",
  fontSize: "var(--text-xl)",
  color: "var(--color-text-on-light)",
  marginBottom: "0.5rem",
};

const helpText: React.CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: "var(--text-sm)",
  color: "var(--color-text-on-light-muted)",
  marginBottom: "1rem",
};

/** Devuelve el motivo si los valores no son válidos (mismas reglas que la base), o null. */
function validar(f: AnticiposForm): string | null {
  const pct = Number(f.porcentaje);
  if (!f.porcentaje.trim() || !Number.isInteger(pct) || pct < 1 || pct > 100) {
    return "El porcentaje del anticipo debe ser un número entero entre 1 y 100.";
  }
  const horas = Number(f.horasPago);
  if (!f.horasPago.trim() || !Number.isInteger(horas) || horas < 1 || horas > 72) {
    return "Las horas para pagar deben ser un número entero entre 1 y 72.";
  }
  if (f.datos.length > MAX_DATOS) return `Los datos de la cuenta no pueden pasar de ${MAX_DATOS} caracteres.`;
  return null;
}

function AnticiposPage() {
  const [original, setOriginal] = useState<AnticiposForm | null>(null);
  const [form, setForm] = useState<AnticiposForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = (message: string, type: ToastState["type"] = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2000);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.from("configuracion_anticipos").select("*").eq("id", 1).single();
    if (error || !data) {
      console.error("Error cargando la configuración de anticipos:", error?.message);
      setError("No se pudo cargar la configuración de anticipos.");
      setLoading(false);
      return;
    }
    const cargado: AnticiposForm = {
      porcentaje: String(data.porcentaje),
      horasPago: String(data.horas_pago),
      datos: (data.datos_transferencia as string | null) ?? "",
    };
    setOriginal(cargado);
    setForm(cargado);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const hayCambios = useMemo(
    () => !!form && !!original && JSON.stringify(form) !== JSON.stringify(original),
    [form, original],
  );

  const setCampo = (campo: keyof AnticiposForm, valor: string) => {
    setForm((prev) => (prev ? { ...prev, [campo]: valor } : prev));
    setFormError(null);
  };

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    const motivo = validar(form);
    if (motivo) {
      setFormError(motivo);
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("configuracion_anticipos")
      .update({
        porcentaje: Number(form.porcentaje),
        horas_pago: Number(form.horasPago),
        datos_transferencia: form.datos.trim() || null,
      })
      .eq("id", 1);
    setSaving(false);

    if (error) {
      console.error("Error al guardar la configuración de anticipos:", error.message);
      setFormError("No se pudo guardar. Intenta de nuevo.");
      return;
    }
    const guardado = { ...form, datos: form.datos.trim() };
    setOriginal(guardado);
    setForm(guardado);
    showToast("Pagos y anticipos actualizados");
  };

  return (
    <AdminLayout pageTitle="Pagos y anticipos">
      <div style={{ maxWidth: "800px", width: "100%", margin: "0 auto" }}>
        {loading ? (
          <LoadingState variant="light" />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchData} variant="light" />
        ) : form ? (
          <form
            onSubmit={handleGuardar}
            className="space-y-8"
            style={{
              backgroundColor: "var(--color-surface-light)",
              border: "1px solid var(--color-border-light)",
              borderRadius: "var(--radius-xl)",
              padding: "2rem",
            }}
          >

            <div style={{ height: "1px", backgroundColor: "var(--color-border-light)" }} />

            <section>
              <h3 style={sectionTitle}>Anticipo</h3>
              <p style={helpText}>
                El porcentaje se calcula sobre el valor del servicio y sus adicionales. Mientras la clienta paga, el horario
                queda apartado durante las horas que indiques; si no paga en ese tiempo, el horario se libera.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label style={labelStyle} htmlFor="anticipo-porcentaje">Porcentaje del anticipo (%)</label>
                  <input
                    id="anticipo-porcentaje"
                    type="text"
                    inputMode="numeric"
                    value={form.porcentaje}
                    onChange={(e) => setCampo("porcentaje", e.target.value.replace(/[^0-9]/g, ""))}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle} htmlFor="anticipo-horas">Horas para pagar</label>
                  <input
                    id="anticipo-horas"
                    type="text"
                    inputMode="numeric"
                    value={form.horasPago}
                    onChange={(e) => setCampo("horasPago", e.target.value.replace(/[^0-9]/g, ""))}
                    style={inputStyle}
                  />
                </div>
              </div>
            </section>

            <div style={{ height: "1px", backgroundColor: "var(--color-border-light)" }} />

            <section>
              <h3 style={sectionTitle}>Datos de la cuenta para transferir</h3>
              <p style={helpText}>
                Banco, tipo de cuenta, número y titular. El asistente de WhatsApp comparte este texto con las clientas que
                deben anticipo. También se puede registrar o consultar por Telegram.
              </p>
              <label style={labelStyle} htmlFor="anticipo-datos">Datos de la cuenta</label>
              <textarea
                id="anticipo-datos"
                rows={5}
                maxLength={MAX_DATOS}
                value={form.datos}
                placeholder="Sin datos registrados"
                onChange={(e) => setCampo("datos", e.target.value)}
                style={{ ...inputStyle, resize: "vertical" }}
              />
              <p style={{ ...helpText, marginTop: "0.5rem", marginBottom: 0 }}>
                {form.datos.length} / {MAX_DATOS} caracteres
              </p>
            </section>

            {formError && (
              <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--color-error)" }}>
                {formError}
              </p>
            )}

            <div className="flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                size="md"
                disabled={!hayCambios || saving}
                onClick={() => {
                  setForm(original);
                  setFormError(null);
                }}
              >
                Descartar cambios
              </Button>
              <Button type="submit" variant="accent" size="md" disabled={!hayCambios || saving}>
                <Save size={18} className="mr-2" />
                {saving ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </form>
        ) : null}
      </div>

      <AdminToast toast={toast} />
    </AdminLayout>
  );
}
