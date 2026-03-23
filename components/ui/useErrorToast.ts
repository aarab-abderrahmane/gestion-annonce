"use client";

import { useEffect, useRef } from 'react';
import { useToast } from '@/components/ui/ToastProvider';
import { getErrorMessage } from '@/lib/errors';

type Options = {
  title?: string;
};

export function useErrorToast(error: unknown, options?: Options) {
  const toast = useToast();
  const previousMessageRef = useRef('');
  const message = getErrorMessage(error, '');

  useEffect(() => {
    if (!message) {
      previousMessageRef.current = '';
      return;
    }

    if (previousMessageRef.current === message) {
      return;
    }

    previousMessageRef.current = message;
    toast.error(message, { title: options?.title });
  }, [message, options?.title, toast]);
}
