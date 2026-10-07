import { ReactNode } from "react";

interface ConfirmModalProps {
  title: string;
  message: ReactNode;
  confirmLabel: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({ title, message, confirmLabel, loading, onConfirm, onCancel }: ConfirmModalProps) {
  return (
    <div
      onClick={() => !loading && onCancel()}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 90,
        backgroundColor: "rgba(0,0,0,0.65)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass-frosted"
        style={{
          width: "100%",
          maxWidth: "380px",
          borderRadius: "var(--radius-2xl)",
          padding: "2rem",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontStyle: "italic",
            fontWeight: 600,
            fontSize: "var(--text-2xl)",
            color: "var(--color-text-primary)",
            marginBottom: "0.75rem",
          }}
        >
          {title}
        </h2>
        <div
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-sm)",
            color: "var(--color-text-secondary)",
            marginBottom: "1.75rem",
          }}
        >
          {message}
        </div>
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            style={{
              padding: "10px 24px",
              borderRadius: "var(--radius-full)",
              border: "2px solid var(--color-primary-dim)",
              backgroundColor: "transparent",
              color: "var(--color-primary)",
              fontFamily: "var(--font-body)",
              fontWeight: 600,
              fontSize: "var(--text-sm)",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.5 : 1,
            }}
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            style={{
              padding: "10px 24px",
              borderRadius: "var(--radius-full)",
              border: "none",
              backgroundColor: "var(--color-primary)",
              color: "var(--color-text-inverse)",
              fontFamily: "var(--font-body)",
              fontWeight: 600,
              fontSize: "var(--text-sm)",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Procesando..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
