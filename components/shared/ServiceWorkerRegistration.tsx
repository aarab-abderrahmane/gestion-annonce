"use client";

import { useEffect } from 'react';

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    if (process.env.NODE_ENV !== 'production') {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister().catch((error) => {
            console.error('Service worker unregister failed', error);
          });
        });
      });

      return;
    }

    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.error('Service worker registration failed', error);
    });
  }, []);

  return null;
}
