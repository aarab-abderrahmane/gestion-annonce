"use client";

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useErrorToast } from '@/components/ui/useErrorToast';
import { adminLoginSchema, getFirstZodError } from '@/lib/validations';

const inputCls =
  'w-full rounded-2xl border bg-[#fbfcfb] px-4 py-4 text-right text-[15px] outline-none transition-all placeholder:text-[#7d8886]';
const inputStyle = {
  borderColor: 'rgba(111, 121, 119, 0.22)',
  color: 'var(--md-on-surface)',
};

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
    if (error) { setError('البريد الإلكتروني أو كلمة المرور غير صحيحة.'); setLoading(false); return; }

    const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin');
    if (adminError || !isAdmin) {
      await supabase.auth.signOut();
      setError('هذا الحساب لا يملك صلاحية الدخول إلى لوحة الإدارة.');
      setLoading(false);
      return;
    }

    router.push('/dashboard'); router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" dir="rtl">
      <div className="space-y-2.5">
        <label className="block text-sm font-semibold" style={{ color: 'var(--md-on-surface)' }}>
          البريد الإلكتروني
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputCls}
          style={inputStyle}
          placeholder="أدخل البريد الإلكتروني"
          autoComplete="email"
          onFocus={(e) => {
            e.target.style.borderColor = 'var(--md-primary)';
            e.target.style.background = '#ffffff';
            e.target.style.boxShadow = '0 0 0 4px rgba(0, 106, 96, 0.08)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'rgba(111, 121, 119, 0.22)';
            e.target.style.background = '#fbfcfb';
            e.target.style.boxShadow = 'none';
          }}
          required
        />
      </div>

      <div className="space-y-2.5">
        <label className="block text-sm font-semibold" style={{ color: 'var(--md-on-surface)' }}>
          كلمة المرور
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputCls}
          style={inputStyle}
          placeholder="أدخل كلمة المرور"
          autoComplete="current-password"
          onFocus={(e) => {
            e.target.style.borderColor = 'var(--md-primary)';
            e.target.style.background = '#ffffff';
            e.target.style.boxShadow = '0 0 0 4px rgba(0, 106, 96, 0.08)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'rgba(111, 121, 119, 0.22)';
            e.target.style.background = '#fbfcfb';
            e.target.style.boxShadow = 'none';
          }}
          required
        />
        <p className="text-[13px]" style={{ color: 'var(--md-outline)' }}>
          يرجى التأكد من إدخال بيانات الحساب الإداري بشكل صحيح.
        </p>
      </div>

      {error && (
        <div
          className="rounded-2xl border px-4 py-3 text-sm leading-6"
          style={{
            background: 'var(--md-error-container)',
            color: 'var(--md-on-error-container)',
            borderColor: 'rgba(186, 26, 26, 0.14)',
          }}
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-2 flex h-14 w-full items-center justify-center rounded-2xl text-[15px] font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
        style={{
          background: 'linear-gradient(135deg, #0f5f76, #0b7b6f)',
          boxShadow: '0 18px 32px rgba(15, 95, 118, 0.20)',
        }}
      >
        {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
      </button>
    </form>
  );
}
