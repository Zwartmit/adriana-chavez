import { Button } from "@/components/ui/Button";

export function LoadingState({ label = "Cargando..." }: { label?: string }) {
  return (
    <div
      style={{
        opacity: 0.5,
        textAlign: "center",
        padding: "3rem 0",
        fontFamily: "var(--font-mono)",
        fontSize: "var(--text-sm)",
        color: "var(--color-text-muted)",
      }}
    >
      {label}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4" style={{ padding: "3rem 0", textAlign: "center" }}>
      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "var(--text-sm)",
          color: "var(--color-error)",
        }}
      >
        {message ?? "No pudimos cargar la información. Intenta de nuevo."}
      </p>
      <Button variant="secondary" size="sm" onClick={onRetry}>
        Reintentar
      </Button>
    </div>
  );
}
