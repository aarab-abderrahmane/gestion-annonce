import type { Metadata } from 'next';
import Link from 'next/link';
import { Bell, Calendar, Info, Search } from 'lucide-react';
import ErrorToastTrigger from '@/components/ui/ErrorToastTrigger';
import { hydrateAnnouncementFiles } from '@/lib/announcement-files';
import { collectErrorMessages } from '@/lib/errors';
import {
  normalizeAnnouncement,
  normalizeEvent,
  normalizeNews,
  type PortalAnnouncementRow,
} from '@/lib/portal-data';
import { buildPublicMetadata } from '@/lib/site';
import { createClient } from '@/lib/supabase/server';

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}): Promise<Metadata> {
  const params = await searchParams;
  const query = (params.q || '').trim();

  return buildPublicMetadata({
    title: query ? `نتائج البحث: ${query} | ISTA Ait Melloul` : 'البحث | ISTA Ait Melloul',
    description: query
      ? `نتائج البحث عن "${query}" في الإعلانات والتنبيهات والفعاليات الخاصة بـ ISTA Ait Melloul.`
      : 'ابحث في الإعلانات والتنبيهات والفعاليات المنشورة على منصة ISTA Ait Melloul.',
    path: query ? `/search?q=${encodeURIComponent(query)}` : '/search',
  });
}

export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const params = await searchParams;
  const query = (params.q || '').trim();
  const supabase = await createClient();

  const [{ data: breakingNewsData, error: newsError }, { data: announcementsData, error: announcementsError }, { data: eventsData, error: eventsError }] = await Promise.all([
    supabase
      .from('breaking_news')
      .select('id, title, slug, level, status, created_at, expires_at')
      .eq('status', 'published')
      .order('created_at', { ascending: false }),
    supabase
      .from('announcements')
      .select(`
        id, title, slug, description, published_at, expires_at, status,
        divisions(name),
        groups(name),
        announcement_category_links(announcement_categories(name, slug))
      `)
      .eq('status', 'published')
      .order('published_at', { ascending: false }),
    supabase
      .from('events')
      .select(`
        id, title, slug, description, cover_image, location, starts_at, ends_at, total_attendees, status,
        event_people(id, name, role, type),
        event_photos(photo_url),
        event_category_links(event_categories(name, slug))
      `)
      .eq('status', 'published')
      .order('starts_at', { ascending: false }),
  ]);

  const announcementFileErrors: string[] = [];

  const announcementsWithFiles = await hydrateAnnouncementFiles(
    supabase as never,
    (announcementsData ?? []) as PortalAnnouncementRow[],
    {
      onError: (message) => announcementFileErrors.push(message),
    },
  );
  const pageErrors = collectErrorMessages([
    newsError,
    announcementsError,
    eventsError,
    ...announcementFileErrors,
  ]);
  const announcements = announcementsWithFiles.map(normalizeAnnouncement);
  const news = (breakingNewsData ?? []).map(normalizeNews);
  const events = (eventsData ?? []).map(normalizeEvent);

  const filteredAnnouncements = query
    ? announcements.filter((item) => item.title.includes(query) || item.content.includes(query))
    : [];
  const filteredNews = query
    ? news.filter((item) => item.title.includes(query) || item.description.includes(query))
    : [];
  const filteredEvents = query
    ? events.filter((item) => item.title.includes(query) || item.shortDescription.includes(query) || item.location.includes(query))
    : [];

  return (
    <>
      <ErrorToastTrigger messages={pageErrors} />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="max-w-3xl mb-8">
          <h1 className="md-display-small font-extrabold mb-3" style={{ color: 'var(--md-on-surface)' }}>البحث الشامل</h1>
          <p className="md-body-large" style={{ color: 'var(--md-on-surface-variant)' }}>ابحث في الإعلانات والتنبيهات والفعاليات.</p>
        </div>
        <form className="w-full flex items-center rounded-full px-5 gap-3 mb-8" style={{ background: 'var(--md-surface-container-high)', height: '56px' }}>
          <Search size={20} style={{ color: 'var(--md-on-surface-variant)', flexShrink: 0 }} />
          <input name="q" defaultValue={query} placeholder="ابحث في كل المحتوى..." className="flex-1 bg-transparent outline-none md-body-large" style={{ color: 'var(--md-on-surface)', fontFamily: 'var(--md-font-brand)' }} />
        </form>
        <div className="space-y-8">
          <section>
            <div className="flex items-center gap-3 mb-4"><Bell size={18} /><h2 className="md-title-large">الإعلانات</h2></div>
            <div className="space-y-3">
              {filteredAnnouncements.map((item) => <Link key={item.id} href={`/announcements/${encodeURIComponent(item.slug)}`} className="block p-4 rounded-[16px]" style={{ background: 'var(--md-surface-container-low)', border: '1px solid var(--md-outline-variant)' }}><h3 className="md-title-medium mb-1">{item.title}</h3><p className="md-body-medium line-clamp-2" style={{ color: 'var(--md-on-surface-variant)' }}>{item.content}</p></Link>)}
            </div>
          </section>
          <section>
            <div className="flex items-center gap-3 mb-4"><Info size={18} /><h2 className="md-title-large">التنبيهات</h2></div>
            <div className="space-y-3">
              {filteredNews.map((item) => <Link key={item.id} href="/important-info" className="block p-4 rounded-[16px]" style={{ background: 'var(--md-surface-container-low)', border: '1px solid var(--md-outline-variant)' }}><h3 className="md-title-medium mb-1">{item.title}</h3><p className="md-body-medium line-clamp-2" style={{ color: 'var(--md-on-surface-variant)' }}>{item.description}</p></Link>)}
            </div>
          </section>
          <section>
            <div className="flex items-center gap-3 mb-4"><Calendar size={18} /><h2 className="md-title-large">الفعاليات</h2></div>
            <div className="space-y-3">
              {filteredEvents.map((item) => <Link key={item.id} href={`/events/${encodeURIComponent(item.slug)}`} className="block p-4 rounded-[16px]" style={{ background: 'var(--md-surface-container-low)', border: '1px solid var(--md-outline-variant)' }}><h3 className="md-title-medium mb-1">{item.title}</h3><p className="md-body-medium" style={{ color: 'var(--md-on-surface-variant)' }}>{item.location}</p></Link>)}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
