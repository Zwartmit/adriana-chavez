import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function CTAFinal() {
  return (
    <section
      className="relative overflow-hidden"
      style={{
        backgroundColor: "var(--color-primary)",
        color: "var(--color-text-inverse)",
        paddingTop: "6rem",
        paddingBottom: "6rem",
      }}
    >
      <img
        src="https://placehold.co/1920x800/1C3D35/C8A96E?text=."
        alt=""
        aria-hidden
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: 0.15 }}
      />
      <div
        className="absolute inset-0"
        style={{ backgroundColor: "rgba(15, 36, 32, 0.85)" }}
      />

      <div
        className="relative z-10 mx-auto flex flex-col items-center text-center gap-6"
        style={{
          maxWidth: "1200px",
          marginLeft: "auto",
          marginRight: "auto",
          paddingLeft: "1.5rem",
          paddingRight: "1.5rem",
        }}
      >
        <span
          className="uppercase"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--text-xs)",
            letterSpacing: "var(--tracking-widest)",
            color: "var(--color-accent)",
          }}
        >
          Reserva tu cita
        </span>

        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontStyle: "italic",
            fontWeight: 600,
            fontSize: "clamp(2.5rem, 5vw, 4rem)",
            lineHeight: "var(--leading-tight)",
          }}
        >
          ¿Lista para tu próxima transformación?
        </h2>

        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-lg)",
            color: "rgba(247, 245, 240, 0.75)",
            maxWidth: "600px",
            lineHeight: "var(--leading-relaxed)",
          }}
        >
          Reserva tu cita hoy y deja que nuestro equipo cuide de ti.
        </p>

        <div
          style={{
            width: 80,
            height: 1,
            backgroundColor: "var(--color-accent)",
            marginTop: "0.5rem",
          }}
        />

        <div className="flex flex-wrap gap-4 justify-center mt-2">
          <a href="/contacto">
            <Button variant="accent" size="lg">
              Reservar mi cita →
            </Button>
          </a>
          <a
            href="https://wa.me/573000000000"
            target="_blank"
            rel="noreferrer"
          >
            <Button variant="ghost" size="lg">
              <MessageCircle size={18} className="mr-2" />
              Hablar por WhatsApp
            </Button>
          </a>
        </div>

        <span
          className="uppercase mt-4"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--text-xs)",
            letterSpacing: "var(--tracking-wider)",
            color: "rgba(247, 245, 240, 0.4)",
          }}
        >
          Sin costo de reserva · Fácil y rápido
        </span>
      </div>
    </section>
  );
}
