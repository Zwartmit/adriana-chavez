import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
}

export function estadoLabel(estado: string): string {
  const map: Record<string, string> = {
    pendiente: "Pendiente",
    confirmada: "Confirmada",
    en_proceso: "En proceso",
    completada: "Completada",
    cancelada: "Cancelada",
    no_asistio: "No asistió",
  };
  return map[estado] || estado;
}

/**
 * Precio de un servicio: "$X" (fijo), "Desde $X" (variable) o "$X – $Y" (rango).
 * `desde` es servicios.precio; `hasta` es servicios.precio_hasta (opcional).
 */
export function formatPriceRange(desde: number, hasta?: number | null, esDesde = false): string {
  if (hasta != null && hasta > desde) return `${formatPrice(desde)} – ${formatPrice(hasta)}`;
  return esDesde ? `Desde ${formatPrice(desde)}` : formatPrice(desde);
}

/**
 * Color de texto legible (claro u oscuro) para un fondo dado en hexadecimal.
 * Elige el que da más contraste según la luminancia relativa (WCAG).
 * Si el color no es un hexadecimal válido, devuelve el texto oscuro.
 */
export function textoSobreColor(fondoHex: string | null | undefined): string {
  const oscuro = "#0A0A0B";
  const claro = "#FAF7F0";
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec((fondoHex ?? "").trim());
  if (!m) return oscuro;
  let h = m[1];
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const canal = (i: number) => {
    const v = parseInt(h.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  const lum = 0.2126 * canal(0) + 0.7152 * canal(2) + 0.0722 * canal(4);
  // contraste con blanco ≈ 1.05 / (lum + 0.05); con negro ≈ (lum + 0.05) / 0.05
  return (lum + 0.05) / 0.05 >= 1.05 / (lum + 0.05) ? oscuro : claro;
}
