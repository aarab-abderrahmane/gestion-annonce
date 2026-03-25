"use client";

import Script from 'next/script';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useErrorToast } from '@/components/ui/useErrorToast';
import { adminLoginSchema, getFirstZodError } from '@/lib/validations';

const fieldClassName =
  'group rounded-[28px] border px-4 py-3 transition-all duration-200 focus-within:-translate-y-0.5 focus-within:shadow-[0_12px_30px_rgba(0,106,96,0.12)]';

const inputClassName =
  'w-full border-0 bg-transparent px-0 py-1 text-right text-[15px] outline-none placeholder:text-[var(--md-outline)]';

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback?: (token: string) => void;
          'expired-callback'?: () => void;
          'error-callback'?: () => void;
          theme?: 'light' | 'dark' | 'auto';
          language?: string;
        },
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

export default function LoginForm() {
  const router = useRouter();
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const captchaContainerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [turnstileReady, setTurnstileReady] = useState(false);

  useErrorToast(error);

  useEffect(() => {
    if (!siteKey || !turnstileReady || !captchaContainerRef.current || widgetIdRef.current || !window.turnstile) {
      return;
    }

    widgetIdRef.current = window.turnstile.render(captchaContainerRef.current, {
      sitekey: siteKey,
      theme: 'light',
      language: 'ar',
      callback: (token: string) => {
        setCaptchaToken(token);
        setError('');
      },
      'expired-callback': () => {
        setCaptchaToken('');
      },
      'error-callback': () => {
        setCaptchaToken('');
        setError('تعذر التحقق الأمني. أعد المحاولة.');
      },
    });

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [siteKey, turnstileReady]);

  function resetCaptcha() {
    setCaptchaToken('');
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (!siteKey) {
      setError('مفتاح Turnstile غير موجود في إعدادات البيئة.');
      return;
    }

    if (!captchaToken) {
      setError('أكمل التحقق الأمني قبل تسجيل الدخول.');
      return;
    }

    const validation = adminLoginSchema.safeParse({
      email,
      password,
    });

    if (!validation.success) {
      setError(getFirstZodError(validation.error));
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      ...validation.data,
      options: {
        captchaToken,
      },
    });

    if (error) {
      setError('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
      resetCaptcha();
      setLoading(false);
      return;
    }

    const { data: canAccessDashboard, error: accessError } = await supabase.rpc('has_dashboard_access');

    if (accessError || !canAccessDashboard) {
      await supabase.auth.signOut();
      setError('هذا الحساب لا يملك صلاحية الدخول إلى لوحة الإدارة.');
      resetCaptcha();
      setLoading(false);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  }

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={() => setTurnstileReady(true)}
      />

      <form onSubmit={handleSubmit} className="space-y-4" dir="rtl">
      <div
        className={fieldClassName}
        style={{
          background: 'var(--md-surface-container-lowest)',
          borderColor: 'var(--md-outline-variant)',
        }}
      >
        <label className="mb-1 flex items-center justify-between gap-3 text-[13px] font-semibold" style={{ color: 'var(--md-on-surface-variant)' }}>
          <span>البريد الإلكتروني</span>
          <Mail size={16} style={{ color: 'var(--md-primary)' }} />
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClassName}
          placeholder="admin@example.com"
          autoComplete="email"
          required
        />
      </div>

      <div
        className={fieldClassName}
        style={{
          background: 'var(--md-surface-container-lowest)',
          borderColor: 'var(--md-outline-variant)',
        }}
      >
        <label className="mb-1 flex items-center justify-between gap-3 text-[13px] font-semibold" style={{ color: 'var(--md-on-surface-variant)' }}>
          <span>كلمة المرور</span>
          <LockKeyhole size={16} style={{ color: 'var(--md-primary)' }} />
        </label>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors"
            style={{ color: 'var(--md-on-surface-variant)' }}
            aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>

          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClassName}
            placeholder="أدخل كلمة المرور"
            autoComplete="current-password"
            required
          />
        </div>
      </div>

      <div
        className="rounded-[24px] border px-4 py-3 text-[13px] leading-6"
        style={{
          background: 'rgba(0, 106, 96, 0.05)',
          borderColor: 'rgba(0, 106, 96, 0.12)',
          color: 'var(--md-on-surface-variant)',
        }}
      >
        تأكد من استعمال بيانات الحساب الإداري المعتمدة. الحسابات المفوضة ستظهر لها فقط الأقسام المسموح بها.
      </div>

      <div
        className="border-t px-4 py-4"
     
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="text-[13px] font-semibold" style={{ color: 'var(--md-on-surface-variant)' }}>
            التحقق الأمني
          </span>
          <span className="text-[12px]" style={{ color: 'var(--md-outline)' }}>
            مطلوب قبل تسجيل الدخول
          </span>
        </div>

        <div ref={captchaContainerRef} className="min-h-[65px]" />
      </div>

      {error ? (
        <div
          className="rounded-[24px] border px-4 py-3 text-sm leading-6"
          style={{
            background: 'var(--md-error-container)',
            color: 'var(--md-on-error-container)',
            borderColor: 'rgba(186, 26, 26, 0.16)',
          }}
        >
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="md-btn md-btn-filled md-btn-lg mt-2 flex w-full items-center justify-center rounded-full disabled:cursor-not-allowed disabled:opacity-60"
        style={{
          boxShadow: '0 18px 36px rgba(0, 106, 96, 0.22)',
        }}
      >
        {loading ? 'جاري تسجيل الدخول...' : 'الدخول إلى لوحة الإدارة'}
      </button>
      </form>
    </>
  );
}
