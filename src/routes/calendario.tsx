import { createFileRoute } from "@tanstack/react-router";
import { construirIcs } from "@/lib/calendario-ics";

// Enlace que recibe la clienta por WhatsApp para guardar su cita (o su retoque) en el calendario del teléfono.
// Es una ruta del servidor que responde con un archivo .ics. No consulta la base de datos ni lleva datos
// personales: el servicio, la hora y la profesional viajan en el propio enlace.
// Ejemplo: /calendario?s=20261026T0800&m=45&x=Manicure%20tradicional&p=Adriana&a=1080
export const Route = createFileRoute("/calendario")({
  server: {
    handlers: {
      GET: ({ request }) => {
        const q = new URL(request.url).searchParams;
        const ics = construirIcs({
          t: q.get("t"),
          s: q.get("s"),
          m: q.get("m"),
          d: q.get("d"),
          x: q.get("x"),
          p: q.get("p"),
          a: q.get("a"),
        });
        if (!ics) {
          return new Response("Enlace de calendario no válido.", {
            status: 400,
            headers: { "content-type": "text/plain; charset=utf-8" },
          });
        }
        return new Response(ics, {
          status: 200,
          headers: {
            "content-type": "text/calendar; charset=utf-8",
            "content-disposition": 'inline; filename="cita.ics"',
            "cache-control": "no-store",
            "x-robots-tag": "noindex",
          },
        });
      },
    },
  },
});
