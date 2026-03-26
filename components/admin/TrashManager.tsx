"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowUpRight, RotateCcw, Search, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useErrorToast } from '@/components/ui/useErrorToast';
import { useToast } from '@/components/ui/ToastProvider';
import {
  ADMIN_RESOURCE_LABELS,
  type AdminResource,
} from '@/lib/admin-permissions';
import { getErrorMessage } from '@/lib/errors';
import type { ContentStatus } from '@/types';

type TrashResource = Extract<
  AdminResource,
  'announcements' | 'breaking_news' | 'danger_news' | 'events' | 'home_carousel'
>;

export type TrashManagerItem = {
  key: string;
  id: string;
  resource: TrashResource;
  title: string;
  summary: string;
  deletedAt: string;
  status: ContentStatus;
  href: string;
};

type DialogState =
  | { open: false }
  | {
      open: true;
      action: 'restore' | 'purge';
      keys: string[];
    };

const RESOURCE_ORDER: TrashResource[] = [
  'announcements',
  'events',
  'breaking_news',
  'danger_news',
  'home_carousel',
];

const RESOURCE_ENDPOINTS: Record<TrashResource, string> = {
  announcements: '/api/announcements',
  events: '/api/events',
  breaking_news: '/api/breaking-news',
  danger_news: '/api/danger-news',
  home_carousel: '/api/home-carousel',
};

const RESOURCE_BADGE_STYLES: Record<TrashResource, { background: string; color: string }> = {
  announcements: {
    background: 'var(--md-primary-container)',
    color: 'var(--md-on-primary-container)',
  },
  events: {
    background: 'var(--md-tertiary-container)',
    color: 'var(--md-on-tertiary-container)',
  },
  breaking_news: {
    background: 'var(--md-error-container)',
    color: 'var(--md-on-error-container)',
  },
  danger_news: {
    background: 'color-mix(in srgb, var(--md-error-container) 82%, white 18%)',
    color: 'var(--md-on-error-container)',
  },
  home_carousel: {
    background: 'var(--md-secondary-container)',
    color: 'var(--md-on-secondary-container)',
  },
};

const STATUS_BADGE_STYLES: Record<ContentStatus, { background: string; color: string; label: string }> = {
  published: {
    background: 'var(--md-primary-container)',
    color: 'var(--md-on-primary-container)',
    label: 'منشور',
  },
  draft: {
    background: 'var(--md-surface-container-highest)',
    color: 'var(--md-on-surface-variant)',
    label: 'مسودة',
  },
};

const dateFormatter = new Intl.DateTimeFormat('ar-MA', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

function sortItems(items: TrashManagerItem[]) {
  return [...items].sort(
    (left, right) =>
      new Date(right.deletedAt).getTime() - new Date(left.deletedAt).getTime(),
  );
}

function formatDate(value: string) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return dateFormatter.format(parsed);
}

async function parseActionResponse(response: Response) {
  return (await response.json().catch(() => null)) as { error?: string } | null;
}

async function runTrashAction(
  item: TrashManagerItem,
  action: 'restore' | 'purge',
) {
  const endpoint = `${RESOURCE_ENDPOINTS[item.resource]}/${item.id}`;
  const response =
    action === 'restore'
      ? await fetch(endpoint, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action: 'restore' }),
        })
      : await fetch(`${endpoint}?purge=true`, {
          method: 'DELETE',
        });

  const result = await parseActionResponse(response);

  if (!response.ok) {
    throw new Error(
      result?.error ??
        (action === 'restore'
          ? 'تعذر استرجاع العنصر المحدد.'
          : 'تعذر حذف العنصر المحدد نهائيا.'),
    );
  }
}

export default function TrashManager({
  initialItems,
}: {
  initialItems: TrashManagerItem[];
}) {
  const router = useRouter();
  const toast = useToast();
  const selectAllRef = useRef<HTMLInputElement | null>(null);
  const [items, setItems] = useState<TrashManagerItem[]>(() =>
    sortItems(initialItems),
  );
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [resourceFilter, setResourceFilter] = useState<'all' | TrashResource>('all');
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [dialogState, setDialogState] = useState<DialogState>({ open: false });

  useErrorToast(error);

  useEffect(() => {
    setItems(sortItems(initialItems));
  }, [initialItems]);

  const selectedKeySet = useMemo(() => new Set(selectedKeys), [selectedKeys]);
  const normalizedQuery = query.trim().toLowerCase();

  const countsByResource = useMemo(() => {
    return items.reduce<Record<TrashResource, number>>(
      (accumulator, item) => {
        accumulator[item.resource] += 1;
        return accumulator;
      },
      {
        announcements: 0,
        events: 0,
        breaking_news: 0,
        danger_news: 0,
        home_carousel: 0,
      },
    );
  }, [items]);

  const visibleItems = useMemo(() => {
    return items.filter((item) => {
      if (resourceFilter !== 'all' && item.resource !== resourceFilter) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const haystack = [
        item.title,
        item.summary,
        ADMIN_RESOURCE_LABELS[item.resource],
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [items, normalizedQuery, resourceFilter]);

  const visibleSelectedCount = useMemo(
    () => visibleItems.filter((item) => selectedKeySet.has(item.key)).length,
    [selectedKeySet, visibleItems],
  );

  const allVisibleSelected =
    visibleItems.length > 0 && visibleSelectedCount === visibleItems.length;
  const someVisibleSelected =
    visibleSelectedCount > 0 && visibleSelectedCount < visibleItems.length;

  useEffect(() => {
    if (!selectAllRef.current) return;
    selectAllRef.current.indeterminate = someVisibleSelected;
  }, [someVisibleSelected]);

  const dialogItems = useMemo(() => {
    if (!dialogState.open) return [];

    const keyedItems = new Map(items.map((item) => [item.key, item]));
    return dialogState.keys
      .map((key) => keyedItems.get(key))
      .filter((item): item is TrashManagerItem => Boolean(item));
  }, [dialogState, items]);

  function toggleSelection(key: string) {
    setSelectedKeys((current) =>
      current.includes(key)
        ? current.filter((item) => item !== key)
        : [...current, key],
    );
  }

  function toggleVisibleSelection() {
    const visibleKeys = visibleItems.map((item) => item.key);

    setSelectedKeys((current) => {
      if (allVisibleSelected) {
        return current.filter((key) => !visibleKeys.includes(key));
      }

      return [...new Set([...current, ...visibleKeys])];
    });
  }

  function clearSelection() {
    setSelectedKeys([]);
  }

  function requestAction(action: 'restore' | 'purge', keys: string[]) {
    if (keys.length === 0 || submitting) return;
    setDialogState({ open: true, action, keys });
  }

  async function handleConfirmAction() {
    if (!dialogState.open) return;

    const targetItems = dialogItems;
    if (targetItems.length === 0) {
      setDialogState({ open: false });
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const results = await Promise.allSettled(
        targetItems.map((item) => runTrashAction(item, dialogState.action)),
      );

      const successfulKeys: string[] = [];
      const failedMessages: string[] = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successfulKeys.push(targetItems[index].key);
          return;
        }

        failedMessages.push(getErrorMessage(result.reason));
      });

      if (successfulKeys.length > 0) {
        const successfulKeySet = new Set(successfulKeys);

        setItems((current) =>
          current.filter((item) => !successfulKeySet.has(item.key)),
        );
        setSelectedKeys((current) =>
          current.filter((key) => !successfulKeySet.has(key)),
        );

        toast.success(
          dialogState.action === 'restore'
            ? `تم استرجاع ${successfulKeys.length} عنصر بنجاح.`
            : `تم حذف ${successfulKeys.length} عنصر نهائيا.`,
        );
        router.refresh();
      }

      if (failedMessages.length > 0) {
        setError(failedMessages[0]);
      }
    } finally {
      setSubmitting(false);
      setDialogState({ open: false });
    }
  }

  const actionCount = dialogItems.length;
  const firstDialogItem = dialogItems[0] ?? null;
  const purgeVerificationText =
    dialogState.open && dialogState.action === 'purge'
      ? actionCount === 1
        ? firstDialogItem?.title ?? null
        : String(actionCount)
      : null;

  return (
    <div className="space-y-6">
      <ConfirmDialog
        key={
          dialogState.open
            ? `${dialogState.action}:${dialogState.keys.join(',')}`
            : 'trash-center-dialog-closed'
        }
        open={dialogState.open}
        onClose={() => setDialogState({ open: false })}
        onConfirm={() => void handleConfirmAction()}
        title={
          dialogState.open && dialogState.action === 'purge'
            ? 'حذف نهائي من سلة المهملات'
            : 'استرجاع عناصر من سلة المهملات'
        }
        description={
          dialogState.open && dialogState.action === 'purge'
            ? actionCount === 1
              ? 'سيتم حذف هذا العنصر نهائيًا من قاعدة البيانات. لا يمكن التراجع عن هذا الإجراء.'
              : `سيتم حذف ${actionCount} عناصر نهائيًا من قاعدة البيانات. لا يمكن التراجع عن هذا الإجراء.`
            : actionCount === 1
              ? 'سيتم استرجاع هذا العنصر وإعادته إلى قسمه الأصلي.'
              : `سيتم استرجاع ${actionCount} عناصر وإعادتها إلى أقسامها الأصلية.`
        }
        confirmLabel={
          dialogState.open && dialogState.action === 'purge'
            ? 'حذف نهائيًا'
            : 'استرجاع'
        }
        confirmVariant={
          dialogState.open && dialogState.action === 'purge'
            ? 'destructive'
            : 'filled'
        }
        loading={submitting}
        verificationText={purgeVerificationText}
        verificationLabel={
          purgeVerificationText
            ? actionCount === 1
              ? 'أعد كتابة عنوان العنصر للتأكيد'
              : 'أعد كتابة عدد العناصر المحددة للتأكيد'
            : undefined
        }
      />

      <section className="md-card-outlined p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2
              className="md-title-large"
              style={{ color: 'var(--md-on-surface)' }}
            >
              مركز سلة المهملات
            </h2>
            <p
              className="md-body-small mt-2 max-w-3xl"
              style={{ color: 'var(--md-on-surface-variant)' }}
            >
              راقب جميع العناصر المحذوفة من الإعلانات والفعاليات والأخبار والكاروسيل، ثم استرجعها أو احذفها نهائيًا بشكل فردي أو جماعي.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <span
              className="rounded-full px-3 py-1.5 md-label-small"
              style={{
                background: 'var(--md-secondary-container)',
                color: 'var(--md-on-secondary-container)',
              }}
            >
              إجمالي المهملات: {items.length}
            </span>
            <span
              className="rounded-full px-3 py-1.5 md-label-small"
              style={{
                background: selectedKeys.length
                  ? 'var(--md-primary-container)'
                  : 'var(--md-surface-container-highest)',
                color: selectedKeys.length
                  ? 'var(--md-on-primary-container)'
                  : 'var(--md-on-surface-variant)',
              }}
            >
              المحدد: {selectedKeys.length}
            </span>
          </div>
        </div>
      </section>

      <section className="md-card-outlined space-y-5 p-6">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            label="البحث داخل المهملات"
            placeholder="ابحث بالعنوان أو القسم"
            startAdornment={
              <Search
                size={18}
                style={{ color: 'var(--md-on-surface-variant)' }}
              />
            }
          />

          <div className="flex flex-wrap items-end gap-2">
            <Button
              type="button"
              variant="tonal"
              onClick={() => requestAction('restore', selectedKeys)}
              disabled={selectedKeys.length === 0}
              leftIcon={<RotateCcw size={16} />}
            >
              استرجاع المحدد
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => requestAction('purge', selectedKeys)}
              disabled={selectedKeys.length === 0}
              leftIcon={<Trash2 size={16} />}
            >
              حذف المحدد نهائيًا
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setResourceFilter('all')}
            className="md-chip"
            style={
              resourceFilter === 'all'
                ? {
                    background: 'var(--md-tertiary-container)',
                    borderColor: 'transparent',
                    color: 'var(--md-on-tertiary-container)',
                  }
                : {}
            }
          >
            الكل ({items.length})
          </button>
          {RESOURCE_ORDER.map((resource) => (
            <button
              key={resource}
              type="button"
              onClick={() => setResourceFilter(resource)}
              className="md-chip"
              style={
                resourceFilter === resource
                  ? {
                      background: RESOURCE_BADGE_STYLES[resource].background,
                      borderColor: 'transparent',
                      color: RESOURCE_BADGE_STYLES[resource].color,
                    }
                  : {}
              }
            >
              {ADMIN_RESOURCE_LABELS[resource]} ({countsByResource[resource]})
            </button>
          ))}
        </div>

        <div
          className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--md-shape-l)] border px-4 py-3"
          style={{
            borderColor: 'var(--md-outline-variant)',
            background: 'var(--md-surface-container-low)',
          }}
        >
          <label className="flex items-center gap-3 md-body-medium" style={{ color: 'var(--md-on-surface)' }}>
            <input
              ref={selectAllRef}
              type="checkbox"
              checked={allVisibleSelected}
              onChange={toggleVisibleSelection}
              disabled={visibleItems.length === 0}
              className="h-4 w-4 accent-[var(--md-primary)]"
            />
            تحديد العناصر الظاهرة ({visibleItems.length})
          </label>

          <div className="flex flex-wrap items-center gap-3">
            {selectedKeys.length > 0 ? (
              <button
                type="button"
                onClick={clearSelection}
                className="md-btn md-btn-text md-state"
              >
                إلغاء التحديد
              </button>
            ) : null}
            <span className="md-body-small" style={{ color: 'var(--md-on-surface-variant)' }}>
              الظاهر حالياً: {visibleItems.length}
            </span>
          </div>
        </div>

        {visibleItems.length === 0 ? (
          <div
            className="rounded-[var(--md-shape-xl)] border border-dashed px-5 py-10 text-center"
            style={{
              borderColor: 'var(--md-outline-variant)',
              color: 'var(--md-on-surface-variant)',
            }}
          >
            <p className="md-body-medium">
              {items.length === 0
                ? 'سلة المهملات فارغة حالياً.'
                : 'لا توجد عناصر تطابق الفلتر الحالي.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleItems.map((item) => {
              const statusBadge = STATUS_BADGE_STYLES[item.status];
              const selected = selectedKeySet.has(item.key);

              return (
                <article
                  key={item.key}
                  className="rounded-[var(--md-shape-xl)] border p-4 transition-colors"
                  style={{
                    borderColor: selected
                      ? 'var(--md-primary)'
                      : 'var(--md-outline-variant)',
                    background: selected
                      ? 'color-mix(in srgb, var(--md-primary-container) 36%, white 64%)'
                      : 'var(--md-surface-container-low)',
                  }}
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="flex min-w-0 gap-4">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleSelection(item.key)}
                        className="mt-1 h-4 w-4 shrink-0 accent-[var(--md-primary)]"
                      />

                      <div className="min-w-0 space-y-3">
                        <div className="flex flex-wrap gap-2">
                          <span
                            className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                            style={RESOURCE_BADGE_STYLES[item.resource]}
                          >
                            {ADMIN_RESOURCE_LABELS[item.resource]}
                          </span>
                          <span
                            className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                            style={{
                              background: statusBadge.background,
                              color: statusBadge.color,
                            }}
                          >
                            {statusBadge.label}
                          </span>
                          <span
                            className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                            style={{
                              background: 'var(--md-surface-container-highest)',
                              color: 'var(--md-on-surface-variant)',
                            }}
                          >
                            حذف في {formatDate(item.deletedAt)}
                          </span>
                        </div>

                        <div className="min-w-0">
                          <h3
                            className="md-title-medium truncate"
                            style={{ color: 'var(--md-on-surface)' }}
                          >
                            {item.title}
                          </h3>
                          <p
                            className="md-body-small mt-2 whitespace-pre-wrap"
                            style={{ color: 'var(--md-on-surface-variant)' }}
                          >
                            {item.summary}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 xl:justify-end">
                      <Link
                        href={item.href}
                        className="md-btn md-btn-text md-state"
                      >
                        <ArrowUpRight size={16} />
                        فتح القسم
                      </Link>
                      <Button
                        type="button"
                        variant="tonal"
                        onClick={() => requestAction('restore', [item.key])}
                        disabled={submitting}
                        leftIcon={<RotateCcw size={16} />}
                      >
                        استرجاع
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => requestAction('purge', [item.key])}
                        disabled={submitting}
                        leftIcon={<Trash2 size={16} />}
                      >
                        حذف نهائي
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
