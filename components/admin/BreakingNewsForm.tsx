"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type FormValues = {
  title: string;
  slug: string;
  level: 'dangerous' | 'urgent' | 'warning';
  status: 'draft' | 'published';
  expires_at: string;
};

type BreakingNewsFormProps = {
  mode: 'create' | 'edit';
  initialValues: FormValues;
  id?: string;
};

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function BreakingNewsForm({ mode, initialValues, id }: BreakingNewsFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [values, setValues] = useState<FormValues>(initialValues);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (mode === 'create') {
      setValues((current) => ({
        ...current,
        slug: slugify(current.title),
      }));
    }
  }, [mode, values.title]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    const trimmedTitle = values.title.trim();
    const generatedSlug = slugify(trimmedTitle);

    if (!trimmedTitle || !generatedSlug || !values.level || !values.status || !values.expires_at) {
      setError('Tous les champs sont obligatoires.');
      return;
    }

    setSaving(true);

    const payload = {
      title: trimmedTitle,
      slug: mode === 'create' ? generatedSlug : values.slug,
      level: values.level,
      status: values.status,
      expires_at: new Date(values.expires_at).toISOString(),
    };

    const query = mode === 'create'
      ? supabase.from('breaking_news').insert(payload)
      : supabase.from('breaking_news').update(payload).eq('id', id);

    const { error: queryError } = await query;

    if (queryError) {
      setError(queryError.message);
      setSaving(false);
      return;
    }

    router.push('/dashboard/breaking-news');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-[32px] border border-[#d9cdbb] bg-[#fffdf8] p-6 shadow-sm">
      <div className="grid gap-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <label htmlFor="title" className="mb-2 block text-sm font-semibold text-[#38515a]">
            Title
          </label>
          <input
            id="title"
            value={values.title}
            onChange={(event) => setValues({ ...values, title: event.target.value })}
            placeholder="أدخل عنوان الخبر"
            className="w-full rounded-2xl border border-[#d9cdbb] px-4 py-3 outline-none transition focus:border-[#123c3a]"
            required
          />
        </div>

        <div>
          <label htmlFor="level" className="mb-2 block text-sm font-semibold text-[#38515a]">
            Level
          </label>
          <select
            id="level"
            value={values.level}
            onChange={(event) => setValues({ ...values, level: event.target.value as FormValues['level'] })}
            className="w-full rounded-2xl border border-[#d9cdbb] px-4 py-3 outline-none transition focus:border-[#123c3a]"
          >
            <option value="dangerous">🔴 Dangerous</option>
            <option value="urgent">🟠 Urgent</option>
            <option value="warning">🟡 Warning</option>
          </select>
        </div>

        <div>
          <label htmlFor="status" className="mb-2 block text-sm font-semibold text-[#38515a]">
            Status
          </label>
          <select
            id="status"
            value={values.status}
            onChange={(event) => setValues({ ...values, status: event.target.value as FormValues['status'] })}
            className="w-full rounded-2xl border border-[#d9cdbb] px-4 py-3 outline-none transition focus:border-[#123c3a]"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label htmlFor="expires_at" className="mb-2 block text-sm font-semibold text-[#38515a]">
            Expires at
          </label>
          <input
            id="expires_at"
            type="datetime-local"
            value={values.expires_at}
            onChange={(event) => setValues({ ...values, expires_at: event.target.value })}
            className="w-full rounded-2xl border border-[#d9cdbb] px-4 py-3 outline-none transition focus:border-[#123c3a]"
            required
          />
        </div>

        <div className="md:col-span-2 rounded-2xl border border-dashed border-[#d9cdbb] bg-[#faf5eb] px-4 py-3 text-sm text-[#6d7f82]">
          <span className="font-semibold text-[#38515a]">Slug:</span>{' '}
          {mode === 'create' ? values.slug || 'Will be generated automatically from the title' : values.slug}
        </div>
      </div>

      {error ? <p className="rounded-2xl bg-[#ffe2dd] px-4 py-3 text-sm font-semibold text-[#8a1f13]">{error}</p> : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-2xl bg-[#123c3a] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
        <Link
          href="/dashboard/breaking-news"
          className="rounded-2xl bg-[#ece4d7] px-5 py-3 text-sm font-semibold text-[#38515a]"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
