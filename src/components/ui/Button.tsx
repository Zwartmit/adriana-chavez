import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "accent" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--color-primary)] text-[var(--color-text-inverse)] hover:bg-[var(--color-primary-lt)]",
  secondary:
    "bg-transparent border border-[var(--color-primary)] text-[var(--color-text-primary)] hover:bg-[var(--color-primary)] hover:text-[var(--color-text-inverse)]",
  accent:
    "bg-[var(--color-accent)] text-[var(--color-primary-dim)] hover:bg-[var(--color-accent-dim)]",
  ghost:
    "bg-transparent border border-white/40 text-[var(--color-text-inverse)] hover:bg-white/10",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-[18px] py-[8px] text-[var(--text-sm)]",
  md: "px-[28px] py-[12px] text-[var(--text-base)]",
  lg: "px-[36px] py-[16px] text-[var(--text-lg)]",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-[var(--font-body)] font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
        "rounded-[var(--radius-full)]",
        "transition-all duration-[250ms] ease",
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
