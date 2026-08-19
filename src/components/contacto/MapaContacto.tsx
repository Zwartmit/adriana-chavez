import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function MapaContacto() {
  return (
    <section style={{ backgroundColor: "var(--color-bg-alt)" }}>
      <div
        className="h-[300px] md:h-[450px]"
        style={{ width: "100%", position: "relative", overflow: "hidden" }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            backgroundColor: "var(--color-bg-alt)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1rem",
            border: "2px dashed var(--color-border)",
          }}
        >
          <MapPin size={40} color="var(--color-primary)" />
          <p
            style={{
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontSize: "var(--text-xl)",
              color: "var(--color-text-secondary)",
            }}
          >
            Mapa interactivo
          </p>
          <p
            className="uppercase"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--text-xs)",
              color: "var(--color-text-muted)",
              letterSpacing: "var(--tracking-wider)",
            }}
          >
            Se conectará con Google Maps API
          </p>
          <a
            href="https://maps.google.com"
            target="_blank"
            rel="noreferrer"
            style={{ marginTop: "0.5rem" }}
          >
            <Button variant="primary" size="sm">
              Ver en Google Maps →
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
}
