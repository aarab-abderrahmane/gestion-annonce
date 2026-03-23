"use client";

import { useEffect } from 'react';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/ToastProvider';
import { getErrorMessage } from '@/lib/errors';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const toast = useToast();
  const message = getErrorMessage(error);

  useEffect(() => {
    toast.error(message);
  }, [message, toast]);

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-2xl items-center justify-center px-4 py-12 text-center">
      <div
        className="w-full rounded-[32px] border px-6 py-8"
        style={{
          background: 'var(--md-surface-container-low)',
          borderColor: 'var(--md-outline-variant)',
        }}
      >
        <p className="md-title-large" style={{ color: 'var(--md-on-surface)' }}>
          تعذر إكمال الطلب حالياً.
        </p>
        <p className="md-body-medium mt-3" style={{ color: 'var(--md-on-surface-variant)' }}>
          {message}
        </p>
        <div className="mt-6 flex justify-center">
          <Button type="button" onClick={() => reset()}>
            إعادة المحاولة
          </Button>
        </div>
      </div>
    </div>
  );
}
