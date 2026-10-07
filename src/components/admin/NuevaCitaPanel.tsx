import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { X } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { es } from "react-day-picker/locale";
import "react-day-picker/style.css";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase/client";
import { TZDate } from "@date-fns/tz";
import { CrudServiciosModal } from "./CrudServiciosModal";
import { CrudProfesionalesModal } from "./CrudProfesionalesModal";

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

interface ProfesionalOption {
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
  for (let h = 0; h <= 23; h++) {
    for (const m of [0, 30]) {
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

  const [profesionales, setProfesionals] = useState<ProfesionalOption[]>([]);
  const [selectedProfesionalId, setSelectedProfesionalId] = useState("");
  const [profesionalQuery, setProfesionalQuery] = useState("");
  const [showProfesionalResults, setShowProfesionalResults] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(defaultDate ?? new TZDate(new Date(), "America/Bogota"));
  const [selectedHora, setSelectedHora] = useState("");
  const [notas, setNotas] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [isServiciosModalOpen, setIsServiciosModalOpen] = useState(false);
  const [isProfesionalsModalOpen, setIsProfesionalsModalOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedDate(defaultDate ?? new TZDate(new Date(), "America/Bogota"));
  }, [isOpen, defaultDate]);

  const fetchOptions = useCallback(async () => {
    const [{ data: serviciosData }, { data: profesionalesData }] = await Promise.all([
      supabase.from("servicios").select("id, nombre, duracion_min").eq("activo", true).order("orden", { ascending: true }),
      supabase.from("profesionales").select("id, nombre").eq("activo", true).order("orden", { ascending: true }),
    ]);
    setServicios(serviciosData ?? []);
    setProfesionals(profesionalesData ?? []);
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
    setSelectedProfesionalId("");
    setProfesionalQuery("");
    setShowProfesionalResults(false);
    setSelectedDate(defaultDate ?? new TZDate(new Date(), "America/Bogota"));
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

    if (!selectedCliente || !selectedServicioId || !selectedProfesionalId || !selectedDate || !selectedHora) {
      setFormError("Completa todos los campos requeridos.");
      return;
    }

    const servicio = servicios.find((s) => s.id === selectedServicioId);
    const [hh, mm] = selectedHora.split(":").map(Number);
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const date = selectedDate.getDate();
    
    // Forzamos la zona horaria a Bogotá, sin importar en qué país esté la computadora
    const fechaHora = new TZDate(year, month, date, hh, mm, 0, 0, "America/Bogota");

    setSubmitting(true);

    // --- VALIDACIÓN DE SOLAPAMIENTOS ---
    const startOfDay = new TZDate(year, month, date, 0, 0, 0, 0, "America/Bogota");
    const endOfDay = new TZDate(year, month, date, 23, 59, 59, 999, "America/Bogota");
    const startNew = fechaHora.getTime();
    const endNew = startNew + (servicio?.duracion_min ?? 60) * 60_000;
    const profName = profesionales.find((p: ProfesionalOption) => p.id === selectedProfesionalId)?.nombre ?? "La profesional";

    const [citasRes, bloqueosRes] = await Promise.all([
      supabase
        .from("citas")
        .select("fecha_hora, duracion_min, estado")
        .eq("profesional_id", selectedProfesionalId)
        .in("estado", ["pendiente", "confirmada", "en_proceso"])
        .gte("fecha_hora", startOfDay.toISOString())
        .lte("fecha_hora", endOfDay.toISOString()),
      supabase
        .from("bloqueos_horario")
        .select("fecha_inicio, fecha_fin")
        .eq("profesional_id", selectedProfesionalId)
        .gte("fecha_fin", startOfDay.toISOString())
        .lte("fecha_inicio", endOfDay.toISOString())
    ]);

    if (bloqueosRes.data) {
      for (const b of bloqueosRes.data) {
        const bs = new Date(b.fecha_inicio).getTime();
        const be = new Date(b.fecha_fin).getTime();
        if (startNew < be && endNew > bs) {
          const formatBs = format(new TZDate(b.fecha_inicio, "America/Bogota"), "hh:mm a");
          const formatBe = format(new TZDate(b.fecha_fin, "America/Bogota"), "hh:mm a");
          setFormError(`${profName} tiene un bloqueo de ${formatBs} a ${formatBe}.`);
          setSubmitting(false);
          return;
        }
      }
    }

    if (citasRes.data) {
      for (const c of citasRes.data) {
        const cs = new Date(c.fecha_hora).getTime();
        const ce = cs + c.duracion_min * 60_000;
        if (startNew < ce && endNew > cs) {
          const formatCs = format(new TZDate(c.fecha_hora, "America/Bogota"), "hh:mm a");
          const formatCe = format(new TZDate(new Date(ce).toISOString(), "America/Bogota"), "hh:mm a");
          setFormError(`${profName} ya tiene una cita de ${formatCs} a ${formatCe}.`);
          setSubmitting(false);
          return;
        }
      }
    }
    // -----------------------------------

    const { error } = await supabase.from("citas").insert({
      cliente_id: selectedCliente.id,
      profesional_id: selectedProfesionalId,
      servicio_id: selectedServicioId,
      fecha_hora: fechaHora.toISOString(),
      duracion_min: servicio?.duracion_min ?? 60,
      estado: "confirmada",
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
      onError(error.code === "23P01" ? error.message : "No se pudo crear la cita.");
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

          {/* Profesional */}
          <div style={{ position: "relative" }}>
            <div className="flex items-center justify-between mb-[6px]">
              <label style={{ ...labelStyle, marginBottom: 0 }}>Profesional *</label>
              <button
                type="button"
                onClick={() => setIsProfesionalsModalOpen(true)}
                className="text-xs font-semibold hover:underline"
                style={{ color: "var(--color-primary-dim)" }}
              >
                + Gestionar
              </button>
            </div>
            <input
              type="text"
              placeholder="Buscar profesional..."
              value={selectedProfesionalId ? (profesionales.find(e => e.id === selectedProfesionalId)?.nombre ?? "") : profesionalQuery}
              onChange={(e) => {
                setSelectedProfesionalId("");
                setProfesionalQuery(e.target.value);
                setShowProfesionalResults(true);
              }}
              onFocus={() => setShowProfesionalResults(true)}
              onBlur={() => setTimeout(() => setShowProfesionalResults(false), 200)}
              style={inputStyle}
            />
            {showProfesionalResults && !selectedProfesionalId && (
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
                {profesionales.filter(e => e.nombre.toLowerCase().includes(profesionalQuery.toLowerCase())).length === 0 ? (
                  <div style={{ padding: "10px 14px", color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>No hay coincidencias</div>
                ) : (
                  profesionales.filter(e => e.nombre.toLowerCase().includes(profesionalQuery.toLowerCase())).map((est) => (
                    <button
                      key={est.id}
                      type="button"
                      onClick={() => {
                        setSelectedProfesionalId(est.id);
                        setShowProfesionalResults(false);
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
      <CrudProfesionalesModal
        isOpen={isProfesionalsModalOpen}
        onClose={() => setIsProfesionalsModalOpen(false)}
        onUpdated={fetchOptions}
      />
    </>
  );
}

