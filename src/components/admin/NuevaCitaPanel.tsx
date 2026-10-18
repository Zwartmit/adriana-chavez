import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { es } from "react-day-picker/locale";
import "react-day-picker/style.css";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase/client";
import { TZDate } from "@date-fns/tz";
import { CrudServiciosModal } from "./CrudServiciosModal";
import { CrudProfesionalesModal } from "./CrudProfesionalesModal";
import { formatDuration, formatPriceRange } from "@/lib/utils";

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
  precio: number;
  precio_hasta: number | null;
  precio_desde: boolean;
}

interface AdicionalOption {
  id: string;
  nombre: string;
  duracion_min: number;
  precio: number;
  precio_hasta: number | null;
  precio_desde: boolean;
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

export function NuevaCitaPanel({ isOpen, onClose, defaultDate, onCreated }: NuevaCitaPanelProps) {
  const [clienteQuery, setClienteQuery] = useState("");
  const [clienteResults, setClienteResults] = useState<ClienteResult[]>([]);
  const [selectedCliente, setSelectedCliente] = useState<ClienteResult | null>(null);
  const [showResults, setShowResults] = useState(false);

  const [servicios, setServicios] = useState<ServicioOption[]>([]);
  const [selectedServicioId, setSelectedServicioId] = useState("");
  const [servicioQuery, setServicioQuery] = useState("");
  const [showServicioResults, setShowServicioResults] = useState(false);

  // Adicionales activos del servicio elegido y los que se marcaron
  const [adicionalesDisponibles, setAdicionalesDisponibles] = useState<AdicionalOption[]>([]);
  const [selectedAdicionales, setSelectedAdicionales] = useState<string[]>([]);

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

  // Horas de inicio válidas (horario del salón, almuerzo, excepciones, citas y bloqueos), calculadas en la base
  const [horasLibres, setHorasLibres] = useState<string[]>([]);
  const [loadingHoras, setLoadingHoras] = useState(false);
  const [horasError, setHorasError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedDate(defaultDate ?? new TZDate(new Date(), "America/Bogota"));
  }, [isOpen, defaultDate]);

  const fetchOptions = useCallback(async () => {
    const [{ data: serviciosData }, { data: profesionalesData }] = await Promise.all([
      supabase.from("servicios").select("id, nombre, duracion_min, precio, precio_hasta, precio_desde").eq("activo", true).order("orden", { ascending: true }),
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
    setSelectedAdicionales([]);
    if (!isOpen || !selectedServicioId) {
      setAdicionalesDisponibles([]);
      return;
    }
    let cancelled = false;
    supabase
      .from("servicio_adicionales")
      .select("orden, adicionales(id, nombre, duracion_min, precio, precio_hasta, precio_desde, activo)")
      .eq("servicio_id", selectedServicioId)
      .order("orden", { ascending: true })
      .then(({ data, error }: { data: any; error: { message: string } | null }) => {
        if (cancelled) return;
        if (error) {
          console.error("[NuevaCitaPanel] error al cargar adicionales:", error.message);
          setAdicionalesDisponibles([]);
          return;
        }
        const lista = ((data ?? []) as { adicionales: (AdicionalOption & { activo: boolean }) | null }[])
          .map((r) => r.adicionales)
          .filter((a): a is AdicionalOption & { activo: boolean } => !!a && a.activo)
          .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
        setAdicionalesDisponibles(lista);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, selectedServicioId]);

  const adicionalesElegidos = adicionalesDisponibles.filter((a) => selectedAdicionales.includes(a.id));
  const minutosExtra = adicionalesElegidos.reduce((acc, a) => acc + a.duracion_min, 0);

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

  useEffect(() => {
    if (!isOpen || !selectedServicioId || !selectedProfesionalId || !selectedDate) {
      setHorasLibres([]);
      setSelectedHora("");
      setHorasError(null);
      return;
    }
    let cancelled = false;
    const fecha = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;
    setLoadingHoras(true);
    setHorasError(null);
    supabase
      .rpc("horarios_libres", {
        p_servicio: selectedServicioId,
        p_fecha: fecha,
        p_profesional: selectedProfesionalId,
        p_incluir_pasadas: true,
        p_duracion_extra: minutosExtra,
      })
      .then(({ data, error }: { data: { inicio_local: string }[] | null; error: { message: string } | null }) => {
        if (cancelled) return;
        setLoadingHoras(false);
        if (error) {
          console.error("[NuevaCitaPanel] error al cargar horas libres:", error.message);
          setHorasLibres([]);
          setHorasError("No se pudieron cargar las horas libres. Intenta de nuevo.");
          return;
        }
        const horas = (data ?? []).map((r) => r.inicio_local);
        setHorasLibres(horas);
        setSelectedHora((prev) => (horas.includes(prev) ? prev : ""));
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, selectedServicioId, selectedProfesionalId, selectedDate, minutosExtra]);

  const resetForm = useCallback(() => {
    setClienteQuery("");
    setClienteResults([]);
    setSelectedCliente(null);
    setSelectedServicioId("");
    setServicioQuery("");
    setShowServicioResults(false);
    setAdicionalesDisponibles([]);
    setSelectedAdicionales([]);
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

    // Una sola operación: crea la cita con su duración total (servicio + adicionales) y guarda los adicionales
    const { error } = await supabase.rpc("crear_cita_con_adicionales", {
      p_cliente: selectedCliente.id,
      p_profesional: selectedProfesionalId,
      p_servicio: selectedServicioId,
      p_inicio: fechaHora.toISOString(),
      p_duracion_base: servicio?.duracion_min ?? 60,
      p_adicionales: selectedAdicionales,
      p_canal: "presencial",
      p_estado: "confirmada",
      p_notas_cliente: notas || null,
    });
    setSubmitting(false);

    if (error) {
      console.error("[NuevaCitaPanel] error al crear cita:", error.message);
      setFormError(
        error.code === "23P01"
          ? error.message
          : error.code === "22023"
            ? "Uno de los adicionales ya no está disponible para este servicio. Revisa la selección."
            : "No se pudo crear la cita. Intenta de nuevo.",
      );
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

          {/* Adicionales del servicio */}
          {adicionalesDisponibles.length > 0 && (
            <div>
              <label style={labelStyle}>
                Adicionales <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(opcional)</span>
              </label>
              <div
                className="flex flex-col gap-2"
                style={{
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-lg)",
                  backgroundColor: "var(--color-bg-alt)",
                  padding: "10px 14px",
                }}
              >
                {adicionalesDisponibles.map((a) => (
                  <label key={a.id} className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedAdicionales.includes(a.id)}
                      onChange={() =>
                        setSelectedAdicionales((prev) =>
                          prev.includes(a.id) ? prev.filter((x) => x !== a.id) : [...prev, a.id],
                        )
                      }
                      style={{ width: 16, height: 16, marginTop: 2, accentColor: "var(--color-primary)" }}
                    />
                    <span style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--color-text-primary)" }}>
                      {a.nombre}
                      <span style={{ color: "var(--color-text-muted)", fontSize: "var(--text-xs)", marginLeft: 6 }}>
                        {formatPriceRange(a.precio, a.precio_hasta, a.precio_desde)}
                        {a.duracion_min > 0 ? ` · +${formatDuration(a.duracion_min)}` : ""}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
              {selectedServicioId && adicionalesElegidos.length > 0 && (() => {
                const srv = servicios.find((s) => s.id === selectedServicioId);
                if (!srv) return null;
                const desde = srv.precio + adicionalesElegidos.reduce((acc, a) => acc + a.precio, 0);
                const hasta =
                  (srv.precio_hasta ?? srv.precio) +
                  adicionalesElegidos.reduce((acc, a) => acc + (a.precio_hasta ?? a.precio), 0);
                return (
                  <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginTop: 6 }}>
                    Duración total: {formatDuration(srv.duracion_min + minutosExtra)} · Precio estimado:{" "}
                    {formatPriceRange(desde, hasta, srv.precio_desde)}
                  </p>
                );
              })()}
            </div>
          )}

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
            <select
              value={selectedHora}
              onChange={(e) => setSelectedHora(e.target.value)}
              disabled={!selectedServicioId || !selectedProfesionalId || loadingHoras}
              style={inputStyle}
            >
              <option value="">
                {!selectedServicioId || !selectedProfesionalId
                  ? "Elige servicio y profesional primero"
                  : loadingHoras
                    ? "Buscando horas..."
                    : horasLibres.length === 0
                      ? "No hay horas libres ese día"
                      : "Selecciona una hora"}
              </option>
              {horasLibres.map((slot) => (
                <option key={slot} value={slot}>
                  {format12h(slot)}
                </option>
              ))}
            </select>
            {horasError && (
              <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", color: "var(--color-error)", marginTop: 6 }}>
                {horasError}
              </p>
            )}
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

