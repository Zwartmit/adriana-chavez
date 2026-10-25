import { createFileRoute } from "@tanstack/react-router";
import { construirGoogle, construirIcs, prefiereIcs } from "@/lib/calendario-ics";

// Enlace que recibe la clienta por WhatsApp para guardar su cita (o su retoque) en el calendario del teléfono.
// Es una ruta del servidor: no consulta la base de datos ni lleva datos personales (el servicio, la hora y la
// profesional viajan en el propio enlace).
//   · iPhone, iPad y Mac: responde con un .ics que el sistema abre como "Agregar al calendario" (con la alarma).
//   · Android y computador: redirige a Google Calendar con el evento ya lleno.
//   · ?f=ics o ?f=google fuerzan una de las dos salidas.
// Ejemplo: /calendario?s=20261026T0800&m=45&x=Manicure%20tradicional&p=Adriana&a=840
export const Route = createFileRoute("/calendario")({
  server: {
    handlers: {
      GET: ({ request }) => {
        const q = new URL(request.url).searchParams;
        const entrada = {
          t: q.get("t"),
          s: q.get("s"),
          m: q.get("m"),
          d: q.get("d"),
          x: q.get("x"),
          p: q.get("p"),
          a: q.get("a"),
        };
        const forzar = q.get("f");
        const usarIcs = forzar === "ics" || (forzar !== "google" && prefiereIcs(request.headers.get("user-agent")));

        if (usarIcs) {
          const ics = construirIcs(entrada);
          if (ics) {
            return new Response(ics, {
              status: 200,
              headers: {
                "content-type": "text/calendar; charset=utf-8",
                "content-disposition": 'inline; filename="cita.ics"',
                "cache-control": "no-store",
                "x-robots-tag": "noindex",
              },
            });
          }
        } else {
          const google = construirGoogle(entrada);
          if (google) {
            return new Response(null, {
              status: 302,
              headers: { location: google, "cache-control": "no-store", "x-robots-tag": "noindex" },
            });
          }
        }
        return new Response("Enlace de calendario no válido.", {
          status: 400,
          headers: { "content-type": "text/plain; charset=utf-8" },
        });
      },
    },
  },
});
