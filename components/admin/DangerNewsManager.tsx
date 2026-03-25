"use client";

import Link from 'next/link';
import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Gauge, ListOrdered, Minus, Settings2 } from 'lucide-react';
import DangerNewsTable from '@/components/admin/DangerNewsTable';
import DangerNewsIcon from '@/components/shared/DangerNewsIcon';
import { useToast } from '@/components/ui/ToastProvider';
import { useErrorToast } from '@/components/ui/useErrorToast';
import { createClient } from '@/lib/supabase/client';
import {
  DANGER_NEWS_ICON_LABELS,
  DANGER_NEWS_ICON_VALUES,
  DEFAULT_DANGER_NEWS_TICKER_SETTINGS,
  normalizeDangerNewsTickerSettings,
  type DangerNewsItemRow,
  type DangerNewsTickerSettingsRow,
} from '@/lib/danger-news';
import type { ResourcePermissionState } from '@/lib/admin-permissions';
import type { DangerNewsIconName } from '@/types';
import {
  dangerNewsTickerSettingsSchema,
  getFirstZodError,
} from '@/lib/validations';

type FormValues = {
  is_enabled: boolean;
  badge_label: string;
  title: string;
  speed_seconds: string;
  max_items: string;
  separator: string;
  icon_name: DangerNewsIconName;
  gradient_from_color: string;
  gradient_to_color: string;
  accent_color: string;
  text_color: string;
};

const inputCls = 'w-full h-12 rounded-[var(--md-shape-s)] border px-4 md-body-medium outline-none transition-colors';
const inputStyle = {
  background: 'var(--md-surface-container-lowest)',
  borderColor: 'var(--md-outline)',
  color: 'var(--md-on-surface)',
};

function createFormValues(settings?: DangerNewsTickerSettingsRow | null): FormValues {
  const normalized = normalizeDangerNewsTickerSettings(settings);

  return {
    is_enabled: normalized.isEnabled,
    badge_label: normalized.badgeLabel,
    title: normalized.title,
    speed_seconds: String(normalized.speedSeconds),
    max_items: String(normalized.maxItems),
    separator: normalized.separator,
    icon_name: normalized.iconName,
    gradient_from_color: normalized.gradientFromColor,
    gradient_to_color: normalized.gradientToColor,
    accent_color: normalized.accentColor,
    text_color: normalized.textColor,
  };
}

function resolveIconName(value: string | null | undefined): DangerNewsIconName {
  return DANGER_NEWS_ICON_VALUES.includes(value as DangerNewsIconName)
    ? (value as DangerNewsIconName)
    : DEFAULT_DANGER_NEWS_TICKER_SETTINGS.iconName;
}

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

function ColorField({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-3 rounded-[var(--md-shape-m)] border px-3 py-2" style={{ borderColor: 'var(--md-outline)', background: 'var(--md-surface-container-lowest)' }}>
        <input
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
          disabled={disabled}
          className="h-10 w-12 cursor-pointer rounded border-0 bg-transparent p-0 disabled:cursor-not-allowed"
        />
        <input
          value={value}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
          className={`${inputCls} h-10 border-0 px-2`}
          style={{ ...inputStyle, background: 'transparent' }}
          disabled={disabled}
        />
      </div>
    </Field>
  );
}

export default function DangerNewsManager({
  initialSettings,
  items,
  permissions,
}: {
  initialSettings: DangerNewsTickerSettingsRow | null;
  items: DangerNewsItemRow[];
  permissions: ResourcePermissionState;
}) {
  const router = useRouter();
  const supabase = createClient();
  const toast = useToast();
  const [settingsId, setSettingsId] = useState<string | null>(initialSettings?.id ?? null);
  const [values, setValues] = useState<FormValues>(() => createFormValues(initialSettings));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useErrorToast(error);

  const canSave = settingsId ? permissions.update : permissions.create;
  const readOnly = !canSave;
  const publishedCount = useMemo(
    () => items.filter((row) => row.status === 'published' && !row.deleted_at).length,
    [items],
  );
  const draftCount = useMemo(
    () => items.filter((row) => row.status !== 'published' && !row.deleted_at).length,
    [items],
  );
  const trashedCount = useMemo(
    () => items.filter((row) => Boolean(row.deleted_at)).length,
    [items],
  );

  const previewMaxItems = Math.max(
    1,
    Number.parseInt(values.max_items || String(DEFAULT_DANGER_NEWS_TICKER_SETTINGS.maxItems), 10) || DEFAULT_DANGER_NEWS_TICKER_SETTINGS.maxItems,
  );
  const previewSpeedSeconds = Math.max(
    5,
    Number.parseInt(values.speed_seconds || String(DEFAULT_DANGER_NEWS_TICKER_SETTINGS.speedSeconds), 10) || DEFAULT_DANGER_NEWS_TICKER_SETTINGS.speedSeconds,
  );
  const previewIconName = resolveIconName(values.icon_name);
  const previewSettings = normalizeDangerNewsTickerSettings({
    is_enabled: values.is_enabled,
    badge_label: values.badge_label,
    title: values.title,
    speed_seconds: previewSpeedSeconds,
    max_items: previewMaxItems,
    separator: values.separator,
    icon_name: previewIconName,
    gradient_from_color: values.gradient_from_color,
    gradient_to_color: values.gradient_to_color,
    accent_color: values.accent_color,
    text_color: values.text_color,
  });
  const previewTitles = useMemo(() => {
    const titles = items
      .filter((row) => row.status === 'published' && !row.deleted_at)
      .slice(0, previewMaxItems)
      .map((row) => row.title);

    if (titles.length > 0) return titles;

    return [
      'مثال على عنصر مستقل داخل الشريط الخطير',
      'يمكنك إدارة العناصر من هذه الصفحة دون المرور على الأخبار العاجلة',
    ].slice(0, previewMaxItems);
  }, [items, previewMaxItems]);

  function setField<K extends keyof FormValues>(field: K, value: FormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    const validation = dangerNewsTickerSettingsSchema.safeParse({
      is_enabled: values.is_enabled,
      badge_label: values.badge_label.trim(),
      title: values.title.trim(),
      speed_seconds: values.speed_seconds,
      max_items: values.max_items,
      separator: values.separator.trim(),
      icon_name: resolveIconName(values.icon_name),
      gradient_from_color: values.gradient_from_color.trim().toUpperCase(),
      gradient_to_color: values.gradient_to_color.trim().toUpperCase(),
      accent_color: values.accent_color.trim().toUpperCase(),
      text_color: values.text_color.trim().toUpperCase(),
    });

    if (!validation.success) {
      setError(getFirstZodError(validation.error));
      return;
    }

    setSaving(true);

    try {
      const payload = validation.data;
      const query = settingsId
        ? supabase.from('danger_news_settings').update(payload).eq('id', settingsId).select('id').single()
        : supabase.from('danger_news_settings').insert(payload).select('id').single();
      const { data, error: saveError } = await query;

      if (saveError) {
        throw saveError;
      }

      setSettingsId(data.id);
      toast.success('تم حفظ إعدادات الشريط الخطير بنجاح.');
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'تعذر حفظ إعدادات الشريط الخطير حالياً.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <section
        className="rounded-[32px] border p-6 shadow-sm"
        style={{
          borderColor: 'color-mix(in srgb, var(--md-error) 18%, var(--md-outline-variant) 82%)',
          background: 'linear-gradient(135deg, color-mix(in srgb, var(--md-error-container) 70%, white 30%) 0%, var(--md-surface) 100%)',
        }}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div
              className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 md-label-medium"
              style={{ background: 'var(--md-error)', color: 'var(--md-on-error)' }}
            >
              <AlertTriangle size={16} />
              وحدة الشريط الخطير
            </div>
            <div>
              <h2 className="md-title-large" style={{ color: 'var(--md-on-surface)' }}>
                إدارة محتوى الشريط الخطير وتخصيصه
              </h2>
              <p className="md-body-medium mt-2 max-w-3xl" style={{ color: 'var(--md-on-surface-variant)' }}>
                أضف عناصر مستقلة للشريط، واضبط عنوانه وسرعته وعدد العناصر المعروضة من نفس الواجهة.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {permissions.create ? (
              <Link href="/dashboard/danger-news/create" className="md-btn md-btn-filled md-state">
                عنصر جديد
              </Link>
            ) : null}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <span className="rounded-full px-3 py-1.5 md-label-small" style={{ background: 'var(--md-error-container)', color: 'var(--md-on-error-container)' }}>
            منشور: {publishedCount}
          </span>
          <span className="rounded-full px-3 py-1.5 md-label-small" style={{ background: 'var(--md-warning-container)', color: 'var(--md-on-warning-container)' }}>
            مسودات: {draftCount}
          </span>
          <span className="rounded-full px-3 py-1.5 md-label-small" style={{ background: 'var(--md-surface-container-highest)', color: 'var(--md-on-surface-variant)' }}>
            مهملات: {trashedCount}
          </span>
          <span className="rounded-full px-3 py-1.5 md-label-small" style={{ background: values.is_enabled ? 'var(--md-primary-container)' : 'var(--md-surface-container-highest)', color: values.is_enabled ? 'var(--md-on-primary-container)' : 'var(--md-on-surface-variant)' }}>
            الحالة: {values.is_enabled ? 'مفعّل' : 'معطّل'}
          </span>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(380px,0.85fr)]">
        <form onSubmit={handleSubmit} className="md-card-outlined p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[var(--md-shape-l)]" style={{ background: 'var(--md-error-container)', color: 'var(--md-on-error-container)' }}>
              <Settings2 size={20} />
            </div>
            <div>
              <h3 className="md-title-medium" style={{ color: 'var(--md-on-surface)' }}>
                تخصيص الشريط
              </h3>
              <p className="md-body-small mt-1" style={{ color: 'var(--md-on-surface-variant)' }}>
                تتحكم هذه الإعدادات مباشرة في الشريط الخطير داخل الصفحة الرئيسية، بما في ذلك الألوان والأيقونة.
              </p>
            </div>
          </div>

          <label
            className="flex items-center justify-between gap-4 rounded-[var(--md-shape-l)] border px-4 py-4"
            style={{ borderColor: 'var(--md-outline-variant)', background: 'var(--md-surface-container-low)' }}
          >
            <div>
              <p className="md-title-small" style={{ color: 'var(--md-on-surface)' }}>
                تفعيل الشريط
              </p>
              <p className="md-body-small mt-1" style={{ color: 'var(--md-on-surface-variant)' }}>
                عند الإيقاف لن يظهر الشريط الخطير في الصفحة الرئيسية.
              </p>
            </div>
            <input
              type="checkbox"
              checked={values.is_enabled}
              onChange={(event) => setField('is_enabled', event.target.checked)}
              disabled={readOnly}
            />
          </label>

          <div className="grid gap-5 md:grid-cols-2">
            <Field label="شارة الشريط">
              <input
                value={values.badge_label}
                onChange={(event) => setField('badge_label', event.target.value)}
                className={inputCls}
                style={inputStyle}
                disabled={readOnly}
                onFocus={(event) => (event.target.style.borderColor = 'var(--md-primary)')}
                onBlur={(event) => (event.target.style.borderColor = 'var(--md-outline)')}
              />
            </Field>

            <Field label="عنوان الشريط">
              <input
                value={values.title}
                onChange={(event) => setField('title', event.target.value)}
                className={inputCls}
                style={inputStyle}
                disabled={readOnly}
                onFocus={(event) => (event.target.style.borderColor = 'var(--md-primary)')}
                onBlur={(event) => (event.target.style.borderColor = 'var(--md-outline)')}
              />
            </Field>

            <Field label="سرعة الحركة بالثواني">
              <div className="relative">
                <Gauge size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--md-outline)' }} />
                <input
                  type="number"
                  min={5}
                  max={120}
                  value={values.speed_seconds}
                  onChange={(event) => setField('speed_seconds', event.target.value)}
                  className={`${inputCls} pl-11`}
                  style={inputStyle}
                  disabled={readOnly}
                  onFocus={(event) => (event.target.style.borderColor = 'var(--md-primary)')}
                  onBlur={(event) => (event.target.style.borderColor = 'var(--md-outline)')}
                />
              </div>
            </Field>

            <Field label="عدد العناصر المعروضة">
              <div className="relative">
                <ListOrdered size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--md-outline)' }} />
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={values.max_items}
                  onChange={(event) => setField('max_items', event.target.value)}
                  className={`${inputCls} pl-11`}
                  style={inputStyle}
                  disabled={readOnly}
                  onFocus={(event) => (event.target.style.borderColor = 'var(--md-primary)')}
                  onBlur={(event) => (event.target.style.borderColor = 'var(--md-outline)')}
                />
              </div>
            </Field>

            <div className="md:col-span-2">
              <Field label="رمز الفاصل">
                <div className="relative max-w-xs">
                  <Minus size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--md-outline)' }} />
                  <input
                    value={values.separator}
                    onChange={(event) => setField('separator', event.target.value)}
                    className={`${inputCls} pl-11`}
                    style={inputStyle}
                    disabled={readOnly}
                    onFocus={(event) => (event.target.style.borderColor = 'var(--md-primary)')}
                    onBlur={(event) => (event.target.style.borderColor = 'var(--md-outline)')}
                  />
                </div>
              </Field>
            </div>

          </div>

          {error ? (
            <p
              className="md-body-small rounded-[var(--md-shape-m)] px-4 py-3"
              style={{ background: 'var(--md-error-container)', color: 'var(--md-on-error-container)' }}
            >
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={saving || readOnly} className="md-btn md-btn-filled md-state disabled:opacity-50">
              {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
            </button>
            <button
              type="button"
              onClick={() => setValues(createFormValues(initialSettings))}
              disabled={saving}
              className="md-btn md-btn-outlined md-state disabled:opacity-50"
            >
              إعادة القيم الحالية
            </button>
          </div>
        </form>

        <section className="md-card-outlined p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[var(--md-shape-l)]" style={{ background: 'var(--md-secondary-container)', color: 'var(--md-on-secondary-container)' }}>
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3 className="md-title-medium" style={{ color: 'var(--md-on-surface)' }}>
                معاينة سريعة
              </h3>
              <p className="md-body-small mt-1" style={{ color: 'var(--md-on-surface-variant)' }}>
                هذه المعاينة تعكس العنوان والسرعة والفاصل وعدد العناصر والألوان والأيقونة التي سيستخدمها الشريط.
              </p>
            </div>
          </div>

          <div
            className="overflow-hidden rounded-[24px] border"
            style={{
              borderColor: previewSettings.accentColor,
              background: `linear-gradient(90deg, ${previewSettings.gradientFromColor} 0%, ${previewSettings.gradientToColor} 100%)`,
            }}
          >
            <div className="flex flex-col gap-4 px-5 py-4">
              <div className="flex items-center gap-3">
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-full"
                  style={{ background: previewSettings.accentColor, color: '#FFFFFF' }}
                >
                  <DangerNewsIcon name={previewSettings.iconName} size={20} />
                </span>
                <div>
                  <p className="md-label-small uppercase tracking-widest" style={{ color: previewSettings.textColor, opacity: 0.78 }}>
                    {previewSettings.badgeLabel}
                  </p>
                  <h4 className="md-title-medium" style={{ color: previewSettings.textColor }}>
                    {previewSettings.title}
                  </h4>
                </div>
              </div>

              <div
                dir="ltr"
                className="dangerous-news-ticker-shell overflow-hidden rounded-[var(--md-shape-full)] border px-4 py-3"
                style={{
                  borderColor: `${previewSettings.accentColor}33`,
                  background: `color-mix(in srgb, white 78%, ${previewSettings.gradientToColor} 22%)`,
                }}
              >
                <div
                  dir="ltr"
                  className="dangerous-news-ticker-track flex items-center"
                  style={{
                    ['--dangerous-news-repeat-count' as string]: 2,
                    ['--dangerous-news-ticker-duration' as string]: `${previewSettings.speedSeconds}s`,
                  }}
                >
                  {[0, 1].map((segmentIndex) => (
                    <div
                      key={`preview-segment-${segmentIndex}`}
                      aria-hidden={segmentIndex === 0 ? undefined : true}
                      className={`dangerous-news-ticker-segment inline-flex shrink-0 items-center whitespace-nowrap ${segmentIndex === 0 ? '' : 'dangerous-news-ticker-segment--duplicate pointer-events-none'}`}
                    >
                      {previewTitles.map((title, index) => (
                        <div key={`preview-${segmentIndex}-${index}`} className="flex shrink-0 items-center gap-4 pe-6">
                          <span className="md-title-small whitespace-nowrap" dir="rtl" style={{ color: previewSettings.textColor, fontFamily: 'var(--md-font-brand)' }}>
                            {title}
                          </span>
                          <span aria-hidden="true" className="shrink-0 text-sm" style={{ color: previewSettings.textColor, opacity: 0.45 }}>
                            {previewSettings.separator}
                          </span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[var(--md-shape-l)] px-4 py-3" style={{ background: 'var(--md-surface-container-low)' }}>
              <p className="md-label-small" style={{ color: 'var(--md-on-surface-variant)' }}>السرعة</p>
              <p className="md-title-small mt-1" style={{ color: 'var(--md-on-surface)' }}>
                {previewSettings.speedSeconds} ثانية
              </p>
            </div>
            <div className="rounded-[var(--md-shape-l)] px-4 py-3" style={{ background: 'var(--md-surface-container-low)' }}>
              <p className="md-label-small" style={{ color: 'var(--md-on-surface-variant)' }}>عدد العناصر</p>
              <p className="md-title-small mt-1" style={{ color: 'var(--md-on-surface)' }}>
                {previewSettings.maxItems}
              </p>
            </div>
            <div className="rounded-[var(--md-shape-l)] px-4 py-3" style={{ background: 'var(--md-surface-container-low)' }}>
              <p className="md-label-small" style={{ color: 'var(--md-on-surface-variant)' }}>الفاصل</p>
              <p className="md-title-small mt-1" style={{ color: 'var(--md-on-surface)' }}>
                {previewSettings.separator}
              </p>
            </div>
          </div>

          <div className="space-y-4 rounded-[var(--md-shape-xl)] border p-4" style={{ borderColor: 'var(--md-outline-variant)', background: 'var(--md-surface-container-low)' }}>
            <div>
              <h4 className="md-title-small" style={{ color: 'var(--md-on-surface)' }}>
                تخصيص التصميم
              </h4>
              <p className="md-body-small mt-1" style={{ color: 'var(--md-on-surface-variant)' }}>
                اختر أيقونة الشريط ثم عدل الألوان مباشرة من هذه المعاينة.
              </p>
            </div>

            <Field label="أيقونة الشريط">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {DANGER_NEWS_ICON_VALUES.map((iconName) => {
                  const isActive = values.icon_name === iconName;

                  return (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => setField('icon_name', iconName)}
                      disabled={readOnly}
                      className="rounded-[var(--md-shape-l)] border px-3 py-3 text-right transition disabled:opacity-60"
                      style={{
                        borderColor: isActive ? previewSettings.accentColor : 'var(--md-outline-variant)',
                        background: isActive ? `${previewSettings.accentColor}14` : 'var(--md-surface)',
                        color: 'var(--md-on-surface)',
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="flex h-10 w-10 items-center justify-center rounded-full"
                          style={{
                            background: isActive ? previewSettings.accentColor : 'var(--md-surface-container-highest)',
                            color: isActive ? '#FFFFFF' : 'var(--md-on-surface-variant)',
                          }}
                        >
                          <DangerNewsIcon name={iconName} size={18} />
                        </span>
                        <span className="md-label-medium">{DANGER_NEWS_ICON_LABELS[iconName]}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <ColorField
                label="لون بداية الخلفية"
                value={values.gradient_from_color}
                onChange={(value) => setField('gradient_from_color', value)}
                disabled={readOnly}
              />

              <ColorField
                label="لون نهاية الخلفية"
                value={values.gradient_to_color}
                onChange={(value) => setField('gradient_to_color', value)}
                disabled={readOnly}
              />

              <ColorField
                label="لون الأيقونة والإطار"
                value={values.accent_color}
                onChange={(value) => setField('accent_color', value)}
                disabled={readOnly}
              />

              <ColorField
                label="لون النص"
                value={values.text_color}
                onChange={(value) => setField('text_color', value)}
                disabled={readOnly}
              />
            </div>
          </div>
        </section>
      </div>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="md-title-large" style={{ color: 'var(--md-on-surface)' }}>
              عناصر الشريط الخطير
            </h3>
            <p className="md-body-small mt-1" style={{ color: 'var(--md-on-surface-variant)' }}>
              هذه العناصر مستقلة تمامًا عن الأخبار العاجلة، وهي المصدر الوحيد الذي يغذي الشريط في الصفحة الرئيسية.
            </p>
          </div>
          {permissions.create ? (
            <Link href="/dashboard/danger-news/create" className="md-btn md-btn-outlined md-state">
              إضافة عنصر
            </Link>
          ) : null}
        </div>

        {items.length > 0 ? (
          <DangerNewsTable rows={items} permissions={permissions} />
        ) : (
          <div className="md-card-outlined p-6 text-sm" style={{ color: 'var(--md-on-surface-variant)' }}>
            لا توجد عناصر داخل الشريط الخطير بعد.
          </div>
        )}
      </section>
    </div>
  );
}
