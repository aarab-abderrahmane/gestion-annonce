export const revalidate = 120;

import type { Metadata } from 'next';
import Link from 'next/link';
import { Bell, CalendarDays, ChevronLeft, Paperclip } from 'lucide-react';
import { hydrateAnnouncementFiles } from '@/lib/announcement-files';
import { normalizeAnnouncement } from '@/lib/portal-data';
import { buildPublicMetadata } from '@/lib/site';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = buildPublicMetadata({
  title: 'معلومات هامة | ISTA Ait Melloul',
  description: 'إعلانات عامة ومعلومات مهمة موجهة لجميع طلبة وزوار ISTA Ait Melloul.',
  path: '/important-info',
});

type CategoryRecord = { slug?: string | null };
type CategoryLinkRecord = {
  announcement_categories?: CategoryRecord | CategoryRecord[] | null;
};
type AnnouncementRow = {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  published_at?: string | null;
  expires_at?: string | null;
  status: string;
  divisions?: { name?: string | null } | null;
  groups?: { name?: string | null } | null;
  announcement_category_links?: CategoryLinkRecord[] | null;
};

function hasGeneralCategory(row: AnnouncementRow) {
  return (row.announcement_category_links ?? []).some((link) => {
    const category = link.announcement_categories;
    if (Array.isArray(category)) {
      return category.some((item) => item?.slug === 'general');
    }

    return category?.slug === 'general';
  });
}

export default async function Page() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('announcements')
    .select(`
      id, title, slug, description, published_at, expires_at, status,
      divisions(name),
      groups(name),
      announcement_category_links(announcement_categories(name, slug))
    `)
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  if (error) console.error(error);

  const generalRows = ((data ?? []) as AnnouncementRow[]).filter(hasGeneralCategory);
  const announcementsWithFiles = await hydrateAnnouncementFiles(
    supabase as never,
    generalRows,
  );
  const announcements = announcementsWithFiles.map(normalizeAnnouncement);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <div className="mb-10 max-w-3xl">
        <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-full" style={{ background: 'var(--md-secondary-container)', color: 'var(--md-on-secondary-container)' }}>
          <Bell size={26} />
        </div>
        <h1 className="md-display-small font-extrabold mb-3" style={{ color: 'var(--md-on-surface)' }}>
          معلومات هامة
        </h1>
        <p className="md-body-large" style={{ color: 'var(--md-on-surface-variant)' }}>
          إعلانات عامة موجهة لجميع الطلبة والزوار، مصنفة ضمن فئة <span className="font-semibold">general</span>.
        </p>
      </div>

      {announcements.length ? (
        <div className="space-y-5">
          {announcements.map((announcement) => (
            <article
              key={announcement.id}
              className="rounded-[28px] p-6 md:p-8"
              style={{
                background: 'var(--md-surface-container-low)',
                border: '1px solid var(--md-outline-variant)',
              }}
            >
              <div className="flex flex-wrap gap-2 mb-5">
                <span
                  className="md-label-small px-3 py-1 rounded-full uppercase tracking-wider"
                  style={{ background: 'var(--md-tertiary-container)', color: 'var(--md-on-tertiary-container)' }}
                >
                  {announcement.category}
                </span>
                {announcement.department ? (
                  <span
                    className="md-label-small px-3 py-1 rounded-full"
                    style={{ background: 'var(--md-surface-container-high)', color: 'var(--md-on-surface-variant)' }}
                  >
                    {announcement.department}
                  </span>
                ) : null}
              </div>

              <h2 className="md-headline-small mb-3" style={{ color: 'var(--md-on-surface)' }}>
                {announcement.title}
              </h2>

              <div className="flex flex-wrap gap-5 mb-5 md-body-medium" style={{ color: 'var(--md-on-surface-variant)' }}>
                <span className="flex items-center gap-2">
                  <CalendarDays size={16} />
                  {announcement.publishDate}
                </span>
                {announcement.attachments?.length ? (
                  <span className="flex items-center gap-2">
                    <Paperclip size={16} />
                    {announcement.attachments.length} مرفق
                  </span>
                ) : null}
              </div>

              <p className="md-body-large whitespace-pre-line mb-6" style={{ color: 'var(--md-on-surface-variant)' }}>
                {announcement.content}
              </p>

              <Link
                href={`/announcements/${encodeURIComponent(announcement.slug)}`}
                className="inline-flex items-center gap-2 md-label-large"
                style={{ color: 'var(--md-primary)' }}
              >
                عرض الإعلان
                <ChevronLeft size={16} />
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <div
          className="rounded-[28px] p-8 text-center"
          style={{ background: 'var(--md-surface-container-low)', border: '1px solid var(--md-outline-variant)' }}
        >
          <h2 className="md-title-large mb-2" style={{ color: 'var(--md-on-surface)' }}>
            لا توجد إعلانات عامة حالياً
          </h2>
          <p className="md-body-medium" style={{ color: 'var(--md-on-surface-variant)' }}>
            ستظهر هنا الإعلانات المصنفة ضمن فئة general بعد نشرها.
          </p>
        </div>
      )}
    </div>
  );
}
