import { Instagram, Facebook, Youtube, MapPin, Phone, Mail } from "lucide-react";
import { NAV_LINKS, SOCIAL_LINKS, CONTACT_INFO } from "@/constants";

const linkStyle: React.CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: "var(--text-sm)",
  color: "rgba(247, 245, 240, 0.6)",
  transition: "color var(--transition-base)",
};

const headingStyle: React.CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: "var(--text-xs)",
  fontWeight: 600,
  letterSpacing: "var(--tracking-widest)",
  textTransform: "uppercase",
  color: "var(--color-accent)",
};

export function Footer() {
  return (
    <footer
      style={{
        backgroundColor: "var(--color-primary-dim)",
        color: "var(--color-text-inverse)",
      }}
    >
      <div
        className="mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 text-center md:text-left"
        style={{
          maxWidth: "var(--container-max)",
          padding: "var(--section-padding-y-sm) var(--container-padding)",
        }}
      >
        {/* Col 1 — Marca */}
        <div className="flex flex-col gap-6 items-center md:items-start">
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--text-2xl)",
              fontWeight: 600,
              color: "var(--color-accent)",
            }}
          >
            Adriana Chávez
          </div>
          <p
            style={{
              fontStyle: "italic",
              color: "var(--color-text-muted)",
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-sm)",
            }}
          >
            Tu belleza, nuestra pasión.
          </p>
          <div className="flex gap-4">
            <a
              href={SOCIAL_LINKS.instagram}
              aria-label="Instagram"
              target="_blank"
              rel="noreferrer"
              className="text-[rgba(247,245,240,0.6)] hover:text-[var(--color-accent)] transition-colors"
            >
              <Instagram size={20} />
            </a>
            <a
              href={SOCIAL_LINKS.facebook}
              aria-label="Facebook"
              target="_blank"
              rel="noreferrer"
              className="text-[rgba(247,245,240,0.6)] hover:text-[var(--color-accent)] transition-colors"
            >
              <Facebook size={20} />
            </a>
            <a
              href={SOCIAL_LINKS.tiktok}
              aria-label="TikTok"
              target="_blank"
              rel="noreferrer"
              className="text-[rgba(247,245,240,0.6)] hover:text-[var(--color-accent)] transition-colors"
            >
              <Youtube size={20} />
            </a>
          </div>
        </div>

        {/* Col 2 — Links */}
        <div className="flex flex-col gap-4 items-center md:items-start">
          <h3 style={headingStyle}>Navegación</h3>
          <ul className="flex flex-col gap-3 items-center md:items-start">

            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  style={linkStyle}
                  className="hover:!text-[var(--color-accent)]"
                >
                  {l.label}
                </a>
              </li>
            ))}
            <li>
              <a
                href="/contacto"
                style={linkStyle}
                className="hover:!text-[var(--color-accent)]"
              >
                Reservar cita
              </a>
            </li>
          </ul>
        </div>

        {/* Col 3 — Contacto */}
        <div className="flex flex-col gap-4 items-center md:items-start">
          <h3 style={headingStyle}>Contacto</h3>
          <ul className="flex flex-col gap-3 items-center md:items-start">

            <li className="flex items-start gap-2" style={linkStyle}>
              <MapPin size={16} className="mt-0.5 shrink-0" />
              {CONTACT_INFO.address}
            </li>
            <li className="flex items-start gap-2" style={linkStyle}>
              <Phone size={16} className="mt-0.5 shrink-0" />
              {CONTACT_INFO.phone}
            </li>
            <li className="flex items-start gap-2" style={linkStyle}>
              <Mail size={16} className="mt-0.5 shrink-0" />
              {CONTACT_INFO.email}
            </li>
          </ul>

          <h3 style={{ ...headingStyle, marginTop: "1rem" }}>Horarios</h3>
          <ul className="flex flex-col gap-2 items-center md:items-start">
            <li style={linkStyle}>{CONTACT_INFO.schedule.weekdays}</li>
            <li style={linkStyle}>{CONTACT_INFO.schedule.saturday}</li>
            <li style={linkStyle}>{CONTACT_INFO.schedule.sunday}</li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ borderTop: "1px solid rgba(224, 221, 213, 0.2)" }}>
        <div
          className="mx-auto flex flex-col md:flex-row items-center justify-between gap-3"
          style={{
            maxWidth: "var(--container-max)",
            padding: "1.5rem var(--container-padding)",
            fontFamily: "var(--font-mono)",
            fontSize: "var(--text-xs)",
            color: "var(--color-text-muted)",
          }}
        >
          <span>© 2024 Adriana Chávez · Todos los derechos reservados</span>
          <a
            href="/privacidad"
            className="hover:text-[var(--color-accent)] transition-colors"
          >
            Política de privacidad
          </a>
        </div>
      </div>
    </footer>
  );
}
