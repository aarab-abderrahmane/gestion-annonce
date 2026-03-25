export const revalidate = 60;

import type { Metadata } from 'next';
import Announcements from '@/components/legacy/Announcements';
import ErrorToastTrigger from '@/components/ui/ErrorToastTrigger';
import { hydrateAnnouncementFiles } from '@/lib/announcement-files';
import { collectErrorMessages } from '@/lib/errors';
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
    .is('deleted_at', null)
    .order('published_at', { ascending: false });

  const announcementFileErrors: string[] = [];

  const announcementsWithFiles = await hydrateAnnouncementFiles(
    supabase as never,
    (data ?? []) as PortalAnnouncementRow[],
    {
      onError: (message) => announcementFileErrors.push(message),
    },
  );
  const pageErrors = collectErrorMessages([error, ...announcementFileErrors]);
  const announcements = announcementsWithFiles.map(normalizeAnnouncement);

  return (
    <>
      <ErrorToastTrigger messages={pageErrors} />
      <Announcements announcements={announcements} />
    </>
  );
}
