import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { es } from "react-day-picker/locale";
import "react-day-picker/style.css";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase/client";

interface ClienteResult {
  id: string;
  nombre: string;
  apellido: string | null;
  telefono: string | null;
}

interface ServicioOption {
  id: string;
  nombre: string;
  duracion_min: number;
}

interface EstilistaOption {
  id: string;
  nombre: string;
}

interface NuevaCitaPanelProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDate?: Date;
  onCreated: () => void;
  onError: (message: string) => void;
}

function generarSlots(): string[] {
  const slots: string[] = [];
  for (let h = 8; h <= 19; h++) {
    for (const m of [0, 30]) {
      if (h === 19 && m === 30) continue;
      slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return slots;
}

const SLOTS = generarSlots();

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

export function NuevaCitaPanel({ isOpen, onClose, defaultDate, onCreated, onError }: NuevaCitaPanelProps) {
  const [clienteQuery, setClienteQuery] = useState("");
  const [clienteResults, setClienteResults] = useState<ClienteResult[]>([]);
  const [selectedCliente, setSelectedCliente] = useState<ClienteResult | null>(null);
  const [showResults, setShowResults] = useState(false);

  const [servicios, setServicios] = useState<ServicioOption[]>([]);
  const [selectedServicioId, setSelectedServicioId] = useState("");
  const [estilistas, setEstilistas] = useState<EstilistaOption[]>([]);
  const [selectedEstilistaId, setSelectedEstilistaId] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(defaultDate ?? new Date());
  const [selectedHora, setSelectedHora] = useState("");
  const [notas, setNotas] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedDate(defaultDate ?? new Date());
  }, [isOpen, defaultDate]);

  useEffect(() => {
    if (!isOpen) return;

    async function fetchOptions() {
      const [{ data: serviciosData }, { data: estilistasData }] = await Promise.all([
        supabase.from("servicios").select("id, nombre, duracion_min").eq("activo", true).order("orden", { ascending: true }),
        supabase.from("estilistas").select("id, nombre").eq("activo", true).order("orden", { ascending: true }),
      ]);
      setServicios(serviciosData ?? []);
      setEstilistas(estilistasData ?? []);
    }
    fetchOptions();
  }, [isOpen]);

  useEffect(() => {
    if (clienteQuery.trim().length < 2) {
      setClienteResults([]);
      return;
    }
    let cancelled = false;
    const timeout = setTimeout(async () => {
      const q = clienteQuery.trim();
      const { data } = await supabase
        .from("clientes")
        .select("id, nombre, apellido, telefono")
        .or(`nombre.ilike.%${q}%,apellido.ilike.%${q}%`)
        .eq("activo", true)
        .limit(8);
      if (!cancelled) setClienteResults(data ?? []);
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [clienteQuery]);

  const resetForm = useCallback(() => {
    setClienteQuery("");
    setClienteResults([]);
    setSelectedCliente(null);
    setSelectedServicioId("");
    setSelectedEstilistaId("");
    setSelectedDate(defaultDate ?? new Date());
    setSelectedHora("");
    setNotas("");
    setFormError(null);
  }, [defaultDate]);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedCliente || !selectedServicioId || !selectedEstilistaId || !selectedDate || !selectedHora) {
      setFormError("Completa todos los campos requeridos.");
      return;
    }

    const servicio = servicios.find((s) => s.id === selectedServicioId);
    const [hh, mm] = selectedHora.split(":").map(Number);
    const fechaHora = new Date(selectedDate);
    fechaHora.setHours(hh, mm, 0, 0);

    setSubmitting(true);
    const { error } = await supabase.from("citas").insert({
      cliente_id: selectedCliente.id,
      estilista_id: selectedEstilistaId,
      servicio_id: selectedServicioId,
      fecha_hora: fechaHora.toISOString(),
      duracion_min: servicio?.duracion_min ?? 60,
      estado: "pendiente",
      notas_cliente: notas || null,
      canal_origen: "presencial",
    });
    setSubmitting(false);

    if (error) {
      console.error("[NuevaCitaPanel] error al crear cita:", error.message);
      setFormError(error.message);
      onError("No se pudo crear la cita.");
      return;
    }

    resetForm();
    onCreated();
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
            Nueva cita
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
          {/* Cliente */}
          <div style={{ position: "relative" }}>
            <label style={labelStyle}>Cliente *</label>
            <input
              type="text"
              placeholder="Buscar por nombre o apellido..."
              value={selectedCliente ? `${selectedCliente.nombre} ${selectedCliente.apellido ?? ""}` : clienteQuery}
              onChange={(e) => {
                setSelectedCliente(null);
                setClienteQuery(e.target.value);
                setShowResults(true);
              }}
              onFocus={() => setShowResults(true)}
              style={inputStyle}
            />
            {showResults && clienteResults.length > 0 && !selectedCliente && (
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
                  maxHeight: "200px",
                  overflowY: "auto",
                }}
              >
                {clienteResults.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setSelectedCliente(c);
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
                    {c.nombre} {c.apellido ?? ""}
                    {c.telefono && (
                      <span style={{ color: "var(--color-text-muted)", marginLeft: 8, fontSize: "var(--text-xs)" }}>
                        {c.telefono}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Servicio */}
          <div>
            <label style={labelStyle}>Servicio *</label>
            <select
              value={selectedServicioId}
              onChange={(e) => setSelectedServicioId(e.target.value)}
              style={inputStyle}
            >
              <option value="">Selecciona un servicio</option>
              {servicios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre} ({s.duracion_min} min)
                </option>
              ))}
            </select>
          </div>

          {/* Estilista */}
          <div>
            <label style={labelStyle}>Estilista *</label>
            <select
              value={selectedEstilistaId}
              onChange={(e) => setSelectedEstilistaId(e.target.value)}
              style={inputStyle}
            >
              <option value="">Selecciona un estilista</option>
              {estilistas.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Fecha */}
          <div>
            <label style={labelStyle}>Fecha *</label>
            <div
              style={{
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-lg)",
                backgroundColor: "var(--color-bg-alt)",
                padding: "0.5rem",
              }}
            >
              <DayPicker
                className="admin-daypicker"
                mode="single"
                locale={es}
                selected={selectedDate}
                onSelect={setSelectedDate}
                weekStartsOn={1}
              />
            </div>
          </div>

          {/* Hora */}
          <div>
            <label style={labelStyle}>Hora *</label>
            <select value={selectedHora} onChange={(e) => setSelectedHora(e.target.value)} style={inputStyle}>
              <option value="">Selecciona una hora</option>
              {SLOTS.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
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

          {formError && (
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-sm)",
                color: "var(--color-error)",
              }}
            >
              {formError}
            </p>
          )}

          <Button type="submit" variant="accent" size="lg" className="w-full" disabled={submitting}>
            {submitting ? "Creando cita..." : "Crear cita"}
          </Button>
        </form>
      </aside>
    </>
  );
}
