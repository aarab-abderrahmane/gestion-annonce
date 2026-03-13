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
}: {
  title: string;
  rows: T[];
  columns: Column<T>[];
  emptyMessage: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <section className="md-card-outlined overflow-hidden">
      {/* Card header */}
      <div
        className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: '1px solid var(--md-outline-variant)' }}
      >
        <h2 className="md-title-medium" style={{ color: 'var(--md-on-surface)' }}>
          {title}
        </h2>
        {actionHref && actionLabel ? (
          <Link href={actionHref} className="md-btn md-btn-tonal md-state" style={{ height: 36, padding: '0 16px', fontSize: 13 }}>
            {actionLabel}
          </Link>
        ) : null}
      </div>

      {/* Body */}
      {rows.length === 0 ? (
        <div className="px-6 py-12 text-center md-body-medium" style={{ color: 'var(--md-on-surface-variant)' }}>
          {emptyMessage}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--md-surface-container)' }}>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className="md-label-medium text-right px-6 py-3"
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
                  className="transition-colors hover:bg-[var(--md-surface-container-low)]"
                  style={{ borderTop: '1px solid var(--md-outline-variant)' }}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className="md-body-medium px-6 py-4 align-top"
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
