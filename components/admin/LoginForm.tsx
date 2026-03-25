"use client";

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useErrorToast } from '@/components/ui/useErrorToast';
import { adminLoginSchema, getFirstZodError } from '@/lib/validations';

const fieldClassName =
  'group rounded-[28px] border px-4 py-3 transition-all duration-200 focus-within:-translate-y-0.5 focus-within:shadow-[0_12px_30px_rgba(0,106,96,0.12)]';

const inputClassName =
  'w-full border-0 bg-transparent px-0 py-1 text-right text-[15px] outline-none placeholder:text-[var(--md-outline)]';

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useErrorToast(error);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

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
    const { error } = await supabase.auth.signInWithPassword(validation.data);

    if (error) {
      setError('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
      setLoading(false);
      return;
    }

    const { data: canAccessDashboard, error: accessError } = await supabase.rpc('has_dashboard_access');

    if (accessError || !canAccessDashboard) {
      await supabase.auth.signOut();
      setError('هذا الحساب لا يملك صلاحية الدخول إلى لوحة الإدارة.');
      setLoading(false);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  }

  return (
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
  );
}
