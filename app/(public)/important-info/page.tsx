export const revalidate = 120;

import ImportantInfo from '@/components/legacy/ImportantInfo';
import { normalizeNews } from '@/lib/portal-data';
import { createClient } from '@/lib/supabase/server';

export default async function Page() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('breaking_news')
    .select('id, title, slug, level, status, created_at, expires_at')
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  if (error) console.error(error);

  const newsItems = (data ?? []).map(normalizeNews);
  return <ImportantInfo newsItems={newsItems} />;
}
