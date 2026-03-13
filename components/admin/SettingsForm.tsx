"use client";

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type Props = {
  email: string;
};

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
    setSaving(true);
    setError('');
    setSuccess('');

    const payload: { email?: string; password?: string } = {};
    if (newEmail.trim() && newEmail.trim() !== email) payload.email = newEmail.trim();
    if (newPassword.trim()) payload.password = newPassword.trim();

    if (!payload.email && !payload.password) {
      setError('Enter a new email or password first.');
      setSaving(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser(payload);
    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    setSuccess('Settings updated successfully.');
    setNewPassword('');
    setSaving(false);
    router.refresh();
  }

  async function handleLogout() {
    setLoggingOut(true);
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-[32px] border border-[#d9cdbb] bg-[#fffdf8] p-6 shadow-sm">
      <div>
        <label htmlFor="admin-email" className="mb-2 block text-sm font-semibold text-[#38515a]">Change admin email</label>
        <input
          id="admin-email"
          type="email"
          value={newEmail}
          onChange={(event) => setNewEmail(event.target.value)}
          className="w-full rounded-2xl border border-[#d9cdbb] px-4 py-3"
        />
      </div>

      <div>
        <label htmlFor="admin-password" className="mb-2 block text-sm font-semibold text-[#38515a]">Change admin password</label>
        <input
          id="admin-password"
          type="password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          className="w-full rounded-2xl border border-[#d9cdbb] px-4 py-3"
        />
      </div>

      {error ? <p className="rounded-2xl bg-[#ffe2dd] px-4 py-3 text-sm font-semibold text-[#8a1f13]">{error}</p> : null}
      {success ? <p className="rounded-2xl bg-[#dff3ea] px-4 py-3 text-sm font-semibold text-[#0f5a46]">{success}</p> : null}

      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={saving} className="rounded-2xl bg-[#123c3a] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button
          type="button"
          onClick={() => void handleLogout()}
          disabled={loggingOut}
          className="rounded-2xl bg-[#ece4d7] px-5 py-3 text-sm font-semibold text-[#38515a] disabled:opacity-60"
        >
          {loggingOut ? 'Logging out...' : 'Logout'}
        </button>
      </div>
    </form>
  );
}
