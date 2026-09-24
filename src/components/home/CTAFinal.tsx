export function CTAFinal() {
  return (
    <section
      data-navbar-dark
      className="relative overflow-hidden"
      style={{
        background: `
          radial-gradient(ellipse at 50% 0%, rgba(232,201,122,0.08) 0%, transparent 60%),
          var(--color-bg)
        `,
        color: "var(--color-text-primary)",
        paddingTop: "8rem",
        paddingBottom: "8rem",
        textAlign: "center",
      }}
    >
      <div
        className="relative z-10 mx-auto flex flex-col items-center text-center gap-6"
        style={{
          maxWidth: "1440px",
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

        <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
          <a
            href="/contacto"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "var(--color-accent)",
              color: "var(--color-text-inverse)",
              fontFamily: "var(--font-body)",
              fontWeight: 600,
              fontSize: "var(--text-base)",
              letterSpacing: "var(--tracking-wide)",
              padding: "14px 36px",
              borderRadius: "var(--radius-full)",
              minHeight: "52px",
              whiteSpace: "nowrap",
              transition: "background-color var(--transition-base)",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "var(--color-accent-dim)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "var(--color-accent)")
            }
          >
            Reservar mi cita →
          </a>
        </div>
      </div>
    </section>
  );
}
