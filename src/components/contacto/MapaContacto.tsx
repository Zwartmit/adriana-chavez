export function MapaContacto() {
  return (
    <section>
      <div
        className="h-[300px] md:h-[450px]"
        style={{
          width: "100%",
          borderRadius: "var(--radius-xl)",
          overflow: "hidden",
          border: "0.5px solid var(--color-border-gold)",
          position: "relative",
        }}
      >
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d295.4714087573995!2d-72.89022048954475!3d4.876936822400488!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8e6ad3f10fcdd433%3A0xb59fc61f9d00aa82!2sCentro%20de%20Belleza%20Adriana%20Chavez!5e0!3m2!1sen!2sco!4v1787200436030!5m2!1sen!2sco"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          title="Ubicación Centro de Belleza Adriana Chávez"
        />
      </div>
    </section>
  );
}
