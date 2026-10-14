/** Utilidades compartidas para las pantallas de horario (salón y servicios). */

/** Horas en pasos de 15 minutos, en formato "HH:MM" de 24 horas. */
export function generarSlots(desde = "05:00", hasta = "23:00", pasoMin = 15): string[] {
  const [h0, m0] = desde.split(":").map(Number);
  const [h1, m1] = hasta.split(":").map(Number);
  const slots: string[] = [];
  for (let t = h0 * 60 + m0; t <= h1 * 60 + m1; t += pasoMin) {
    slots.push(`${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`);
  }
  return slots;
}

/** "14:30" -> "2:30 PM" */
export function format12h(time24: string): string {
  const [h, m] = time24.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

/** "08:00:00" (columna time de Postgres) -> "08:00". Devuelve "" si no hay valor. */
export function recortarHora(t: string | null | undefined): string {
  return t ? t.slice(0, 5) : "";
}

/** Días de atención en numeración ISO (1 = lunes ... 7 = domingo), como en configuracion_horario. */
export const DIAS_ISO = [
  { iso: 1, corto: "L", largo: "Lunes" },
  { iso: 2, corto: "M", largo: "Martes" },
  { iso: 3, corto: "X", largo: "Miércoles" },
  { iso: 4, corto: "J", largo: "Jueves" },
  { iso: 5, corto: "V", largo: "Viernes" },
  { iso: 6, corto: "S", largo: "Sábado" },
  { iso: 7, corto: "D", largo: "Domingo" },
] as const;
