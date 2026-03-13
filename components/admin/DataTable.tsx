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
    <section className="rounded-[32px] border border-[#d9cdbb] bg-[#fffdf8] shadow-sm">
      <div className="flex items-center justify-between border-b border-[#ece4d7] px-6 py-5">
        <h2 className="text-xl font-bold text-[#123c3a]">{title}</h2>
        {actionHref && actionLabel ? (
          <Link href={actionHref} className="rounded-2xl bg-[#123c3a] px-4 py-2 text-sm font-semibold text-white">
            {actionLabel}
          </Link>
        ) : null}
      </div>
      {rows.length === 0 ? (
        <div className="px-6 py-12 text-sm text-[#6d7f82]">{emptyMessage}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-right">
            <thead>
              <tr className="text-xs uppercase tracking-[0.2em] text-[#9a7b4f]">
                {columns.map((column) => (
                  <th key={column.key} className="px-6 py-4 font-semibold">{column.header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-[#ece4d7] text-sm text-[#38515a]">
                  {columns.map((column) => (
                    <td key={column.key} className="px-6 py-4 align-top">{column.render(row)}</td>
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
