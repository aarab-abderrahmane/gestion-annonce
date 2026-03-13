"use client";

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Filter } from 'lucide-react';

type Category = { id: string; name: string; slug: string };
type Row = {
  id: string;
  title: string;
  divisionName: string;
  status: string;
  publishedAt: string | null;
  categories: Category[];
  files: Array<{ file_url: string | null }>;
};
type FilterOption = { label: string; value: string };

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

export default function AnnouncementsTable({ rows, divisions, categories }: { rows: Row[]; divisions: FilterOption[]; categories: FilterOption[] }) {
  const supabase = createClient();
  const router = useRouter();
  const [divisionFilter, setDivisionFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredRows = useMemo(() =>
    rows.filter((row) => {
      const matchesDivision = divisionFilter === 'all' || row.divisionName === divisionFilter;
      const matchesCategory = categoryFilter === 'all' || row.categories.some((c) => c.slug === categoryFilter);
      const matchesStatus = statusFilter === 'all' || row.status === statusFilter;
      return matchesDivision && matchesCategory && matchesStatus;
    }),
    [rows, divisionFilter, categoryFilter, statusFilter]
  );

  async function handleDelete(row: Row) {
    if (!window.confirm('حذف هذا الإعلان وملفاته المرتبطة؟')) return;
    setDeletingId(row.id);
    try {
      for (const file of row.files) {
        if (!file.file_url) continue;
        const target = extractStorageTarget(file.file_url);
        if (!target) continue;
        await supabase.storage.from(target.bucket).remove([target.path]);
      }
      const { error } = await supabase.from('announcements').delete().eq('id', row.id);
      if (error) { alert(error.message); setDeletingId(null); return; }
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'خطأ غير متوقع');
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-5">
      {/* MD3 Filter chips row */}
      <div
        className="flex flex-wrap items-center gap-3 p-4 rounded-[var(--md-shape-xl)]"
        style={{ background: 'var(--md-surface-container-low)', border: '1px solid var(--md-outline-variant)' }}
      >
        <span className="md-label-medium flex items-center gap-1.5" style={{ color: 'var(--md-on-surface-variant)' }}>
          <Filter size={14} /> تصفية:
        </span>

        {/* Division select */}
        <select
          value={divisionFilter}
          onChange={(e) => setDivisionFilter(e.target.value)}
          className="md-label-medium h-8 px-3 rounded-[var(--md-shape-s)] border outline-none cursor-pointer"
          style={{
            background: divisionFilter !== 'all' ? 'var(--md-secondary-container)' : 'transparent',
            borderColor: divisionFilter !== 'all' ? 'transparent' : 'var(--md-outline)',
            color: divisionFilter !== 'all' ? 'var(--md-on-secondary-container)' : 'var(--md-on-surface-variant)',
          }}
        >
          <option value="all">كل الأقسام</option>
          {divisions.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
        </select>

        {/* Category select */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="md-label-medium h-8 px-3 rounded-[var(--md-shape-s)] border outline-none cursor-pointer"
          style={{
            background: categoryFilter !== 'all' ? 'var(--md-secondary-container)' : 'transparent',
            borderColor: categoryFilter !== 'all' ? 'transparent' : 'var(--md-outline)',
            color: categoryFilter !== 'all' ? 'var(--md-on-secondary-container)' : 'var(--md-on-surface-variant)',
          }}
        >
          <option value="all">كل الأصناف</option>
          {categories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>

        {/* Status chips */}
        {['all', 'draft', 'published'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className="md-chip"
            style={statusFilter === s ? {
              background: 'var(--md-secondary-container)',
              borderColor: 'transparent',
              color: 'var(--md-on-secondary-container)',
            } : {}}
          >
            {s === 'all' ? 'الكل' : s === 'draft' ? 'مسودة' : 'منشور'}
          </button>
        ))}
      </div>

      {/* Table or empty */}
      {filteredRows.length === 0 ? (
        <div
          className="rounded-[var(--md-shape-xl)] border border-dashed px-5 py-12 text-center md-body-medium"
          style={{ borderColor: 'var(--md-outline-variant)', color: 'var(--md-on-surface-variant)' }}
        >
          لا توجد إعلانات تطابق المرشحات المحددة.
        </div>
      ) : (
        <div className="md-card-outlined overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--md-surface-container)' }}>
                  {['العنوان', 'القسم', 'الأصناف', 'الحالة', 'تاريخ النشر', 'الإجراءات'].map((h) => (
                    <th key={h} className="md-label-medium text-right px-6 py-3" style={{ color: 'var(--md-on-surface-variant)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => {
                  const isPublished = row.status === 'published';
                  return (
                    <tr
                      key={row.id}
                      style={{ borderTop: '1px solid var(--md-outline-variant)' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--md-surface-container-low)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td className="md-body-medium px-6 py-4 font-semibold" style={{ color: 'var(--md-on-surface)' }}>
                        {row.title}
                      </td>
                      <td className="md-body-medium px-6 py-4" style={{ color: 'var(--md-on-surface-variant)' }}>
                        {row.divisionName || '—'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {row.categories.length === 0 ? (
                            <span style={{ color: 'var(--md-on-surface-variant)' }}>—</span>
                          ) : row.categories.map((cat) => (
                            <span
                              key={cat.id}
                              className="md-label-small px-2.5 py-0.5 rounded-[var(--md-shape-full)]"
                              style={{ background: 'var(--md-surface-container)', color: 'var(--md-on-surface-variant)' }}
                            >
                              {cat.name}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className="md-label-small px-3 py-1 rounded-[var(--md-shape-full)]"
                          style={{
                            background: isPublished ? 'var(--md-primary-container)' : 'var(--md-surface-container-highest)',
                            color: isPublished ? 'var(--md-on-primary-container)' : 'var(--md-on-surface-variant)',
                          }}
                        >
                          {isPublished ? 'منشور' : 'مسودة'}
                        </span>
                      </td>
                      <td className="md-body-small px-6 py-4" style={{ color: 'var(--md-on-surface-variant)' }}>
                        {row.publishedAt ? new Date(row.publishedAt).toLocaleString('ar-MA') : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <Link
                            href={`/dashboard/announcements/${row.id}/edit`}
                            className="md-btn md-btn-tonal md-state"
                            style={{ height: 32, padding: '0 14px', fontSize: 13 }}
                          >
                            تعديل
                          </Link>
                          <button
                            type="button"
                            onClick={() => void handleDelete(row)}
                            disabled={deletingId === row.id}
                            className="md-btn md-state disabled:opacity-50"
                            style={{
                              height: 32,
                              padding: '0 14px',
                              fontSize: 13,
                              background: 'var(--md-error-container)',
                              color: 'var(--md-on-error-container)',
                              borderRadius: 'var(--md-shape-full)',
                            }}
                          >
                            {deletingId === row.id ? '...' : 'حذف'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
