import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  eachDayOfInterval,
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  getHours,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subDays,
  subMonths,
  subWeeks,
  subYears,
} from "date-fns";
import { es } from "date-fns/locale";
import { Download } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminToast, type ToastState } from "@/components/admin/AdminToast";
import { IngresosChart, type ChartPoint } from "@/components/admin/reportes/IngresosChart";
import { Button } from "@/components/ui/Button";
import { LoadingState, ErrorState } from "@/components/ui/QueryState";
import { supabase } from "@/lib/supabase/client";
import { getUser } from "@/lib/supabase/auth";
import type { EstadoCita } from "@/lib/supabase/types";
import { formatPrice } from "@/lib/utils";

export const Route = createFileRoute("/admin/reportes/")({
  component: ReportesPage,
});

type Periodo = "hoy" | "semana" | "mes" | "año";

const PERIODOS: { value: Periodo; label: string }[] = [
  { value: "hoy", label: "Hoy" },
  { value: "semana", label: "Esta semana" },
  { value: "mes", label: "Este mes" },
  { value: "año", label: "Este año" },
];

interface CitaReporteRow {
  id: string;
  estado: EstadoCita;
  precio_cobrado: number | null;
  fecha_hora: string;
  servicio_id: string | null;
  estilista_id: string | null;
  clientes: { nombre: string; apellido: string | null } | null;
}

interface NombreOption {
  id: string;
  nombre: string;
}

interface ReporteCajaRow {
  id: string;
  fecha: string;
  ingresos_servicios: number;
  ingresos_productos: number;
  total_ingresos: number;
  total_citas: number;
  citas_completadas: number;
  citas_canceladas: number;
  generado_por: string;
}

function rangoPeriodo(periodo: Periodo, ref: Date) {
  switch (periodo) {
    case "hoy":
      return { inicio: startOfDay(ref), fin: endOfDay(ref) };
    case "semana":
      return { inicio: startOfWeek(ref, { weekStartsOn: 1 }), fin: endOfWeek(ref, { weekStartsOn: 1 }) };
    case "mes":
      return { inicio: startOfMonth(ref), fin: endOfMonth(ref) };
    case "año":
      return { inicio: startOfYear(ref), fin: endOfYear(ref) };
  }
}

function rangoPeriodoAnterior(periodo: Periodo, ref: Date) {
  switch (periodo) {
    case "hoy":
      return rangoPeriodo("hoy", subDays(ref, 1));
    case "semana":
      return rangoPeriodo("semana", subWeeks(ref, 1));
    case "mes":
      return rangoPeriodo("mes", subMonths(ref, 1));
    case "año":
      return rangoPeriodo("año", subYears(ref, 1));
  }
}

const cardStyle: React.CSSProperties = {
  borderRadius: "var(--radius-2xl)",
  padding: "1.5rem",
  backgroundColor: "var(--color-surface-light)",
  border: "1px solid var(--color-border-light)",
  boxShadow: "0 2px 12px rgba(10,10,11,0.08)",
};
const sectionCardStyle: React.CSSProperties = {
  backgroundColor: "var(--color-surface-light)",
  border: "1px solid var(--color-border-light)",
  borderRadius: "var(--radius-xl)",
  padding: "1.75rem",
};

const th: React.CSSProperties = {
  textAlign: "left",
  padding: "12px 16px",
  fontFamily: "var(--font-mono)",
  fontSize: "var(--text-xs)",
  textTransform: "uppercase",
  letterSpacing: "var(--tracking-wider)",
  color: "var(--color-primary)",
  whiteSpace: "nowrap",
};
const td: React.CSSProperties = {
  padding: "12px 16px",
  fontFamily: "var(--font-body)",
  fontSize: "var(--text-sm)",
  color: "var(--color-text-on-light-muted)",
};

function ReportesPage() {
  const [periodo, setPeriodo] = useState<Periodo>("mes");
  const [citas, setCitas] = useState<CitaReporteRow[]>([]);
  const [ingresosPrevios, setIngresosPrevios] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [servicios, setServicios] = useState<NombreOption[]>([]);
  const [estilistas, setEstilistas] = useState<NombreOption[]>([]);

  const [cierres, setCierres] = useState<ReporteCajaRow[]>([]);
  const [cierresLoading, setCierresLoading] = useState(true);
  const [generandoCierre, setGenerandoCierre] = useState(false);

  const [toast, setToast] = useState<ToastState | null>(null);
  const showToast = (message: string, type: ToastState["type"] = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2000);
  };

  const fetchReporte = useCallback(async (p: Periodo) => {
    setLoading(true);
    setError(null);

    const ahora = new Date();
    const { inicio, fin } = rangoPeriodo(p, ahora);
    const { inicio: inicioAnterior, fin: finAnterior } = rangoPeriodoAnterior(p, ahora);

    const [{ data: citasData, error: citasError }, { data: previasData, error: previasError }] = await Promise.all([
      supabase
        .from("citas")
        .select("id, estado, precio_cobrado, fecha_hora, servicio_id, estilista_id, clientes(nombre, apellido)")
        .gte("fecha_hora", inicio.toISOString())
        .lte("fecha_hora", fin.toISOString()),
      supabase
        .from("citas")
        .select("precio_cobrado, estado")
        .eq("estado", "completada")
        .gte("fecha_hora", inicioAnterior.toISOString())
        .lte("fecha_hora", finAnterior.toISOString()),
    ]);

    if (citasError) {
      console.error("[ReportesPage] error al cargar citas:", citasError.message);
      setError(citasError.message);
      setLoading(false);
      return;
    }
    if (previasError) {
      console.error("[ReportesPage] error al cargar período anterior:", previasError.message);
    }

    console.log(`[ReportesPage] ${citasData.length} citas cargadas desde Supabase para el período "${p}"`);
    setCitas(citasData as unknown as CitaReporteRow[]);
    setIngresosPrevios((previasData ?? []).reduce((sum, c) => sum + (c.precio_cobrado ?? 0), 0));
    setLoading(false);
  }, []);

  const fetchCierres = useCallback(async () => {
    setCierresLoading(true);
    const { data, error } = await supabase.from("reportes_caja").select("*").order("fecha", { ascending: false }).limit(30);
    if (error) {
      console.error("[ReportesPage] error al cargar cierres:", error.message);
      setCierresLoading(false);
      return;
    }
    console.log(`[ReportesPage] ${data.length} cierres de caja cargados desde Supabase`);
    setCierres(data as unknown as ReporteCajaRow[]);
    setCierresLoading(false);
  }, []);

  useEffect(() => {
    fetchReporte(periodo);
  }, [periodo, fetchReporte]);

  useEffect(() => {
    fetchCierres();
    supabase
      .from("servicios")
      .select("id, nombre")
      .then(({ data }) => setServicios(data ?? []));
    supabase
      .from("estilistas")
      .select("id, nombre")
      .then(({ data }) => setEstilistas(data ?? []));
  }, [fetchCierres]);

  // ── Métricas principales ──
  const completadas = useMemo(() => citas.filter((c) => c.estado === "completada"), [citas]);
  const canceladas = useMemo(() => citas.filter((c) => c.estado === "cancelada"), [citas]);
  const ingresosTotales = useMemo(() => completadas.reduce((sum, c) => sum + (c.precio_cobrado ?? 0), 0), [completadas]);
  const ticketPromedio = completadas.length > 0 ? ingresosTotales / completadas.length : 0;
  const tasaCancelacion = citas.length > 0 ? (canceladas.length / citas.length) * 100 : 0;

  const cambioVsAnterior =
    ingresosPrevios > 0
      ? ((ingresosTotales - ingresosPrevios) / ingresosPrevios) * 100
      : ingresosTotales > 0
      ? null // "Nuevo"
      : 0;

  const colorCancelacion =
    tasaCancelacion < 15 ? "var(--color-success)" : tasaCancelacion <= 25 ? "var(--color-warning)" : "var(--color-error)";

  // ── Datos del gráfico ──
  const chartData: ChartPoint[] = useMemo(() => {
    const ahora = new Date();
    const { inicio, fin } = rangoPeriodo(periodo, ahora);

    if (periodo === "hoy") {
      const porHora = new Map<number, number>();
      for (const c of completadas) porHora.set(getHours(new Date(c.fecha_hora)), (porHora.get(getHours(new Date(c.fecha_hora))) ?? 0) + (c.precio_cobrado ?? 0));
      const horas = Array.from({ length: 12 }, (_, i) => i + 8); // 8am - 7pm
      return horas.map((h) => ({ label: `${h}:00`, ingresos: porHora.get(h) ?? 0 }));
    }

    if (periodo === "semana") {
      const dias = eachDayOfInterval({ start: inicio, end: fin });
      return dias.map((d) => {
        const ingresos = completadas
          .filter((c) => format(new Date(c.fecha_hora), "yyyy-MM-dd") === format(d, "yyyy-MM-dd"))
          .reduce((sum, c) => sum + (c.precio_cobrado ?? 0), 0);
        return { label: format(d, "EEE d", { locale: es }), ingresos };
      });
    }

    if (periodo === "mes") {
      const dias = eachDayOfInterval({ start: inicio, end: fin });
      return dias.map((d) => {
        const ingresos = completadas
          .filter((c) => format(new Date(c.fecha_hora), "yyyy-MM-dd") === format(d, "yyyy-MM-dd"))
          .reduce((sum, c) => sum + (c.precio_cobrado ?? 0), 0);
        return { label: format(d, "d"), ingresos };
      });
    }

    // año: agrupar por mes
    return Array.from({ length: 12 }, (_, m) => {
      const ingresos = completadas
        .filter((c) => new Date(c.fecha_hora).getMonth() === m)
        .reduce((sum, c) => sum + (c.precio_cobrado ?? 0), 0);
      return { label: format(new Date(ahora.getFullYear(), m, 1), "MMM", { locale: es }), ingresos };
    });
  }, [periodo, completadas]);

  const chartVariant = periodo === "hoy" || periodo === "semana" ? "area" : "bar";

  // ── Servicios más vendidos ──
  const serviciosNombre = useMemo(() => new Map(servicios.map((s) => [s.id, s.nombre])), [servicios]);
  const estilistasNombre = useMemo(() => new Map(estilistas.map((e) => [e.id, e.nombre])), [estilistas]);

  const serviciosStats = useMemo(() => {
    const map = new Map<string, { citas: number; ingresos: number }>();
    for (const c of completadas) {
      const key = c.servicio_id ?? "sin-servicio";
      const entry = map.get(key) ?? { citas: 0, ingresos: 0 };
      entry.citas += 1;
      entry.ingresos += c.precio_cobrado ?? 0;
      map.set(key, entry);
    }
    const rows = Array.from(map.entries()).map(([id, stats]) => ({
      id,
      nombre: serviciosNombre.get(id) ?? "Sin servicio",
      citas: stats.citas,
      ingresos: stats.ingresos,
      porcentaje: ingresosTotales > 0 ? (stats.ingresos / ingresosTotales) * 100 : 0,
      ticketPromedio: stats.ingresos / stats.citas,
    }));
    rows.sort((a, b) => b.ingresos - a.ingresos);
    return rows.slice(0, 10);
  }, [completadas, serviciosNombre, ingresosTotales]);

  // ── Rendimiento por estilista ──
  const estilistasStats = useMemo(() => {
    const map = new Map<string, { citas: number; ingresos: number; cancelaciones: number }>();
    for (const c of completadas) {
      const key = c.estilista_id ?? "sin-estilista";
      const entry = map.get(key) ?? { citas: 0, ingresos: 0, cancelaciones: 0 };
      entry.citas += 1;
      entry.ingresos += c.precio_cobrado ?? 0;
      map.set(key, entry);
    }
    for (const c of canceladas) {
      const key = c.estilista_id ?? "sin-estilista";
      const entry = map.get(key) ?? { citas: 0, ingresos: 0, cancelaciones: 0 };
      entry.cancelaciones += 1;
      map.set(key, entry);
    }
    const rows = Array.from(map.entries()).map(([id, stats]) => ({
      id,
      nombre: estilistasNombre.get(id) ?? "Sin asignar",
      citas: stats.citas,
      ingresos: stats.ingresos,
      ticketPromedio: stats.citas > 0 ? stats.ingresos / stats.citas : 0,
      cancelaciones: stats.cancelaciones,
    }));
    rows.sort((a, b) => b.ingresos - a.ingresos);
    return rows;
  }, [completadas, canceladas, estilistasNombre]);

  // ── Exportar CSV ──
  const handleExportarCSV = () => {
    const headers = ["Fecha", "Hora", "Clienta", "Servicio", "Estilista", "Estado", "Precio cobrado"];
    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const rows = citas.map((c) => {
      const fecha = new Date(c.fecha_hora);
      const clienteNombre = c.clientes ? `${c.clientes.nombre} ${c.clientes.apellido ?? ""}`.trim() : "";
      return [
        format(fecha, "yyyy-MM-dd"),
        format(fecha, "HH:mm"),
        escape(clienteNombre),
        escape(c.servicio_id ? serviciosNombre.get(c.servicio_id) ?? "" : ""),
        escape(c.estilista_id ? estilistasNombre.get(c.estilista_id) ?? "" : ""),
        c.estado,
        String(c.precio_cobrado ?? ""),
      ].join(",");
    });
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reporte-${format(new Date(), "yyyy-MM")}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ── Generar cierre de hoy ──
  const handleGenerarCierre = async () => {
    setGenerandoCierre(true);
    const hoy = new Date();
    const inicioHoy = startOfDay(hoy);
    const finHoy = endOfDay(hoy);
    const fechaHoy = format(hoy, "yyyy-MM-dd");

    const [{ data: citasHoy, error: citasHoyError }, { data: ordenesHoy, error: ordenesHoyError }] = await Promise.all([
      supabase
        .from("citas")
        .select("estado, precio_cobrado")
        .gte("fecha_hora", inicioHoy.toISOString())
        .lte("fecha_hora", finHoy.toISOString()),
      supabase
        .from("ordenes")
        .select("total")
        .not("fecha_pago", "is", null)
        .gte("fecha_pago", inicioHoy.toISOString())
        .lte("fecha_pago", finHoy.toISOString()),
    ]);

    if (citasHoyError || ordenesHoyError) {
      console.error("[ReportesPage] error al calcular cierre:", citasHoyError?.message ?? ordenesHoyError?.message);
      showToast("No se pudo generar el cierre de caja.", "error");
      setGenerandoCierre(false);
      return;
    }

    const completadasHoy = (citasHoy ?? []).filter((c) => c.estado === "completada");
    const canceladasHoy = (citasHoy ?? []).filter((c) => c.estado === "cancelada");
    const ingresosServicios = completadasHoy.reduce((sum, c) => sum + (c.precio_cobrado ?? 0), 0);
    const ingresosProductos = (ordenesHoy ?? []).reduce((sum, o) => sum + o.total, 0);

    const user = await getUser();
    const generadoPor = user?.email ?? "Admin";

    const { data: existente } = await supabase.from("reportes_caja").select("id").eq("fecha", fechaHoy).maybeSingle();

    const payload = {
      fecha: fechaHoy,
      ingresos_servicios: ingresosServicios,
      ingresos_productos: ingresosProductos,
      total_ingresos: ingresosServicios + ingresosProductos,
      total_citas: (citasHoy ?? []).length,
      citas_completadas: completadasHoy.length,
      citas_canceladas: canceladasHoy.length,
      generado_por: generadoPor,
    };

    const { error: saveError } = existente
      ? await supabase.from("reportes_caja").update(payload).eq("id", existente.id)
      : await supabase.from("reportes_caja").insert(payload);

    setGenerandoCierre(false);

    if (saveError) {
      console.error("[ReportesPage] error al guardar cierre:", saveError.message);
      showToast("No se pudo generar el cierre de caja.", "error");
      return;
    }

    fetchCierres();
    showToast("Cierre de caja generado correctamente");
  };

  return (
    <AdminLayout pageTitle="Reportes">
      <div className="flex flex-col md:flex-row md:items-center justify-end gap-4" style={{ marginBottom: "1.75rem" }}>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Vista móvil: Select */}
          <div className="w-full md:hidden">
            <select
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value as any)}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: "var(--radius-lg)",
                border: "1px solid var(--color-border-light)",
                backgroundColor: "var(--color-surface)",
                color: "var(--color-text-primary)",
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-sm)",
              }}
            >
              {PERIODOS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* Vista Desktop: Botones */}
          <div className="hidden md:flex items-center gap-2 overflow-x-auto pb-1 w-full sm:w-auto" style={{ WebkitOverflowScrolling: "touch" }}>
            {PERIODOS.map((p) => {
              const active = p.value === periodo;
              return (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPeriodo(p.value)}
                  style={{
                    padding: "8px 18px",
                    borderRadius: "var(--radius-full)",
                    border: active ? "1px solid var(--color-border-light-gold)" : "1px solid var(--color-border-light)",
                    backgroundColor: active ? "rgba(200,168,74,0.12)" : "transparent",
                    color: active ? "var(--color-primary-dim)" : "var(--color-text-on-light-muted)",
                    fontFamily: "var(--font-body)",
                    fontWeight: 500,
                    fontSize: "var(--text-sm)",
                    cursor: "pointer",
                  }}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
          <Button className="w-full sm:w-auto shrink-0" variant="accent" size="sm" onClick={handleExportarCSV} disabled={loading || citas.length === 0}>
            <Download size={14} style={{ marginRight: 6 }} />
            Exportar CSV
          </Button>
        </div>
      </div>

      {loading ? (
        <LoadingState variant="light" />
      ) : error ? (
        <ErrorState message={error} onRetry={() => fetchReporte(periodo)} variant="light" />
      ) : (
        <>
          {/* Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" style={{ marginBottom: "1.75rem" }}>
            <div style={cardStyle}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", textTransform: "uppercase", letterSpacing: "var(--tracking-wider)", color: "var(--color-text-on-light-muted)" }}>
                Ingresos totales
              </p>
              <p style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: "var(--text-4xl)", color: "var(--color-text-on-light)", marginTop: "0.4rem" }}>
                {formatPrice(ingresosTotales)}
              </p>
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--text-xs)",
                  marginTop: "0.4rem",
                  color: cambioVsAnterior === null ? "var(--color-primary-dim)" : cambioVsAnterior >= 0 ? "var(--color-success)" : "var(--color-error)",
                }}
              >
                {cambioVsAnterior === null
                  ? "Sin datos del período anterior"
                  : `vs período anterior: ${cambioVsAnterior >= 0 ? "+" : ""}${cambioVsAnterior.toFixed(1)}%`}
              </p>
            </div>

            <div style={cardStyle}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", textTransform: "uppercase", letterSpacing: "var(--tracking-wider)", color: "var(--color-text-on-light-muted)" }}>
                Citas completadas
              </p>
              <p style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: "var(--text-4xl)", color: "var(--color-text-on-light)", marginTop: "0.4rem" }}>
                {completadas.length}
              </p>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", color: "var(--color-text-on-light-faint)", marginTop: "0.4rem" }}>
                de {citas.length} citas totales agendadas
              </p>
            </div>

            <div style={cardStyle}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", textTransform: "uppercase", letterSpacing: "var(--tracking-wider)", color: "var(--color-text-on-light-muted)" }}>
                Ticket promedio
              </p>
              <p style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: "var(--text-4xl)", color: "var(--color-text-on-light)", marginTop: "0.4rem" }}>
                {formatPrice(ticketPromedio)}
              </p>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", color: "var(--color-text-on-light-faint)", marginTop: "0.4rem" }}>
                por servicio completado
              </p>
            </div>

            <div style={cardStyle}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", textTransform: "uppercase", letterSpacing: "var(--tracking-wider)", color: "var(--color-text-on-light-muted)" }}>
                Tasa de cancelación
              </p>
              <p style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: "var(--text-4xl)", color: "var(--color-text-on-light)", marginTop: "0.4rem" }}>
                {tasaCancelacion.toFixed(1)}%
              </p>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", color: "var(--color-text-on-light-faint)", marginTop: "0.4rem" }}>
                {canceladas.length} citas canceladas
              </p>
            </div>
          </div>

          {/* Gráfico */}
          <div style={{ ...sectionCardStyle, marginBottom: "1.75rem" }}>
            <h3
              style={{
                fontFamily: "var(--font-display)",
                fontStyle: "italic",
                fontWeight: 600,
                fontSize: "var(--text-xl)",
                color: "var(--color-text-on-light)",
                marginBottom: "1rem",
              }}
            >
              Ingresos
            </h3>
            <IngresosChart data={chartData} variant={chartVariant} />
          </div>

          {/* Servicios más vendidos */}
          {/* <div style={{ ...sectionCardStyle, marginBottom: "1.75rem", padding: 0, overflow: "hidden" }}>
            <h3
              style={{
                fontFamily: "var(--font-display)",
                fontStyle: "italic",
                fontWeight: 600,
                fontSize: "var(--text-xl)",
                color: "var(--color-text-on-light)",
                padding: "1.75rem 1.75rem 1rem",
              }}
            >
              Servicios más vendidos
            </h3>
            <div className="overflow-x-auto w-full">
              <table className="w-full min-w-[600px]" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#0A0A0B" }}>
                  <th style={th}>Servicio</th>
                  <th style={th}>Citas completadas</th>
                  <th style={th}>Ingresos generados</th>
                  <th style={th}>% del total</th>
                  <th style={th}>Ticket promedio</th>
                </tr>
              </thead>
              <tbody>
                {serviciosStats.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ ...td, textAlign: "center", padding: "2rem" }}>
                      Sin servicios completados en este período.
                    </td>
                  </tr>
                ) : (
                  <>
                    {serviciosStats.map((s, i) => (
                      <tr
                        key={s.id}
                        style={{
                          backgroundColor: i % 2 === 0 ? "transparent" : "rgba(10,10,11,0.02)",
                          borderBottom: "1px solid var(--color-border-light)",
                        }}
                      >
                        <td style={{ ...td, color: "var(--color-text-on-light)", fontWeight: 500 }}>{s.nombre}</td>
                        <td style={{ ...td, fontFamily: "var(--font-mono)" }}>{s.citas}</td>
                        <td style={{ ...td, fontFamily: "var(--font-mono)" }}>{formatPrice(s.ingresos)}</td>
                        <td style={{ ...td, fontFamily: "var(--font-mono)" }}>{s.porcentaje.toFixed(1)}%</td>
                        <td style={{ ...td, fontFamily: "var(--font-mono)" }}>{formatPrice(s.ticketPromedio)}</td>
                      </tr>
                    ))}
                    <tr style={{ backgroundColor: "var(--color-bg-light-alt)" }}>
                      <td style={{ ...td, fontWeight: 700, color: "var(--color-text-on-light)" }}>Total</td>
                      <td style={{ ...td, fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--color-text-on-light)" }}>
                        {serviciosStats.reduce((sum, s) => sum + s.citas, 0)}
                      </td>
                      <td style={{ ...td, fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--color-text-on-light)" }}>
                        {formatPrice(serviciosStats.reduce((sum, s) => sum + s.ingresos, 0))}
                      </td>
                      <td style={td} />
                      <td style={td} />
                    </tr>
                  </>
                )}
              </tbody>
            </table>
            </div>
          </div> */}

          {/* Rendimiento por estilista */}
          {/* <div style={{ ...sectionCardStyle, marginBottom: "1.75rem", padding: 0, overflow: "hidden" }}>
            <h3
              style={{
                fontFamily: "var(--font-display)",
                fontStyle: "italic",
                fontWeight: 600,
                fontSize: "var(--text-xl)",
                color: "var(--color-text-on-light)",
                padding: "1.75rem 1.75rem 1rem",
              }}
            >
              Rendimiento por estilista
            </h3>
            <div className="overflow-x-auto w-full">
              <table className="w-full min-w-[500px]" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#0A0A0B" }}>
                  <th style={th}>Estilista</th>
                  <th style={th}>Citas completadas</th>
                  <th style={th}>Ingresos</th>
                  <th style={th}>Ticket promedio</th>
                  <th style={th}>Cancelaciones</th>
                </tr>
              </thead>
              <tbody>
                {estilistasStats.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ ...td, textAlign: "center", padding: "2rem" }}>
                      Sin datos en este período.
                    </td>
                  </tr>
                ) : (
                  estilistasStats.map((e, i) => (
                    <tr
                      key={e.id}
                      style={{
                        backgroundColor: i % 2 === 0 ? "transparent" : "rgba(10,10,11,0.02)",
                        borderBottom: i === estilistasStats.length - 1 ? "none" : "1px solid var(--color-border-light)",
                      }}
                    >
                      <td style={{ ...td, color: "var(--color-text-on-light)", fontWeight: 500 }}>{e.nombre}</td>
                      <td style={{ ...td, fontFamily: "var(--font-mono)" }}>{e.citas}</td>
                      <td style={{ ...td, fontFamily: "var(--font-mono)" }}>{formatPrice(e.ingresos)}</td>
                      <td style={{ ...td, fontFamily: "var(--font-mono)" }}>{formatPrice(e.ticketPromedio)}</td>
                      <td style={{ ...td, fontFamily: "var(--font-mono)", color: e.cancelaciones > 0 ? "var(--color-error)" : "var(--color-text-on-light-muted)" }}>
                        {e.cancelaciones}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            </div>
          </div> */}

          {/* Cierre de caja diario */}
          <div style={{ ...sectionCardStyle, padding: 0, overflow: "hidden" }}>
            <div className="flex items-center justify-between flex-wrap gap-3" style={{ padding: "1.75rem 1.75rem 1rem" }}>
              <div>
                <h3
                  style={{
                    fontFamily: "var(--font-display)",
                    fontStyle: "italic",
                    fontWeight: 600,
                    fontSize: "var(--text-xl)",
                    color: "var(--color-text-on-light)",
                  }}
                >
                  Cierre de caja diario
                </h3>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)", color: "var(--color-text-on-light-faint)", marginTop: "0.25rem" }}>
                  Cierres registrados
                </p>
              </div>
              <Button variant="accent" size="sm" disabled={generandoCierre} onClick={handleGenerarCierre}>
                {generandoCierre ? "Generando..." : "Generar cierre de hoy +"}
              </Button>
            </div>

            {cierresLoading ? (
              <LoadingState variant="light" />
            ) : (
              <div className="overflow-x-auto w-full">
                <table className="w-full min-w-[800px]" style={{ borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: "#0A0A0B" }}>
                    <th style={th}>Fecha</th>
                    <th style={th}>Ingresos servicios</th>
                    <th style={th}>Ingresos productos</th>
                    <th style={th}>Total</th>
                    <th style={th}>Citas completadas</th>
                    <th style={th}>Citas canceladas</th>
                    <th style={th}>Generado por</th>
                  </tr>
                </thead>
                <tbody>
                  {cierres.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ ...td, textAlign: "center", padding: "2rem" }}>
                        Aún no hay cierres de caja registrados.
                      </td>
                    </tr>
                  ) : (
                    cierres.map((c, i) => (
                      <tr
                        key={c.id}
                        style={{
                          backgroundColor: i % 2 === 0 ? "transparent" : "rgba(10,10,11,0.02)",
                          borderBottom: i === cierres.length - 1 ? "none" : "1px solid var(--color-border-light)",
                        }}
                      >
                        <td style={{ ...td, fontFamily: "var(--font-mono)", color: "var(--color-text-on-light)" }}>
                          {format(new Date(c.fecha + "T00:00:00"), "d MMM yyyy", { locale: es })}
                        </td>
                        <td style={{ ...td, fontFamily: "var(--font-mono)" }}>{formatPrice(c.ingresos_servicios)}</td>
                        <td style={{ ...td, fontFamily: "var(--font-mono)" }}>{formatPrice(c.ingresos_productos)}</td>
                        <td style={{ ...td, fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--color-primary-dim)" }}>
                          {formatPrice(c.total_ingresos)}
                        </td>
                        <td style={{ ...td, fontFamily: "var(--font-mono)" }}>{c.citas_completadas}</td>
                        <td style={{ ...td, fontFamily: "var(--font-mono)" }}>{c.citas_canceladas}</td>
                        <td style={td}>{c.generado_por}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              </div>
            )}
          </div>
        </>
      )}

      <AdminToast toast={toast} />
    </AdminLayout>
  );
}
