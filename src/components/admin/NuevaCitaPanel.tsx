import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { es } from "react-day-picker/locale";
import "react-day-picker/style.css";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase/client";
import { CrudServiciosModal } from "./CrudServiciosModal";
import { CrudEstilistasModal } from "./CrudEstilistasModal";

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

function format12h(time24: string) {
  const [h, m] = time24.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
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

export function NuevaCitaPanel({ isOpen, onClose, defaultDate, onCreated, onError }: NuevaCitaPanelProps) {
  const [clienteQuery, setClienteQuery] = useState("");
  const [clienteResults, setClienteResults] = useState<ClienteResult[]>([]);
  const [selectedCliente, setSelectedCliente] = useState<ClienteResult | null>(null);
  const [showResults, setShowResults] = useState(false);

  const [servicios, setServicios] = useState<ServicioOption[]>([]);
  const [selectedServicioId, setSelectedServicioId] = useState("");
  const [servicioQuery, setServicioQuery] = useState("");
  const [showServicioResults, setShowServicioResults] = useState(false);

  const [estilistas, setEstilistas] = useState<EstilistaOption[]>([]);
  const [selectedEstilistaId, setSelectedEstilistaId] = useState("");
  const [estilistaQuery, setEstilistaQuery] = useState("");
  const [showEstilistaResults, setShowEstilistaResults] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(defaultDate ?? new Date());
  const [selectedHora, setSelectedHora] = useState("");
  const [notas, setNotas] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [isServiciosModalOpen, setIsServiciosModalOpen] = useState(false);
  const [isEstilistasModalOpen, setIsEstilistasModalOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedDate(defaultDate ?? new Date());
  }, [isOpen, defaultDate]);

  const fetchOptions = useCallback(async () => {
    const [{ data: serviciosData }, { data: estilistasData }] = await Promise.all([
      supabase.from("servicios").select("id, nombre, duracion_min").eq("activo", true).order("orden", { ascending: true }),
      supabase.from("estilistas").select("id, nombre").eq("activo", true).order("orden", { ascending: true }),
    ]);
    setServicios(serviciosData ?? []);
    setEstilistas(estilistasData ?? []);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    fetchOptions();
  }, [isOpen, fetchOptions]);

  useEffect(() => {
    let cancelled = false;
    const timeout = setTimeout(async () => {
      const q = clienteQuery.trim();
      let query = supabase
        .from("clientes")
        .select("id, nombre, apellido, telefono")
        .eq("activo", true);
        
      if (q.length >= 2) {
        query = query.or(`nombre.ilike.%${q}%,apellido.ilike.%${q}%`);
      }
      
      const { data } = await query.order("created_at", { ascending: false }).limit(8);
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
    setServicioQuery("");
    setShowServicioResults(false);
    setSelectedEstilistaId("");
    setEstilistaQuery("");
    setShowEstilistaResults(false);
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
      precio_cobrado: null,
      notas_cliente: notas || null,
      notas_internas: null,
      canal_origen: "presencial",
      recordatorio_24h_enviado: false,
      recordatorio_2h_enviado: false,
      seguimiento_enviado: false,
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
        className={`fixed top-0 right-0 bottom-0 z-70 flex flex-col bg-[var(--color-surface)] w-full sm:w-[440px] transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div
          className="flex items-center justify-between p-4 sm:p-6 shrink-0"
          style={{
            background: "linear-gradient(135deg, rgba(232,201,122,0.1) 0%, rgba(26,24,32,0.95) 100%)",
            borderBottom: "0.5px solid rgba(232,201,122,0.25)",
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
          <button type="button" className="cursor-pointer" aria-label="Cerrar" onClick={handleClose} style={{ color: "white" }}>
            <X size={22} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto flex flex-col gap-5 p-4 sm:p-6"
        >
          {/* Cliente */}
          <div style={{ position: "relative" }}>
            <label style={labelStyle}>Clienta *</label>
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
              onBlur={() => setTimeout(() => setShowResults(false), 200)}
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
                  border: "1px solid var(--color-border)",
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
          <div style={{ position: "relative" }}>
            <div className="flex items-center justify-between mb-[6px]">
              <label style={{ ...labelStyle, marginBottom: 0 }}>Servicio *</label>
              <button
                type="button"
                onClick={() => setIsServiciosModalOpen(true)}
                className="text-xs font-semibold hover:underline"
                style={{ color: "var(--color-primary-dim)" }}
              >
                + Gestionar
              </button>
            </div>
            <input
              type="text"
              placeholder="Buscar servicio..."
              value={selectedServicioId ? (servicios.find(s => s.id === selectedServicioId)?.nombre ?? "") : servicioQuery}
              onChange={(e) => {
                setSelectedServicioId("");
                setServicioQuery(e.target.value);
                setShowServicioResults(true);
              }}
              onFocus={() => setShowServicioResults(true)}
              onBlur={() => setTimeout(() => setShowServicioResults(false), 200)}
              style={inputStyle}
            />
            {showServicioResults && !selectedServicioId && (
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
                  border: "1px solid var(--color-border)",
                }}
              >
                {servicios.filter(s => s.nombre.toLowerCase().includes(servicioQuery.toLowerCase())).length === 0 ? (
                  <div style={{ padding: "10px 14px", color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>No hay coincidencias</div>
                ) : (
                  servicios.filter(s => s.nombre.toLowerCase().includes(servicioQuery.toLowerCase())).map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setSelectedServicioId(s.id);
                        setShowServicioResults(false);
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
                      {s.nombre} <span style={{ color: "var(--color-text-muted)", fontSize: "var(--text-xs)", marginLeft: 4 }}>({s.duracion_min} min)</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Estilista */}
          <div style={{ position: "relative" }}>
            <div className="flex items-center justify-between mb-[6px]">
              <label style={{ ...labelStyle, marginBottom: 0 }}>Estilista *</label>
              <button
                type="button"
                onClick={() => setIsEstilistasModalOpen(true)}
                className="text-xs font-semibold hover:underline"
                style={{ color: "var(--color-primary-dim)" }}
              >
                + Gestionar
              </button>
            </div>
            <input
              type="text"
              placeholder="Buscar estilista..."
              value={selectedEstilistaId ? (estilistas.find(e => e.id === selectedEstilistaId)?.nombre ?? "") : estilistaQuery}
              onChange={(e) => {
                setSelectedEstilistaId("");
                setEstilistaQuery(e.target.value);
                setShowEstilistaResults(true);
              }}
              onFocus={() => setShowEstilistaResults(true)}
              onBlur={() => setTimeout(() => setShowEstilistaResults(false), 200)}
              style={inputStyle}
            />
            {showEstilistaResults && !selectedEstilistaId && (
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
                  border: "1px solid var(--color-border)",
                }}
              >
                {estilistas.filter(e => e.nombre.toLowerCase().includes(estilistaQuery.toLowerCase())).length === 0 ? (
                  <div style={{ padding: "10px 14px", color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>No hay coincidencias</div>
                ) : (
                  estilistas.filter(e => e.nombre.toLowerCase().includes(estilistaQuery.toLowerCase())).map((est) => (
                    <button
                      key={est.id}
                      type="button"
                      onClick={() => {
                        setSelectedEstilistaId(est.id);
                        setShowEstilistaResults(false);
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
                      {est.nombre}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <div>
            <label style={labelStyle}>Fecha *</label>
            <div
              className="flex justify-center overflow-x-auto w-full"
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
                  {format12h(slot)}
                </option>
              ))}
            </select>
          </div>

          {/* Notas */}
          <div>
            <label style={labelStyle}>Notas <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(opcional)</span></label>
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

      <CrudServiciosModal
        isOpen={isServiciosModalOpen}
        onClose={() => setIsServiciosModalOpen(false)}
        onUpdated={fetchOptions}
      />
      <CrudEstilistasModal
        isOpen={isEstilistasModalOpen}
        onClose={() => setIsEstilistasModalOpen(false)}
        onUpdated={fetchOptions}
      />
    </>
  );
}
