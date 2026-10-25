// Genera el archivo de calendario (.ics) que se abre desde el enlace que recibe la clienta por WhatsApp
// (ruta /calendario). No guarda nada ni lleva datos personales: todo viaja en el enlace.
// Colombia no tiene horario de verano: America/Bogota es siempre UTC-5.

const SALON = "Centro de Belleza Adriana Chávez";
const LUGAR = "Monterrey, Casanare";
const MAPA = "https://maps.google.com/?q=Centro+de+Belleza+Adriana+Chavez+Monterrey+Casanare";
const OFFSET_HORAS = 5;
const MAX_ALARMA_MIN = 60 * 24 * 7;

export type EntradaCalendario = {
  t?: string | null; // "cita" (por defecto) o "retoque"
  s?: string | null; // cita: inicio local YYYYMMDDTHHMM
  m?: string | null; // cita: duración en minutos
  d?: string | null; // retoque: fecha YYYYMMDD
  x?: string | null; // servicio
  p?: string | null; // profesional (opcional)
  a?: string | null; // cita: minutos antes para el aviso (0 o vacío = sin aviso)
};

function limpiar(valor: string | null | undefined, max: number): string {
  // eslint-disable-next-line no-control-regex
  return (valor ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function escapar(texto: string): string {
  return texto.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

// Las líneas de un .ics no pueden pasar de 75 bytes; se parten con un espacio al inicio de la continuación.
function plegar(linea: string): string {
  const bytes = new TextEncoder();
  if (bytes.encode(linea).length <= 75) return linea;
  const partes: string[] = [];
  let actual = "";
  for (const ch of linea) {
    const limite = partes.length === 0 ? 75 : 74;
    if (bytes.encode(actual + ch).length > limite) {
      partes.push(actual);
      actual = ch;
    } else {
      actual += ch;
    }
  }
  partes.push(actual);
  return partes.map((p, i) => (i === 0 ? p : " " + p)).join("\r\n");
}

const dos = (n: number) => String(n).padStart(2, "0");

function aUtc(y: number, mo: number, d: number, h: number, mi: number): string {
  const f = new Date(Date.UTC(y, mo - 1, d, h + OFFSET_HORAS, mi, 0));
  return `${f.getUTCFullYear()}${dos(f.getUTCMonth() + 1)}${dos(f.getUTCDate())}T${dos(f.getUTCHours())}${dos(f.getUTCMinutes())}00Z`;
}

function fechaValida(y: number, mo: number, d: number): boolean {
  const f = new Date(Date.UTC(y, mo - 1, d));
  return f.getUTCFullYear() === y && f.getUTCMonth() === mo - 1 && f.getUTCDate() === d;
}

export function construirIcs(entrada: EntradaCalendario, ahora: Date = new Date()): string | null {
  const tipo = entrada.t === "retoque" ? "retoque" : "cita";
  const servicio = limpiar(entrada.x, 80) || "Tu cita";
  const profesional = limpiar(entrada.p, 60);
  const sello = `${ahora.getUTCFullYear()}${dos(ahora.getUTCMonth() + 1)}${dos(ahora.getUTCDate())}T${dos(ahora.getUTCHours())}${dos(ahora.getUTCMinutes())}${dos(ahora.getUTCSeconds())}Z`;
  const lineas: string[] = ["BEGIN:VCALENDAR", "VERSION:2.0", `PRODID:-//${SALON}//Calendario//ES`, "CALSCALE:GREGORIAN", "METHOD:PUBLISH"];

  if (tipo === "cita") {
    const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})$/.exec(entrada.s ?? "");
    if (!m) return null;
    const [y, mo, d, h, mi] = [Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4]), Number(m[5])];
    if (!fechaValida(y, mo, d) || h > 23 || mi > 59) return null;
    const duracion = Math.min(Math.max(Number.parseInt(entrada.m ?? "", 10) || 60, 5), 600);
    const inicio = aUtc(y, mo, d, h, mi);
    const fin = aUtc(y, mo, d, h, mi + duracion);
    const alarma = Math.min(Math.max(Number.parseInt(entrada.a ?? "", 10) || 0, 0), MAX_ALARMA_MIN);
    const descripcion = [profesional ? `Cita con ${profesional}.` : "Tu cita en el salón.", `Dónde: ${LUGAR}`, MAPA].join("\n");
    lineas.push(
      "BEGIN:VEVENT",
      `UID:cita-${m[1]}${m[2]}${m[3]}T${m[4]}${m[5]}-${duracion}-${servicio.length}${profesional.length}@adrianachavez.com`,
      `DTSTAMP:${sello}`,
      `DTSTART:${inicio}`,
      `DTEND:${fin}`,
      `SUMMARY:${escapar(`${servicio} · ${SALON}`)}`,
      `LOCATION:${escapar(`${SALON}, ${LUGAR}`)}`,
      `DESCRIPTION:${escapar(descripcion)}`,
    );
    if (alarma > 0) {
      lineas.push("BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${escapar(`Tu cita: ${servicio}`)}`, `TRIGGER:-PT${alarma}M`, "END:VALARM");
    }
    lineas.push("END:VEVENT");
  } else {
    const m = /^(\d{4})(\d{2})(\d{2})$/.exec(entrada.d ?? "");
    if (!m) return null;
    const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
    if (!fechaValida(y, mo, d)) return null;
    const siguiente = new Date(Date.UTC(y, mo - 1, d + 1));
    const fin = `${siguiente.getUTCFullYear()}${dos(siguiente.getUTCMonth() + 1)}${dos(siguiente.getUTCDate())}`;
    lineas.push(
      "BEGIN:VEVENT",
      `UID:retoque-${m[1]}${m[2]}${m[3]}-${servicio.length}@adrianachavez.com`,
      `DTSTAMP:${sello}`,
      `DTSTART;VALUE=DATE:${m[1]}${m[2]}${m[3]}`,
      `DTEND;VALUE=DATE:${fin}`,
      `SUMMARY:${escapar(`Retoque de tu ${servicio.toLowerCase()} · ${SALON}`)}`,
      `LOCATION:${escapar(`${SALON}, ${LUGAR}`)}`,
      `DESCRIPTION:${escapar(`Ya casi te toca renovar tu ${servicio.toLowerCase()}. Escríbenos por WhatsApp y te agendamos.\n${MAPA}`)}`,
      "TRANSP:TRANSPARENT",
      // Avisa 3 días antes, a las 9:00 am.
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      `DESCRIPTION:${escapar("Se acerca tu retoque")}`,
      "TRIGGER:-P2DT15H",
      "END:VALARM",
      "END:VEVENT",
    );
  }
  lineas.push("END:VCALENDAR");
  return lineas.map(plegar).join("\r\n") + "\r\n";
}
