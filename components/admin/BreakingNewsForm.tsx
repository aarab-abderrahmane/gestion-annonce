"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useErrorToast } from '@/components/ui/useErrorToast';
import {
  breakingNewsSchema,
  getFirstZodError,
} from '@/lib/validations';

type FormValues = {
  title: string;
  slug: string;
  level: 'dangerous' | 'urgent' | 'warning';
  status: 'draft' | 'published';
  expires_at: string;
};

type BreakingNewsFormProps = { mode: 'create' | 'edit'; initialValues: FormValues; id?: string };

function slugify(value: string) {
  return value.trim().toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="md-label-medium block" style={{ color: 'var(--md-on-surface-variant)' }}>{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full md-body-medium px-4 h-12 rounded-[var(--md-shape-s)] border outline-none transition-colors";
const inputStyle = { background: 'var(--md-surface-container-lowest)', borderColor: 'var(--md-outline)', color: 'var(--md-on-surface)' };

export default function BreakingNewsForm({ mode, initialValues, id }: BreakingNewsFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [values, setValues] = useState<FormValues>(initialValues);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useErrorToast(error);

  function setField<K extends keyof FormValues>(key: K, val: FormValues[K]) {
    setValues((curr) => ({ ...curr, [key]: val }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const trimmedTitle = values.title.trim();
    const generatedSlug = slugify(trimmedTitle);
    const slug = mode === 'create' ? generatedSlug : values.slug || generatedSlug;
    const validation = breakingNewsSchema.safeParse({
      title: trimmedTitle,
      slug,
      level: values.level,
      status: values.status,
      expires_at: values.expires_at,
    });

    if (!validation.success) {
      setError(getFirstZodError(validation.error));
      return;
    }

    setSaving(true);
    const parsed = validation.data;
    const payload = {
      title: parsed.title,
      slug,
      level: parsed.level,
      status: parsed.status,
      expires_at: new Date(parsed.expires_at).toISOString(),
    };
    const query = mode === 'create'
      ? supabase.from('breaking_news').insert(payload)
      : supabase.from('breaking_news').update(payload).eq('id', id);
    const { error: queryError } = await query;
    if (queryError) { setError(queryError.message); setSaving(false); return; }
    router.push('/dashboard/breaking-news');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="md-card-outlined p-6 space-y-5">
      <div className="grid gap-5 md:grid-cols-2">
        {/* Title */}
        <div className="md:col-span-2">
          <Field label="العنوان">
            <input
              id="title"
              value={values.title}
              onChange={(e) => {
                const nextTitle = e.target.value;
                setValues((curr) => ({
                  ...curr,
                  title: nextTitle,
                  slug: mode === 'create' ? slugify(nextTitle) : curr.slug,
                }));
              }}
              placeholder="أدخل عنوان الخبر"
              className={inputCls}
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = 'var(--md-primary)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--md-outline)')}
              required
            />
          </Field>
        </div>

        {/* Level */}
        <Field label="المستوى">
          <select
            id="level"
            value={values.level}
            onChange={(e) => setField('level', e.target.value as FormValues['level'])}
            className={inputCls}
            style={inputStyle}
            onFocus={(e) => (e.target.style.borderColor = 'var(--md-primary)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--md-outline)')}
          >
            <option value="dangerous">🔴 خطير</option>
            <option value="urgent">🟠 عاجل</option>
            <option value="warning">🟡 تحذير</option>
          </select>
        </Field>

        {/* Status */}
        <Field label="الحالة">
          <select
            id="status"
            value={values.status}
            onChange={(e) => setField('status', e.target.value as FormValues['status'])}
            className={inputCls}
            style={inputStyle}
            onFocus={(e) => (e.target.style.borderColor = 'var(--md-primary)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--md-outline)')}
          >
            <option value="draft">مسودة</option>
            <option value="published">منشور</option>
          </select>
        </Field>

        {/* Expires at */}
        <div className="md:col-span-2">
          <Field label="تاريخ الانتهاء">
            <input
              id="expires_at"
              type="datetime-local"
              value={values.expires_at}
              onChange={(e) => setField('expires_at', e.target.value)}
              className={inputCls}
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = 'var(--md-primary)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--md-outline)')}
              required
            />
          </Field>
        </div>

        {/* Slug preview */}
        <div
          className="md:col-span-2 px-4 py-3 rounded-[var(--md-shape-m)] md-body-small"
          style={{ background: 'var(--md-surface-container)', color: 'var(--md-on-surface-variant)' }}
        >
          <span className="font-semibold" style={{ color: 'var(--md-on-surface)' }}>Slug: </span>
          {mode === 'create' ? values.slug || 'سيتم توليده تلقائياً من العنوان' : values.slug}
        </div>
      </div>

      {/* Error */}
      {error && (
        <p
          className="md-body-small px-4 py-3 rounded-[var(--md-shape-m)]"
          style={{ background: 'var(--md-error-container)', color: 'var(--md-on-error-container)' }}
        >
          {error}
        </p>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3 pt-2">
        <button type="submit" disabled={saving} className="md-btn md-btn-filled md-state disabled:opacity-50">
          {saving ? 'جاري الحفظ...' : 'حفظ'}
        </button>
        <Link href="/dashboard/breaking-news" className="md-btn md-btn-outlined md-state">
          إلغاء
        </Link>
      </div>
    </form>
  );
}
