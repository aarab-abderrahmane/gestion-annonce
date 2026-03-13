export const revalidate = 60;

import Announcements from '@/components/legacy/Announcements';
import { normalizeAnnouncement } from '@/lib/portal-data';
import { createClient } from '@/lib/supabase/server';

export default async function Page() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('announcements')
    .select(`
      id, title, slug, description, published_at, expires_at, status,
      divisions(name),
      groups(name),
      announcement_files(file_url, file_name, file_type),
      announcement_category_links(announcement_categories(name, slug))
    `)
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  if (error) console.error(error);

  const announcements = (data ?? []).map(normalizeAnnouncement);
  return <Announcements announcements={announcements} />;
}
