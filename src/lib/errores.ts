/**
 * Traduce errores de Supabase (base de datos y storage) a mensajes claros para el panel.
 * Uso: setError(explicarError(error, "guardar el servicio"))  →  "No se pudo guardar el servicio. Ya existe uno con ese nombre."
 */

interface ErrorLike {
  code?: string;
  message?: string;
  details?: string | null;
  hint?: string | null;
  statusCode?: string | number;
  status?: number;
}

/** Nombres de columna de la base → palabra que entiende Adriana. */
const NOMBRES_CAMPO: Record<string, string> = {
  nombre: "el nombre",
  categoria_id: "la categoría",
  precio: "el precio",
  duracion_min: "la duración",
  marca: "la marca",
  telefono: "el teléfono",
  cargo: "el cargo",
  slug: "el nombre (genera un enlace repetido)",
  fecha_hora: "la fecha y hora",
  cliente_id: "la clienta",
  servicio_id: "el servicio",
  profesional_id: "la profesional",
  motivo: "el motivo",
  fecha_inicio: "la fecha de inicio",
  fecha_fin: "la fecha de fin",
};

function comoObjeto(e: unknown): ErrorLike {
  if (e && typeof e === "object") return e as ErrorLike;
  if (typeof e === "string") return { message: e };
  return {};
}

/** Solo el motivo, sin el "No se pudo ...". Útil cuando el mensaje ya empieza distinto. */
export function motivoDeError(e: unknown): string {
  const err = comoObjeto(e);
  const msg = String(err.message ?? "");
  const detalle = `${msg} ${err.details ?? ""}`;
  const bajo = detalle.toLowerCase();

  // Mensajes que escribimos nosotros en las funciones de la base (raise exception): ya vienen claros.
  if (err.code === "P0001" || err.code === "23P01") return msg;

  if (bajo.includes("failed to fetch") || bajo.includes("networkerror") || bajo.includes("network request failed")) {
    return "No hay conexión con el servidor. Revisa el internet e intenta de nuevo.";
  }
  if (bajo.includes("jwt expired") || err.code === "PGRST301") {
    return "Tu sesión venció. Vuelve a iniciar sesión.";
  }
  if (err.code === "42501" || bajo.includes("row-level security") || bajo.includes("permission denied")) {
    return "Tu usuario no tiene permiso para hacerlo. Entra con la cuenta de administración.";
  }

  // Storage
  if (bajo.includes("bucket not found")) {
    return "No existe el espacio de imágenes en Supabase (bucket). Avísale a Brandon.";
  }
  if (bajo.includes("exceeded the maximum allowed size") || bajo.includes("payload too large") || String(err.statusCode) === "413") {
    return "La imagen pesa demasiado (máximo 5 MB).";
  }
  if (bajo.includes("mime type") && bajo.includes("not supported")) {
    return "Ese formato de imagen no se admite. Usa PNG, JPG o WEBP.";
  }
  if (bajo.includes("already exists") && bajo.includes("resource")) {
    return "Ya existe un archivo con ese nombre. Intenta de nuevo.";
  }

  // Base de datos
  switch (err.code) {
    case "23505":
      return bajo.includes("slug") || bajo.includes("nombre")
        ? "Ya existe uno con ese nombre. Usa otro nombre."
        : "Ya existe un registro igual.";
    case "23503":
      return bajo.includes("still referenced") || bajo.includes("is still")
        ? "Tiene citas, pedidos u otros datos asociados, así que no se puede borrar. Puedes desactivarlo."
        : "Uno de los datos elegidos ya no existe. Recarga la página e intenta de nuevo.";
    case "23502": {
      const col = /column "([^"]+)"/.exec(msg)?.[1];
      return col ? `Falta ${NOMBRES_CAMPO[col] ?? `el campo «${col}»`}.` : "Falta llenar un campo obligatorio.";
    }
    case "23514":
      return "Hay un valor que no es válido (por ejemplo un precio negativo, un rango incorrecto o una duración fuera de lo permitido).";
    case "22P02":
    case "22003":
    case "22007":
    case "22008":
      return "Algún valor tiene un formato que no es válido. Revisa los números y las fechas.";
    case "22001":
      return "Algún texto es demasiado largo.";
  }

  return msg ? `Detalle: ${msg}` : "Error desconocido. Intenta de nuevo.";
}

/** "No se pudo guardar el servicio. Ya existe uno con ese nombre." */
export function explicarError(e: unknown, accion: string): string {
  const motivo = motivoDeError(e);
  return `No se pudo ${accion}. ${motivo}`;
}

/** Cuánto dura un aviso en pantalla: los errores se quedan más tiempo para poder leerlos. */
export function duracionAviso(tipo: "success" | "error"): number {
  return tipo === "error" ? 7000 : 2500;
}
