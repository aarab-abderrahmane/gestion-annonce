"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
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
};

export default function BreakingNewsTable({
  rows,
  permissions,
}: {
  rows: Row[];
  permissions: ResourcePermissionState;
}) {
  const supabase = createClient();
  const router = useRouter();
  const toast = useToast();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  return (
    <div className="md-card-outlined overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--md-surface-container)' }}>
              {['العنوان', 'المستوى', 'الحالة', 'تاريخ الإنشاء', 'تاريخ الانتهاء', 'الإجراءات'].map((h) => (
                <th
                  key={h}
                  className="md-label-medium text-right px-6 py-3"
                  style={{ color: 'var(--md-on-surface-variant)' }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
                {rows.map((row) => {
                  const levelStyle = levelStyles[row.level] ?? { background: 'var(--md-surface-container)', color: 'var(--md-on-surface-variant)' };
                  const isPublished = row.status === 'published';
                  const canEdit = permissions.update && (!isPublished || permissions.publish);
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
                  <td className="px-6 py-4">
                    <span
                      className="md-label-small px-3 py-1 rounded-[var(--md-shape-full)]"
                      style={levelStyle}
                    >
                      {levelLabels[row.level] ?? row.level}
                    </span>
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
                          {canEdit ? (
                            <Link
                              href={`/dashboard/breaking-news/${row.id}/edit`}
                              className="md-btn md-btn-tonal md-state"
                              style={{ height: 32, padding: '0 14px', fontSize: 13 }}
                            >
                              تعديل
                            </Link>
                          ) : null}
                          {permissions.delete ? (
                            <button
                              type="button"
                              onClick={async () => {
                                if (!window.confirm('حذف هذا الخبر العاجل؟')) return;
                                setDeletingId(row.id);
                                try {
                                  const { error } = await supabase.from('breaking_news').delete().eq('id', row.id);
                                  if (error) {
                                    toast.error(error);
                                    setDeletingId(null);
                                    return;
                                  }
                                  router.refresh();
                                } catch (error) {
                                  toast.error(error);
                                  setDeletingId(null);
                                }
                              }}
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
  );
}
