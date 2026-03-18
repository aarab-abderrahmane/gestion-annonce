"use client";

import type { InputHTMLAttributes, ReactNode } from "react";
import { useId } from "react";

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  label?: string;
  hint?: string;
  error?: string;
  startAdornment?: ReactNode;
  endAdornment?: ReactNode;
  containerClassName?: string;
  inputClassName?: string;
};

export default function Input({
  id,
  label,
  hint,
  error,
  startAdornment,
  endAdornment,
  containerClassName,
  inputClassName,
  style,
  ...props
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className={`space-y-2 ${containerClassName ?? ""}`.trim()}>
      {label ? (
        <label htmlFor={inputId} className="block md-label-large" style={{ color: "var(--md-on-surface-variant)" }}>
          {label}
        </label>
      ) : null}

      <div
        className="flex h-12 items-center gap-3 rounded-[var(--md-shape-s)] border px-4"
        style={{
          background: "var(--md-surface-container-lowest)",
          borderColor: error ? "var(--md-error)" : "var(--md-outline)",
        }}
      >
        {startAdornment}
        <input
          {...props}
          id={inputId}
          className={`min-w-0 flex-1 bg-transparent outline-none md-body-medium ${inputClassName ?? ""}`.trim()}
          style={{ color: "var(--md-on-surface)", fontFamily: "var(--md-font-brand)", ...style }}
        />
        {endAdornment}
      </div>

      {error ? (
        <p className="md-body-small" style={{ color: "var(--md-error)" }}>
          {error}
        </p>
      ) : hint ? (
        <p className="md-body-small" style={{ color: "var(--md-on-surface-variant)" }}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}
