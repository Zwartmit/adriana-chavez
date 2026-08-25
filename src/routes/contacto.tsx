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
import { ContactoForm } from "@/components/contacto/ContactoForm";
import { MapaContacto } from "@/components/contacto/MapaContacto";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { CONTACT_INFO, SOCIAL_LINKS } from "@/constants";

export const Route = createFileRoute("/contacto")({
  component: ContactoPage,
  head: () => ({
    meta: [
      { title: "Contacto — Adriana Chávez" },
      {
        name: "description",
        content:
          "Reserva tu cita en el salón Adriana Chávez. Encuéntranos en Bogotá. Atención por WhatsApp, teléfono o formulario.",
      },
    ],
  }),
});

const FAQS_CONTACTO = [
  {
    q: "¿Con cuánto tiempo de anticipación debo reservar mi cita?",
    a: "Recomendamos reservar con al menos 48 horas de anticipación para garantizar disponibilidad. Para servicios de coloración o eventos especiales, lo ideal es reservar con una semana de anticipación.",
  },
  {
    q: "¿Qué necesito llevar a mi primera cita?",
    a: "Solo necesitas llegar con el cabello limpio y seco. Si tienes referencias visuales de lo que quieres (fotos, Pinterest), tráelas — nos ayudan mucho a entender tu visión.",
  },
  {
    q: "¿Puedo cancelar o reprogramar sin costo?",
    a: "Sí, puedes cancelar o reprogramar sin costo hasta 24 horas antes de tu cita. Pasado ese tiempo aplicamos una tarifa de cancelación del 20% del servicio reservado.",
  },
  {
    q: "¿Ofrecen servicios para eventos especiales o grupos?",
    a: "Sí, manejamos paquetes para bodas, grados y eventos corporativos. Contáctanos con al menos 2 semanas de anticipación para coordinar los detalles.",
  },
];

const CANALES = [
  {
    icon: MessageCircle,
    name: "WhatsApp Business",
    detail: "Respuesta inmediata",
    linkLabel: "Escribir ahora →",
    href: "https://wa.me/573000000000",
  },
  ...(CONTACT_INFO.email
    ? [
        {
          icon: Mail,
          name: "Correo electrónico",
          detail: CONTACT_INFO.email,
          linkLabel: "Enviar correo →",
          href: `mailto:${CONTACT_INFO.email}`,
        },
      ]
    : []),
  {
    icon: Phone,
    name: "Teléfono",
    detail: CONTACT_INFO.phone,
    linkLabel: "Llamar ahora →",
    href: "tel:+573000000000",
  },
];

function ContactoPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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
          minHeight: "320px",
          paddingTop: "80px",
          display: "flex",
          alignItems: "center",
        }}
      >
        <div
          className="mx-auto w-full"
          style={{
            maxWidth: "1200px",
            marginLeft: "auto",
            marginRight: "auto",
            paddingLeft: "1.5rem",
            paddingRight: "1.5rem",
            paddingTop: "4rem",
            paddingBottom: "4rem",
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
              maxWidth: "520px",
              lineHeight: "var(--leading-relaxed)",
            }}
          >
            Estamos aquí para atenderte. Escríbenos, llámanos o visítanos
            directamente.
          </p>
        </div>
      </section>

      {/* Formulario + Info */}
      <section
        style={{
          backgroundColor: "var(--color-bg-light)",
          paddingTop: "6rem",
          paddingBottom: "6rem",
        }}
      >
        <div
          className="mx-auto"
          style={{
            maxWidth: "1200px",
            marginLeft: "auto",
            marginRight: "auto",
            paddingLeft: "1.5rem",
            paddingRight: "1.5rem",
          }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-[55fr_45fr] gap-12">
            {/* Formulario */}
            <ContactoForm />

            {/* Info de contacto — tarjeta oscura dentro de la sección clara */}
            <div
              style={{
                backgroundColor: "#0A0A0B",
                boxShadow: "0 8px 32px rgba(10,10,11,0.18)",
                borderRadius: "var(--radius-2xl)",
                padding: "2.5rem",
                color: "var(--color-text-primary)",
              }}
            >
              {/* Visítanos */}
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

              {/* Escríbenos */}
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
                  href="https://wa.me/573000000000"
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

              {/* Llámanos */}
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
                Llámanos
              </p>
              <a
                href="tel:+573000000000"
                className="flex items-center gap-2 mb-6"
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--text-base)",
                  color: "rgba(247,245,240,0.75)",
                }}
              >
                <Phone size={18} color="var(--color-accent)" />
                {CONTACT_INFO.phone}
              </a>

              <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", margin: "1.5rem 0" }} />

              {/* Síguenos */}
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
                  href={SOCIAL_LINKS.instagram}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram"
                  className="text-[rgba(247,245,240,0.6)] hover:text-[var(--color-accent)] transition-colors"
                >
                  <Instagram size={22} />
                </a>
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
                  href={SOCIAL_LINKS.tiktok}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="TikTok"
                  className="text-[rgba(247,245,240,0.6)] hover:text-[var(--color-accent)] transition-colors"
                >
                  <Youtube size={22} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mapa */}
      <MapaContacto />

      {/* Horarios + Canales */}
      <section
        style={{
          backgroundColor: "var(--color-bg-light)",
          paddingTop: "6rem",
          paddingBottom: "6rem",
        }}
      >
        <div
          className="mx-auto"
          style={{
            maxWidth: "1200px",
            marginLeft: "auto",
            marginRight: "auto",
            paddingLeft: "1.5rem",
            paddingRight: "1.5rem",
          }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Horarios */}
            <div>
              <SectionHeader
                eyebrow="Horarios de atención"
                title="¿Cuándo puedes visitarnos?"
                className="mb-8"
                titleColor="var(--color-text-on-light)"
                eyebrowColor="var(--color-primary-dim)"
              />
              <div>
                <div
                  className="flex items-center justify-between"
                  style={{ padding: "1rem 0", borderBottom: "1px solid var(--color-border-light)" }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-body)",
                      fontWeight: 600,
                      fontSize: "var(--text-base)",
                      color: "var(--color-text-on-light)",
                    }}
                  >
                    Lunes a Sábado
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "var(--text-base)",
                      color: "var(--color-primary-dim)",
                    }}
                  >
                    8:00 am – 12:00 pm · 2:00 pm – 6:00 pm
                  </span>
                </div>
                <div
                  className="flex items-center justify-between"
                  style={{
                    padding: "1rem",
                    margin: "0 -1rem",
                    backgroundColor: "rgba(192,57,43,0.06)",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-body)",
                      fontWeight: 600,
                      fontSize: "var(--text-base)",
                      color: "var(--color-text-on-light)",
                    }}
                  >
                    Domingo
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "var(--text-base)",
                      color: "var(--color-error)",
                    }}
                  >
                    Cerrado
                  </span>
                </div>
              </div>
              <p
                className="italic mt-6"
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--text-sm)",
                  color: "var(--color-text-on-light-faint)",
                }}
              >
                Las citas se agendan con mínimo 24 horas de anticipación.
              </p>
            </div>

            {/* Canales directos */}
            <div>
              <SectionHeader
                eyebrow="Canales de contacto"
                title="Elige cómo contactarnos"
                className="mb-8"
                titleColor="var(--color-text-on-light)"
                eyebrowColor="var(--color-primary-dim)"
              />
              <div className="flex flex-col gap-4">
                {CANALES.map(({ icon: Icon, name, detail, linkLabel, href }) => (
                  <div
                    key={name}
                    className="flex items-start gap-4"
                    style={{
                      backgroundColor: "var(--color-surface-light)",
                      border: "1px solid var(--color-border-light)",
                      borderRadius: "var(--radius-xl)",
                      padding: "1.5rem",
                      transition: "all var(--transition-slow)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = "0 8px 24px rgba(10,10,11,0.12)";
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = "none";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    <div
                      className="flex items-center justify-center shrink-0"
                      style={{
                        width: 40,
                        height: 40,
                        backgroundColor: "rgba(200,168,74,0.15)",
                        borderRadius: "var(--radius-lg)",
                      }}
                    >
                      <Icon size={20} color="var(--color-primary-dim)" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span
                        style={{
                          fontFamily: "var(--font-body)",
                          fontWeight: 600,
                          fontSize: "var(--text-base)",
                          color: "var(--color-text-on-light)",
                        }}
                      >
                        {name}
                      </span>
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "var(--text-sm)",
                          color: "var(--color-text-on-light-muted)",
                        }}
                      >
                        {detail}
                      </span>
                      <a
                        href={href}
                        target={href.startsWith("http") ? "_blank" : undefined}
                        rel={href.startsWith("http") ? "noreferrer" : undefined}
                        className="underline"
                        style={{
                          fontFamily: "var(--font-body)",
                          fontWeight: 600,
                          fontSize: "var(--text-sm)",
                          color: "var(--color-primary-dim)",
                          transition: "color var(--transition-base)",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-primary)")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-primary-dim)")}
                      >
                        {linkLabel}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section
        data-navbar-dark
        style={{
          backgroundColor: "var(--color-bg-alt)",
          paddingTop: "5rem",
          paddingBottom: "5rem",
        }}
      >
        <div
          className="mx-auto"
          style={{
            maxWidth: "720px",
            marginLeft: "auto",
            marginRight: "auto",
            paddingLeft: "1.5rem",
            paddingRight: "1.5rem",
          }}
        >
          <SectionHeader
            eyebrow="Preguntas frecuentes"
            title="Antes de tu visita"
            align="center"
            titleSize="clamp(1.75rem, 3vw, 2.5rem)"
            className="mx-auto mb-12"
          />

          <div className="flex flex-col">
            {FAQS_CONTACTO.map((f, i) => {
              const isOpen = openFaq === i;
              return (
                <div key={f.q} style={{ borderTop: "1px solid var(--color-border)" }}>
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    className="w-full flex items-center justify-between gap-4 text-left"
                    style={{
                      padding: "1.25rem 0",
                      fontFamily: "var(--font-body)",
                      fontSize: "var(--text-lg)",
                      fontWeight: isOpen ? 600 : 500,
                      color: isOpen ? "var(--color-primary)" : "var(--color-text-primary)",
                      transition: "color var(--transition-base)",
                    }}
                    aria-expanded={isOpen}
                  >
                    <span>{f.q}</span>
                    <ChevronDown
                      size={20}
                      style={{
                        transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform 300ms ease",
                        color: "var(--color-accent)",
                        flexShrink: 0,
                      }}
                    />
                  </button>
                  <div
                    style={{
                      maxHeight: isOpen ? "400px" : "0px",
                      overflow: "hidden",
                      transition: "max-height 300ms ease",
                    }}
                  >
                    <p
                      style={{
                        paddingBottom: "1.5rem",
                        fontFamily: "var(--font-body)",
                        color: "var(--color-text-secondary)",
                        lineHeight: "var(--leading-relaxed)",
                      }}
                    >
                      {f.a}
                    </p>
                  </div>
                </div>
              );
            })}
            <div style={{ borderTop: "1px solid var(--color-border)" }} />
          </div>
        </div>
      </section>
    </main>
  );
}
