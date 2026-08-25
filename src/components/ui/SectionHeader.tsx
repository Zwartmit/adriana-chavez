import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
  /** CSS font-size for the title. Defaults to clamp(1.75rem, 3vw, 2.5rem). */
  titleSize?: string;
  /** CSS color for the title. Defaults to var(--color-text-primary). */
  titleColor?: string;
  /** CSS color for the eyebrow. Defaults to var(--color-accent). */
  eyebrowColor?: string;
  /** CSS color for the description. Defaults to var(--color-text-secondary). */
  descriptionColor?: string;
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "left",
  className,
  titleSize = "clamp(1.75rem, 3vw, 2.5rem)",
  titleColor,
  eyebrowColor,
  descriptionColor,
}: SectionHeaderProps) {
  const isCenter = align === "center";
  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        isCenter && "items-center text-center",
        className,
      )}
    >
      {eyebrow && (
        <span
          className="uppercase"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--text-xs)",
            color: eyebrowColor || "var(--color-accent)",
            letterSpacing: "var(--tracking-widest)",
          }}
        >
          {eyebrow}
        </span>
      )}
      <h2
        style={{
          fontFamily: "var(--font-display)",
          fontStyle: "italic",
          fontWeight: 600,
          fontSize: titleSize,
          lineHeight: "var(--leading-tight)",
          color: titleColor || "var(--color-text-primary)",
        }}
      >
        {title}
      </h2>
      {description && (
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-lg)",
            color: descriptionColor || "var(--color-text-secondary)",
            maxWidth: "560px",
            lineHeight: "var(--leading-normal)",
          }}
        >
          {description}
        </p>
      )}
    </div>
  );
}
