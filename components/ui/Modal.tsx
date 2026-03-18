"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect } from "react";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
  closeOnOverlay?: boolean;
};

export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  actions,
  closeOnOverlay = true,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="md-scrim absolute inset-0" onClick={closeOnOverlay ? onClose : undefined} />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-2xl overflow-hidden rounded-[var(--md-shape-xl)]"
        style={{
          background: "var(--md-surface-container-high)",
          boxShadow: "0px 8px 12px 6px rgba(0,0,0,0.15), 0px 4px 4px rgba(0,0,0,0.3)",
        }}
      >
        <div className="flex items-start justify-between gap-4 border-b px-6 py-5" style={{ borderColor: "var(--md-outline-variant)" }}>
          <div className="space-y-1">
            {title ? (
              <h2 className="md-headline-small" style={{ color: "var(--md-on-surface)" }}>
                {title}
              </h2>
            ) : null}
            {description ? (
              <p className="md-body-medium" style={{ color: "var(--md-on-surface-variant)" }}>
                {description}
              </p>
            ) : null}
          </div>
          <button type="button" onClick={onClose} className="md-icon-btn" aria-label="إغلاق">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5">{children}</div>

        {actions ? (
          <div className="flex justify-end gap-3 border-t px-6 py-4" style={{ borderColor: "var(--md-outline-variant)" }}>
            {actions}
          </div>
        ) : null}
      </div>
    </div>
  );
}
