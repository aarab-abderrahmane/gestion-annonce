"use client";

import { useEffect } from 'react';
import { useToast } from '@/components/ui/ToastProvider';

export default function ServiceWorkerRegistration() {
  const toast = useToast();

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    if (process.env.NODE_ENV !== 'production') {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister().catch((error) => {
            toast.error(error, { title: 'تعذر تعطيل عامل الخدمة' });
          });
        });
      });

      return;
    }

    navigator.serviceWorker.register('/sw.js').catch((error) => {
      toast.error(error, { title: 'تعذر تفعيل العمل دون اتصال' });
    });
  }, [toast]);

  return null;
}
