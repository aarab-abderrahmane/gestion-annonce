"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useToast } from '@/components/ui/ToastProvider';
import type { ResourcePermissionState } from '@/lib/admin-permissions';

const levelLabels: Record<string, string> = {
  dangerous: 'خطير',
  urgent: 'عاجل',
  warning: 'تحذير',
};

const levelStyles: Record<string, { background: string; color: string }> = {
  dangerous: { background: 'var(--md-error-container)', color: 'var(--md-on-error-container)' },
  urgent: { background: 'var(--md-warning-container)', color: 'var(--md-on-warning-container)' },
  warning: { background: 'var(--md-tertiary-container)', color: 'var(--md-on-tertiary-container)' },
};

type Row = {
  id: string;
  title: string;
  level: string;
  status: string;
  created_at: string;
  expires_at: string;
  deleted_at?: string | null;
};

export default function BreakingNewsTable({
  rows,
  permissions,
}: {
  rows: Row[];
  permissions: ResourcePermissionState;
}) {
  const router = useRouter();
  const toast = useToast();
  const [viewFilter, setViewFilter] = useState<'active' | 'trash' | 'all'>('active');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const filteredRows = useMemo(
    () =>
      rows.filter((row) =>
        viewFilter === 'all' ? true : viewFilter === 'trash' ? Boolean(row.deleted_at) : !row.deleted_at,
      ),
    [rows, viewFilter],
  );

  async function handleTrash(row: Row) {
    if (!window.confirm('نقل هذا الخبر العاجل إلى سلة المهملات؟')) return;
    setDeletingId(row.id);
    try {
      const response = await fetch(`/api/breaking-news/${row.id}`, { method: 'DELETE' });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        toast.error(payload?.error ?? 'تعذر نقل الخبر إلى سلة المهملات.');
        setDeletingId(null);
        return;
      }
      router.refresh();
    } catch (error) {
      toast.error(error);
      setDeletingId(null);
    }
  }

  async function handleRestore(row: Row) {
    setRestoringId(row.id);
    try {
      const response = await fetch(`/api/breaking-news/${row.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restore' }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        toast.error(payload?.error ?? 'تعذر استرجاع الخبر.');
        setRestoringId(null);
        return;
      }
      router.refresh();
    } catch (error) {
      toast.error(error);
      setRestoringId(null);
    }
  }

  async function handlePermanentDelete(row: Row) {
    if (!window.confirm('حذف نهائي لهذا الخبر العاجل؟')) return;
    setDeletingId(row.id);
    try {
      const response = await fetch(`/api/breaking-news/${row.id}?purge=true`, { method: 'DELETE' });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        toast.error(payload?.error ?? 'تعذر الحذف النهائي.');
        setDeletingId(null);
        return;
      }
      router.refresh();
    } catch (error) {
      toast.error(error);
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 px-6 pt-4">
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

      <div className="md-card-outlined overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--md-surface-container)' }}>
                {['العنوان', 'المستوى', 'الحالة', 'تاريخ الإنشاء', 'تاريخ الانتهاء', 'الإجراءات'].map((h) => (
                  <th key={h} className="md-label-medium px-6 py-3 text-right" style={{ color: 'var(--md-on-surface-variant)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => {
                const levelStyle = levelStyles[row.level] ?? { background: 'var(--md-surface-container)', color: 'var(--md-on-surface-variant)' };
                const isPublished = row.status === 'published';
                const isTrashed = Boolean(row.deleted_at);
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
                    <td className="px-6 py-4">
                      <span className="md-label-small rounded-[var(--md-shape-full)] px-3 py-1" style={levelStyle}>
                        {levelLabels[row.level] ?? row.level}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className="md-label-small rounded-[var(--md-shape-full)] px-3 py-1"
                        style={{
                          background: isPublished ? 'var(--md-primary-container)' : 'var(--md-surface-container-highest)',
                          color: isPublished ? 'var(--md-on-primary-container)' : 'var(--md-on-surface-variant)',
                        }}
                      >
                        {isPublished ? 'منشور' : 'مسودة'}
                      </span>
                    </td>
                    <td className="md-body-small px-6 py-4" style={{ color: 'var(--md-on-surface-variant)' }}>
                      {new Date(row.created_at).toLocaleString('ar-MA')}
                    </td>
                    <td className="md-body-small px-6 py-4" style={{ color: 'var(--md-on-surface-variant)' }}>
                      {new Date(row.expires_at).toLocaleString('ar-MA')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {canEdit && !isTrashed ? (
                          <Link href={`/dashboard/breaking-news/${row.id}/edit`} className="md-btn md-btn-tonal md-state" style={{ height: 32, padding: '0 14px', fontSize: 13 }}>
                            تعديل
                          </Link>
                        ) : null}
                        {permissions.delete && !isTrashed ? (
                          <button
                            type="button"
                            onClick={() => void handleTrash(row)}
                            disabled={deletingId === row.id}
                            className="md-btn md-state disabled:opacity-50"
                            style={{ height: 32, padding: '0 14px', fontSize: 13, background: 'var(--md-warning-container)', color: 'var(--md-on-warning-container)', borderRadius: 'var(--md-shape-full)' }}
                          >
                            {deletingId === row.id ? '...' : 'إلى المهملات'}
                          </button>
                        ) : null}
                        {permissions.delete && isTrashed ? (
                          <>
                            <button
                              type="button"
                              onClick={() => void handleRestore(row)}
                              disabled={restoringId === row.id}
                              className="md-btn md-btn-tonal md-state disabled:opacity-50"
                              style={{ height: 32, padding: '0 14px', fontSize: 13 }}
                            >
                              {restoringId === row.id ? '...' : 'استرجاع'}
                            </button>
                            <button
                              type="button"
                              onClick={() => void handlePermanentDelete(row)}
                              disabled={deletingId === row.id}
                              className="md-btn md-state disabled:opacity-50"
                              style={{ height: 32, padding: '0 14px', fontSize: 13, background: 'var(--md-error-container)', color: 'var(--md-on-error-container)', borderRadius: 'var(--md-shape-full)' }}
                            >
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
    </div>
  );
}
