import {
  BREAKING_NEWS_AUDIT_ACTION_LABELS,
  type BreakingNewsAuditAction,
} from '@/lib/breaking-news-workflow';

type AuditEntry = {
  id: string;
  action: BreakingNewsAuditAction;
  actor_name: string | null;
  actor_email: string | null;
  previous_status: string | null;
  next_status: string | null;
  previous_editorial_status: string | null;
  next_editorial_status: string | null;
  notes: string | null;
  created_at: string;
};

function formatState(value: string | null) {
  if (!value) return '—';
  if (value === 'draft') return 'مسودة';
  if (value === 'published') return 'منشور';
  if (value === 'in_review') return 'قيد المراجعة';
  if (value === 'changes_requested') return 'مطلوب تعديلات';
  if (value === 'approved') return 'تمت الموافقة';
  return value;
}

export default function BreakingNewsAuditTrail({
  entries,
}: {
  entries: AuditEntry[];
}) {
  return (
    <section className="md-card-outlined p-6">
      <div className="space-y-1">
        <h3 className="md-title-large" style={{ color: 'var(--md-on-surface)' }}>
          سجل المراجعة
        </h3>
        <p
          className="md-body-small"
          style={{ color: 'var(--md-on-surface-variant)' }}
        >
          كل تغيير مهم على الخبر يظهر هنا مع الفاعل والحالة قبل وبعد.
        </p>
      </div>

      {entries.length === 0 ? (
        <div
          className="mt-5 rounded-[var(--md-shape-l)] border border-dashed px-4 py-5 md-body-small"
          style={{
            borderColor: 'var(--md-outline-variant)',
            color: 'var(--md-on-surface-variant)',
            background: 'var(--md-surface-container-low)',
          }}
        >
          لا يوجد سجل مراجعة لهذا الخبر بعد.
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {entries.map((entry) => (
            <article
              key={entry.id}
              className="rounded-[var(--md-shape-l)] border p-4"
              style={{
                borderColor: 'var(--md-outline-variant)',
                background: 'var(--md-surface-container-low)',
              }}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <p
                    className="md-title-small"
                    style={{ color: 'var(--md-on-surface)' }}
                  >
                    {BREAKING_NEWS_AUDIT_ACTION_LABELS[entry.action]}
                  </p>
                  <p
                    className="md-body-small"
                    style={{ color: 'var(--md-on-surface-variant)' }}
                  >
                    {(entry.actor_name || entry.actor_email || 'مستخدم إداري')}{' '}
                    • {new Date(entry.created_at).toLocaleString('ar-MA')}
                  </p>
                </div>
                <div
                  className="rounded-[var(--md-shape-full)] px-3 py-1 md-label-small"
                  style={{
                    background: 'var(--md-surface-container-highest)',
                    color: 'var(--md-on-surface-variant)',
                  }}
                >
                  {formatState(entry.previous_editorial_status)} →{' '}
                  {formatState(entry.next_editorial_status)}
                </div>
              </div>

              <div
                className="mt-3 grid gap-2 md:grid-cols-2 md-body-small"
                style={{ color: 'var(--md-on-surface-variant)' }}
              >
                <p>حالة النشر: {formatState(entry.previous_status)} → {formatState(entry.next_status)}</p>
                <p>حالة التحرير: {formatState(entry.previous_editorial_status)} → {formatState(entry.next_editorial_status)}</p>
              </div>

              {entry.notes ? (
                <div
                  className="mt-3 rounded-[var(--md-shape-m)] px-3 py-2 md-body-small"
                  style={{
                    background: 'var(--md-surface-container)',
                    color: 'var(--md-on-surface)',
                  }}
                >
                  {entry.notes}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
