"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useErrorToast } from '@/components/ui/useErrorToast';
import {
  dangerNewsSchema,
  getFirstZodError,
} from '@/lib/validations';

type FormValues = {
  title: string;
  status: 'draft' | 'published';
  expires_at: string;
};

type DangerNewsFormProps = {
  mode: 'create' | 'edit';
  initialValues: FormValues;
  canPublish: boolean;
  id?: string;
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="md-label-medium block" style={{ color: 'var(--md-on-surface-variant)' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputCls = "w-full md-body-medium px-4 h-12 rounded-[var(--md-shape-s)] border outline-none transition-colors";
const inputStyle = { background: 'var(--md-surface-container-lowest)', borderColor: 'var(--md-outline)', color: 'var(--md-on-surface)' };

export default function DangerNewsForm({ mode, initialValues, canPublish, id }: DangerNewsFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [values, setValues] = useState<FormValues>(initialValues);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useErrorToast(error);

  function setField<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    const validation = dangerNewsSchema.safeParse({
      title: values.title.trim(),
      status: values.status,
      expires_at: values.expires_at,
    });

    if (!validation.success) {
      setError(getFirstZodError(validation.error));
      return;
    }

    setSaving(true);

    const payload = {
      title: validation.data.title,
      status: validation.data.status,
      expires_at: new Date(validation.data.expires_at).toISOString(),
    };

    const query = mode === 'create'
      ? supabase.from('danger_news').insert(payload)
      : supabase.from('danger_news').update(payload).eq('id', id);
    const { error: queryError } = await query;

    if (queryError) {
      setError(queryError.message);
      setSaving(false);
      return;
    }

    router.push('/dashboard/danger-news');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="md-card-outlined p-6 space-y-5">
      <div className="grid gap-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <Field label="نص العنصر">
            <input
              id="title"
              value={values.title}
              onChange={(event) => setField('title', event.target.value)}
              placeholder="أدخل النص الذي سيظهر داخل الشريط"
              className={inputCls}
              style={inputStyle}
              onFocus={(event) => (event.target.style.borderColor = 'var(--md-primary)')}
              onBlur={(event) => (event.target.style.borderColor = 'var(--md-outline)')}
              required
            />
          </Field>
        </div>

        <Field label="الحالة">
          <select
            id="status"
            value={values.status}
            onChange={(event) => setField('status', event.target.value as FormValues['status'])}
            className={inputCls}
            style={inputStyle}
            onFocus={(event) => (event.target.style.borderColor = 'var(--md-primary)')}
            onBlur={(event) => (event.target.style.borderColor = 'var(--md-outline)')}
          >
            <option value="draft">مسودة</option>
            {canPublish ? <option value="published">منشور</option> : null}
          </select>
        </Field>

        <Field label="تاريخ الانتهاء">
          <input
            id="expires_at"
            type="datetime-local"
            value={values.expires_at}
            onChange={(event) => setField('expires_at', event.target.value)}
            className={inputCls}
            style={inputStyle}
            onFocus={(event) => (event.target.style.borderColor = 'var(--md-primary)')}
            onBlur={(event) => (event.target.style.borderColor = 'var(--md-outline)')}
            required
          />
        </Field>
      </div>

      {error ? (
        <p
          className="md-body-small px-4 py-3 rounded-[var(--md-shape-m)]"
          style={{ background: 'var(--md-error-container)', color: 'var(--md-on-error-container)' }}
        >
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3 pt-2">
        <button type="submit" disabled={saving} className="md-btn md-btn-filled md-state disabled:opacity-50">
          {saving ? 'جاري الحفظ...' : 'حفظ'}
        </button>
        <Link href="/dashboard/danger-news" className="md-btn md-btn-outlined md-state">
          إلغاء
        </Link>
      </div>
    </form>
  );
}
