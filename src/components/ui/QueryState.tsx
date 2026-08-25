import { Button } from "@/components/ui/Button";

interface StateVariantProps {
  /** "dark" (default) for dark sections, "light" for sections on --color-bg-light. */
  variant?: "dark" | "light";
}

export function LoadingState({
  label = "Cargando...",
  variant = "dark",
}: { label?: string } & StateVariantProps) {
  return (
    <div
      style={{
        opacity: 0.5,
        textAlign: "center",
        padding: "3rem 0",
        fontFamily: "var(--font-mono)",
        fontSize: "var(--text-sm)",
        color: variant === "light" ? "var(--color-text-on-light-faint)" : "var(--color-text-muted)",
      }}
    >
      {label}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
  variant = "dark",
}: { message?: string; onRetry: () => void } & StateVariantProps) {
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
      <Button
        variant="secondary"
        size="sm"
        onClick={onRetry}
        style={variant === "light" ? { borderColor: "var(--color-primary-dim)", color: "var(--color-primary-dim)" } : undefined}
      >
        Reintentar
      </Button>
    </div>
  );
}
