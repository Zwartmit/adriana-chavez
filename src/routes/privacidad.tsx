import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacidad")({
  head: () => ({
    meta: [
      {
        title: "Política de Privacidad | Adriana Chávez",
      },
      {
        name: "description",
        content: "Política de privacidad y tratamiento de datos personales del Centro de Belleza Adriana Chávez (Ley 1581 de 2012).",
      },
    ],
  }),
  component: PrivacidadPage,
});

function PrivacidadPage() {
  return (
    <main
      className="flex-1"
      data-navbar-dark
      data-navbar-solid
      style={{
        paddingTop: "var(--header-height)",
        backgroundColor: "#F5F0E8",
        minHeight: "100vh",
      }}
    >
      <div
        className="mx-auto"
        style={{
          maxWidth: "800px",
          padding: "var(--section-padding-y) var(--container-padding)",
        }}
      >
        <h1
          className="mb-8"
          style={{
            fontFamily: "var(--font-display)",
            fontStyle: "italic",
            fontSize: "clamp(2rem, 5vw, 3rem)",
            fontWeight: 600,
            color: "#0A0A0B",
            lineHeight: 1.2,
          }}
        >
          Política de Privacidad y Tratamiento de Datos Personales
        </h1>

        <div
          className="space-y-6"
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-base)",
            color: "rgba(10, 10, 11, 0.7)",
            lineHeight: "var(--leading-relaxed)",
          }}
        >
          <p>
            En <strong>Adriana Chávez</strong>, respetamos tu privacidad y estamos comprometidos con la protección de tus datos personales, en estricto cumplimiento de la <strong>Ley 1581 de 2012</strong> (Ley Estatutaria de Protección de Datos Personales en Colombia) y sus decretos reglamentarios.
          </p>

          <h2
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-xl)",
              fontWeight: 600,
              color: "#0A0A0B",
              marginTop: "2rem",
            }}
          >
            1. Finalidad del Tratamiento
          </h2>
          <p>
            Los datos personales que recolectamos (como tu nombre, número de teléfono y correo electrónico) son utilizados exclusivamente para:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Agendar, confirmar, modificar o cancelar tus citas en nuestro centro de belleza.</li>
            <li>Enviarte recordatorios e información sobre tus servicios agendados.</li>
            <li>Comunicarnos contigo para ofrecerte promociones exclusivas, nuevos servicios y beneficios.</li>
            <li>Mejorar nuestra atención al cliente y personalizar tu experiencia con nosotros.</li>
          </ul>

          <h2
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-xl)",
              fontWeight: 600,
              color: "#0A0A0B",
              marginTop: "2rem",
            }}
          >
            2. Derechos del Titular
          </h2>
          <p>
            Como titular de los datos personales, tienes derecho a:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Conocer, actualizar y rectificar tus datos personales en cualquier momento.</li>
            <li>Solicitar prueba de la autorización otorgada para el tratamiento de los mismos.</li>
            <li>Revocar la autorización y/o solicitar la supresión de tus datos cuando consideres que no se están respetando los principios y derechos constitucionales.</li>
            <li>Acceder en forma gratuita a tus datos personales que han sido objeto de tratamiento.</li>
          </ul>

          <h2
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-xl)",
              fontWeight: 600,
              color: "#0A0A0B",
              marginTop: "2rem",
            }}
          >
            3. Seguridad de la Información
          </h2>
          <p>
            En Adriana Chávez hemos adoptado las medidas técnicas, humanas y administrativas necesarias para garantizar la seguridad de tus datos, evitando su alteración, pérdida, consulta, uso o acceso no autorizado o fraudulento. No vendemos ni compartimos tu información con terceros con fines comerciales ajenos al servicio.
          </p>

          <h2
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-xl)",
              fontWeight: 600,
              color: "#0A0A0B",
              marginTop: "2rem",
            }}
          >
            4. Atención de Consultas y Reclamos
          </h2>
          <p>
            Para ejercer tus derechos de conocer, actualizar, rectificar o suprimir tus datos, puedes ponerte en contacto a través de nuestros canales oficiales.
          </p>
        </div>
      </div>
    </main>
  );
}
