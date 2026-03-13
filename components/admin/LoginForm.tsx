"use client";

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError('Email ou mot de passe incorrect');
      setLoading(false);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="mb-2 block text-sm font-semibold text-[#38515a]">Email</label>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-2xl border border-[#d9cdbb] bg-[#fffdf8] px-4 py-3 outline-none"
          placeholder="admin@ista.ma"
          required
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-semibold text-[#38515a]">Mot de passe</label>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-2xl border border-[#d9cdbb] bg-[#fffdf8] px-4 py-3 outline-none"
          placeholder="••••••••"
          required
        />
      </div>
      {error ? <p className="rounded-2xl bg-[#ffe2dd] px-4 py-3 text-sm font-semibold text-[#8a1f13]">{error}</p> : null}
      <button type="submit" disabled={loading} className="w-full rounded-2xl bg-[#123c3a] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
        {loading ? 'Connexion...' : 'Login'}
      </button>
    </form>
  );
}
