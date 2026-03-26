export const revalidate = 30;

import type { Metadata } from 'next';
import ImportantInfo from '@/components/legacy/ImportantInfo';
import ErrorToastTrigger from '@/components/ui/ErrorToastTrigger';
import { collectErrorMessages } from '@/lib/errors';
import { normalizeNews } from '@/lib/portal-data';
import { buildPublicMetadata } from '@/lib/site';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = buildPublicMetadata({
  title: 'تنبيهات هامة | ISTA Ait Melloul',
  description: 'مركز التنبيهات الرسمية والعاجلة المنشورة عبر breaking news داخل منصة ISTA Ait Melloul.',
  path: '/important-info',
});

export default async function Page() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('breaking_news')
    .select('id, title, slug, level, status, published_at, created_at, expires_at')
    .eq('status', 'published')
    .is('deleted_at', null)
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });

  const pageErrors = collectErrorMessages([error]);
  const newsItems = (data ?? []).map(normalizeNews);

  return (
    <>
      <ErrorToastTrigger messages={pageErrors} />
      <ImportantInfo newsItems={newsItems} />
    </>
  );
}
