import { ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/Button";

const STATS = [
  { value: "320+", label: "clientas felices" },
  { value: "12", label: "años de experiencia" },
  { value: "98%", label: "satisfacción" },
];

export function HeroBanner() {
  return (
    <section
      className="relative flex items-center justify-center overflow-hidden"
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--color-primary)",
        color: "var(--color-text-inverse)",
        paddingTop: "6rem",
        paddingBottom: "6rem",
      }}
    >
      {/* bg image */}
      <img
        src="https://placehold.co/1920x1080/1C3D35/F7F5F0?text=."
        alt=""
        aria-hidden
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: 0.3 }}
      />
      <div
        className="absolute inset-0"
        style={{ backgroundColor: "rgba(15, 36, 32, 0.5)" }}
      />

      <div
        className="relative z-10 mx-auto flex flex-col items-start gap-6 w-full"
        style={{
          maxWidth: "1200px",
          marginLeft: "auto",
          marginRight: "auto",
          paddingLeft: "1.5rem",
          paddingRight: "1.5rem",
        }}
      >
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
          Salón de belleza en Bogotá
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
            color: "var(--color-text-inverse)",
          }}
        >
          Tu belleza,
          <br />
          nuestra pasión.
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
          Expertos en realzar tu estilo con técnicas premium y atención
          personalizada.
        </p>

        <div
          className="animate-fade-in-up flex flex-wrap gap-4"
          style={{ animationDelay: "0.8s" }}
        >
          <a href="/contacto">
            <Button variant="accent" size="md">
              Reservar cita →
            </Button>
          </a>
          <a href="/servicios">
            <Button variant="ghost" size="md">
              Ver servicios
            </Button>
          </a>
        </div>

        <div
          className="animate-scale-in-x"
          style={{
            animationDelay: "0.8s",
            width: "80px",
            height: "1px",
            backgroundColor: "var(--color-accent)",
            marginTop: "1rem",
          }}
        />

        <div
          className="animate-fade-in-up grid grid-cols-3 gap-8 w-full max-w-xl mt-4"
          style={{ animationDelay: "1.0s" }}
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
