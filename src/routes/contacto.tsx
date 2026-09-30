import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  ChevronDown,
  Facebook,
  Instagram,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Youtube,
} from "lucide-react";
import { MapaContacto } from "@/components/contacto/MapaContacto";
import { CONTACT_INFO, SOCIAL_LINKS } from "@/constants";

export const Route = createFileRoute("/contacto")({
  component: ContactoPage,
  head: () => ({
    meta: [
      { title: "Contacto | Centro de Belleza Adriana Chávez" },
      {
        name: "description",
        content:
          "Reserva tu cita en el centro Adriana Chávez. Encuéntranos en Monterrey, Casanare. Atención por WhatsApp, teléfono o formulario.",
      },
    ],
  }),
});

function ContactoPage() {
  return (
    <main>
      {/* Hero */}
      <section
        data-navbar-dark
        className="relative overflow-hidden"
        style={{
          background: `
            radial-gradient(ellipse at 80% 50%, rgba(232,201,122,0.07) 0%, transparent 55%),
            var(--color-bg)
          `,
          minHeight: "220px",
          paddingTop: "80px",
          display: "flex",
          alignItems: "center",
        }}
      >
        <div
          className="mx-auto w-full"
          style={{
            maxWidth: "1440px",
            marginLeft: "auto",
            marginRight: "auto",
            paddingLeft: "1.5rem",
            paddingRight: "1.5rem",
            paddingTop: "2rem",
            paddingBottom: "2rem",
          }}
        >
          <div
            style={{
              width: 60,
              height: 2,
              backgroundColor: "var(--color-accent)",
              marginBottom: "1.5rem",
            }}
          />
          <p
            className="uppercase"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--text-xs)",
              letterSpacing: "var(--tracking-widest)",
              color: "var(--color-accent)",
              marginBottom: "1rem",
            }}
          >
            Contacto
          </p>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontWeight: 600,
              fontSize: "clamp(2.5rem, 5vw, 3.5rem)",
              color: "var(--color-text-primary)",
              lineHeight: "var(--leading-tight)",
              marginBottom: "1.25rem",
            }}
          >
            Reserva tu cita
          </h1>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontWeight: 300,
              fontSize: "var(--text-lg)",
              color: "rgba(247,245,240,0.65)",
              maxWidth: "100%",
              lineHeight: "var(--leading-relaxed)",
            }}
          >
            Estamos aquí para atenderte. Escríbenos o visítanos directamente.
          </p>
        </div>
      </section>

      {/* Info */}
      <section
        style={{
          backgroundColor: "var(--color-bg-light)",
          paddingTop: "3rem",
          paddingBottom: "3rem",
        }}
      >
        <div
          className="mx-auto"
          style={{
            maxWidth: "1440px",
            marginLeft: "auto",
            marginRight: "auto",
            paddingLeft: "1.5rem",
            paddingRight: "1.5rem",
          }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-[30fr_70fr] gap-6 items-stretch">
            <div
              style={{
                backgroundColor: "#0A0A0B",
                boxShadow: "0 8px 32px rgba(10,10,11,0.18)",
                borderRadius: "var(--radius-2xl)",
                padding: "2.5rem",
                color: "var(--color-text-primary)",
              }}
            >
              <p
                className="uppercase"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--text-xs)",
                  letterSpacing: "var(--tracking-widest)",
                  color: "var(--color-accent)",
                  marginBottom: "1rem",
                }}
              >
                Visítanos
              </p>
              <div className="flex items-start gap-2 mb-6">
                <MapPin size={18} color="var(--color-accent)" style={{ flexShrink: 0, marginTop: "2px" }} />
                <a
                  href={CONTACT_INFO.mapUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "var(--text-base)",
                    color: "rgba(247,245,240,0.75)",
                    textDecoration: "none",
                  }}
                >
                  {CONTACT_INFO.address}
                </a>
              </div>

              <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", margin: "1.5rem 0" }} />

              <p
                className="uppercase"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--text-xs)",
                  letterSpacing: "var(--tracking-widest)",
                  color: "var(--color-accent)",
                  marginBottom: "1rem",
                }}
              >
                Escríbenos
              </p>
              <div className="flex flex-col gap-3 mb-6">
                <a
                  href="https://wa.me/573102680814"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 self-start"
                  style={{
                    backgroundColor: "rgba(37,211,102,0.15)",
                    border: "1px solid rgba(37,211,102,0.3)",
                    color: "#25D366",
                    borderRadius: "var(--radius-full)",
                    padding: "8px 16px",
                    fontFamily: "var(--font-body)",
                    fontSize: "var(--text-sm)",
                    fontWeight: 600,
                    transition: "background-color var(--transition-base)",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "rgba(37,211,102,0.25)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "rgba(37,211,102,0.15)")
                  }
                >
                  <MessageCircle size={18} color="#25D366" />
                  WhatsApp
                </a>
                {CONTACT_INFO.email && (
                  <a
                    href={`mailto:${CONTACT_INFO.email}`}
                    className="flex items-center gap-2"
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "var(--text-base)",
                      color: "rgba(247,245,240,0.75)",
                    }}
                  >
                    <Mail size={18} color="var(--color-accent)" />
                    {CONTACT_INFO.email}
                  </a>
                )}
              </div>

              <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", margin: "1.5rem 0" }} />

              <p
                className="uppercase"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--text-xs)",
                  letterSpacing: "var(--tracking-widest)",
                  color: "var(--color-accent)",
                  marginBottom: "1rem",
                }}
              >
                Síguenos
              </p>
              <div className="flex gap-4">
                <a
                  href={SOCIAL_LINKS.facebook}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Facebook"
                  className="text-[rgba(247,245,240,0.6)] hover:text-[var(--color-accent)] transition-colors"
                >
                  <Facebook size={22} />
                </a>
                <a
                  href={SOCIAL_LINKS.instagram}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram"
                  className="text-[rgba(247,245,240,0.6)] hover:text-[var(--color-accent)] transition-colors"
                >
                  <Instagram size={22} />
                </a>
              </div>
            </div>

            <MapaContacto />
          </div>
        </div>
      </section>
    </main>
  );
}
