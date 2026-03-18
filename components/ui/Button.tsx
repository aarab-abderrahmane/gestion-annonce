"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import Spinner from "@/components/ui/Spinner";

type ButtonVariant = "filled" | "tonal" | "outlined" | "text" | "destructive";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
};

function getVariantClass(variant: ButtonVariant) {
  if (variant === "filled") return "md-btn-filled";
  if (variant === "tonal") return "md-btn-tonal";
  if (variant === "outlined") return "md-btn-outlined";
  if (variant === "text") return "md-btn-text";
  return "";
}

function getSizeClass(size: ButtonSize) {
  if (size === "lg") return "md-btn-lg";
  if (size === "sm") return "h-9 px-4 text-sm";
  return "";
}

export default function Button({
  variant = "filled",
  size = "md",
  loading = false,
  leftIcon,
  rightIcon,
  className,
  children,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const destructiveStyle =
    variant === "destructive"
      ? {
          background: "var(--md-error)",
          color: "var(--md-on-error)",
        }
      : undefined;

  return (
    <button
      {...props}
      disabled={isDisabled}
      className={`md-btn md-state disabled:opacity-50 ${getVariantClass(variant)} ${getSizeClass(size)} ${className ?? ""}`.trim()}
      style={{ ...destructiveStyle, ...style }}
    >
      {loading ? <Spinner size={16} label="جاري المعالجة" /> : leftIcon}
      <span>{children}</span>
      {!loading ? rightIcon : null}
    </button>
  );
}
