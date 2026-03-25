import type { ReactNode } from 'react';
import Link from 'next/link';

interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
}

export default function DataTable<T extends { id: string }>({
  title,
  rows,
  columns,
  emptyMessage,
  actionHref,
  actionLabel,
  description,
}: {
  title: string;
  rows: T[];
  columns: Column<T>[];
  emptyMessage: string;
  actionHref?: string;
  actionLabel?: string;
  description?: string;
}) {
  return (
    <section className="md-card-outlined overflow-hidden">
      <div
        className="flex items-center justify-between px-6 py-4"
        style={{
          borderBottom: '1px solid var(--md-outline-variant)',
          background: 'linear-gradient(180deg, var(--md-surface-container-low) 0%, var(--md-surface) 100%)',
        }}
      >
        <div className="space-y-1">
          <h2 className="md-title-medium" style={{ color: 'var(--md-on-surface)' }}>
            {title}
          </h2>
          {description ? (
            <p className="md-body-small" style={{ color: 'var(--md-on-surface-variant)' }}>
              {description}
            </p>
          ) : null}
        </div>

        {actionHref && actionLabel ? (
          <Link href={actionHref} className="md-btn md-btn-tonal md-state" style={{ height: 36, padding: '0 16px', fontSize: 13 }}>
            {actionLabel}
          </Link>
        ) : null}
      </div>

      {rows.length === 0 ? (
        <div className="px-6 py-12 text-center md-body-medium" style={{ color: 'var(--md-on-surface-variant)' }}>
          {emptyMessage}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--md-surface-container-low)' }}>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className="px-6 py-3 text-right md-label-medium"
                    style={{ color: 'var(--md-on-surface-variant)' }}
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className="transition-colors hover:bg-[var(--md-surface-container)]"
                  style={{ borderTop: '1px solid var(--md-outline-variant)' }}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className="px-6 py-4 align-top md-body-medium"
                      style={{ color: 'var(--md-on-surface)' }}
                    >
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
