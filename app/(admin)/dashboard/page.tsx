import Link from 'next/link';
import { BellRing, Building2, CalendarDays, Newspaper } from 'lucide-react';
import DataTable from '@/components/admin/DataTable';
import StatsCard from '@/components/admin/StatsCard';
import { createClient } from '@/lib/supabase/server';

export default async function DashboardPage() {
  const supabase = await createClient();

  const [breakingCount, announcementsCount, eventsCount, divisionsCount, announcementsRes, eventsRes] = await Promise.all([
    supabase.from('breaking_news').select('*', { count: 'exact', head: true }),
    supabase.from('announcements').select('*', { count: 'exact', head: true }),
    supabase.from('events').select('*', { count: 'exact', head: true }),
    supabase.from('divisions').select('*', { count: 'exact', head: true }),
    supabase.from('announcements').select('id, title, slug, published_at, status').order('published_at', { ascending: false }).limit(5),
    supabase.from('events').select('id, title, slug, starts_at, status, location').order('starts_at', { ascending: false }).limit(5),
  ]);

  return (
    <div className="space-y-8">
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard label="Total breaking news" value={breakingCount.count ?? 0} accent="#f3b95f" icon={<BellRing size={18} />} />
        <StatsCard label="Total announcements" value={announcementsCount.count ?? 0} accent="#d5eadf" icon={<Newspaper size={18} />} />
        <StatsCard label="Total events" value={eventsCount.count ?? 0} accent="#dbe8ff" icon={<CalendarDays size={18} />} />
        <StatsCard label="Total divisions" value={divisionsCount.count ?? 0} accent="#f7dfd7" icon={<Building2 size={18} />} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <DataTable
          title="Recent announcements"
          rows={announcementsRes.data ?? []}
          emptyMessage="No announcements yet."
          actionHref="/dashboard/announcements"
          actionLabel="Open section"
          columns={[
            { key: 'title', header: 'Title', render: (row) => <span className="font-semibold text-[#123c3a]">{row.title}</span> },
            { key: 'status', header: 'Status', render: (row) => row.status },
            { key: 'published_at', header: 'Published', render: (row) => row.published_at ? new Date(row.published_at).toLocaleDateString('fr-FR') : '-' },
          ]}
        />
        <DataTable
          title="Recent events"
          rows={eventsRes.data ?? []}
          emptyMessage="No events yet."
          actionHref="/dashboard/breaking-news"
          actionLabel="Quick links"
          columns={[
            { key: 'title', header: 'Title', render: (row) => <span className="font-semibold text-[#123c3a]">{row.title}</span> },
            { key: 'location', header: 'Location', render: (row) => row.location || '-' },
            { key: 'starts_at', header: 'Starts', render: (row) => row.starts_at ? new Date(row.starts_at).toLocaleDateString('fr-FR') : '-' },
          ]}
        />
      </div>

      <section className="rounded-[32px] border border-[#d9cdbb] bg-[#fffdf8] p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-bold text-[#123c3a]">Quick links</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard/breaking-news" className="rounded-2xl bg-[#123c3a] px-4 py-3 text-sm font-semibold text-white">Manage breaking news</Link>
          <Link href="/dashboard/announcements" className="rounded-2xl bg-[#ece4d7] px-4 py-3 text-sm font-semibold text-[#38515a]">Announcements</Link>
          <Link href="/dashboard/settings" className="rounded-2xl bg-[#ece4d7] px-4 py-3 text-sm font-semibold text-[#38515a]">Settings</Link>
        </div>
      </section>
    </div>
  );
}
