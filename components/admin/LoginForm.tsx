"use client";

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const inputCls = "w-full md-body-large px-4 h-14 rounded-[var(--md-shape-s)] border outline-none transition-colors";
const inputStyle = { background: 'transparent', borderColor: 'var(--md-outline)', color: 'var(--md-on-surface)' };

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true); setError('');
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError('البريد الإلكتروني أو كلمة المرور غير صحيحة.'); setLoading(false); return; }
    router.push('/dashboard'); router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="md-label-large block" style={{ color: 'var(--md-on-surface-variant)' }}>
          البريد الإلكتروني
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputCls}
          style={inputStyle}
          placeholder="admin@ista.ma"
          onFocus={(e) => (e.target.style.borderColor = 'var(--md-primary)')}
          onBlur={(e) => (e.target.style.borderColor = 'var(--md-outline)')}
          required
        />
      </div>

      <div className="space-y-2">
        <label className="md-label-large block" style={{ color: 'var(--md-on-surface-variant)' }}>
          كلمة المرور
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputCls}
          style={inputStyle}
          placeholder="••••••••"
          onFocus={(e) => (e.target.style.borderColor = 'var(--md-primary)')}
          onBlur={(e) => (e.target.style.borderColor = 'var(--md-outline)')}
          required
        />
      </div>

      {error && (
        <div
          className="md-body-small px-4 py-3 rounded-[var(--md-shape-m)]"
          style={{ background: 'var(--md-error-container)', color: 'var(--md-on-error-container)' }}
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="md-btn md-btn-filled md-btn-lg md-state w-full disabled:opacity-50 mt-2"
      >
        {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
      </button>
    </form>
  );
}
