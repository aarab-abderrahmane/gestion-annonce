export const revalidate = 30;

import PublicShell from '@/components/legacy/PublicShell';
import HomeRoute from '@/components/legacy/HomeRoute';
import { hydrateAnnouncementFiles } from '@/lib/announcement-files';
import { normalizeAnnouncement, normalizeEvent, normalizeNews } from '@/lib/portal-data';
import { createClient } from '@/lib/supabase/server';

export default async function Page() {
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

  if (newsError) console.error(newsError);
  if (announcementsError) console.error(announcementsError);
  if (eventsError) console.error(eventsError);

  const announcementsWithFiles = await hydrateAnnouncementFiles(supabase, announcementsData ?? []);
  const news = (breakingNewsData ?? []).map(normalizeNews);
  const announcements = announcementsWithFiles.map(normalizeAnnouncement);
  const events = (eventsData ?? []).map(normalizeEvent);

  return (
    <PublicShell>
      <HomeRoute announcements={announcements} newsItems={news} events={events} />
    </PublicShell>
  );
}
