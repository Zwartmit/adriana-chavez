import { useState } from "react";
import { Pencil } from "lucide-react";

interface SelectOption {
  value: string;
  label: string;
}

interface InlineEditFieldProps {
  label: string;
  value: string;
  displayValue?: string;
  onChange: (value: string) => void;
  type?: "text" | "tel" | "email" | "date";
  options?: SelectOption[];
  placeholder?: string;
  /** Texto de la opción vacía del selector (por defecto "Sin preferencia"). */
  emptyLabel?: string;
}

const fieldInputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  backgroundColor: "var(--color-bg-light)",
  border: "1px solid var(--color-primary-dim)",
  borderRadius: "var(--radius-md)",
  fontFamily: "var(--font-body)",
  fontSize: "var(--text-sm)",
  color: "var(--color-text-on-light)",
  outline: "none",
};

export function InlineEditField({
  label,
  value,
  displayValue,
  onChange,
  type = "text",
  options,
  placeholder,
  emptyLabel = "Sin preferencia",
}: InlineEditFieldProps) {
  const [editing, setEditing] = useState(false);

  return (
    <div>
      <p
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "var(--text-xs)",
          textTransform: "uppercase",
          letterSpacing: "var(--tracking-wider)",
          color: "var(--color-text-on-light-faint)",
          marginBottom: "4px",
        }}
      >
        {label}
      </p>
      {editing ? (
        options ? (
          <select
            autoFocus
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={() => setEditing(false)}
            style={fieldInputStyle}
          >
            <option value="">{emptyLabel}</option>
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            autoFocus
            type={type}
            value={value}
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value)}
            onBlur={() => setEditing(false)}
            onKeyDown={(e) => e.key === "Enter" && setEditing(false)}
            style={fieldInputStyle}
          />
        )
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="flex items-center gap-2"
          style={{
            width: "100%",
            textAlign: "left",
            padding: "6px 0",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-sm)",
            color: value ? "var(--color-text-on-light)" : "var(--color-text-on-light-faint)",
          }}
        >
          {displayValue ?? value ?? "—"}
          <Pencil size={12} color="var(--color-text-on-light-faint)" />
        </button>
      )}
    </div>
  );
}
