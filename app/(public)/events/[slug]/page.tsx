export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import EventDetailPage from '@/components/public/EventDetailPage';
import ErrorToastTrigger from '@/components/ui/ErrorToastTrigger';
import { collectErrorMessages } from '@/lib/errors';
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
  const { data } = await supabase
    .from('events')
    .select('slug')
    .eq('status', 'published')
    .is('deleted_at', null);

  return data?.map((item) => ({ slug: item.slug })) ?? [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from('events')
    .select('title, slug, description, cover_image')
    .eq('status', 'published')
    .is('deleted_at', null)
    .eq('slug', decodeURIComponent(slug))
    .maybeSingle();

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
    .is('deleted_at', null)
    .eq('slug', decodeURIComponent(slug))
    .maybeSingle();

  const pageErrors = collectErrorMessages([error]);

  if (!data) {
    return (
      <>
        <ErrorToastTrigger messages={pageErrors} />
        <div className="mx-auto max-w-5xl px-4 py-8 text-right sm:px-6 lg:px-8 md:py-12">
          {pageErrors.length ? 'تعذر تحميل الفعالية حالياً.' : 'تعذر العثور على الفعالية المطلوبة.'}
        </div>
      </>
    );
  }

  const event = normalizeEvent(data);

  return (
    <>
      <ErrorToastTrigger messages={pageErrors} />
      <EventDetailPage event={event} />
    </>
  );
}
