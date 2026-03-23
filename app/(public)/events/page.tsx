export const revalidate = 300;

import type { Metadata } from 'next';
import EventsRoute from '@/components/legacy/EventsRoute';
import ErrorToastTrigger from '@/components/ui/ErrorToastTrigger';
import { collectErrorMessages } from '@/lib/errors';
import { normalizeEvent } from '@/lib/portal-data';
import { buildPublicMetadata } from '@/lib/site';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = buildPublicMetadata({
  title: 'الفعاليات | ISTA Ait Melloul',
  description: 'أرشيف الفعاليات والأنشطة المنشورة الخاصة بـ ISTA Ait Melloul.',
  path: '/events',
});

export default async function Page() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('events')
    .select(`
      id, title, slug, description, cover_image, location, starts_at, ends_at, total_attendees, status,
      event_people(id, name, role, type),
      event_photos(photo_url),
      event_category_links(event_categories(name, slug))
    `)
    .eq('status', 'published')
    .order('starts_at', { ascending: false });

  const pageErrors = collectErrorMessages([error]);
  const events = (data ?? []).map(normalizeEvent);

  return (
    <>
      <ErrorToastTrigger messages={pageErrors} />
      <EventsRoute events={events} />
    </>
  );
}
