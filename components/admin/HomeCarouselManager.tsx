"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ImageIcon, Plus, Upload, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { getErrorMessage } from '@/lib/errors';
import { DEFAULT_HOME_CAROUSEL_SLIDE_INPUTS } from '@/lib/home-carousel';
import { HOME_CAROUSEL_BUCKET } from '@/lib/storage';
import { useToast } from '@/components/ui/ToastProvider';
import { useErrorToast } from '@/components/ui/useErrorToast';
import type { ResourcePermissionState } from '@/lib/admin-permissions';
import {
  getFirstZodError,
  homeCarouselSlideSchema,
  validateUploadFile,
} from '@/lib/validations';
import type { ContentStatus, HomeCarouselTarget } from '@/types';

type Row = {
  id: string;
  title: string;
  subtitle: string;
  image_url: string;
  cta_label: string;
  target: HomeCarouselTarget;
  sort_order: number;
  status: ContentStatus;
  created_at: string;
  updated_at: string;
};

export type HomeCarouselAdminRow = Row;

type FormValues = {
  title: string;
  subtitle: string;
  image_url: string;
  cta_label: string;
  target: HomeCarouselTarget;
  sort_order: string;
  status: ContentStatus;
};

const targetOptions: Array<{ value: HomeCarouselTarget; label: string }> = [
  { value: 'events', label: 'الفعاليات' },
  { value: 'announcements', label: 'الإعلانات' },
  { value: 'important-info', label: 'المعلومات المهمة' },
  { value: 'home', label: 'الرئيسية' },
];

const inputCls =
  "w-full md-body-medium px-4 h-12 rounded-[var(--md-shape-s)] border outline-none transition-colors";
const inputStyle = {
  background: 'var(--md-surface-container-lowest)',
  borderColor: 'var(--md-outline)',
  color: 'var(--md-on-surface)',
};

function sortRows(rows: Row[]) {
  return [...rows].sort((left, right) => {
    if (left.sort_order !== right.sort_order) {
      return left.sort_order - right.sort_order;
    }

    return new Date(left.created_at).getTime() - new Date(right.created_at).getTime();
  });
}

function getNextSortOrder(rows: Row[]) {
  return rows.reduce((maxOrder, row) => Math.max(maxOrder, row.sort_order), 0) + 1;
}

function createEmptyValues(nextSortOrder: number): FormValues {
  return {
    title: '',
    subtitle: '',
    image_url: '',
    cta_label: '',
    target: 'events',
    sort_order: String(nextSortOrder),
    status: 'draft',
  };
}

function extractStorageTarget(fileUrl: string) {
  const marker = '/storage/v1/object/public/';
  const index = fileUrl.indexOf(marker);
  if (index === -1) return null;

  const rest = fileUrl.slice(index + marker.length);
  const parts = rest.split('/');
  const bucket = parts.shift();
  const path = parts.join('/');

  if (!bucket || !path) return null;

  return { bucket, path };
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

export default function HomeCarouselManager({
  initialRows,
  permissions,
}: {
  initialRows: Row[];
  permissions: ResourcePermissionState;
}) {
  const router = useRouter();
  const supabase = createClient();
  const toast = useToast();
  const [rows, setRows] = useState<Row[]>(() => sortRows(initialRows));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [values, setValues] = useState<FormValues>(() => createEmptyValues(getNextSortOrder(sortRows(initialRows))));
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  useErrorToast(error);

  useEffect(() => {
    setRows(sortRows(initialRows));
  }, [initialRows]);

  useEffect(() => {
    if (!imageFile) {
      setImagePreviewUrl('');
      return;
    }

    const objectUrl = URL.createObjectURL(imageFile);
    setImagePreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [imageFile]);

  const publishedCount = useMemo(
    () => rows.filter((row) => row.status === 'published').length,
    [rows]
  );
  const canCreate = permissions.create;
  const canUpdate = permissions.update;
  const canDelete = permissions.delete;
  const canPublish = permissions.publish;
  const readOnly = !canCreate && !canUpdate;
  const formLocked = selectedId ? !canUpdate : !canCreate;

  const previewUrl = imagePreviewUrl || values.image_url.trim();

  function startCreate(nextSortOrder = getNextSortOrder(rows)) {
    setSelectedId(null);
    setValues(createEmptyValues(nextSortOrder));
    setImageFile(null);
    setError('');
  }

  function startEdit(row: Row) {
    setSelectedId(row.id);
    setValues({
      title: row.title,
      subtitle: row.subtitle,
      image_url: row.image_url,
      cta_label: row.cta_label,
      target: row.target,
      sort_order: String(row.sort_order),
      status: row.status,
    });
    setImageFile(null);
    setError('');
  }

  function setField<K extends keyof FormValues>(field: K, value: FormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  async function uploadImage(file: File) {
    const validation = validateUploadFile(file);
    if (!validation.success) throw new Error(validation.error);
    if (validation.fileType !== 'image') throw new Error('يُسمح فقط بملفات الصور لهذا الحقل.');

    const formData = new FormData();
    formData.set('bucket', HOME_CAROUSEL_BUCKET);
    formData.set('folder', 'slides');
    formData.set('file', file);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    const result = (await response.json().catch(() => null)) as
      | { error?: string; url?: string }
      | null;

    if (!response.ok || !result?.url) {
      throw new Error(result?.error ?? 'فشل رفع صورة الشريحة.');
    }

    return result.url;
  }

  async function removeStoredImage(fileUrl: string) {
    const target = extractStorageTarget(fileUrl);
    if (!target || target.bucket !== HOME_CAROUSEL_BUCKET) return;

    await supabase.storage.from(target.bucket).remove([target.path]);
  }

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;

    if (!file) {
      setImageFile(null);
      return;
    }

    const validation = validateUploadFile(file);
    if (!validation.success) {
      setError(validation.error);
      event.target.value = '';
      setImageFile(null);
      return;
    }

    if (validation.fileType !== 'image') {
      setError('يُسمح فقط بملفات الصور لهذا الحقل.');
      event.target.value = '';
      setImageFile(null);
      return;
    }

    setError('');
    setImageFile(file);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    const validation = homeCarouselSlideSchema.safeParse({
      title: values.title.trim(),
      subtitle: values.subtitle.trim(),
      image_url: values.image_url.trim(),
      cta_label: values.cta_label.trim(),
      target: values.target,
      sort_order: values.sort_order,
      status: values.status,
    });

    if (!validation.success) {
      setError(getFirstZodError(validation.error));
      return;
    }

    setSaving(true);

    try {
      const parsed = validation.data;
      const previousRow = rows.find((row) => row.id === selectedId) ?? null;
      let imageUrl = parsed.image_url.trim();

      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      if (!imageUrl) {
        throw new Error('المرجو إدخال رابط صورة أو رفع صورة للشريحة.');
      }

      const payload = {
        title: parsed.title,
        subtitle: parsed.subtitle,
        image_url: imageUrl,
        cta_label: parsed.cta_label,
        target: parsed.target,
        sort_order: parsed.sort_order,
        status: parsed.status,
      };

      if (selectedId) {
        const { error: updateError } = await supabase
          .from('home_carousel_slides')
          .update(payload)
          .eq('id', selectedId);

        if (updateError) {
          throw new Error(updateError.message);
        }

        const updatedRow: Row = {
          ...payload,
          id: selectedId,
          created_at: previousRow?.created_at ?? new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        const nextRows = sortRows(
          rows.map((row) => (row.id === selectedId ? updatedRow : row))
        );

        setRows(nextRows);
        startEdit(updatedRow);

        if (imageFile && previousRow && previousRow.image_url !== imageUrl) {
          void removeStoredImage(previousRow.image_url);
        }

        toast.success('تم تحديث الشريحة بنجاح.');
      } else {
        const { data, error: insertError } = await supabase
          .from('home_carousel_slides')
          .insert(payload)
          .select('id, title, subtitle, image_url, cta_label, target, sort_order, status, created_at, updated_at')
          .single();

        if (insertError || !data) {
          throw new Error(insertError?.message ?? 'تعذر إنشاء الشريحة.');
        }

        const nextRows = sortRows([...rows, data as Row]);
        setRows(nextRows);
        startCreate(getNextSortOrder(nextRows));
        toast.success('تمت إضافة الشريحة بنجاح.');
      }

      router.refresh();
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(row: Row) {
    if (!window.confirm('حذف هذه الشريحة من الكاروسيل؟')) return;

    setDeletingId(row.id);
    setError('');

    try {
      const { error: deleteError } = await supabase
        .from('home_carousel_slides')
        .delete()
        .eq('id', row.id);

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      const nextRows = sortRows(rows.filter((item) => item.id !== row.id));
      setRows(nextRows);

      if (selectedId === row.id) {
        startCreate(getNextSortOrder(nextRows));
      }

      void removeStoredImage(row.image_url);

      toast.success('تم حذف الشريحة بنجاح.');
      router.refresh();
    } catch (deleteError) {
      setError(getErrorMessage(deleteError));
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSeedDefaults() {
    setSaving(true);
    setError('');

    try {
      const payload = DEFAULT_HOME_CAROUSEL_SLIDE_INPUTS.map((slide) => ({
        title: slide.title,
        subtitle: slide.subtitle,
        image_url: slide.imageUrl,
        cta_label: slide.ctaLabel,
        target: slide.target,
        sort_order: slide.sortOrder,
        status: slide.status,
      }));

      const { data, error: insertError } = await supabase
        .from('home_carousel_slides')
        .insert(payload)
        .select('id, title, subtitle, image_url, cta_label, target, sort_order, status, created_at, updated_at')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (insertError) {
        throw new Error(insertError.message);
      }

      const nextRows = sortRows((data ?? []) as Row[]);
      setRows(nextRows);

      if (nextRows[0]) {
        startEdit(nextRows[0]);
      }

      toast.success('تمت إضافة الشرائح الافتراضية.');
      router.refresh();
    } catch (seedError) {
      setError(getErrorMessage(seedError));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="md-card-outlined p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="md-title-large" style={{ color: 'var(--md-on-surface)' }}>
              تخصيص كاروسيل الصفحة الرئيسية
            </h2>
            <p className="md-body-small mt-2 max-w-3xl" style={{ color: 'var(--md-on-surface-variant)' }}>
              أضف الشرائح، غيّر ترتيبها، حدّد الزر والوجهة، وارفع صوراً مباشرة إلى Supabase Storage.
              الصفحة الرئيسية تعرض فقط الشرائح المنشورة الموجودة في قاعدة البيانات.
            </p>
          </div>
          {canCreate ? (
            <button
              type="button"
              onClick={() => startCreate()}
              className="md-btn md-btn-filled md-state"
            >
              <Plus size={18} />
              شريحة جديدة
            </button>
          ) : null}
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <span
            className="rounded-full px-3 py-1.5 md-label-small"
            style={{ background: 'var(--md-secondary-container)', color: 'var(--md-on-secondary-container)' }}
          >
            إجمالي الشرائح: {rows.length}
          </span>
          <span
            className="rounded-full px-3 py-1.5 md-label-small"
            style={{
              background: publishedCount > 0 ? 'var(--md-primary-container)' : 'var(--md-surface-container-highest)',
              color: publishedCount > 0 ? 'var(--md-on-primary-container)' : 'var(--md-on-surface-variant)',
            }}
          >
            الشرائح المنشورة: {publishedCount}
          </span>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]">
        <section className="md-card-outlined p-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="md-title-medium" style={{ color: 'var(--md-on-surface)' }}>
                الشرائح الحالية
              </h3>
              <p className="md-body-small mt-1" style={{ color: 'var(--md-on-surface-variant)' }}>
            {readOnly ? 'يمكنك استعراض الشرائح الحالية فقط.' : 'اضغط على أي شريحة لتعديلها أو حذفها.'}
              </p>
            </div>
          </div>

          {rows.length === 0 ? (
            <div className="space-y-4">
              <div
                className="rounded-[var(--md-shape-xl)] border border-dashed px-5 py-8 text-center"
                style={{ borderColor: 'var(--md-outline-variant)', color: 'var(--md-on-surface-variant)' }}
              >
                <p className="md-body-medium">لا توجد شرائح محفوظة بعد.</p>
                <p className="md-body-small mt-2">
                  يمكنك إضافة الشرائح الافتراضية إلى قاعدة البيانات أو إنشاء شرائحك الخاصة من النموذج المجاور.
                </p>
                <div className="mt-4 flex justify-center">
                  {canCreate ? (
                    <button
                      type="button"
                      onClick={() => void handleSeedDefaults()}
                      disabled={saving}
                      className="md-btn md-btn-filled md-state disabled:opacity-50"
                    >
                      <Plus size={18} />
                      {saving ? 'جاري الإضافة...' : 'إضافة الشرائح الافتراضية'}
                    </button>
                  ) : null}
                </div>
                <p className="md-body-small mt-3 text-center" style={{ color: 'var(--md-on-surface-variant)' }}>
                  بعد إضافتها ستظهر هنا كشرائح عادية ويمكن حذفها بزر الحذف.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {rows.map((row) => {
                const active = row.id === selectedId;
                const targetLabel = targetOptions.find((option) => option.value === row.target)?.label ?? row.target;
                const isPublished = row.status === 'published';
                const canEditRow = canUpdate && (!isPublished || canPublish);

                return (
                  <div
                    key={row.id}
                    className="rounded-[var(--md-shape-xl)] border p-4 transition-colors"
                    style={{
                      background: active ? 'var(--md-secondary-container)' : 'var(--md-surface-container-low)',
                      borderColor: active ? 'var(--md-primary)' : 'var(--md-outline-variant)',
                    }}
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start">
                      <button
                        type="button"
                        onClick={() => startEdit(row)}
                        disabled={!canEditRow}
                        className="flex min-w-0 flex-1 items-start gap-4 text-right disabled:cursor-default disabled:opacity-70"
                      >
                        <div
                          className="h-20 w-28 shrink-0 overflow-hidden rounded-[var(--md-shape-l)]"
                          style={{ background: 'var(--md-surface-container)' }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={row.image_url} alt={row.title} className="h-full w-full object-cover" />
                        </div>
                        <div className="min-w-0 space-y-2">
                          <div className="flex flex-wrap gap-2">
                            <span
                              className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                              style={{
                                background: isPublished ? 'var(--md-primary-container)' : 'var(--md-surface-container-highest)',
                                color: isPublished ? 'var(--md-on-primary-container)' : 'var(--md-on-surface-variant)',
                              }}
                            >
                              {isPublished ? 'منشور' : 'مسودة'}
                            </span>
                            <span
                              className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                              style={{ background: 'var(--md-tertiary-container)', color: 'var(--md-on-tertiary-container)' }}
                            >
                              {targetLabel}
                            </span>
                            <span
                              className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                              style={{ background: 'var(--md-surface-container-highest)', color: 'var(--md-on-surface-variant)' }}
                            >
                              ترتيب {row.sort_order}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="md-title-small truncate" style={{ color: 'var(--md-on-surface)' }}>
                              {row.title}
                            </p>
                            <p
                              className="md-body-small mt-1 line-clamp-2"
                              style={{ color: active ? 'var(--md-on-secondary-container)' : 'var(--md-on-surface-variant)' }}
                            >
                              {row.subtitle}
                            </p>
                          </div>
                        </div>
                      </button>

                      <div className="flex shrink-0 gap-2">
                        {canEditRow ? (
                          <button
                            type="button"
                            onClick={() => startEdit(row)}
                            className="md-btn md-btn-tonal md-state"
                            style={{ height: 36, padding: '0 14px', fontSize: 13 }}
                          >
                            تعديل
                          </button>
                        ) : null}
                        {canDelete ? (
                          <button
                            type="button"
                            onClick={() => void handleDelete(row)}
                            disabled={deletingId === row.id}
                            className="md-btn md-state disabled:opacity-50"
                            style={{
                              height: 36,
                              padding: '0 14px',
                              fontSize: 13,
                              background: 'var(--md-error-container)',
                              color: 'var(--md-on-error-container)',
                              borderRadius: 'var(--md-shape-full)',
                            }}
                          >
                            {deletingId === row.id ? '...' : 'حذف'}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <form onSubmit={handleSubmit} className="md-card-outlined p-6 space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="md-title-medium" style={{ color: 'var(--md-on-surface)' }}>
                {selectedId ? 'تعديل الشريحة' : 'إضافة شريحة'}
              </h3>
              <p className="md-body-small mt-1" style={{ color: 'var(--md-on-surface-variant)' }}>
                {readOnly
                  ? 'هذا الحساب يملك صلاحية العرض فقط لهذه الصفحة.'
                  : !canCreate && !selectedId
                    ? 'اختر شريحة من القائمة لتعديلها. لا يمكن لهذا الحساب إنشاء شرائح جديدة.'
                  : 'يمكنك إدخال رابط صورة خارجي أو رفع صورة مباشرة إلى Supabase.'}
              </p>
            </div>
            {selectedId && canCreate ? (
              <button
                type="button"
                onClick={() => startCreate()}
                className="md-btn md-btn-outlined md-state"
              >
                شريحة جديدة
              </button>
            ) : null}
          </div>

          <div
            className="overflow-hidden rounded-[var(--md-shape-xl)] border"
            style={{
              background: 'var(--md-surface-container-low)',
              borderColor: 'var(--md-outline-variant)',
            }}
          >
            {previewUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={previewUrl} alt={values.title || 'Preview'} className="h-56 w-full object-cover" />
            ) : (
              <div className="flex h-56 items-center justify-center gap-3" style={{ color: 'var(--md-on-surface-variant)' }}>
                <ImageIcon size={22} />
                <span className="md-body-medium">معاينة الصورة ستظهر هنا</span>
              </div>
            )}
          </div>

          <div className="grid gap-5">
            <Field label="العنوان">
              <input
                value={values.title}
                onChange={(event) => setField('title', event.target.value)}
                placeholder="أدخل عنوان الشريحة"
                className={inputCls}
                style={inputStyle}
                disabled={formLocked}
                onFocus={(event) => (event.target.style.borderColor = 'var(--md-primary)')}
                onBlur={(event) => (event.target.style.borderColor = 'var(--md-outline)')}
                required
              />
            </Field>

            <Field label="الوصف المختصر">
              <textarea
                value={values.subtitle}
                onChange={(event) => setField('subtitle', event.target.value)}
                placeholder="أدخل وصفاً يظهر تحت العنوان"
                className="w-full min-h-28 md-body-medium px-4 py-3 rounded-[var(--md-shape-s)] border outline-none transition-colors resize-y"
                style={inputStyle}
                disabled={formLocked}
                onFocus={(event) => (event.target.style.borderColor = 'var(--md-primary)')}
                onBlur={(event) => (event.target.style.borderColor = 'var(--md-outline)')}
                required
              />
            </Field>

            <Field label="رابط الصورة">
              <input
                value={values.image_url}
                onChange={(event) => setField('image_url', event.target.value)}
                placeholder="https://..."
                className={inputCls}
                style={inputStyle}
                disabled={formLocked}
                onFocus={(event) => (event.target.style.borderColor = 'var(--md-primary)')}
                onBlur={(event) => (event.target.style.borderColor = 'var(--md-outline)')}
              />
            </Field>

            <Field label="رفع صورة جديدة">
              <div className="space-y-3">
                <label
                  className={`flex items-center justify-center gap-3 rounded-[var(--md-shape-xl)] border border-dashed px-4 py-5 text-center ${
                    formLocked ? 'cursor-default opacity-70' : 'cursor-pointer'
                  }`}
                  style={{
                    background: 'var(--md-surface-container-low)',
                    borderColor: 'var(--md-outline-variant)',
                    color: 'var(--md-on-surface-variant)',
                  }}
                >
                  <Upload size={18} />
                  <span className="md-body-medium">
                    {imageFile ? imageFile.name : 'اختر صورة من جهازك'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    disabled={formLocked}
                  />
                </label>

                {imageFile && !formLocked ? (
                  <button
                    type="button"
                    onClick={() => setImageFile(null)}
                    className="md-btn md-btn-text md-state"
                    style={{ color: 'var(--md-error)' }}
                  >
                    <X size={16} />
                    إزالة الصورة الجديدة
                  </button>
                ) : null}
              </div>
            </Field>

            <div className="grid gap-5 md:grid-cols-2">
              <Field label="نص الزر">
                <input
                  value={values.cta_label}
                  onChange={(event) => setField('cta_label', event.target.value)}
                  placeholder="مثال: استكشف الفعاليات"
                  className={inputCls}
                  style={inputStyle}
                  disabled={formLocked}
                  onFocus={(event) => (event.target.style.borderColor = 'var(--md-primary)')}
                  onBlur={(event) => (event.target.style.borderColor = 'var(--md-outline)')}
                  required
                />
              </Field>

              <Field label="الوجهة">
                <select
                  value={values.target}
                  onChange={(event) => setField('target', event.target.value as HomeCarouselTarget)}
                  className={inputCls}
                  style={inputStyle}
                  disabled={formLocked}
                  onFocus={(event) => (event.target.style.borderColor = 'var(--md-primary)')}
                  onBlur={(event) => (event.target.style.borderColor = 'var(--md-outline)')}
                >
                  {targetOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <Field label="الترتيب">
                <input
                  type="number"
                  min={1}
                  value={values.sort_order}
                  onChange={(event) => setField('sort_order', event.target.value)}
                  className={inputCls}
                  style={inputStyle}
                  disabled={formLocked}
                  onFocus={(event) => (event.target.style.borderColor = 'var(--md-primary)')}
                  onBlur={(event) => (event.target.style.borderColor = 'var(--md-outline)')}
                  required
                />
              </Field>

              <Field label="الحالة">
                <select
                  value={values.status}
                  onChange={(event) => setField('status', event.target.value as ContentStatus)}
                  className={inputCls}
                  style={inputStyle}
                  disabled={formLocked}
                  onFocus={(event) => (event.target.style.borderColor = 'var(--md-primary)')}
                  onBlur={(event) => (event.target.style.borderColor = 'var(--md-outline)')}
                >
                  <option value="draft">مسودة</option>
                  {canPublish ? <option value="published">منشور</option> : null}
                </select>
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

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="submit"
              disabled={saving || formLocked}
              className="md-btn md-btn-filled md-state disabled:opacity-50"
            >
              {saving ? 'جاري الحفظ...' : selectedId ? 'حفظ التعديلات' : 'إضافة الشريحة'}
            </button>
            <button
              type="button"
              onClick={() => startCreate()}
              disabled={!canCreate}
              className="md-btn md-btn-outlined md-state"
            >
              إعادة تعيين
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
