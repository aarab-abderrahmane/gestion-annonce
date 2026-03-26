'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ExternalLink, Search } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';
import {
  WORKFLOW_ACTION_LABELS,
  WORKFLOW_EDITORIAL_STATUS_LABELS,
  WORKFLOW_RESOURCE_CONFIG,
  type WorkflowAction,
  type WorkflowEditorialStatus,
  type WorkflowResource,
} from '@/lib/workflow-control';

type WorkflowItem = {
  id: string;
  resource: WorkflowResource;
  title: string;
  status: 'draft' | 'published';
  editorial_status: WorkflowEditorialStatus;
  created_at: string;
  published_at: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  edit_href: string;
};

function getAvailableActions(item: WorkflowItem): WorkflowAction[] {
  if (item.status === 'published') {
    return ['move_to_draft'];
  }

  if (item.editorial_status === 'draft' || item.editorial_status === 'changes_requested') {
    return ['submit_for_review'];
  }

  if (item.editorial_status === 'in_review') {
    return ['request_changes', 'approve'];
  }

  if (item.editorial_status === 'approved') {
    return ['publish', 'move_to_draft'];
  }

  return [];
}

function editorialTone(status: WorkflowEditorialStatus) {
  if (status === 'approved') {
    return {
      background: 'var(--md-tertiary-container)',
      color: 'var(--md-on-tertiary-container)',
    };
  }

  if (status === 'in_review') {
    return {
      background: 'var(--md-secondary-container)',
      color: 'var(--md-on-secondary-container)',
    };
  }

  if (status === 'changes_requested') {
    return {
      background: 'var(--md-error-container)',
      color: 'var(--md-on-error-container)',
    };
  }

  return {
    background: 'var(--md-surface-container-highest)',
    color: 'var(--md-on-surface-variant)',
  };
}

export default function WorkflowControlPage({
  initialItems,
}: {
  initialItems: WorkflowItem[];
}) {
  const toast = useToast();
  const [items, setItems] = useState(initialItems);
  const [resourceFilter, setResourceFilter] = useState<'all' | WorkflowResource>('all');
  const [editorialFilter, setEditorialFilter] = useState<'all' | WorkflowEditorialStatus>('all');
  const [publishFilter, setPublishFilter] = useState<'all' | 'draft' | 'published'>('all');
  const [query, setQuery] = useState('');
  const [actingKey, setActingKey] = useState<string | null>(null);

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();

    return items.filter((item) => {
      if (resourceFilter !== 'all' && item.resource !== resourceFilter) return false;
      if (editorialFilter !== 'all' && item.editorial_status !== editorialFilter) return false;
      if (publishFilter !== 'all' && item.status !== publishFilter) return false;
      if (
        normalizedQuery &&
        !`${item.title} ${WORKFLOW_RESOURCE_CONFIG[item.resource].label}`
          .toLocaleLowerCase()
          .includes(normalizedQuery)
      ) {
        return false;
      }

      return true;
    });
  }, [editorialFilter, items, publishFilter, query, resourceFilter]);

  const stats = useMemo(() => {
    return {
      total: items.length,
      inReview: items.filter((item) => item.editorial_status === 'in_review').length,
      approved: items.filter((item) => item.editorial_status === 'approved').length,
      published: items.filter((item) => item.status === 'published').length,
    };
  }, [items]);

  async function handleAction(item: WorkflowItem, action: WorkflowAction) {
    const actingId = `${item.resource}:${item.id}:${action}`;
    setActingKey(actingId);

    const notes =
      action === 'request_changes'
        ? window.prompt('أدخل ملاحظات التعديلات المطلوبة:', item.review_notes ?? '') ?? ''
        : action === 'approve'
          ? window.prompt('ملاحظات الاعتماد (اختياري):', item.review_notes ?? '') ?? ''
          : '';

    try {
      const response = await fetch(`/api/workflow/${item.resource}/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, notes }),
      });
      const result = (await response.json().catch(() => null)) as
        | { error?: string; item?: Partial<WorkflowItem> }
        | null;

      if (!response.ok || !result?.item) {
        toast.error(result?.error ?? 'تعذر تنفيذ الإجراء حالياً.');
        setActingKey(null);
        return;
      }

      const updatedItem = result.item;

      setItems((current) =>
        current.map((entry) =>
          entry.id === item.id && entry.resource === item.resource
            ? {
                ...entry,
                ...updatedItem,
                editorial_status:
                  (updatedItem.editorial_status as WorkflowEditorialStatus | undefined) ??
                  entry.editorial_status,
                published_at:
                  (updatedItem.published_at as string | null | undefined) ??
                  entry.published_at,
                reviewed_at:
                  (updatedItem.reviewed_at as string | null | undefined) ??
                  entry.reviewed_at,
                review_notes:
                  (updatedItem.review_notes as string | null | undefined) ??
                  entry.review_notes,
              }
            : entry,
        ),
      );

      toast.success(`تم تنفيذ: ${WORKFLOW_ACTION_LABELS[action]}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'تعذر تنفيذ الإجراء حالياً.');
    } finally {
      setActingKey(null);
    }
  }

  return (
    <div className="space-y-6">
      <section
        className="rounded-[calc(var(--md-shape-xl)+4px)] border p-6"
        style={{
          borderColor: 'var(--md-outline-variant)',
          background:
            'linear-gradient(135deg, var(--md-surface-container-low) 0%, var(--md-surface) 100%)',
        }}
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <p className="md-label-large" style={{ color: 'var(--md-primary)' }}>
              مركز سير التحرير
            </p>
            <h1 className="md-display-small" style={{ color: 'var(--md-on-surface)' }}>
              التحكم الكامل في المراجعة والنشر عبر كل الوحدات
            </h1>
            <p className="md-body-medium max-w-3xl" style={{ color: 'var(--md-on-surface-variant)' }}>
              من هنا تتابع كل العناصر القابلة للنشر، ترسلها للمراجعة، تعتمدها، وتنشرها أو تعيدها إلى المسودة بدون التنقل بين الجداول المتفرقة.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            ['إجمالي العناصر', stats.total],
            ['قيد المراجعة', stats.inReview],
            ['جاهزة للنشر', stats.approved],
            ['منشورة', stats.published],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-[var(--md-shape-l)] border px-4 py-4"
              style={{
                borderColor: 'var(--md-outline-variant)',
                background: 'var(--md-surface-container-lowest)',
              }}
            >
              <p className="md-body-small" style={{ color: 'var(--md-on-surface-variant)' }}>
                {label}
              </p>
              <p className="mt-2 md-headline-small" style={{ color: 'var(--md-on-surface)' }}>
                {value}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="md-card-outlined p-5 space-y-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.5fr)_repeat(3,minmax(0,0.8fr))]">
          <label
            className="flex items-center gap-3 rounded-[var(--md-shape-l)] border px-4 py-3"
            style={{
              borderColor: 'var(--md-outline-variant)',
              background: 'var(--md-surface-container-low)',
            }}
          >
            <Search size={18} style={{ color: 'var(--md-on-surface-variant)' }} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="ابحث بالعنوان أو اسم الوحدة"
              className="min-w-0 flex-1 bg-transparent outline-none md-body-medium"
              style={{ color: 'var(--md-on-surface)' }}
            />
          </label>

          <select
            value={resourceFilter}
            onChange={(event) =>
              setResourceFilter(event.target.value as typeof resourceFilter)
            }
            className="h-12 rounded-[var(--md-shape-l)] border px-4 md-body-medium outline-none"
            style={{
              borderColor: 'var(--md-outline-variant)',
              background: 'var(--md-surface-container-low)',
              color: 'var(--md-on-surface)',
            }}
          >
            <option value="all">كل الوحدات</option>
            {Object.entries(WORKFLOW_RESOURCE_CONFIG).map(([resource, config]) => (
              <option key={resource} value={resource}>
                {config.label}
              </option>
            ))}
          </select>

          <select
            value={editorialFilter}
            onChange={(event) =>
              setEditorialFilter(event.target.value as typeof editorialFilter)
            }
            className="h-12 rounded-[var(--md-shape-l)] border px-4 md-body-medium outline-none"
            style={{
              borderColor: 'var(--md-outline-variant)',
              background: 'var(--md-surface-container-low)',
              color: 'var(--md-on-surface)',
            }}
          >
            <option value="all">كل حالات التحرير</option>
            {Object.entries(WORKFLOW_EDITORIAL_STATUS_LABELS).map(([status, label]) => (
              <option key={status} value={status}>
                {label}
              </option>
            ))}
          </select>

          <select
            value={publishFilter}
            onChange={(event) =>
              setPublishFilter(event.target.value as typeof publishFilter)
            }
            className="h-12 rounded-[var(--md-shape-l)] border px-4 md-body-medium outline-none"
            style={{
              borderColor: 'var(--md-outline-variant)',
              background: 'var(--md-surface-container-low)',
              color: 'var(--md-on-surface)',
            }}
          >
            <option value="all">كل حالات النشر</option>
            <option value="draft">مسودة</option>
            <option value="published">منشور</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--md-surface-container)' }}>
                {['العنوان', 'الوحدة', 'التحرير', 'النشر', 'آخر توقيت', 'ملاحظات', 'إجراءات'].map((header) => (
                  <th
                    key={header}
                    className="px-4 py-3 text-right md-label-medium"
                    style={{ color: 'var(--md-on-surface-variant)' }}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => {
                const tone = editorialTone(item.editorial_status);
                const availableActions = getAvailableActions(item);

                return (
                  <tr
                    key={`${item.resource}:${item.id}`}
                    style={{ borderTop: '1px solid var(--md-outline-variant)' }}
                  >
                    <td className="px-4 py-4 md-body-medium font-semibold" style={{ color: 'var(--md-on-surface)' }}>
                      <div className="space-y-1">
                        <div>{item.title}</div>
                        <Link
                          href={item.edit_href}
                          className="inline-flex items-center gap-1 text-xs"
                          style={{ color: 'var(--md-primary)' }}
                        >
                          فتح التحرير
                          <ExternalLink size={12} />
                        </Link>
                      </div>
                    </td>
                    <td className="px-4 py-4 md-body-small" style={{ color: 'var(--md-on-surface-variant)' }}>
                      {WORKFLOW_RESOURCE_CONFIG[item.resource].label}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className="rounded-[var(--md-shape-full)] px-3 py-1 md-label-small"
                        style={tone}
                      >
                        {WORKFLOW_EDITORIAL_STATUS_LABELS[item.editorial_status]}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className="rounded-[var(--md-shape-full)] px-3 py-1 md-label-small"
                        style={{
                          background:
                            item.status === 'published'
                              ? 'var(--md-primary-container)'
                              : 'var(--md-surface-container-highest)',
                          color:
                            item.status === 'published'
                              ? 'var(--md-on-primary-container)'
                              : 'var(--md-on-surface-variant)',
                        }}
                      >
                        {item.status === 'published' ? 'منشور' : 'مسودة'}
                      </span>
                    </td>
                    <td className="px-4 py-4 md-body-small" style={{ color: 'var(--md-on-surface-variant)' }}>
                      <div className="space-y-1">
                        <div>إنشاء: {new Date(item.created_at).toLocaleString('ar-MA')}</div>
                        <div>مراجعة: {item.reviewed_at ? new Date(item.reviewed_at).toLocaleString('ar-MA') : '—'}</div>
                        <div>نشر: {item.published_at ? new Date(item.published_at).toLocaleString('ar-MA') : '—'}</div>
                      </div>
                    </td>
                    <td className="px-4 py-4 md-body-small" style={{ color: 'var(--md-on-surface-variant)' }}>
                      {item.review_notes || '—'}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        {availableActions.map((action) => {
                          const actionKey = `${item.resource}:${item.id}:${action}`;
                          return (
                            <button
                              key={action}
                              type="button"
                              onClick={() => void handleAction(item, action)}
                              disabled={actingKey === actionKey}
                              className="md-btn md-state disabled:opacity-50"
                              style={{
                                height: 34,
                                padding: '0 14px',
                                fontSize: 13,
                                background:
                                  action === 'publish'
                                    ? 'var(--md-primary-container)'
                                    : action === 'request_changes'
                                      ? 'var(--md-error-container)'
                                      : 'var(--md-surface-container-high)',
                                color:
                                  action === 'publish'
                                    ? 'var(--md-on-primary-container)'
                                    : action === 'request_changes'
                                      ? 'var(--md-on-error-container)'
                                      : 'var(--md-on-surface)',
                                borderRadius: 'var(--md-shape-full)',
                              }}
                            >
                              {actingKey === actionKey ? '...' : WORKFLOW_ACTION_LABELS[action]}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredItems.length === 0 ? (
          <div
            className="rounded-[var(--md-shape-l)] border border-dashed px-4 py-8 text-center md-body-medium"
            style={{
              borderColor: 'var(--md-outline-variant)',
              color: 'var(--md-on-surface-variant)',
              background: 'var(--md-surface-container-low)',
            }}
          >
            لا توجد عناصر مطابقة للفلاتر الحالية.
          </div>
        ) : null}
      </section>
    </div>
  );
}
