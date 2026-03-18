"use client";

import type { HTMLAttributes, ReactNode } from "react";

type BadgeVariant = "primary" | "success" | "warning" | "danger" | "neutral";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
  children: ReactNode;
};

function getVariantStyle(variant: BadgeVariant) {
  if (variant === "success") {
    return {
      background: "var(--md-primary-container)",
      color: "var(--md-on-primary-container)",
    };
  }

  if (variant === "warning") {
    return {
      background: "var(--md-warning-container)",
      color: "var(--md-on-warning-container)",
    };
  }

  if (variant === "danger") {
    return {
      background: "var(--md-error-container)",
      color: "var(--md-on-error-container)",
    };
  }

  if (variant === "neutral") {
    return {
      background: "var(--md-surface-container)",
      color: "var(--md-on-surface-variant)",
    };
  }

  return {
    background: "var(--md-secondary-container)",
    color: "var(--md-on-secondary-container)",
  };
}

export default function Badge({
  variant = "primary",
  children,
  className,
  style,
  ...props
}: BadgeProps) {
  return (
    <span
      {...props}
      className={`inline-flex items-center rounded-full px-3 py-1 md-label-medium ${className ?? ""}`.trim()}
      style={{ ...getVariantStyle(variant), ...style }}
    >
      {children}
    </span>
  );
}
