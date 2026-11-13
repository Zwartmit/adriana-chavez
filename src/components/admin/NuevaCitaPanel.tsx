import { useCallback, useEffect, useState } from "react";
import { explicarError } from "@/lib/errores";
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

const soloDigitos = (s: string) => s.replace(/\D/g, "");

// Patrón para buscar un teléfono guardado con espacios o guiones: 3%0%0%1... (se confirma después en código)
const patronTelefono = (digitos: string) => `%${digitos.split("").join("%")}%`;

// Para comparar nombres sin importar mayúsculas ni tildes
const normalizarNombre = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();

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

  // Clienta nueva: si el nombre escrito no se eligió de la lista, se registra sola al pulsar "Crear cita"
  const [nuevoTelefono, setNuevoTelefono] = useState("");
  const [nuevoNacimiento, setNuevoNacimiento] = useState("");
  const [clienteDuplicada, setClienteDuplicada] = useState<ClienteResult | null>(null);

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
  // Hora escrita a mano: si rompe una regla del salón se avisa y una administradora puede "Agendar igual"
  const [esAdmin, setEsAdmin] = useState(false);
  const [reglaRota, setReglaRota] = useState<string | null>(null);
  const [confirmarForzar, setConfirmarForzar] = useState(false);

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
        // Cada palabra debe aparecer en el nombre o en el apellido ("Ana Pérez" encuentra nombre Ana + apellido Pérez)
        for (const palabra of q.split(/\s+/).filter(Boolean)) {
          query = query.or(`nombre.ilike.%${palabra}%,apellido.ilike.%${palabra}%`);
        }
      }
      
      const { data } = await query.order("created_at", { ascending: false }).limit(8);
      if (!cancelled) setClienteResults(data ?? []);
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [clienteQuery]);

  // Clienta nueva = hay un nombre escrito y no se eligió ninguna de la lista
  const nombreNuevo = clienteQuery.trim().replace(/\s+/g, " ");
  const esNueva = !selectedCliente && nombreNuevo.length >= 2;
  const coincidenciaExacta = esNueva
    ? clienteResults.find((c) => normalizarNombre(`${c.nombre} ${c.apellido ?? ""}`) === normalizarNombre(nombreNuevo))
    : undefined;

  // Las horas ya pasadas de hoy se siguen ofreciendo (Adriana puede registrar una cita que ya empezó),
  // pero se marcan para que no se elijan por error.
  const esHoraPasada = (slot: string) => {
    if (!selectedDate) return false;
    const ahora = new TZDate(Date.now(), "America/Bogota");
    const esHoy =
      selectedDate.getFullYear() === ahora.getFullYear() &&
      selectedDate.getMonth() === ahora.getMonth() &&
      selectedDate.getDate() === ahora.getDate();
    if (!esHoy) return false;
    const [hh, mm] = slot.split(":").map(Number);
    return hh * 60 + mm <= ahora.getHours() * 60 + ahora.getMinutes();
  };

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
        // La hora escrita a mano se conserva aunque no esté en la lista de sugeridas
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, selectedServicioId, selectedProfesionalId, selectedDate, minutosExtra]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    supabase.rpc("es_admin").then(({ data }: { data: boolean | null }) => {
      if (!cancelled) setEsAdmin(data === true);
    });
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  // Revisa en vivo si la hora elegida o escrita rompe alguna regla de horario (solo informa; el servidor decide)
  useEffect(() => {
    setReglaRota(null);
    setConfirmarForzar(false);
    if (!isOpen || !selectedServicioId || !selectedProfesionalId || !selectedDate || !/^\d{1,2}:\d{2}$/.test(selectedHora)) return;
    const servicio = servicios.find((s) => s.id === selectedServicioId);
    if (!servicio) return;
    let cancelled = false;
    const [hh, mm] = selectedHora.split(":").map(Number);
    const inicio = new TZDate(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), hh, mm, 0, 0, "America/Bogota");
    const fin = new Date(inicio.getTime() + ((servicio.duracion_min ?? 60) + minutosExtra) * 60000);
    supabase
      .rpc("horario_violado", {
        p_profesional: selectedProfesionalId,
        p_servicio: selectedServicioId,
        p_inicio: inicio.toISOString(),
        p_fin: fin.toISOString(),
      })
      .then(({ data, error }: { data: string | null; error: { message: string } | null }) => {
        if (cancelled || error) return;
        setReglaRota(typeof data === "string" && data ? data : null);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, selectedServicioId, selectedProfesionalId, selectedDate, selectedHora, minutosExtra, servicios]);

  const resetForm = useCallback(() => {
    setClienteQuery("");
    setClienteResults([]);
    setSelectedCliente(null);
    setNuevoTelefono("");
    setNuevoNacimiento("");
    setClienteDuplicada(null);
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

  const enviar = async (forzar: boolean) => {
    setFormError(null);
    setConfirmarForzar(false);

    const faltan = [
      !selectedCliente && !esNueva && "elegir la clienta o escribir su nombre",
      !selectedServicioId && "elegir el servicio",
      !selectedProfesionalId && "elegir la profesional",
      !selectedDate && "elegir la fecha",
      !selectedHora && "elegir la hora (si no aparecen horas, esa profesional no tiene espacio libre ese día)",
    ].filter(Boolean);
    if (faltan.length > 0 || !selectedDate) {
      setFormError(`Falta ${faltan.join(", ")}.`);
      return;
    }

    // Hora que rompe una regla del salón: solo una administradora puede agendarla, y tras confirmar
    if (reglaRota && !forzar) {
      if (!esAdmin) {
        setFormError(`Esa hora no se puede agendar: ${reglaRota}. Solo una administradora puede agendar fuera de las reglas de horario.`);
        return;
      }
      setConfirmarForzar(true);
      return;
    }

    if (!selectedCliente) {
      const digitos = soloDigitos(nuevoTelefono);
      if (digitos && digitos.length < 10) {
        setFormError("El teléfono parece incompleto. Escribe el celular con sus 10 dígitos o déjalo vacío.");
        return;
      }
      if (coincidenciaExacta && !digitos) {
        setFormError(`Ya existe «${coincidenciaExacta.nombre} ${coincidenciaExacta.apellido ?? ""}». Elígela de la lista, o escribe un teléfono si es otra persona.`);
        return;
      }
      const hoy = new TZDate(Date.now(), "America/Bogota");
      const hoyISO = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;
      if (nuevoNacimiento && nuevoNacimiento > hoyISO) {
        setFormError("La fecha de nacimiento no puede ser futura.");
        return;
      }
    }

    const servicio = servicios.find((s) => s.id === selectedServicioId);
    const [hh, mm] = selectedHora.split(":").map(Number);
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const date = selectedDate.getDate();
    
    // Forzamos la zona horaria a Bogotá, sin importar en qué país esté la computadora
    const fechaHora = new TZDate(year, month, date, hh, mm, 0, 0, "America/Bogota");

    setSubmitting(true);

    // Clienta nueva: se registra primero. Si la cita falla después, la clienta queda elegida y no se duplica al reintentar.
    let clienteId = selectedCliente?.id ?? null;
    if (!clienteId) {
      const digitos = soloDigitos(nuevoTelefono);
      const telefonoNuevo = digitos || null;
      if (telefonoNuevo) {
        const ult10 = telefonoNuevo.slice(-10);
        const { data: posibles } = await supabase
          .from("clientes")
          .select("id, nombre, apellido, telefono")
          .ilike("telefono", patronTelefono(ult10))
          .limit(10);
        const duplicada = ((posibles ?? []) as ClienteResult[]).find(
          (c) => soloDigitos(c.telefono ?? "").slice(-10) === ult10,
        );
        if (duplicada) {
          setClienteDuplicada(duplicada);
          setSubmitting(false);
          setFormError("Ya hay una clienta registrada con ese teléfono. Usa esa clienta o cambia el número.");
          return;
        }
      }

      const { data: creada, error: errCliente } = await supabase
        .from("clientes")
        .insert({
          perfil_id: null,
          nombre: nombreNuevo,
          apellido: null,
          email: null,
          telefono: telefonoNuevo,
          fecha_nacimiento: nuevoNacimiento || null,
          apodo: null,
          anticipo_modo: null,
          notas: null,
          alergias: null,
          preferencias: null,
          acepta_datos: true,
          fecha_acepta: new Date().toISOString(),
          activo: true,
        })
        .select("id, nombre, apellido, telefono")
        .single();

      if (errCliente || !creada) {
        console.error("[NuevaCitaPanel] error al registrar la clienta:", errCliente?.message);
        setSubmitting(false);
        setFormError(
          errCliente?.code === "23505"
            ? "Ya existe una clienta con ese teléfono."
            : errCliente
              ? explicarError(errCliente, "registrar la clienta")
              : "No se pudo registrar la clienta. Intenta de nuevo.",
        );
        return;
      }
      clienteId = creada.id;
      setSelectedCliente(creada as ClienteResult);
      setClienteDuplicada(null);
    }

    // Una sola operación: crea la cita con su duración total (servicio + adicionales) y guarda los adicionales
    const { error } = await supabase.rpc("crear_cita_con_adicionales", {
      p_cliente: clienteId,
      p_profesional: selectedProfesionalId,
      p_servicio: selectedServicioId,
      p_inicio: fechaHora.toISOString(),
      p_duracion_base: servicio?.duracion_min ?? 60,
      p_adicionales: selectedAdicionales,
      p_canal: "presencial",
      p_estado: "confirmada",
      p_notas_cliente: notas || null,
      p_forzar: forzar,
    });
    setSubmitting(false);

    if (error) {
      console.error("[NuevaCitaPanel] error al crear cita:", error.message);
      // El servidor rechazó el horario aunque la revisión en vivo no lo detectó: se ofrece "Agendar igual" a una administradora
      if (error.code === "23P01" && error.message.startsWith("Horario no permitido") && !forzar && esAdmin) {
        setReglaRota(error.message.replace(/^Horario no permitido:\s*/, ""));
        setConfirmarForzar(true);
        return;
      }
      setFormError(
        error.code === "23P01"
          ? error.message
          : error.code === "42501"
            ? "Solo una administradora puede agendar fuera de las reglas de horario."
          : error.code === "22023"
            ? "Uno de los adicionales ya no está disponible para este servicio. Revisa la selección."
            : explicarError(error, "crear la cita"),
      );
      return;
    }

    resetForm();
    onCreated();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void enviar(false);
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
              placeholder="Buscar o escribir el nombre de una clienta nueva..."
              value={selectedCliente ? `${selectedCliente.nombre} ${selectedCliente.apellido ?? ""}` : clienteQuery}
              onChange={(e) => {
                setSelectedCliente(null);
                setClienteQuery(e.target.value);
                setClienteDuplicada(null);
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

            {esNueva && (
              <div
                style={{
                  marginTop: 10,
                  padding: 12,
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-lg)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", color: "var(--color-text-muted)", margin: 0 }}>
                  Clienta nueva: «{nombreNuevo}» se registrará al crear la cita. El teléfono y la fecha de nacimiento son opcionales.
                </p>
                {coincidenciaExacta && (
                  <div
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "var(--text-sm)",
                      color: "var(--color-text-primary)",
                      display: "flex",
                      flexWrap: "wrap",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span>
                      Ya existe una clienta con ese nombre{coincidenciaExacta.telefono ? ` (${coincidenciaExacta.telefono})` : ""}.
                    </span>
                    <button
                      type="button"
                      className="text-xs font-semibold hover:underline"
                      style={{ color: "var(--color-primary-dim)" }}
                      onClick={() => {
                        setSelectedCliente(coincidenciaExacta);
                        setShowResults(false);
                        setNuevoTelefono("");
                        setNuevoNacimiento("");
                        setClienteDuplicada(null);
                        setFormError(null);
                      }}
                    >
                      Usar esta clienta
                    </button>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label style={labelStyle}>Teléfono</label>
                    <input
                      type="tel"
                      placeholder="300 123 4567"
                      value={nuevoTelefono}
                      onChange={(e) => {
                        setNuevoTelefono(e.target.value);
                        setClienteDuplicada(null);
                      }}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Fecha de nacimiento</label>
                    <input
                      type="date"
                      value={nuevoNacimiento}
                      onChange={(e) => setNuevoNacimiento(e.target.value)}
                      className="input-hora-manual"
                      style={{ ...inputStyle, colorScheme: "dark" }}
                    />
                  </div>
                </div>
                {clienteDuplicada && (
                  <div
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "var(--text-sm)",
                      color: "var(--color-text-primary)",
                      display: "flex",
                      flexWrap: "wrap",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span>
                      Ya existe: {clienteDuplicada.nombre} {clienteDuplicada.apellido ?? ""}
                      {clienteDuplicada.telefono ? ` (${clienteDuplicada.telefono})` : ""}
                    </span>
                    <button
                      type="button"
                      className="text-xs font-semibold hover:underline"
                      style={{ color: "var(--color-primary-dim)" }}
                      onClick={() => {
                        setSelectedCliente(clienteDuplicada);
                        setClienteDuplicada(null);
                        setNuevoTelefono("");
                        setNuevoNacimiento("");
                        setFormError(null);
                      }}
                    >
                      Usar esta clienta
                    </button>
                  </div>
                )}
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
                  {esHoraPasada(slot) ? " (ya pasó)" : ""}
                </option>
              ))}
            </select>
            <label style={{ ...labelStyle, marginTop: 12 }}>
              O escribe la hora <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(por ejemplo 9:20)</span>
            </label>
            <input
              type="time"
              step={60}
              value={selectedHora}
              onChange={(e) => setSelectedHora(e.target.value)}
              disabled={!selectedServicioId || !selectedProfesionalId}
              className="input-hora-manual"
              style={{ ...inputStyle, colorScheme: "dark" }}
            />
            {horasError && (
              <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", color: "var(--color-error)", marginTop: 6 }}>
                {horasError}
              </p>
            )}
            {reglaRota && (
              <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--color-warning)", marginTop: 8 }}>
                Esta hora rompe una regla del salón: {reglaRota}.{" "}
                {esAdmin
                  ? "Al crear la cita te pediré confirmar si quieres agendarla igual."
                  : "Solo una administradora puede agendar fuera de las reglas de horario."}
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

          {confirmarForzar && reglaRota && (
            <div
              role="alert"
              style={{
                border: "1px solid var(--color-warning)",
                borderRadius: "var(--radius-lg)",
                padding: "1rem",
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-sm)",
                color: "var(--color-text-primary)",
              }}
            >
              <p style={{ marginBottom: 12 }}>
                Esta hora rompe una regla del salón: <strong>{reglaRota}</strong>. ¿Agendar igual? Quedará registrado en la cita. Si choca con otra cita o con un bloqueo, igual no se podrá.
              </p>
              <div className="flex gap-3">
                <Button type="button" variant="accent" size="md" disabled={submitting} onClick={() => void enviar(true)}>
                  {submitting ? "Creando cita..." : "Agendar igual"}
                </Button>
                <Button type="button" variant="ghost" size="md" disabled={submitting} onClick={() => setConfirmarForzar(false)}>
                  Cambiar la hora
                </Button>
              </div>
            </div>
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

