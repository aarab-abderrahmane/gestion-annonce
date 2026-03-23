"use client";

import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { getErrorMessage } from '@/lib/errors';

type ToastTone = 'error' | 'success' | 'info';

type ToastItem = {
  id: string;
  title: string;
  description: string;
  tone: ToastTone;
};

type ToastOptions = {
  title?: string;
  duration?: number;
};

type ToastContextValue = {
  show: (description: string, tone?: ToastTone, options?: ToastOptions) => void;
  error: (error: unknown, options?: ToastOptions) => void;
  success: (message: string, options?: ToastOptions) => void;
  info: (message: string, options?: ToastOptions) => void;
  dismiss: (id: string) => void;
};

const DEFAULT_DURATION_MS = 6000;
const DUPLICATE_WINDOW_MS = 2000;

const ToastContext = createContext<ToastContextValue | null>(null);

function getToastTitle(tone: ToastTone, title?: string) {
  if (title) return title;
  if (tone === 'success') return 'تمت العملية';
  if (tone === 'info') return 'معلومة';
  return 'حدث خطأ';
}

function getToastIcon(tone: ToastTone) {
  if (tone === 'success') return <CheckCircle2 size={18} />;
  if (tone === 'info') return <Info size={18} />;
  return <AlertCircle size={18} />;
}

function getToastColors(tone: ToastTone) {
  if (tone === 'success') {
    return {
      background: 'var(--md-primary-container)',
      color: 'var(--md-on-primary-container)',
      borderColor: 'color-mix(in srgb, var(--md-primary) 18%, transparent)',
    };
  }

  if (tone === 'info') {
    return {
      background: 'var(--md-secondary-container)',
      color: 'var(--md-on-secondary-container)',
      borderColor: 'color-mix(in srgb, var(--md-secondary) 18%, transparent)',
    };
  }

  return {
    background: 'var(--md-error-container)',
    color: 'var(--md-on-error-container)',
    borderColor: 'color-mix(in srgb, var(--md-error) 18%, transparent)',
  };
}

function createToastId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function ToastProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timeoutIdsRef = useRef(new Map<string, number>());
  const recentToastKeysRef = useRef(new Map<string, number>());

  const dismiss = useCallback((id: string) => {
    const timeoutId = timeoutIdsRef.current.get(id);
    if (timeoutId) {
      window.clearTimeout(timeoutId);
      timeoutIdsRef.current.delete(id);
    }

    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback((description: string, tone: ToastTone = 'info', options?: ToastOptions) => {
    const normalizedDescription = description.trim();
    if (!normalizedDescription) return;

    const now = Date.now();
    const title = getToastTitle(tone, options?.title);
    const duplicateKey = `${tone}:${title}:${normalizedDescription}`;
    const lastShownAt = recentToastKeysRef.current.get(duplicateKey) ?? 0;

    if (now - lastShownAt < DUPLICATE_WINDOW_MS) {
      return;
    }

    recentToastKeysRef.current.set(duplicateKey, now);

    const id = createToastId();
    const toast: ToastItem = {
      id,
      title,
      description: normalizedDescription,
      tone,
    };

    setToasts((current) => [...current.slice(-2), toast]);

    const timeoutId = window.setTimeout(() => {
      dismiss(id);
    }, options?.duration ?? DEFAULT_DURATION_MS);

    timeoutIdsRef.current.set(id, timeoutId);
  }, [dismiss]);

  const showError = useCallback((error: unknown, options?: ToastOptions) => {
    show(getErrorMessage(error), 'error', options);
  }, [show]);

  useEffect(() => {
    const timeoutIds = timeoutIdsRef.current;

    const handleWindowError = (event: ErrorEvent) => {
      showError(event.error ?? event.message);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      showError(event.reason);
    };

    window.addEventListener('error', handleWindowError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleWindowError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);

      timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
      timeoutIds.clear();
    };
  }, [showError]);

  const value = useMemo<ToastContextValue>(() => ({
    show,
    error: showError,
    success: (message, options) => show(message, 'success', options),
    info: (message, options) => show(message, 'info', options),
    dismiss,
  }), [dismiss, show, showError]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed z-[9999] flex flex-col gap-3 px-4"
        style={{
          insetBlockStart: 16,
          insetInlineStart: 16,
          width: 'min(24rem, calc(100vw - 2rem))',
        }}
      >
        {toasts.map((toast) => {
          const colors = getToastColors(toast.tone);

          return (
            <div
              key={toast.id}
              className="pointer-events-auto rounded-[24px] border px-4 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.14)] backdrop-blur-sm"
              style={{
                ...colors,
                animation: 'toast-in 180ms cubic-bezier(0.2, 0, 0, 1)',
              }}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">{getToastIcon(toast.tone)}</div>
                <div className="min-w-0 flex-1">
                  <p className="md-title-small">{toast.title}</p>
                  <p className="md-body-small mt-1 break-words">{toast.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(toast.id)}
                  className="md-icon-btn h-8 w-8 shrink-0"
                  style={{ color: 'inherit' }}
                  aria-label="إغلاق"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }

  return context;
}
