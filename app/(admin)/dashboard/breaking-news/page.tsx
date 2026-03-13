import Link from 'next/link';
import BreakingNewsTable from '@/components/admin/BreakingNewsTable';
import { createClient } from '@/lib/supabase/server';

export default async function BreakingNewsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('breaking_news')
    .select('id, title, level, status, created_at, expires_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error(error);
  }

  const rows = data ?? [];

  return (
    <section className="rounded-[32px] border border-[#d9cdbb] bg-[#fffdf8] shadow-sm">
      <div className="flex items-center justify-between border-b border-[#ece4d7] px-6 py-5">
        <div>
          <h2 className="text-2xl font-black text-[#123c3a]">Breaking News</h2>
          <p className="mt-1 text-sm text-[#6d7f82]">Manage all breaking news items from Supabase.</p>
        </div>
        <Link href="/dashboard/breaking-news/create" className="rounded-2xl bg-[#123c3a] px-4 py-3 text-sm font-semibold text-white">Ajouter</Link>
      </div>
      {rows.length === 0 ? (
        <div className="px-6 py-12 text-sm text-[#6d7f82]">No breaking news found.</div>
      ) : (
        <BreakingNewsTable rows={rows} />
      )}
    </section>
  );
}
