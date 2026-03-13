"use client";

import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type FormValues = {
  title: string;
  slug: string;
  level: 'dangerous' | 'urgent' | 'warning';
  status: 'draft' | 'published';
  expires_at: string;
};

export default function BreakingNewsForm({ mode, initialValues, id }: { mode: 'create' | 'edit'; initialValues: FormValues; id?: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [values, setValues] = useState<FormValues>(initialValues);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');

    const payload = {
      title: values.title,
      slug: values.slug,
      level: values.level,
      status: values.status,
      expires_at: new Date(values.expires_at).toISOString(),
    };

    const query = mode === 'create'
      ? supabase.from('breaking_news').insert(payload)
      : supabase.from('breaking_news').update(payload).eq('id', id);

    const { error } = await query;
    if (error) {
      setError(error.message);
      setSaving(false);
      return;
    }

    router.push('/dashboard/breaking-news');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-[32px] border border-[#d9cdbb] bg-[#fffdf8] p-6 shadow-sm">
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-semibold text-[#38515a]">Title</label>
          <input value={values.title} onChange={(e) => setValues({ ...values, title: e.target.value })} className="w-full rounded-2xl border border-[#d9cdbb] px-4 py-3" required />
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-[#38515a]">Slug</label>
          <input value={values.slug} onChange={(e) => setValues({ ...values, slug: e.target.value })} className="w-full rounded-2xl border border-[#d9cdbb] px-4 py-3" required />
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-[#38515a]">Level</label>
          <select value={values.level} onChange={(e) => setValues({ ...values, level: e.target.value as FormValues['level'] })} className="w-full rounded-2xl border border-[#d9cdbb] px-4 py-3">
            <option value="dangerous">dangerous</option>
            <option value="urgent">urgent</option>
            <option value="warning">warning</option>
          </select>
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-[#38515a]">Status</label>
          <select value={values.status} onChange={(e) => setValues({ ...values, status: e.target.value as FormValues['status'] })} className="w-full rounded-2xl border border-[#d9cdbb] px-4 py-3">
            <option value="draft">draft</option>
            <option value="published">published</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-semibold text-[#38515a]">Expires at</label>
          <input type="datetime-local" value={values.expires_at} onChange={(e) => setValues({ ...values, expires_at: e.target.value })} className="w-full rounded-2xl border border-[#d9cdbb] px-4 py-3" required />
        </div>
      </div>
      {error ? <p className="rounded-2xl bg-[#ffe2dd] px-4 py-3 text-sm font-semibold text-[#8a1f13]">{error}</p> : null}
      <div className="flex gap-3">
        <button type="submit" disabled={saving} className="rounded-2xl bg-[#123c3a] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">{saving ? 'Saving...' : mode === 'create' ? 'Create' : 'Update'}</button>
        <button type="button" onClick={() => router.push('/dashboard/breaking-news')} className="rounded-2xl bg-[#ece4d7] px-5 py-3 text-sm font-semibold text-[#38515a]">Cancel</button>
      </div>
    </form>
  );
}
