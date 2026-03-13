"use client";

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type Category = {
  id: string;
  name: string;
  slug: string;
};

type Props = {
  announcementCategories: Category[];
  eventCategories: Category[];
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

function CategorySection({
  title,
  table,
  rows,
}: {
  title: string;
  table: 'announcement_categories' | 'event_categories';
  rows: Category[];
}) {
  const supabase = createClient();
  const router = useRouter();
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = name.trim();
    const slug = slugify(trimmed);
    if (!trimmed || !slug) {
      setError('Name is required.');
      return;
    }

    setSubmitting(true);
    setError('');

    const { error: insertError } = await supabase.from(table).insert({ name: trimmed, slug });
    if (insertError) {
      setError(insertError.message);
      setSubmitting(false);
      return;
    }

    setName('');
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this category?')) return;
    setDeletingId(id);
    setError('');

    const { error: deleteError } = await supabase.from(table).delete().eq('id', id);
    if (deleteError) {
      setError(deleteError.message);
      setDeletingId(null);
      return;
    }

    router.refresh();
  }

  return (
    <section className="rounded-[32px] border border-[#d9cdbb] bg-[#fffdf8] p-6 shadow-sm">
      <div className="mb-5">
        <h2 className="text-2xl font-black text-[#123c3a]">{title}</h2>
        <p className="mt-1 text-sm text-[#6d7f82]">Add or delete categories directly from Supabase.</p>
      </div>

      <div className="space-y-3">
        {rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#d9cdbb] bg-[#faf5eb] px-4 py-6 text-sm text-[#6d7f82]">No categories yet.</div>
        ) : rows.map((row) => (
          <div key={row.id} className="flex items-center justify-between rounded-2xl border border-[#ece4d7] px-4 py-3">
            <div>
              <p className="font-semibold text-[#123c3a]">{row.name}</p>
              <p className="text-xs text-[#6d7f82]">{row.slug}</p>
            </div>
            <button
              type="button"
              onClick={() => void handleDelete(row.id)}
              disabled={deletingId === row.id}
              className="rounded-xl bg-[#8a1f13] px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
            >
              {deletingId === row.id ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        ))}
      </div>

      <form onSubmit={handleAdd} className="mt-6 flex flex-col gap-3 sm:flex-row">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Add new category"
          className="flex-1 rounded-2xl border border-[#d9cdbb] px-4 py-3"
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded-2xl bg-[#123c3a] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {submitting ? 'Adding...' : 'Add'}
        </button>
      </form>

      {error ? <p className="mt-4 rounded-2xl bg-[#ffe2dd] px-4 py-3 text-sm font-semibold text-[#8a1f13]">{error}</p> : null}
    </section>
  );
}

export default function CategoriesManager({ announcementCategories, eventCategories }: Props) {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <CategorySection title="Announcement Categories" table="announcement_categories" rows={announcementCategories} />
      <CategorySection title="Event Categories" table="event_categories" rows={eventCategories} />
    </div>
  );
}
