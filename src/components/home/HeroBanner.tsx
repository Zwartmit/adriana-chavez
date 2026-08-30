import { useEffect, useState } from "react";
import { ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { HeroModel3D } from "./HeroModel3D";

export function HeroBanner() {
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

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
        <div className="flex flex-col items-center text-center lg:items-start lg:text-left gap-6">
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
            Centro de belleza · Monterrey, Casanare
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

          {/* Modelo 3D en Móvil/Tablet (se muestra aquí) */}
          {!isDesktop && (
            <div className="flex w-full items-center justify-center my-8 animate-fade-in-up" style={{ animationDelay: "0.7s" }}>
              <div style={{ position: "relative", width: 260, height: 260 }}>
                <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "1px solid rgba(232,201,122,0.2)" }} />
                <div style={{ position: "absolute", inset: "25px", borderRadius: "50%", border: "1px solid rgba(232,201,122,0.15)" }} />
                <div style={{ position: "absolute", inset: "50px", borderRadius: "50%", border: "1px solid rgba(232,201,122,0.3)", backgroundColor: "rgba(232,201,122,0.06)" }} />
                <div style={{ position: "absolute", inset: "-40px", zIndex: 10 }}>
                  <HeroModel3D scale={2.8} positionY={-1.6} />
                </div>
              </div>
            </div>
          )}

          <div
            className="animate-fade-in-up flex flex-wrap justify-center lg:justify-start gap-4"
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
            className="animate-scale-in-x mx-auto lg:mx-0"
            style={{
              animationDelay: "0.8s",
              width: "80px",
              height: "1.5px",
              background: "linear-gradient(90deg, var(--color-primary-dim), var(--color-primary), var(--color-primary-dim))",
              marginTop: "1rem",
            }}
          />
        </div>

        {/* Columna derecha — decoración geométrica (Solo Desktop) */}
        <div className="hidden lg:flex items-center justify-center">
          <div style={{ position: "relative", width: 320, height: 320 }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "1px solid rgba(232,201,122,0.2)" }} />
            <div style={{ position: "absolute", inset: "40px", borderRadius: "50%", border: "1px solid rgba(232,201,122,0.15)" }} />
            <div style={{ position: "absolute", inset: "80px", borderRadius: "50%", border: "1px solid rgba(232,201,122,0.3)", backgroundColor: "rgba(232,201,122,0.06)" }} />
            <div style={{ position: "absolute", inset: "-100px", zIndex: 10 }}>
              {isDesktop && <HeroModel3D />}
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
