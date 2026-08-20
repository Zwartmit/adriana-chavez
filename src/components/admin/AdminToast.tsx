import { CheckCircle2, XCircle } from "lucide-react";

export interface ToastState {
  message: string;
  type: "success" | "error";
}

export function AdminToast({ toast }: { toast: ToastState | null }) {
  if (!toast) return null;
  const Icon = toast.type === "success" ? CheckCircle2 : XCircle;

  return (
    <div
      className="glass-obsidian"
      style={{
        position: "fixed",
        bottom: "1.5rem",
        right: "1.5rem",
        zIndex: 80,
        display: "flex",
        alignItems: "center",
        gap: "0.6rem",
        padding: "0.9rem 1.25rem",
        borderRadius: "var(--radius-lg)",
        backgroundColor: "var(--color-surface)",
      }}
    >
      <Icon
        size={18}
        color={toast.type === "success" ? "var(--color-success)" : "var(--color-error)"}
      />
      <span
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "var(--text-sm)",
          color: "var(--color-text-primary)",
        }}
      >
        {toast.message}
      </span>
    </div>
  );
}
