export const revalidate = 300;

import type { Metadata } from 'next';
import EventDetailPage from '@/components/public/EventDetailPage';
import { normalizeEvent } from '@/lib/portal-data';
import { buildPublicMetadata } from '@/lib/site';
import { createClient } from '@/lib/supabase/server';

function toSeoDescription(value?: string | null) {
  const content = (value ?? '').replace(/\s+/g, ' ').trim();
  if (!content) {
    return 'تفاصيل فعالية منشورة على منصة ISTA Ait Melloul.';
  }

  return content.length > 160 ? `${content.slice(0, 157)}...` : content;
}

export async function generateStaticParams() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('events')
    .select('slug')
    .eq('status', 'published');

  if (error) console.error(error);
  return data?.map((item) => ({ slug: item.slug })) ?? [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('events')
    .select('title, slug, description, cover_image')
    .eq('status', 'published')
    .eq('slug', decodeURIComponent(slug))
    .maybeSingle();

  if (error) console.error(error);

  if (!data) {
    return buildPublicMetadata({
      title: 'الفعالية غير موجودة | ISTA Ait Melloul',
      description: 'تعذر العثور على الفعالية المطلوبة على منصة ISTA Ait Melloul.',
      path: `/events/${encodeURIComponent(slug)}`,
      type: 'article',
    });
  }

  return buildPublicMetadata({
    title: `${data.title} | ISTA Ait Melloul`,
    description: toSeoDescription(data.description),
    path: `/events/${encodeURIComponent(data.slug)}`,
    type: 'article',
    images: data.cover_image ? [data.cover_image] : undefined,
  });
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
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 text-right sm:px-6 lg:px-8 md:py-12">
        تعذر العثور على الفعالية المطلوبة.
      </div>
    );
  }

  const event = normalizeEvent(data);
  return <EventDetailPage event={event} />;
}
