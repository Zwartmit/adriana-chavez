import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return (
    <main>
      <section
        style={{
          minHeight: "100vh",
          background: "var(--color-primary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--text-4xl)",
            color: "var(--color-text-inverse)",
            fontStyle: "italic",
          }}
        >
          Adriana Chávez — En construcción
        </p>
      </section>
    </main>
  );
}
