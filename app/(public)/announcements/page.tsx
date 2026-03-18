export const revalidate = 60;

import type { Metadata } from 'next';
import Announcements from '@/components/legacy/Announcements';
import { hydrateAnnouncementFiles } from '@/lib/announcement-files';
import { normalizeAnnouncement, type PortalAnnouncementRow } from '@/lib/portal-data';
import { buildPublicMetadata } from '@/lib/site';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = buildPublicMetadata({
  title: 'الإعلانات | ISTA Ait Melloul',
  description: 'تصفح جميع الإعلانات الرسمية المنشورة لطلبة وزوار ISTA Ait Melloul.',
  path: '/announcements',
});

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

  const announcementsWithFiles = await hydrateAnnouncementFiles(
    supabase as never,
    (data ?? []) as PortalAnnouncementRow[],
  );
  const announcements = announcementsWithFiles.map(normalizeAnnouncement);
  return <Announcements announcements={announcements} />;
}
