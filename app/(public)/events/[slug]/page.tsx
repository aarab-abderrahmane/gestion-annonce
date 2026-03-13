export const revalidate = 300;

import { normalizeEvent } from '@/lib/portal-data';
import { createClient } from '@/lib/supabase/server';
import EventDetailRoute from '@/components/legacy/EventDetailRoute';

export async function generateStaticParams() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('events')
    .select('slug')
    .eq('status', 'published');

  if (error) console.error(error);
  return data?.map((item) => ({ slug: item.slug })) ?? [];
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
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
    .eq('slug', decodeURIComponent(slug))
    .maybeSingle();

  if (error) console.error(error);
  if (!data) {
    return <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">Not found</div>;
  }

  const event = normalizeEvent(data);
  return <EventDetailRoute event={event} />;
}
