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
