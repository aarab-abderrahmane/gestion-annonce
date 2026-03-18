"use client";

import { Search, X } from "lucide-react";
import type { KeyboardEvent } from "react";

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: (value: string) => void;
  placeholder?: string;
  className?: string;
  ariaLabel?: string;
  disabled?: boolean;
};

export default function SearchBar({
  value,
  onChange,
  onSubmit,
  placeholder = "ابحث...",
  className,
  ariaLabel = "حقل البحث",
  disabled = false,
}: SearchBarProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      onSubmit?.(value);
    }
  }

  return (
    <div
      className={`flex h-14 items-center gap-3 rounded-full px-4 ${className ?? ""}`.trim()}
      style={{
        background: "var(--md-surface-container-high)",
        border: "1px solid var(--md-outline-variant)",
      }}
    >
      <Search size={20} style={{ color: "var(--md-on-surface-variant)", flexShrink: 0 }} />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        aria-label={ariaLabel}
        disabled={disabled}
        className="min-w-0 flex-1 bg-transparent outline-none md-body-large"
        style={{ color: "var(--md-on-surface)", fontFamily: "var(--md-font-brand)" }}
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          className="md-icon-btn"
          aria-label="مسح البحث"
          disabled={disabled}
        >
          <X size={18} />
        </button>
      ) : null}
    </div>
  );
}
