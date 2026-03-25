"use client";

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/ToastProvider';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Filter } from 'lucide-react';
import type { ResourcePermissionState } from '@/lib/admin-permissions';

type Category = { id: string; name: string; slug: string };
type Row = {
  id: string;
  title: string;
  divisionName: string;
  status: string;
  publishedAt: string | null;
  deletedAt: string | null;
  categories: Category[];
  files: Array<{ file_url: string | null }>;
};
type FilterOption = { label: string; value: string };
type DialogState =
  | { open: false }
  | {
      open: true;
      mode: 'trash' | 'purge';
      row: Row;
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

export default function AnnouncementsTable({
  rows,
  divisions,
  categories,
  permissions,
}: {
  rows: Row[];
  divisions: FilterOption[];
  categories: FilterOption[];
  permissions: ResourcePermissionState;
}) {
  const supabase = createClient();
  const router = useRouter();
  const toast = useToast();
  const [divisionFilter, setDivisionFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewFilter, setViewFilter] = useState<'active' | 'trash' | 'all'>('active');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [dialogState, setDialogState] = useState<DialogState>({ open: false });

  const filteredRows = useMemo(
    () =>
      rows.filter((row) => {
        const matchesView =
          viewFilter === 'all'
            ? true
            : viewFilter === 'trash'
              ? Boolean(row.deletedAt)
              : !row.deletedAt;
        const matchesDivision = divisionFilter === 'all' || row.divisionName === divisionFilter;
        const matchesCategory = categoryFilter === 'all' || row.categories.some((c) => c.slug === categoryFilter);
        const matchesStatus = statusFilter === 'all' || row.status === statusFilter;
        return matchesView && matchesDivision && matchesCategory && matchesStatus;
      }),
    [rows, divisionFilter, categoryFilter, statusFilter, viewFilter],
  );

  function requestTrash(row: Row) {
    setDialogState({ open: true, mode: 'trash', row });
  }

  async function handleTrash(row: Row) {
    setDeletingId(row.id);

    try {
      const response = await fetch(`/api/announcements/${row.id}`, {
        method: 'DELETE',
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        toast.error(payload?.error ?? 'تعذر نقل الإعلان إلى سلة المهملات.');
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
      const response = await fetch(`/api/announcements/${row.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restore' }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        toast.error(payload?.error ?? 'تعذر استرجاع الإعلان.');
        setRestoringId(null);
        return;
      }

      router.refresh();
    } catch (err) {
      toast.error(err);
      setRestoringId(null);
    }
  }

  function requestPermanentDelete(row: Row) {
    setDialogState({ open: true, mode: 'purge', row });
  }

  async function handlePermanentDelete(row: Row) {
    setDeletingId(row.id);

    try {
      for (const file of row.files) {
        if (!file.file_url) continue;
        const target = extractStorageTarget(file.file_url);
        if (!target) continue;
        await supabase.storage.from(target.bucket).remove([target.path]);
      }

      const response = await fetch(`/api/announcements/${row.id}?purge=true`, {
        method: 'DELETE',
      });
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

  async function handleDialogConfirm() {
    if (!dialogState.open) return;
    const { row, mode } = dialogState;
    setDialogState({ open: false });
    if (mode === 'trash') {
      await handleTrash(row);
      return;
    }
    await handlePermanentDelete(row);
  }

  return (
    <div className="space-y-5">
      <ConfirmDialog
        key={dialogState.open ? `${dialogState.mode}:${dialogState.row.id}` : 'announcement-dialog-closed'}
        open={dialogState.open}
        onClose={() => setDialogState({ open: false })}
        onConfirm={() => void handleDialogConfirm()}
        title={dialogState.open && dialogState.mode === 'purge' ? 'حذف نهائي للإعلان' : 'نقل الإعلان إلى المهملات'}
        description={
          dialogState.open && dialogState.mode === 'purge'
            ? 'سيتم حذف الإعلان وملفاته المرتبطة نهائيًا، ولا يمكن التراجع بعد ذلك.'
            : 'سيتم إخفاء الإعلان من القوائم العامة ويمكن استعادته لاحقًا من المهملات.'
        }
        confirmLabel={dialogState.open && dialogState.mode === 'purge' ? 'حذف نهائيًا' : 'نقل إلى المهملات'}
        confirmVariant={dialogState.open && dialogState.mode === 'purge' ? 'destructive' : 'filled'}
        loading={Boolean(dialogState.open && deletingId === dialogState.row.id)}
        verificationText={dialogState.open && dialogState.mode === 'purge' ? dialogState.row.title : null}
        verificationLabel="أعد كتابة عنوان الإعلان للتأكيد"
      />
      <div
        className="flex flex-wrap items-center gap-3 rounded-[var(--md-shape-xl)] p-4"
        style={{ background: 'var(--md-surface-container-low)', border: '1px solid var(--md-outline-variant)' }}
      >
        <span className="md-label-medium flex items-center gap-1.5" style={{ color: 'var(--md-on-surface-variant)' }}>
          <Filter size={14} /> تصفية:
        </span>

        <select
          value={divisionFilter}
          onChange={(e) => setDivisionFilter(e.target.value)}
          className="md-label-medium h-8 cursor-pointer rounded-[var(--md-shape-s)] border px-3 outline-none"
          style={{
            background: divisionFilter !== 'all' ? 'var(--md-secondary-container)' : 'transparent',
            borderColor: divisionFilter !== 'all' ? 'transparent' : 'var(--md-outline)',
            color: divisionFilter !== 'all' ? 'var(--md-on-secondary-container)' : 'var(--md-on-surface-variant)',
          }}
        >
          <option value="all">كل الأقسام</option>
          {divisions.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
        </select>

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
                  {['العنوان', 'القسم', 'الأصناف', 'الحالة', 'تاريخ النشر', 'الإجراءات'].map((header) => (
                    <th key={header} className="md-label-medium px-6 py-3 text-right" style={{ color: 'var(--md-on-surface-variant)' }}>
                      {header}
                    </th>
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
                          {isTrashed ? (
                            <div className="md-label-small" style={{ color: 'var(--md-error)' }}>
                              في سلة المهملات
                            </div>
                          ) : null}
                        </div>
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
                              className="md-label-small rounded-[var(--md-shape-full)] px-2.5 py-0.5"
                              style={{ background: 'var(--md-surface-container)', color: 'var(--md-on-surface-variant)' }}
                            >
                              {cat.name}
                            </span>
                          ))}
                        </div>
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
                        {row.publishedAt ? new Date(row.publishedAt).toLocaleString('fr-FR', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          timeZone: 'Africa/Casablanca'
                        }) : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {canEdit && !isTrashed ? (
                            <Link
                              href={`/dashboard/announcements/${row.id}/edit`}
                              className="md-btn md-btn-tonal md-state"
                              style={{ height: 32, padding: '0 14px', fontSize: 13 }}
                            >
                              تعديل
                            </Link>
                          ) : null}

                          {permissions.delete && !isTrashed ? (
                            <button
                              type="button"
                              onClick={() => requestTrash(row)}
                              disabled={deletingId === row.id}
                              className="md-btn md-state disabled:opacity-50"
                              style={{
                                height: 32,
                                padding: '0 14px',
                                fontSize: 13,
                                background: 'var(--md-warning-container)',
                                color: 'var(--md-on-warning-container)',
                                borderRadius: 'var(--md-shape-full)',
                              }}
                            >
                              {deletingId === row.id ? '...' : 'نقل إلى المهملات'}
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
                                {restoringId === row.id ? '...' : 'استعادة'}
                              </button>
                              <button
                                type="button"
                              onClick={() => requestPermanentDelete(row)}
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
                                {deletingId === row.id ? '...' : 'حذف نهائيًا'}
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
