"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/ToastProvider';
import type { ResourcePermissionState } from '@/lib/admin-permissions';

type Row = {
  id: string;
  title: string;
  status: string;
  created_at: string;
  expires_at: string;
  deleted_at?: string | null;
};

type DialogState =
  | { open: false }
  | {
      open: true;
      mode: 'trash' | 'purge';
      row: Row;
    };

export default function DangerNewsTable({
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
  const [dialogState, setDialogState] = useState<DialogState>({ open: false });

  const filteredRows = useMemo(
    () =>
      rows.filter((row) =>
        viewFilter === 'all' ? true : viewFilter === 'trash' ? Boolean(row.deleted_at) : !row.deleted_at,
      ),
    [rows, viewFilter],
  );

  function requestTrash(row: Row) {
    setDialogState({ open: true, mode: 'trash', row });
  }

  async function handleTrash(row: Row) {
    setDeletingId(row.id);
    try {
      const response = await fetch(`/api/danger-news/${row.id}`, { method: 'DELETE' });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        toast.error(payload?.error ?? 'تعذر نقل العنصر إلى سلة المهملات.');
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
      const response = await fetch(`/api/danger-news/${row.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restore' }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        toast.error(payload?.error ?? 'تعذر استرجاع العنصر.');
        setRestoringId(null);
        return;
      }
      router.refresh();
    } catch (error) {
      toast.error(error);
      setRestoringId(null);
    }
  }

  function requestPermanentDelete(row: Row) {
    setDialogState({ open: true, mode: 'purge', row });
  }

  async function handlePermanentDelete(row: Row) {
    setDeletingId(row.id);
    try {
      const response = await fetch(`/api/danger-news/${row.id}?purge=true`, { method: 'DELETE' });
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
    <div className="space-y-4">
      <ConfirmDialog
        key={dialogState.open ? `${dialogState.mode}:${dialogState.row.id}` : 'danger-news-dialog-closed'}
        open={dialogState.open}
        onClose={() => setDialogState({ open: false })}
        onConfirm={() => void handleDialogConfirm()}
        title={dialogState.open && dialogState.mode === 'purge' ? 'حذف نهائي لعنصر الشريط' : 'نقل عنصر الشريط إلى المهملات'}
        description={
          dialogState.open && dialogState.mode === 'purge'
            ? 'سيتم حذف عنصر الشريط نهائيًا، ولن تتمكن من استعادته بعد ذلك.'
            : 'سيتم إخفاء عنصر الشريط من الصفحة الرئيسية ويمكن استعادته لاحقًا من المهملات.'
        }
        confirmLabel={dialogState.open && dialogState.mode === 'purge' ? 'حذف نهائيًا' : 'نقل إلى المهملات'}
        confirmVariant={dialogState.open && dialogState.mode === 'purge' ? 'destructive' : 'filled'}
        loading={Boolean(dialogState.open && deletingId === dialogState.row.id)}
        verificationText={dialogState.open && dialogState.mode === 'purge' ? dialogState.row.title : null}
        verificationLabel="أعد كتابة النص للتأكيد"
      />

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
                {['النص', 'الحالة', 'تاريخ الإنشاء', 'تاريخ الانتهاء', 'الإجراءات'].map((header) => (
                  <th key={header} className="md-label-medium px-6 py-3 text-right" style={{ color: 'var(--md-on-surface-variant)' }}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => {
                const isPublished = row.status === 'published';
                const isTrashed = Boolean(row.deleted_at);
                const canEdit = permissions.update && (!isPublished || permissions.publish);

                return (
                  <tr
                    key={row.id}
                    style={{ borderTop: '1px solid var(--md-outline-variant)' }}
                    onMouseEnter={(event) => (event.currentTarget.style.background = 'var(--md-surface-container-low)')}
                    onMouseLeave={(event) => (event.currentTarget.style.background = 'transparent')}
                  >
                    <td className="md-body-medium px-6 py-4 font-semibold" style={{ color: 'var(--md-on-surface)' }}>
                      <div className="space-y-1">
                        <div>{row.title}</div>
                        {isTrashed ? <div className="md-label-small" style={{ color: 'var(--md-error)' }}>في سلة المهملات</div> : null}
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
                      {new Date(row.created_at).toLocaleString('fr-FR', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        timeZone: 'Africa/Casablanca'
                      })}
                    </td>
                    <td className="md-body-small px-6 py-4" style={{ color: 'var(--md-on-surface-variant)' }}>
                      {new Date(row.expires_at).toLocaleString('fr-FR', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        timeZone: 'Africa/Casablanca'
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {canEdit && !isTrashed ? (
                          <Link href={`/dashboard/danger-news/${row.id}/edit`} className="md-btn md-btn-tonal md-state" style={{ height: 32, padding: '0 14px', fontSize: 13 }}>
                            تعديل
                          </Link>
                        ) : null}
                        {permissions.delete && !isTrashed ? (
                          <button
                            type="button"
                            onClick={() => requestTrash(row)}
                            disabled={deletingId === row.id}
                            className="md-btn md-state disabled:opacity-50"
                            style={{ height: 32, padding: '0 14px', fontSize: 13, background: 'var(--md-warning-container)', color: 'var(--md-on-warning-container)', borderRadius: 'var(--md-shape-full)' }}
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
                              style={{ height: 32, padding: '0 14px', fontSize: 13, background: 'var(--md-error-container)', color: 'var(--md-on-error-container)', borderRadius: 'var(--md-shape-full)' }}
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
    </div>
  );
}
