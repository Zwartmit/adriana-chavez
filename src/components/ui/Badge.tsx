import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "primary";

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-[var(--color-accent-lt)] text-[var(--color-accent-dim)]",
  primary: "bg-[var(--color-primary)] text-[var(--color-text-inverse)]",
};

export function Badge({ variant = "default", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[var(--radius-full)] uppercase",
        "font-[var(--font-mono)] text-[var(--text-xs)]",
        "px-3 py-1",
        variantStyles[variant],
        className,
      )}
      style={{ letterSpacing: "var(--tracking-wider)" }}
    >
      {children}
    </span>
  );
}
