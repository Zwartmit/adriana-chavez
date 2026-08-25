import { ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/Button";

const STATS = [
  { value: "320+", label: "clientas felices" },
  { value: "98%", label: "satisfacción" },
];

export function HeroBanner() {
  return (
    <section
      data-navbar-dark
      className="relative overflow-hidden"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        background: `
          radial-gradient(ellipse at 75% 50%, rgba(232,201,122,0.06) 0%, transparent 55%),
          radial-gradient(ellipse at 10% 80%, rgba(232,201,122,0.04) 0%, transparent 45%),
          var(--color-bg)
        `,
        color: "var(--color-text-primary)",
        paddingTop: "6rem",
        paddingBottom: "6rem",
      }}
    >
      <div
        className="relative z-10 w-full grid grid-cols-1 lg:grid-cols-2 items-center gap-16"
        style={{
          maxWidth: "1200px",
          marginLeft: "auto",
          marginRight: "auto",
          paddingLeft: "1.5rem",
          paddingRight: "1.5rem",
        }}
      >
        <div className="flex flex-col items-start gap-6">
          <span
            className="animate-fade-in-up uppercase"
            style={{
              animationDelay: "0.2s",
              fontFamily: "var(--font-mono)",
              fontSize: "var(--text-xs)",
              letterSpacing: "var(--tracking-widest)",
              color: "var(--color-accent)",
            }}
          >
            Salón de belleza · Monterrey, Casanare
          </span>

          <h1
            className="animate-fade-in-up"
            style={{
              animationDelay: "0.4s",
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontWeight: 600,
              fontSize: "clamp(3rem, 7vw, 5.5rem)",
              lineHeight: "var(--leading-tight)",
              color: "var(--color-text-primary)",
            }}
          >
            Belleza, estilo y
            <br />
            confianza en un solo lugar.
          </h1>

          <p
            className="animate-fade-in-up"
            style={{
              animationDelay: "0.6s",
              fontFamily: "var(--font-body)",
              fontWeight: 300,
              fontSize: "var(--text-xl)",
              color: "rgba(247, 245, 240, 0.7)",
              maxWidth: "520px",
              lineHeight: "var(--leading-normal)",
            }}
          >
            Profesionalismo, calidad y atención personalizada.
          </p>

          <div
            className="animate-fade-in-up flex flex-wrap gap-4"
            style={{ animationDelay: "0.8s", marginTop: "2.5rem" }}
          >
            <a href="/contacto" style={{ display: "inline-block" }}>
              <Button variant="accent" size="lg">
                Reservar cita →
              </Button>
            </a>
            <a href="/servicios" style={{ display: "inline-block" }}>
              <Button variant="ghost" size="lg">
                Ver servicios
              </Button>
            </a>
          </div>

          <div
            className="animate-scale-in-x"
            style={{
              animationDelay: "0.8s",
              width: "80px",
              height: "1.5px",
              background: "linear-gradient(90deg, var(--color-primary-dim), var(--color-primary), var(--color-primary-dim))",
              marginTop: "1rem",
            }}
          />

          <div
            className="animate-fade-in-up grid grid-cols-2 gap-8 w-full max-w-xl"
            style={{ animationDelay: "1.0s", marginTop: "3rem" }}
          >
            {STATS.map((s) => (
              <div key={s.label} className="flex flex-col gap-1">
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontWeight: 700,
                    fontSize: "var(--text-3xl)",
                    color: "var(--color-accent)",
                  }}
                >
                  {s.value}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "var(--text-sm)",
                    color: "rgba(247, 245, 240, 0.5)",
                  }}
                >
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Columna derecha — decoración geométrica */}
        <div className="hidden lg:flex items-center justify-center">
          <div style={{ position: "relative", width: 320, height: 320 }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "1px solid rgba(232,201,122,0.2)" }} />
            <div style={{ position: "absolute", inset: "40px", borderRadius: "50%", border: "1px solid rgba(232,201,122,0.15)" }} />
            <div style={{ position: "absolute", inset: "80px", borderRadius: "50%", border: "1px solid rgba(232,201,122,0.3)", backgroundColor: "rgba(232,201,122,0.06)" }} />
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.25rem" }}>
              <span style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: "var(--text-5xl)", fontWeight: 600, color: "var(--color-accent)" }}>12</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", letterSpacing: "var(--tracking-widest)", textTransform: "uppercase", color: "rgba(247,245,240,0.5)" }}>años de experiencia</span>
            </div>
          </div>
        </div>
      </div>

      {/* scroll indicator */}
      <div
        className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce-y"
        style={{ bottom: "2rem", color: "var(--color-accent)" }}
        aria-hidden
      >
        <div
          className="flex items-center justify-center rounded-full"
          style={{
            width: 40,
            height: 40,
            border: "1px solid var(--color-accent)",
          }}
        >
          <ArrowDown size={16} />
        </div>
      </div>
    </section>
  );
}
