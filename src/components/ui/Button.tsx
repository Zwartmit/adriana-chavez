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
  sm: "px-5 py-2 text-[var(--text-sm)] tracking-[var(--tracking-wide)]",
  md: "px-8 py-3 text-[var(--text-sm)] tracking-[var(--tracking-wide)]",
  lg: "px-10 py-4 text-[var(--text-base)] tracking-[var(--tracking-wide)]",
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
        "inline-flex items-center justify-center font-[var(--font-body)] font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] whitespace-nowrap",
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
