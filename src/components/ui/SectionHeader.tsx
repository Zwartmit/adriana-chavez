import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "left",
  className,
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
          className="font-[var(--font-mono)] text-[var(--text-xs)] uppercase text-[var(--color-accent)]"
          style={{ letterSpacing: "var(--tracking-widest)" }}
        >
          {eyebrow}
        </span>
      )}
      <h2
        className="font-[var(--font-display)] font-semibold text-[var(--color-text-primary)] text-[var(--text-4xl)] md:text-[var(--text-5xl)]"
        style={{ lineHeight: "var(--leading-tight)" }}
      >
        {title}
      </h2>
      {description && (
        <p
          className="font-[var(--font-body)] text-[var(--text-lg)] text-[var(--color-text-secondary)] max-w-[560px]"
          style={{ lineHeight: "var(--leading-normal)" }}
        >
          {description}
        </p>
      )}
    </div>
  );
}
