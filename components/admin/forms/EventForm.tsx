"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useErrorToast } from '@/components/ui/useErrorToast';
import { EVENTS_BUCKET } from '@/lib/storage';
import {
  eventSchema,
  getFirstZodError,
  validateUploadFile,
} from '@/lib/validations';

type Category = { id: string; name: string; slug: string };
type EventPerson = { name: string; role: string; type: 'participant' | 'organizer' };
type ExistingPhoto = { id?: string; photo_url: string };

type InitialValues = {
  title: string;
  slug: string;
  description: string;
  location: string;
  starts_at: string;
  ends_at: string;
  total_attendees: number;
  status: 'draft' | 'published';
  category_ids: string[];
  people: EventPerson[];
  cover_image: string;
  photos: ExistingPhoto[];
};

type Props = {
  mode: 'create' | 'edit';
  categories: Category[];
  initialValues: InitialValues;
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

export default function EventForm({ mode, categories, initialValues, canPublish, id }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [values, setValues] = useState<InitialValues>(initialValues);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useErrorToast(error);

  useEffect(() => {
    if (mode === 'create') {
      setValues((current) => ({ ...current, slug: slugify(current.title) }));
    }
  }, [mode, values.title]);

  function toggleCategory(categoryId: string) {
    setValues((current) => ({
      ...current,
      category_ids: current.category_ids.includes(categoryId)
        ? current.category_ids.filter((id) => id !== categoryId)
        : [...current.category_ids, categoryId],
    }));
  }

  function updatePerson(index: number, field: keyof EventPerson, value: string) {
    setValues((current) => ({
      ...current,
      people: current.people.map((person, personIndex) =>
        personIndex === index ? { ...person, [field]: value } : person
      ),
    }));
  }

  function addPerson() {
    setValues((current) => ({
      ...current,
      people: [...current.people, { name: '', role: '', type: 'participant' }],
    }));
  }

  function removePerson(index: number) {
    setValues((current) => ({
      ...current,
      people: current.people.filter((_, personIndex) => personIndex !== index),
    }));
  }

  function handleCoverChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;

    if (!file) {
      setCoverImageFile(null);
      return;
    }

    const validation = validateUploadFile(file);
    if (!validation.success) {
      setError(validation.error);
      event.target.value = '';
      setCoverImageFile(null);
      return;
    }

    if (validation.fileType !== 'image') {
      setError('يُسمح فقط بملفات الصور لهذا الحقل.');
      event.target.value = '';
      setCoverImageFile(null);
      return;
    }

    setError('');
    setCoverImageFile(file);
  }

  function handlePhotosChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);

    for (const file of files) {
      const validation = validateUploadFile(file);
      if (!validation.success) {
        setError(validation.error);
        event.target.value = '';
        setPhotoFiles([]);
        return;
      }

      if (validation.fileType !== 'image') {
        setError('يُسمح فقط بملفات الصور لهذا الحقل.');
        event.target.value = '';
        setPhotoFiles([]);
        return;
      }
    }

    setError('');
    setPhotoFiles(files);
  }

  async function uploadImage(eventId: string, file: File, folder: string) {
    const validation = validateUploadFile(file);
    if (!validation.success) throw new Error(validation.error);
    if (validation.fileType !== 'image') {
      throw new Error('يُسمح فقط بملفات الصور لهذا الحقل.');
    }

    const formData = new FormData();
    formData.set('bucket', EVENTS_BUCKET);
    formData.set('folder', `${folder}/${eventId}`);
    formData.set('file', file);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    const result = (await response.json().catch(() => null)) as
      | { error?: string; url?: string }
      | null;

    if (!response.ok || !result?.url) {
      throw new Error(result?.error ?? 'فشل رفع الصورة.');
    }

    return result.url;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    const title = values.title.trim();
    const slug = mode === 'create' ? slugify(title) : values.slug || slugify(title);
    const validation = eventSchema.safeParse({
      title,
      slug,
      description: values.description.trim(),
      location: values.location.trim(),
      starts_at: values.starts_at,
      ends_at: values.ends_at,
      total_attendees: Number(values.total_attendees) || 0,
      status: values.status,
      category_ids: values.category_ids,
      people: values.people,
      cover_image: values.cover_image || '',
      photos: values.photos ?? [],
    });

    if (!validation.success) {
      setError(getFirstZodError(validation.error));
      return;
    }

    setSaving(true);
    let createdEventId: string | null = null;

    try {
      const parsed = validation.data;
      const validPeople = parsed.people.filter((person) => person.name.trim() && person.role.trim());
      let coverImageUrl = parsed.cover_image || null;
      let eventId = id;

      const payloadBase = {
        title: parsed.title,
        slug,
        description: parsed.description,
        location: parsed.location,
        starts_at: new Date(parsed.starts_at).toISOString(),
        ends_at: new Date(parsed.ends_at).toISOString(),
        total_attendees: parsed.total_attendees,
        status: parsed.status,
      };

      if (mode === 'create') {
        const { data, error: insertError } = await supabase.from('events').insert({ ...payloadBase, cover_image: coverImageUrl }).select('id').single();
        if (insertError || !data) throw new Error(insertError?.message ?? 'Failed to create event');
        eventId = data.id;
        createdEventId = data.id;
      } else {
        const { error: updateError } = await supabase.from('events').update({ ...payloadBase, cover_image: coverImageUrl }).eq('id', id);
        if (updateError) throw new Error(updateError.message);
      }

      if (!eventId) throw new Error('Event id is missing');

      if (coverImageFile) {
        coverImageUrl = await uploadImage(eventId, coverImageFile, 'events/covers');
        const { error: coverError } = await supabase.from('events').update({ cover_image: coverImageUrl }).eq('id', eventId);
        if (coverError) throw new Error(coverError.message);
      }

      const { error: deleteCategoryLinksError } = await supabase.from('event_category_links').delete().eq('event_id', eventId);
      if (deleteCategoryLinksError) throw new Error(deleteCategoryLinksError.message);
      if (parsed.category_ids.length > 0) {
        const links = parsed.category_ids.map((categoryId) => ({ event_id: eventId, category_id: categoryId }));
        const { error: categoryLinksError } = await supabase.from('event_category_links').insert(links);
        if (categoryLinksError) throw new Error(categoryLinksError.message);
      }

      const { error: deletePeopleError } = await supabase.from('event_people').delete().eq('event_id', eventId);
      if (deletePeopleError) throw new Error(deletePeopleError.message);
      if (validPeople.length > 0) {
        const { error: peopleError } = await supabase.from('event_people').insert(validPeople.map((person) => ({ ...person, event_id: eventId, name: person.name.trim(), role: person.role.trim() })));
        if (peopleError) throw new Error(peopleError.message);
      }

      if (photoFiles.length > 0) {
        const uploadedPhotos = [] as Array<{ event_id: string; photo_url: string }>;
        for (const file of photoFiles) {
          const photoUrl = await uploadImage(eventId, file, 'events/photos');
          uploadedPhotos.push({ event_id: eventId, photo_url: photoUrl });
        }
        const { error: photosError } = await supabase.from('event_photos').insert(uploadedPhotos);
        if (photosError) throw new Error(photosError.message);
      }

      router.push('/dashboard/events');
      router.refresh();
    } catch (submitError) {
      if (mode === 'create' && createdEventId) {
        const { error: rollbackError } = await supabase.from('events').delete().eq('id', createdEventId);
        if (rollbackError) {
          const rollbackMessage = submitError instanceof Error ? `${submitError.message} | Rollback failed: ${rollbackError.message}` : `Rollback failed: ${rollbackError.message}`;
          setError(rollbackMessage);
          setSaving(false);
          return;
        }
      }

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
          <input id="title" value={values.title} onChange={(event) => setValues({ ...values, title: event.target.value })} placeholder="أدخل عنوان الفعالية" className="w-full rounded-2xl border border-[#d9cdbb] px-4 py-3" required />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="description" className="mb-2 block text-sm font-semibold text-[#38515a]">Description</label>
          <textarea id="description" value={values.description} onChange={(event) => setValues({ ...values, description: event.target.value })} placeholder="أدخل وصف الفعالية" rows={6} className="w-full rounded-2xl border border-[#d9cdbb] px-4 py-3" required />
        </div>

        <div>
          <label htmlFor="location" className="mb-2 block text-sm font-semibold text-[#38515a]">Location</label>
          <input id="location" value={values.location} onChange={(event) => setValues({ ...values, location: event.target.value })} className="w-full rounded-2xl border border-[#d9cdbb] px-4 py-3" required />
        </div>

        <div>
          <label htmlFor="total_attendees" className="mb-2 block text-sm font-semibold text-[#38515a]">Total attendees</label>
          <input id="total_attendees" type="number" min="0" value={values.total_attendees} onChange={(event) => setValues({ ...values, total_attendees: Number(event.target.value) || 0 })} className="w-full rounded-2xl border border-[#d9cdbb] px-4 py-3" />
        </div>

        <div>
          <label htmlFor="starts_at" className="mb-2 block text-sm font-semibold text-[#38515a]">Start date</label>
          <input id="starts_at" type="datetime-local" value={values.starts_at} onChange={(event) => setValues({ ...values, starts_at: event.target.value })} className="w-full rounded-2xl border border-[#d9cdbb] px-4 py-3" required />
        </div>

        <div>
          <label htmlFor="ends_at" className="mb-2 block text-sm font-semibold text-[#38515a]">End date</label>
          <input id="ends_at" type="datetime-local" value={values.ends_at} onChange={(event) => setValues({ ...values, ends_at: event.target.value })} className="w-full rounded-2xl border border-[#d9cdbb] px-4 py-3" required />
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

        <div className="md:col-span-2">
          <label htmlFor="cover_image" className="mb-2 block text-sm font-semibold text-[#38515a]">Cover image upload</label>
          <input id="cover_image" type="file" accept="image/*" onChange={handleCoverChange} className="w-full rounded-2xl border border-[#d9cdbb] px-4 py-3" />
          {values.cover_image ? <a href={values.cover_image} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-semibold text-[#123c3a]">Current cover image</a> : null}
        </div>

        <div className="md:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-[#38515a]">People</span>
            <button type="button" onClick={addPerson} className="rounded-xl bg-[#123c3a] px-3 py-2 text-xs font-semibold text-white">Add more</button>
          </div>
          <div className="space-y-4">
            {values.people.map((person, index) => (
              <div key={`${person.type}-${index}`} className="grid gap-3 rounded-2xl border border-[#d9cdbb] bg-[#faf5eb] p-4 md:grid-cols-[1fr_1fr_180px_auto]">
                <input value={person.name} onChange={(event) => updatePerson(index, 'name', event.target.value)} placeholder="Name" className="rounded-2xl border border-[#d9cdbb] px-4 py-3" />
                <input value={person.role} onChange={(event) => updatePerson(index, 'role', event.target.value)} placeholder="Role" className="rounded-2xl border border-[#d9cdbb] px-4 py-3" />
                <select value={person.type} onChange={(event) => updatePerson(index, 'type', event.target.value)} className="rounded-2xl border border-[#d9cdbb] px-4 py-3">
                  <option value="participant">participant</option>
                  <option value="organizer">organizer</option>
                </select>
                <button type="button" onClick={() => removePerson(index)} className="rounded-xl bg-[#ece4d7] px-3 py-2 text-xs font-semibold text-[#38515a]">Remove</button>
              </div>
            ))}
          </div>
        </div>

        <div className="md:col-span-2">
          <label htmlFor="photos" className="mb-2 block text-sm font-semibold text-[#38515a]">Photos section</label>
          <input id="photos" type="file" multiple accept="image/*" onChange={handlePhotosChange} className="w-full rounded-2xl border border-[#d9cdbb] px-4 py-3" />
          {(values.photos?.length ?? 0) > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {values.photos.map((photo) => (
                <a key={photo.id ?? photo.photo_url} href={photo.photo_url} target="_blank" rel="noreferrer" className="rounded-full bg-[#ece4d7] px-3 py-1 text-xs font-semibold text-[#38515a]">Existing photo</a>
              ))}
            </div>
          ) : null}
          {photoFiles.length > 0 ? <p className="mt-2 text-sm text-[#6d7f82]">{photoFiles.length} photo(s) selected</p> : null}
        </div>

        <div>
          <label htmlFor="status" className="mb-2 block text-sm font-semibold text-[#38515a]">Status</label>
          <select id="status" value={values.status} onChange={(event) => setValues({ ...values, status: event.target.value as InitialValues['status'] })} className="w-full rounded-2xl border border-[#d9cdbb] px-4 py-3">
            <option value="draft">Draft</option>
            {canPublish ? <option value="published">Published</option> : null}
          </select>
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
        <Link href="/dashboard/events" className="rounded-2xl bg-[#ece4d7] px-5 py-3 text-sm font-semibold text-[#38515a]">Cancel</Link>
      </div>
    </form>
  );
}
