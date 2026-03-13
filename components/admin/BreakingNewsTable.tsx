"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const levelLabels: Record<string, string> = {
  dangerous: 'Dangerous',
  urgent: 'Urgent',
  warning: 'Warning',
};

const levelStyles: Record<string, string> = {
  dangerous: 'bg-[#ffe2dd] text-[#8a1f13]',
  urgent: 'bg-[#fff1cc] text-[#8a5a00]',
  warning: 'bg-[#fff8cf] text-[#8a6b00]',
};

const statusStyles: Record<string, string> = {
  published: 'bg-[#dff3ea] text-[#0f5a46]',
  draft: 'bg-[#ece4d7] text-[#6d7f82]',
};

type Row = {
  id: string;
  title: string;
  level: string;
  status: string;
  created_at: string;
  expires_at: string;
};

export default function BreakingNewsTable({ rows }: { rows: Row[] }) {
  const supabase = createClient();
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-right">
        <thead>
          <tr className="text-xs uppercase tracking-[0.2em] text-[#9a7b4f]">
            <th className="px-6 py-4 font-semibold">Title</th>
            <th className="px-6 py-4 font-semibold">Level</th>
            <th className="px-6 py-4 font-semibold">Status</th>
            <th className="px-6 py-4 font-semibold">Created at</th>
            <th className="px-6 py-4 font-semibold">Expires at</th>
            <th className="px-6 py-4 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-[#ece4d7] text-sm text-[#38515a]">
              <td className="px-6 py-4 font-semibold text-[#123c3a]">{row.title}</td>
              <td className="px-6 py-4">
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${levelStyles[row.level] ?? 'bg-[#ece4d7] text-[#38515a]'}`}>
                  {levelLabels[row.level] ?? row.level}
                </span>
              </td>
              <td className="px-6 py-4">
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusStyles[row.status] ?? 'bg-[#ece4d7] text-[#38515a]'}`}>
                  {row.status}
                </span>
              </td>
              <td className="px-6 py-4">{new Date(row.created_at).toLocaleString('fr-FR')}</td>
              <td className="px-6 py-4">{new Date(row.expires_at).toLocaleString('fr-FR')}</td>
              <td className="px-6 py-4">
                <div className="flex gap-2">
                  <Link href={`/dashboard/breaking-news/${row.id}/edit`} className="rounded-xl bg-[#123c3a] px-3 py-2 text-xs font-semibold text-white">
                    Edit
                  </Link>
                  <button
                    onClick={async () => {
                      if (!window.confirm('Delete this breaking news item?')) return;
                      setDeletingId(row.id);
                      const { error } = await supabase.from('breaking_news').delete().eq('id', row.id);
                      if (error) {
                        alert(error.message);
                        setDeletingId(null);
                        return;
                      }
                      router.refresh();
                    }}
                    disabled={deletingId === row.id}
                    className="rounded-xl bg-[#8a1f13] px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
                  >
                    {deletingId === row.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
