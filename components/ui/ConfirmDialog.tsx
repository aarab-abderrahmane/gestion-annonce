"use client";

import { useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  confirmVariant?: "filled" | "tonal" | "outlined" | "text" | "destructive";
  loading?: boolean;
  verificationText?: string | null;
  verificationLabel?: string;
  verificationHint?: string;
  onConfirm: () => void;
  onClose: () => void;
};

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "إلغاء",
  confirmVariant = "filled",
  loading = false,
  verificationText = null,
  verificationLabel,
  verificationHint,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const [typedValue, setTypedValue] = useState("");

  const requiresVerification = Boolean(verificationText);
  const isVerified = useMemo(() => {
    if (!requiresVerification || !verificationText) return true;
    return typedValue.trim() === verificationText.trim();
  }, [requiresVerification, typedValue, verificationText]);

  return (
    <Modal
      open={open}
      onClose={loading ? () => {} : onClose}
      title={title}
      description={description}
      closeOnOverlay={!loading}
      actions={
        <>
          <Button type="button" variant="text" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button type="button" variant={confirmVariant} onClick={onConfirm} disabled={!isVerified} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {requiresVerification && verificationText ? (
        <Input
          value={typedValue}
          onChange={(event) => setTypedValue(event.target.value)}
          label={verificationLabel ?? "اكتب النص للتأكيد"}
          placeholder={verificationText}
          hint={verificationHint ?? `أعد كتابة "${verificationText}" لتفعيل الإجراء.`}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
        />
      ) : null}
    </Modal>
  );
}
