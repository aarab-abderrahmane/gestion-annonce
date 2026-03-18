import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/site';
import { createClient } from '@/lib/supabase/server';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  const [{ data: announcementRows, error: announcementsError }, { data: eventRows, error: eventsError }] =
    await Promise.all([
      supabase
        .from('announcements')
        .select('slug, published_at')
        .eq('status', 'published')
        .order('published_at', { ascending: false }),
      supabase
        .from('events')
        .select('slug, starts_at')
        .eq('status', 'published')
        .order('starts_at', { ascending: false }),
    ]);

  if (announcementsError) console.error(announcementsError);
  if (eventsError) console.error(eventsError);

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl('/'),
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: absoluteUrl('/announcements'),
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: absoluteUrl('/events'),
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: absoluteUrl('/important-info'),
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
  ];

  const announcementPages: MetadataRoute.Sitemap = (announcementRows ?? [])
    .filter((item) => item.slug)
    .map((item) => ({
      url: absoluteUrl(`/announcements/${encodeURIComponent(item.slug)}`),
      lastModified: item.published_at ? new Date(item.published_at) : new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

  const eventPages: MetadataRoute.Sitemap = (eventRows ?? [])
    .filter((item) => item.slug)
    .map((item) => ({
      url: absoluteUrl(`/events/${encodeURIComponent(item.slug)}`),
      lastModified: item.starts_at ? new Date(item.starts_at) : new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

  return [...staticPages, ...announcementPages, ...eventPages];
}
