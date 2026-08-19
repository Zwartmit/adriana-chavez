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
  primary: [
    "bg-[var(--color-primary)]",
    "text-[var(--color-text-inverse)]",
    "hover:bg-[var(--color-primary-lt)]",
    "font-semibold",
    "tracking-[var(--tracking-wide)]",
    "shadow-[var(--shadow-gold)]",
  ].join(" "),

  secondary: [
    "bg-transparent",
    "border-2",
    "border-[var(--color-primary-dim)]",
    "text-[var(--color-primary)]",
    "hover:bg-[var(--color-accent-lt)]",
    "hover:border-[var(--color-primary)]",
    "font-semibold",
    "tracking-[var(--tracking-wide)]",
    "shadow-[inset_0_0_16px_rgba(232,201,122,0.06)]",
  ].join(" "),

  accent: [
    "bg-[var(--color-primary)]",
    "text-[var(--color-text-inverse)]",
    "hover:bg-[var(--color-primary-lt)]",
    "font-semibold",
    "tracking-[var(--tracking-wide)]",
    "shadow-[var(--shadow-gold)]",
  ].join(" "),

  ghost: [
    "bg-transparent",
    "border",
    "border-white/25",
    "text-[var(--color-text-primary)]",
    "hover:bg-white/[0.05]",
    "hover:border-white/40",
    "font-semibold",
    "tracking-[var(--tracking-wide)]",
    "backdrop-blur-[8px]",
  ].join(" "),
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-[20px] py-[8px] tracking-[var(--tracking-wide)]",
  md: "px-[32px] py-[12px] tracking-[var(--tracking-wide)]",
  lg: "px-[40px] py-[16px] tracking-[var(--tracking-wide)]",
};

const sizeFontSize: Record<ButtonSize, string> = {
  sm: "var(--text-sm)",
  md: "var(--text-sm)",
  lg: "var(--text-base)",
};


export function Button({
  variant = "primary",
  size = "md",
  className,
  style,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-[var(--font-body)] font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] whitespace-nowrap",
        "rounded-[var(--radius-full)]",
        "tracking-[var(--tracking-wide)]",
        "transition-all duration-[var(--transition-base)]",
        "border-0 outline-none",
        sizeStyles[size],
        variantStyles[variant],
        className,
      )}
      style={{ fontSize: sizeFontSize[size], ...style }}
      {...props}
    >
      {children}
    </button>
  );
}
