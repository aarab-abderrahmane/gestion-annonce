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
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          label="إجمالي الأخبار العاجلة"
          value={breakingCount.count ?? 0}
          accent="var(--md-error-container)"
          icon={<BellRing size={22} style={{ color: 'var(--md-on-error-container)' }} />}
        />
        <StatsCard
          label="إجمالي الإعلانات"
          value={announcementsCount.count ?? 0}
          accent="var(--md-primary-container)"
          icon={<Newspaper size={22} style={{ color: 'var(--md-on-primary-container)' }} />}
        />
        <StatsCard
          label="إجمالي الفعاليات"
          value={eventsCount.count ?? 0}
          accent="var(--md-tertiary-container)"
          icon={<CalendarDays size={22} style={{ color: 'var(--md-on-tertiary-container)' }} />}
        />
        <StatsCard
          label="إجمالي الأقسام"
          value={divisionsCount.count ?? 0}
          accent="var(--md-secondary-container)"
          icon={<Building2 size={22} style={{ color: 'var(--md-on-secondary-container)' }} />}
        />
      </div>

      {/* Recent items tables */}
      <div className="grid gap-6 xl:grid-cols-2">
        <DataTable
          title="آخر الإعلانات"
          rows={announcementsRes.data ?? []}
          emptyMessage="لا توجد إعلانات بعد."
          actionHref="/dashboard/announcements"
          actionLabel="عرض الكل"
          columns={[
            {
              key: 'title',
              header: 'العنوان',
              render: (row) => (
                <span className="md-body-medium font-semibold" style={{ color: 'var(--md-on-surface)' }}>
                  {row.title}
                </span>
              ),
            },
            {
              key: 'status',
              header: 'الحالة',
              render: (row) => (
                <span
                  className="md-label-small px-3 py-1 rounded-[var(--md-shape-full)]"
                  style={{
                    background: row.status === 'published' ? 'var(--md-primary-container)' : 'var(--md-surface-container-highest)',
                    color: row.status === 'published' ? 'var(--md-on-primary-container)' : 'var(--md-on-surface-variant)',
                  }}
                >
                  {row.status === 'published' ? 'منشور' : 'مسودة'}
                </span>
              ),
            },
            {
              key: 'published_at',
              header: 'تاريخ النشر',
              render: (row) =>
                row.published_at ? new Date(row.published_at).toLocaleDateString('ar-MA') : '—',
            },
          ]}
        />
        <DataTable
          title="آخر الفعاليات"
          rows={eventsRes.data ?? []}
          emptyMessage="لا توجد فعاليات بعد."
          actionHref="/dashboard/events"
          actionLabel="عرض الكل"
          columns={[
            {
              key: 'title',
              header: 'العنوان',
              render: (row) => (
                <span className="md-body-medium font-semibold" style={{ color: 'var(--md-on-surface)' }}>
                  {row.title}
                </span>
              ),
            },
            {
              key: 'location',
              header: 'الموقع',
              render: (row) => row.location || '—',
            },
            {
              key: 'starts_at',
              header: 'تاريخ البدء',
              render: (row) =>
                row.starts_at ? new Date(row.starts_at).toLocaleDateString('ar-MA') : '—',
            },
          ]}
        />
      </div>

      {/* Quick links */}
      <section className="md-card-outlined p-6">
        <h2 className="md-title-medium mb-4" style={{ color: 'var(--md-on-surface)' }}>
          روابط سريعة
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard/breaking-news" className="md-btn md-btn-filled md-state">
            إدارة الأخبار العاجلة
          </Link>
          <Link href="/dashboard/announcements" className="md-btn md-btn-tonal md-state">
            الإعلانات
          </Link>
          <Link href="/dashboard/structure" className="md-btn md-btn-tonal md-state">
            الأقسام والمجموعات
          </Link>
          <Link href="/dashboard/settings" className="md-btn md-btn-outlined md-state">
            الإعدادات
          </Link>
        </div>
      </section>
    </div>
  );
}
