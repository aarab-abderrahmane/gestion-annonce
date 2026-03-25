export const revalidate = 30;

import type { Metadata } from 'next';
import HomeRoute from '@/components/legacy/HomeRoute';
import ErrorToastTrigger from '@/components/ui/ErrorToastTrigger';
import { hydrateAnnouncementFiles } from '@/lib/announcement-files';
import { collectErrorMessages } from '@/lib/errors';
import { normalizeHomeCarouselSlide } from '@/lib/home-carousel';
import {
  normalizeAnnouncement,
  normalizeEvent,
  normalizeNews,
  type PortalAnnouncementRow,
} from '@/lib/portal-data';
import { buildPublicMetadata } from '@/lib/site';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = buildPublicMetadata({
  title: 'الرئيسية | ISTA Ait Melloul',
  description: 'الصفحة الرئيسية لمنصة gestion-annonces الخاصة بـ ISTA Ait Melloul لعرض الإعلانات والمعلومات المهمة والفعاليات.',
  path: '/',
});

export default async function Page() {
  const supabase = await createClient();

  const [
    { data: breakingNewsData, error: newsError },
    { data: announcementsData, error: announcementsError },
    { data: eventsData, error: eventsError },
    { data: slidesData, error: slidesError },
  ] = await Promise.all([
    supabase
      .from('breaking_news')
      .select('id, title, slug, level, status, created_at, expires_at')
      .eq('status', 'published')
      .is('deleted_at', null)
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
      .is('deleted_at', null)
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
      .is('deleted_at', null)
      .order('starts_at', { ascending: false }),
    supabase
      .from('home_carousel_slides')
      .select('id, title, subtitle, image_url, cta_label, target, sort_order, status, created_at, updated_at')
      .eq('status', 'published')
      .is('deleted_at', null)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true }),
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
    slidesError,
    ...announcementFileErrors,
  ]);
  const news = (breakingNewsData ?? []).map(normalizeNews);
  const announcements = announcementsWithFiles.map(normalizeAnnouncement);
  const events = (eventsData ?? []).map(normalizeEvent);
  const slides = (slidesData ?? []).map(normalizeHomeCarouselSlide);

  return (
    <>
      <ErrorToastTrigger messages={pageErrors} />
      <HomeRoute announcements={announcements} newsItems={news} events={events} slides={slides} />
    </>
  );
}
