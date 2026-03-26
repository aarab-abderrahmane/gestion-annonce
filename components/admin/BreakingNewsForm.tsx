"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { useErrorToast } from '@/components/ui/useErrorToast';
import {
  BREAKING_NEWS_EDITORIAL_STATUS_LABELS,
  type BreakingNewsEditorialStatus,
} from '@/lib/breaking-news-workflow';
import {
  breakingNewsSchema,
  getFirstZodError,
} from '@/lib/validations';

type FormValues = {
  title: string;
  slug: string;
  level: 'dangerous' | 'urgent' | 'warning';
  status: 'draft' | 'published';
  editorial_status: BreakingNewsEditorialStatus;
  review_notes: string;
  expires_at: string;
};

type BreakingNewsFormProps = {
  mode: 'create' | 'edit';
  initialValues: FormValues;
  canPublish: boolean;
  id?: string;
};

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
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

export default function BreakingNewsForm({ mode, initialValues, canPublish, id }: BreakingNewsFormProps) {
  const router = useRouter();
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
      editorial_status: values.editorial_status,
      review_notes: values.review_notes,
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
      editorial_status: parsed.editorial_status,
      review_notes: parsed.review_notes || null,
      expires_at: new Date(parsed.expires_at).toISOString(),
    };
    try {
      const response = await fetch(
        mode === 'create' ? '/api/breaking-news' : `/api/breaking-news/${id}`,
        {
          method: mode === 'create' ? 'POST' : 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      );
      const result = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      if (!response.ok) {
        setError(result?.error ?? 'تعذر حفظ الخبر حالياً.');
        setSaving(false);
        return;
      }

      router.push('/dashboard/breaking-news');
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'تعذر حفظ الخبر حالياً.',
      );
      setSaving(false);
    }
  }

  const editorialOptions = canPublish
    ? ([
        'draft',
        'in_review',
        'changes_requested',
        'approved',
      ] as const)
    : (['draft', 'in_review'] as const);

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
            {canPublish ? <option value="published">منشور</option> : null}
          </select>
        </Field>

        <Field label="مسار التحرير">
          <select
            id="editorial_status"
            value={values.editorial_status}
            onChange={(e) =>
              setField(
                'editorial_status',
                e.target.value as FormValues['editorial_status'],
              )
            }
            className={inputCls}
            style={inputStyle}
            onFocus={(e) => (e.target.style.borderColor = 'var(--md-primary)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--md-outline)')}
          >
            {editorialOptions.map((option) => (
              <option key={option} value={option}>
                {BREAKING_NEWS_EDITORIAL_STATUS_LABELS[option]}
              </option>
            ))}
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

        <div className="md:col-span-2">
          <Field label={canPublish ? 'ملاحظات المراجعة' : 'ملاحظات المراجع'}>
            <textarea
              id="review_notes"
              value={values.review_notes}
              onChange={(e) => setField('review_notes', e.target.value)}
              className={`${inputCls} min-h-28 py-3`}
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = 'var(--md-primary)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--md-outline)')}
              placeholder={
                canPublish
                  ? 'أضف ملاحظات الاعتماد أو التعديلات المطلوبة.'
                  : 'ستظهر هنا ملاحظات المراجع إن وُجدت.'
              }
              readOnly={!canPublish}
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

      <div
        className="rounded-[var(--md-shape-m)] px-4 py-3 md-body-small"
        style={{
          background: 'var(--md-surface-container-low)',
          color: 'var(--md-on-surface-variant)',
        }}
      >
        {canPublish
          ? 'يمكنك اعتماد الخبر أو طلب تعديلات عليه أو نشره مباشرة.'
          : 'يمكنك حفظ الخبر كمسودة أو إرساله للمراجعة. النشر والاعتماد متاحان للمراجع فقط.'}
      </div>

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
