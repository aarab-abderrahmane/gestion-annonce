"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getStorageErrorMessage, STORAGE_BUCKET } from '@/lib/storage';

type Division = { id: string; name: string; slug: string };
type Group = { id: string; name: string; slug: string; division_id: string };
type Category = { id: string; name: string; slug: string };
type ExistingFile = { id?: string; file_url: string; file_name: string | null; file_type: 'pdf' | 'image' };

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

function getFileType(file: File): 'pdf' | 'image' | null {
  if (file.type === 'application/pdf') return 'pdf';
  if (file.type.startsWith('image/')) return 'image';
  return null;
}

export default function AnnouncementForm({ mode, divisions, groups, categories, initialValues, id }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [values, setValues] = useState<InitialValues>(initialValues);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

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

  function handleFilesChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).filter((file) => getFileType(file));
    setSelectedFiles(files);
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
      const fileType = getFileType(file);
      if (!fileType) continue;
      const extension = file.name.includes('.') ? file.name.split('.').pop() : '';
      const path = `${announcementId}/${Date.now()}-${Math.random().toString(36).slice(2)}${extension ? `.${extension}` : ''}`;

      const { error: uploadError } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });

      if (uploadError) {
        throw new Error(getStorageErrorMessage(uploadError.message));
      }

      const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
      uploaded.push({
        announcement_id: announcementId,
        file_url: data.publicUrl,
        file_name: file.name,
        file_type: fileType,
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

    if (!title || !slug || !values.description.trim() || !values.division_id || !values.status) {
      setError('Tous les champs obligatoires doivent être remplis.');
      return;
    }

    setSaving(true);

    try {
      const payload = {
        title,
        slug,
        description: values.description.trim(),
        division_id: values.division_id,
        group_id: values.group_id || null,
        expires_at: values.expires_at ? new Date(values.expires_at).toISOString() : null,
        status: values.status,
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

      if (values.category_ids.length > 0) {
        const links = values.category_ids.map((categoryId) => ({
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
          {(values.files?.length ?? 0) > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {values.files?.map((file) => (
                <a key={file.id ?? file.file_url} href={file.file_url} target="_blank" rel="noreferrer" className="rounded-full bg-[#ece4d7] px-3 py-1 text-xs font-semibold text-[#38515a]">{file.file_name || 'File'}</a>
              ))}
            </div>
          ) : null}
          {selectedFiles.length > 0 ? (
            <p className="mt-2 text-sm text-[#6d7f82]">{selectedFiles.length} file(s) selected</p>
          ) : null}
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
