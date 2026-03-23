"use client";

import { useEffect } from 'react';
import { useToast } from '@/components/ui/ToastProvider';

type Props = {
  messages: string[];
  title?: string;
};

export default function ErrorToastTrigger({ messages, title }: Props) {
  const toast = useToast();
  const signature = messages.join('\n');

  useEffect(() => {
    messages
      .filter(Boolean)
      .forEach((message) => {
        toast.error(message, { title });
      });
  }, [messages, signature, title, toast]);

  return null;
}
