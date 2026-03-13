"use client";

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type Category = {
  id: string;
  name: string;
  slug: string;
};

type Row = {
  id: string;
  title: string;
  divisionName: string;
  status: string;
  publishedAt: string | null;
  categories: Category[];
  files: Array<{ file_url: string | null }>;
};

type FilterOption = {
  label: string;
  value: string;
};

type AnnouncementsTableProps = {
  rows: Row[];
  divisions: FilterOption[];
  categories: FilterOption[];
};

const statusStyles: Record<string, string> = {
  published: 'bg-[#dff3ea] text-[#0f5a46]',
  draft: 'bg-[#ece4d7] text-[#6d7f82]',
};

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

export default function AnnouncementsTable({ rows, divisions, categories }: AnnouncementsTableProps) {
  const supabase = createClient();
  const router = useRouter();
  const [divisionFilter, setDivisionFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const matchesDivision = divisionFilter === 'all' || row.divisionName === divisionFilter;
      const matchesCategory = categoryFilter === 'all' || row.categories.some((category) => category.slug === categoryFilter);
      const matchesStatus = statusFilter === 'all' || row.status === statusFilter;
      return matchesDivision && matchesCategory && matchesStatus;
    });
  }, [rows, divisionFilter, categoryFilter, statusFilter]);

  async function handleDelete(row: Row) {
    if (!window.confirm('Delete this announcement and its linked files?')) return;
    setDeletingId(row.id);

    try {
      for (const file of row.files) {
        if (!file.file_url) continue;
        const target = extractStorageTarget(file.file_url);
        if (!target) continue;
        await supabase.storage.from(target.bucket).remove([target.path]);
      }

      const { error } = await supabase.from('announcements').delete().eq('id', row.id);
      if (error) {
        alert(error.message);
        setDeletingId(null);
        return;
      }

      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected error';
      alert(message);
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-3">
        <label className="space-y-2 text-sm font-semibold text-[#38515a]">
          <span>Filter by division</span>
          <select value={divisionFilter} onChange={(event) => setDivisionFilter(event.target.value)} className="w-full rounded-2xl border border-[#d9cdbb] bg-white px-4 py-3">
            <option value="all">All divisions</option>
            {divisions.map((division) => (
              <option key={division.value} value={division.value}>{division.label}</option>
            ))}
          </select>
        </label>

        <label className="space-y-2 text-sm font-semibold text-[#38515a]">
          <span>Filter by category</span>
          <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="w-full rounded-2xl border border-[#d9cdbb] bg-white px-4 py-3">
            <option value="all">All categories</option>
            {categories.map((category) => (
              <option key={category.value} value={category.value}>{category.label}</option>
            ))}
          </select>
        </label>

        <label className="space-y-2 text-sm font-semibold text-[#38515a]">
          <span>Filter by status</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="w-full rounded-2xl border border-[#d9cdbb] bg-white px-4 py-3">
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </label>
      </div>

      {filteredRows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#d9cdbb] bg-[#faf5eb] px-5 py-10 text-sm text-[#6d7f82]">
          No announcements match the selected filters.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-right">
            <thead>
              <tr className="text-xs uppercase tracking-[0.2em] text-[#9a7b4f]">
                <th className="px-6 py-4 font-semibold">Title</th>
                <th className="px-6 py-4 font-semibold">Division</th>
                <th className="px-6 py-4 font-semibold">Categories</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Published at</th>
                <th className="px-6 py-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr key={row.id} className="border-t border-[#ece4d7] text-sm text-[#38515a]">
                  <td className="px-6 py-4 font-semibold text-[#123c3a]">{row.title}</td>
                  <td className="px-6 py-4">{row.divisionName || '—'}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      {row.categories.length === 0 ? (
                        <span className="text-[#6d7f82]">—</span>
                      ) : row.categories.map((category) => (
                        <span key={category.id} className="rounded-full bg-[#ece4d7] px-3 py-1 text-xs font-semibold text-[#38515a]">
                          {category.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusStyles[row.status] ?? 'bg-[#ece4d7] text-[#38515a]'}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">{row.publishedAt ? new Date(row.publishedAt).toLocaleString('fr-FR') : '—'}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <Link href={`/dashboard/announcements/${row.id}/edit`} className="rounded-xl bg-[#123c3a] px-3 py-2 text-xs font-semibold text-white">Edit</Link>
                      <button
                        type="button"
                        onClick={() => void handleDelete(row)}
                        disabled={deletingId === row.id}
                        className="rounded-xl bg-[#8a1f13] px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
                      >
                        {deletingId === row.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
