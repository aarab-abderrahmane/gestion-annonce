"use client";

import { ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useErrorToast } from '@/components/ui/useErrorToast';
import { ANNOUNCEMENTS_BUCKET } from '@/lib/storage';
import {
  announcementSchema,
  getFirstZodError,
  validateUploadFile,
} from '@/lib/validations';

type Division = { id: string; name: string; slug: string };
type Group = { id: string; name: string; slug: string; division_id: string };
type Category = { id: string; name: string; slug: string };
type ExistingFile = { id?: string; file_url: string; file_name: string | null; file_type: 'pdf' | 'image' };
type PreviewFile = ExistingFile & { previewKey: string; badge: string; metaLabel: string };

type InitialValues = {
  title: string;
  slug: string;
  description: string;
  division_id: string;
  group_id: string;
  category_ids: string[];
  expires_at: string;
  status: 'draft' | 'published';
  files?: ExistingFile[];
};

type Props = {
  mode: 'create' | 'edit';
  divisions: Division[];
  groups: Group[];
  categories: Category[];
  initialValues: InitialValues;
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

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function revokePreviewUrls(files: PreviewFile[]) {
  files.forEach((file) => {
    if (file.file_url.startsWith('blob:')) {
      URL.revokeObjectURL(file.file_url);
    }
  });
}

function AttachmentPreviewGrid({
  title,
  helperText,
  files,
}: {
  title: string;
  helperText?: string;
  files: PreviewFile[];
}) {
  if (files.length === 0) return null;

  return (
    <div className="mt-4 space-y-3">
      <div>
        <p className="text-sm font-semibold text-[#38515a]">{title}</p>
        {helperText ? <p className="text-xs text-[#6d7f82]">{helperText}</p> : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {files.map((file) => (
          <div key={file.previewKey} className="overflow-hidden rounded-[28px] border border-[#d9cdbb] bg-white shadow-sm">
            <div className="h-44 overflow-hidden border-b border-[#efe5d6] bg-[#faf5eb]">
              {file.file_type === 'image' ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={file.file_url}
                  alt={file.file_name || 'Announcement attachment preview'}
                  className="h-full w-full object-cover"
                />
              ) : (
                <iframe
                  src={file.file_url}
                  title={file.file_name || 'PDF preview'}
                  className="h-full w-full"
                />
              )}
            </div>

            <div className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="min-w-0 break-all text-sm font-semibold text-[#38515a]">
                  {file.file_name || 'File'}
                </p>
                <span className="shrink-0 rounded-full bg-[#ece4d7] px-3 py-1 text-[11px] font-semibold text-[#38515a]">
                  {file.badge}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 text-xs text-[#6d7f82]">
                <span>{file.metaLabel}</span>
                <a
                  href={file.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-[#123c3a]"
                >
                  Preview
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AnnouncementForm({ mode, divisions, groups, categories, initialValues, id }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [values, setValues] = useState<InitialValues>(initialValues);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedFilePreviews, setSelectedFilePreviews] = useState<PreviewFile[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useErrorToast(error);

  const availableGroups = useMemo(() => {
    return groups.filter((group) => group.division_id === values.division_id);
  }, [groups, values.division_id]);

  useEffect(() => {
    if (mode === 'create') {
      setValues((current) => ({ ...current, slug: slugify(current.title) }));
    }
  }, [mode, values.title]);

  useEffect(() => {
    if (!values.division_id) return;
    if (availableGroups.some((group) => group.id === values.group_id)) return;
    setValues((current) => ({ ...current, group_id: '' }));
  }, [availableGroups, values.division_id, values.group_id]);

  useEffect(() => {
    return () => {
      revokePreviewUrls(selectedFilePreviews);
    };
  }, [selectedFilePreviews]);

  const existingFilePreviews = useMemo<PreviewFile[]>(() => {
    return (values.files ?? []).map((file) => ({
      ...file,
      previewKey: `existing-${file.id ?? file.file_url}`,
      badge: 'Uploaded',
      metaLabel: file.file_type === 'image' ? 'Image' : 'PDF',
    }));
  }, [values.files]);

  function handleFilesChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    const validFiles: Array<{ file: File; fileType: 'pdf' | 'image' }> = [];

    for (const file of files) {
      const validation = validateUploadFile(file);
      if (!validation.success) {
        setError(validation.error);
        event.target.value = '';
        setSelectedFiles([]);
        setSelectedFilePreviews((current) => {
          revokePreviewUrls(current);
          return [];
        });
        return;
      }

      validFiles.push({ file, fileType: validation.fileType });
    }

    const nextPreviews = validFiles.map(({ file, fileType }, index) => ({
      previewKey: `selected-${file.name}-${file.lastModified}-${index}`,
      file_url: URL.createObjectURL(file),
      file_name: file.name,
      file_type: fileType,
      badge: 'Selected',
      metaLabel: `${fileType === 'image' ? 'Image' : 'PDF'} · ${formatFileSize(file.size)}`,
    }));

    setError('');
    setSelectedFiles(files);
    setSelectedFilePreviews((current) => {
      revokePreviewUrls(current);
      return nextPreviews;
    });
  }

  function toggleCategory(categoryId: string) {
    setValues((current) => ({
      ...current,
      category_ids: current.category_ids.includes(categoryId)
        ? current.category_ids.filter((id) => id !== categoryId)
        : [...current.category_ids, categoryId],
    }));
  }

  async function uploadFiles(announcementId: string) {
    const uploaded = [] as Array<{ announcement_id: string; file_url: string; file_name: string; file_type: 'pdf' | 'image' }>;

    for (const file of selectedFiles) {
      const validation = validateUploadFile(file);
      if (!validation.success) {
        throw new Error(validation.error);
      }

      const formData = new FormData();
      formData.set('bucket', ANNOUNCEMENTS_BUCKET);
      formData.set('folder', announcementId);
      formData.set('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const result = (await response.json().catch(() => null)) as
        | { error?: string; url?: string }
        | null;

      if (!response.ok || !result?.url) {
        throw new Error(result?.error ?? 'فشل رفع الملف.');
      }

      uploaded.push({
        announcement_id: announcementId,
        file_url: result.url,
        file_name: file.name,
        file_type: validation.fileType,
      });
    }

    if (uploaded.length > 0) {
      const { error: filesError } = await supabase.from('announcement_files').insert(uploaded);
      if (filesError) {
        throw new Error(filesError.message);
      }
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    const title = values.title.trim();
    const slug = mode === 'create' ? slugify(title) : values.slug || slugify(title);
    const validation = announcementSchema.safeParse({
      title,
      slug,
      description: values.description.trim(),
      division_id: values.division_id,
      group_id: values.group_id,
      category_ids: values.category_ids,
      expires_at: values.expires_at,
      status: values.status,
      files: values.files ?? [],
    });

    if (!validation.success) {
      setError(getFirstZodError(validation.error));
      return;
    }

    setSaving(true);

    try {
      const parsed = validation.data;
      const payload = {
        title: parsed.title,
        slug,
        description: parsed.description,
        division_id: parsed.division_id,
        group_id: parsed.group_id || null,
        expires_at: parsed.expires_at ? new Date(parsed.expires_at).toISOString() : null,
        status: parsed.status,
      };

      let announcementId = id;

      if (mode === 'create') {
        const { data, error: insertError } = await supabase.from('announcements').insert(payload).select('id').single();
        if (insertError || !data) {
          throw new Error(insertError?.message ?? 'Failed to create announcement');
        }
        announcementId = data.id;
      } else {
        const { error: updateError } = await supabase.from('announcements').update(payload).eq('id', id);
        if (updateError) {
          throw new Error(updateError.message);
        }
      }

      if (!announcementId) {
        throw new Error('Announcement id is missing');
      }

      const { error: deleteLinksError } = await supabase.from('announcement_category_links').delete().eq('announcement_id', announcementId);
      if (deleteLinksError) {
        throw new Error(deleteLinksError.message);
      }

      if (parsed.category_ids.length > 0) {
        const links = parsed.category_ids.map((categoryId) => ({
          announcement_id: announcementId,
          category_id: categoryId,
        }));
        const { error: linksError } = await supabase.from('announcement_category_links').insert(links);
        if (linksError) {
          throw new Error(linksError.message);
        }
      }

      await uploadFiles(announcementId);

      router.push('/dashboard/announcements');
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unexpected error');
      setSaving(false);
      return;
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-[32px] border border-[#d9cdbb] bg-[#fffdf8] p-6 shadow-sm">
      <div className="grid gap-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <label htmlFor="title" className="mb-2 block text-sm font-semibold text-[#38515a]">Title</label>
          <input id="title" value={values.title} onChange={(event) => setValues({ ...values, title: event.target.value })} placeholder="أدخل عنوان الإعلان" className="w-full rounded-2xl border border-[#d9cdbb] px-4 py-3" required />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="description" className="mb-2 block text-sm font-semibold text-[#38515a]">Description</label>
          <textarea id="description" value={values.description} onChange={(event) => setValues({ ...values, description: event.target.value })} placeholder="أدخل وصف الإعلان" rows={6} className="w-full rounded-2xl border border-[#d9cdbb] px-4 py-3" required />
        </div>

        <div>
          <label htmlFor="division" className="mb-2 block text-sm font-semibold text-[#38515a]">Division</label>
          <select id="division" value={values.division_id} onChange={(event) => setValues({ ...values, division_id: event.target.value })} className="w-full rounded-2xl border border-[#d9cdbb] px-4 py-3" required>
            <option value="">Select division</option>
            {divisions.map((division) => (
              <option key={division.id} value={division.id}>{division.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="group" className="mb-2 block text-sm font-semibold text-[#38515a]">Group</label>
          <select id="group" value={values.group_id} onChange={(event) => setValues({ ...values, group_id: event.target.value })} className="w-full rounded-2xl border border-[#d9cdbb] px-4 py-3">
            <option value="">Select group</option>
            {availableGroups.map((group) => (
              <option key={group.id} value={group.id}>{group.name}</option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <span className="mb-3 block text-sm font-semibold text-[#38515a]">Categories</span>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <label key={category.id} className="flex items-center gap-3 rounded-2xl border border-[#d9cdbb] bg-[#faf5eb] px-4 py-3 text-sm text-[#38515a]">
                <input type="checkbox" checked={values.category_ids.includes(category.id)} onChange={() => toggleCategory(category.id)} />
                <span>{category.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="expires_at" className="mb-2 block text-sm font-semibold text-[#38515a]">Expires at</label>
          <input id="expires_at" type="date" value={values.expires_at} onChange={(event) => setValues({ ...values, expires_at: event.target.value })} className="w-full rounded-2xl border border-[#d9cdbb] px-4 py-3" />
        </div>

        <div>
          <label htmlFor="status" className="mb-2 block text-sm font-semibold text-[#38515a]">Status</label>
          <select id="status" value={values.status} onChange={(event) => setValues({ ...values, status: event.target.value as InitialValues['status'] })} className="w-full rounded-2xl border border-[#d9cdbb] px-4 py-3">
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label htmlFor="files" className="mb-2 block text-sm font-semibold text-[#38515a]">File upload</label>
          <input id="files" type="file" multiple accept="application/pdf,image/*" onChange={handleFilesChange} className="w-full rounded-2xl border border-[#d9cdbb] px-4 py-3" />
          <AttachmentPreviewGrid
            title="Selected files preview"
            helperText="These files will be uploaded after you save the announcement."
            files={selectedFilePreviews}
          />
          <AttachmentPreviewGrid
            title="Current attachments"
            helperText="These files are already attached to this announcement."
            files={existingFilePreviews}
          />
        </div>

        <div className="md:col-span-2 rounded-2xl border border-dashed border-[#d9cdbb] bg-[#faf5eb] px-4 py-3 text-sm text-[#6d7f82]">
          <span className="font-semibold text-[#38515a]">Slug:</span>{' '}
          {mode === 'create' ? values.slug || 'Will be generated automatically from the title' : values.slug}
        </div>
      </div>

      {error ? <p className="rounded-2xl bg-[#ffe2dd] px-4 py-3 text-sm font-semibold text-[#8a1f13]">{error}</p> : null}

      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={saving} className="rounded-2xl bg-[#123c3a] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">
          {saving ? 'Saving...' : 'Save'}
        </button>
        <Link href="/dashboard/announcements" className="rounded-2xl bg-[#ece4d7] px-5 py-3 text-sm font-semibold text-[#38515a]">Cancel</Link>
      </div>
    </form>
  );
}
