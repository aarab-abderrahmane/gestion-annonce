"use client";

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { adminSettingsSchema, getFirstZodError } from '@/lib/validations';

type Props = { email: string };

const inputCls = "w-full md-body-medium px-4 h-12 rounded-[var(--md-shape-s)] border outline-none transition-colors";
const inputStyle = { background: 'var(--md-surface-container-lowest)', borderColor: 'var(--md-outline)', color: 'var(--md-on-surface)' };

export default function SettingsForm({ email }: Props) {
  const supabase = createClient();
  const router = useRouter();
  const [newEmail, setNewEmail] = useState(email);
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');
    const validation = adminSettingsSchema.safeParse({
      email: newEmail.trim(),
      password: newPassword.trim(),
    });
    if (!validation.success) {
      setError(getFirstZodError(validation.error));
      return;
    }

    setSaving(true);
    const parsed = validation.data;
    const payload: { email?: string; password?: string } = {};
    if (parsed.email && parsed.email !== email) payload.email = parsed.email;
    if (parsed.password) payload.password = parsed.password;
    if (!payload.email && !payload.password) {
      setError('أدخل بريداً إلكترونياً أو كلمة مرور جديدة أولاً.');
      setSaving(false); return;
    }
    const { error: updateError } = await supabase.auth.updateUser(payload);
    if (updateError) { setError(updateError.message); setSaving(false); return; }
    setSuccess('تم تحديث الإعدادات بنجاح.'); setNewPassword(''); setSaving(false);
    router.refresh();
  }

  async function handleLogout() {
    setLoggingOut(true);
    await supabase.auth.signOut();
    router.push('/login'); router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="md-card-outlined p-6 space-y-5">
      <div className="space-y-2">
        <label htmlFor="admin-email" className="md-label-medium block" style={{ color: 'var(--md-on-surface-variant)' }}>
          البريد الإلكتروني
        </label>
        <input
          id="admin-email"
          type="email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          className={inputCls}
          style={inputStyle}
          onFocus={(e) => (e.target.style.borderColor = 'var(--md-primary)')}
          onBlur={(e) => (e.target.style.borderColor = 'var(--md-outline)')}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="admin-password" className="md-label-medium block" style={{ color: 'var(--md-on-surface-variant)' }}>
          كلمة المرور الجديدة
        </label>
        <input
          id="admin-password"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="اترك فارغاً إن لم تُرد التغيير"
          className={inputCls}
          style={inputStyle}
          onFocus={(e) => (e.target.style.borderColor = 'var(--md-primary)')}
          onBlur={(e) => (e.target.style.borderColor = 'var(--md-outline)')}
        />
      </div>

      {error && (
        <p className="md-body-small px-4 py-3 rounded-[var(--md-shape-m)]" style={{ background: 'var(--md-error-container)', color: 'var(--md-on-error-container)' }}>
          {error}
        </p>
      )}
      {success && (
        <p className="md-body-small px-4 py-3 rounded-[var(--md-shape-m)]" style={{ background: 'var(--md-primary-container)', color: 'var(--md-on-primary-container)' }}>
          {success}
        </p>
      )}

      <div className="flex flex-wrap gap-3 pt-1">
        <button type="submit" disabled={saving} className="md-btn md-btn-filled md-state disabled:opacity-50">
          {saving ? 'جاري الحفظ...' : 'حفظ'}
        </button>
        <button
          type="button"
          onClick={() => void handleLogout()}
          disabled={loggingOut}
          className="md-btn md-btn-outlined md-state disabled:opacity-50"
          style={{ color: 'var(--md-error)', borderColor: 'var(--md-error)' }}
        >
          {loggingOut ? 'جاري الخروج...' : 'تسجيل الخروج'}
        </button>
      </div>
    </form>
  );
}
