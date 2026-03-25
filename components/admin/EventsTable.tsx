"use client";

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/ToastProvider';
import { Filter } from 'lucide-react';
import type { ResourcePermissionState } from '@/lib/admin-permissions';

type Category = { id: string; name: string; slug: string };
type Row = {
  id: string;
  title: string;
  location: string | null;
  startsAt: string;
  status: string;
  deletedAt: string | null;
  categories: Category[];
  coverImage: string | null;
  photos: Array<{ photo_url: string | null }>;
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

export default function EventsTable({
  rows,
  categories,
  permissions,
}: {
  rows: Row[];
  categories: FilterOption[];
  permissions: ResourcePermissionState;
}) {
  const supabase = createClient();
  const router = useRouter();
  const toast = useToast();
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewFilter, setViewFilter] = useState<'active' | 'trash' | 'all'>('active');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const filteredRows = useMemo(
    () =>
      rows.filter((row) => {
        const matchesCategory = categoryFilter === 'all' || row.categories.some((c) => c.slug === categoryFilter);
        const matchesStatus = statusFilter === 'all' || row.status === statusFilter;
        const matchesView =
          viewFilter === 'all' ? true : viewFilter === 'trash' ? Boolean(row.deletedAt) : !row.deletedAt;
        return matchesCategory && matchesStatus && matchesView;
      }),
    [rows, categoryFilter, statusFilter, viewFilter],
  );

  async function handleTrash(row: Row) {
    if (!window.confirm('نقل هذه الفعالية إلى سلة المهملات؟')) return;
    setDeletingId(row.id);
    try {
      const response = await fetch(`/api/events/${row.id}`, { method: 'DELETE' });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        toast.error(payload?.error ?? 'تعذر نقل الفعالية إلى سلة المهملات.');
        setDeletingId(null);
        return;
      }
      router.refresh();
    } catch (err) {
      toast.error(err);
      setDeletingId(null);
    }
  }

  async function handleRestore(row: Row) {
    setRestoringId(row.id);
    try {
      const response = await fetch(`/api/events/${row.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restore' }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        toast.error(payload?.error ?? 'تعذر استرجاع الفعالية.');
        setRestoringId(null);
        return;
      }
      router.refresh();
    } catch (err) {
      toast.error(err);
      setRestoringId(null);
    }
  }

  async function handlePermanentDelete(row: Row) {
    if (!window.confirm('حذف نهائي لهذه الفعالية وملفاتها؟')) return;
    setDeletingId(row.id);
    try {
      const urls = [row.coverImage, ...row.photos.map((p) => p.photo_url)].filter(Boolean) as string[];
      for (const url of urls) {
        const target = extractStorageTarget(url);
        if (!target) continue;
        await supabase.storage.from(target.bucket).remove([target.path]);
      }
      const response = await fetch(`/api/events/${row.id}?purge=true`, { method: 'DELETE' });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        toast.error(payload?.error ?? 'تعذر الحذف النهائي.');
        setDeletingId(null);
        return;
      }
      router.refresh();
    } catch (err) {
      toast.error(err);
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div
        className="flex flex-wrap items-center gap-3 rounded-[var(--md-shape-xl)] p-4"
        style={{ background: 'var(--md-surface-container-low)', border: '1px solid var(--md-outline-variant)' }}
      >
        <span className="md-label-medium flex items-center gap-1.5" style={{ color: 'var(--md-on-surface-variant)' }}>
          <Filter size={14} /> تصفية:
        </span>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="md-label-medium h-8 cursor-pointer rounded-[var(--md-shape-s)] border px-3 outline-none"
          style={{
            background: categoryFilter !== 'all' ? 'var(--md-secondary-container)' : 'transparent',
            borderColor: categoryFilter !== 'all' ? 'transparent' : 'var(--md-outline)',
            color: categoryFilter !== 'all' ? 'var(--md-on-secondary-container)' : 'var(--md-on-surface-variant)',
          }}
        >
          <option value="all">كل الأصناف</option>
          {categories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        {['all', 'draft', 'published'].map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setStatusFilter(status)}
            className="md-chip"
            style={statusFilter === status ? {
              background: 'var(--md-secondary-container)',
              borderColor: 'transparent',
              color: 'var(--md-on-secondary-container)',
            } : {}}
          >
            {status === 'all' ? 'الكل' : status === 'draft' ? 'مسودة' : 'منشور'}
          </button>
        ))}
        {[
          { key: 'active', label: 'النشطة' },
          { key: 'trash', label: 'المهملات' },
          { key: 'all', label: 'الكل' },
        ].map((view) => (
          <button
            key={view.key}
            type="button"
            onClick={() => setViewFilter(view.key as typeof viewFilter)}
            className="md-chip"
            style={viewFilter === view.key ? {
              background: 'var(--md-tertiary-container)',
              borderColor: 'transparent',
              color: 'var(--md-on-tertiary-container)',
            } : {}}
          >
            {view.label}
          </button>
        ))}
      </div>

      {filteredRows.length === 0 ? (
        <div className="rounded-[var(--md-shape-xl)] border border-dashed px-5 py-12 text-center md-body-medium" style={{ borderColor: 'var(--md-outline-variant)', color: 'var(--md-on-surface-variant)' }}>
          لا توجد فعاليات تطابق المرشحات المحددة.
        </div>
      ) : (
        <div className="md-card-outlined overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--md-surface-container)' }}>
                  {['العنوان', 'الموقع', 'تاريخ البدء', 'الأصناف', 'الحالة', 'الإجراءات'].map((h) => (
                    <th key={h} className="md-label-medium px-6 py-3 text-right" style={{ color: 'var(--md-on-surface-variant)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => {
                  const isPublished = row.status === 'published';
                  const isTrashed = Boolean(row.deletedAt);
                  const canEdit = permissions.update && (!isPublished || permissions.publish);
                  return (
                    <tr
                      key={row.id}
                      style={{ borderTop: '1px solid var(--md-outline-variant)' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--md-surface-container-low)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td className="md-body-medium px-6 py-4 font-semibold" style={{ color: 'var(--md-on-surface)' }}>
                        <div className="space-y-1">
                          <div>{row.title}</div>
                          {isTrashed ? <div className="md-label-small" style={{ color: 'var(--md-error)' }}>في سلة المهملات</div> : null}
                        </div>
                      </td>
                      <td className="md-body-medium px-6 py-4" style={{ color: 'var(--md-on-surface-variant)' }}>{row.location || '—'}</td>
                      <td className="md-body-small px-6 py-4" style={{ color: 'var(--md-on-surface-variant)' }}>
                        {new Date(row.startsAt).toLocaleString('ar-MA')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {row.categories.length === 0 ? <span style={{ color: 'var(--md-on-surface-variant)' }}>—</span> : row.categories.map((cat) => (
                            <span key={cat.id} className="md-label-small rounded-[var(--md-shape-full)] px-2.5 py-0.5" style={{ background: 'var(--md-surface-container)', color: 'var(--md-on-surface-variant)' }}>
                              {cat.name}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="md-label-small rounded-[var(--md-shape-full)] px-3 py-1" style={{ background: isPublished ? 'var(--md-primary-container)' : 'var(--md-surface-container-highest)', color: isPublished ? 'var(--md-on-primary-container)' : 'var(--md-on-surface-variant)' }}>
                          {isPublished ? 'منشور' : 'مسودة'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {canEdit && !isTrashed ? (
                            <Link href={`/dashboard/events/${row.id}/edit`} className="md-btn md-btn-tonal md-state" style={{ height: 32, padding: '0 14px', fontSize: 13 }}>
                              تعديل
                            </Link>
                          ) : null}
                          {permissions.delete && !isTrashed ? (
                            <button type="button" onClick={() => void handleTrash(row)} disabled={deletingId === row.id} className="md-btn md-state disabled:opacity-50" style={{ height: 32, padding: '0 14px', fontSize: 13, background: 'var(--md-warning-container)', color: 'var(--md-on-warning-container)', borderRadius: 'var(--md-shape-full)' }}>
                              {deletingId === row.id ? '...' : 'إلى المهملات'}
                            </button>
                          ) : null}
                          {permissions.delete && isTrashed ? (
                            <>
                              <button type="button" onClick={() => void handleRestore(row)} disabled={restoringId === row.id} className="md-btn md-btn-tonal md-state disabled:opacity-50" style={{ height: 32, padding: '0 14px', fontSize: 13 }}>
                                {restoringId === row.id ? '...' : 'استرجاع'}
                              </button>
                              <button type="button" onClick={() => void handlePermanentDelete(row)} disabled={deletingId === row.id} className="md-btn md-state disabled:opacity-50" style={{ height: 32, padding: '0 14px', fontSize: 13, background: 'var(--md-error-container)', color: 'var(--md-on-error-container)', borderRadius: 'var(--md-shape-full)' }}>
                                {deletingId === row.id ? '...' : 'حذف نهائي'}
                              </button>
                            </>
                          ) : null}
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
