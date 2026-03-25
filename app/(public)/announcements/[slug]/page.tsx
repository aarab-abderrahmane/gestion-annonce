export const revalidate = 60;

import type { Metadata } from 'next';
import Link from 'next/link';
import { CalendarDays, ChevronLeft, Paperclip } from 'lucide-react';
import ErrorToastTrigger from '@/components/ui/ErrorToastTrigger';
import { hydrateAnnouncementFiles } from '@/lib/announcement-files';
import { collectErrorMessages } from '@/lib/errors';
import { normalizeAnnouncement, type PortalAnnouncementRow } from '@/lib/portal-data';
import { buildPublicMetadata } from '@/lib/site';
import { createClient } from '@/lib/supabase/server';

function toSeoDescription(value?: string | null) {
  const content = (value ?? '').replace(/\s+/g, ' ').trim();
  if (!content) {
    return 'تفاصيل إعلان منشور على منصة ISTA Ait Melloul.';
  }

  return content.length > 160 ? `${content.slice(0, 157)}...` : content;
}

export async function generateStaticParams() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('announcements')
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
    .from('announcements')
    .select('title, slug, description')
    .eq('status', 'published')
    .is('deleted_at', null)
    .eq('slug', decodeURIComponent(slug))
    .maybeSingle();

  if (!data) {
    return buildPublicMetadata({
      title: 'الإعلان غير موجود | ISTA Ait Melloul',
      description: 'تعذر العثور على الإعلان المطلوب على منصة ISTA Ait Melloul.',
      path: `/announcements/${encodeURIComponent(slug)}`,
      type: 'article',
    });
  }

  return buildPublicMetadata({
    title: `${data.title} | ISTA Ait Melloul`,
    description: toSeoDescription(data.description),
    path: `/announcements/${encodeURIComponent(data.slug)}`,
    type: 'article',
  });
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
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
    .eq('slug', decodeURIComponent(slug))
    .maybeSingle();

  const initialErrors = collectErrorMessages([error]);

  if (!data) {
    return (
      <>
        <ErrorToastTrigger messages={initialErrors} />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          {initialErrors.length ? 'تعذر تحميل الإعلان حالياً.' : 'الإعلان غير موجود.'}
        </div>
      </>
    );
  }

  const announcementFileErrors: string[] = [];
  const [announcementRow] = await hydrateAnnouncementFiles(
    supabase as never,
    [data as PortalAnnouncementRow],
    {
      onError: (message) => announcementFileErrors.push(message),
    },
  );
  const pageErrors = collectErrorMessages([error, ...announcementFileErrors]);
  const announcement = normalizeAnnouncement(announcementRow);

  return (
    <>
      <ErrorToastTrigger messages={pageErrors} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <Link href="/announcements" className="inline-flex items-center gap-2 md-label-large mb-8" style={{ color: 'var(--md-primary)' }}>
          <ChevronLeft size={18} /> العودة إلى الإعلانات
        </Link>
        <article className="rounded-[28px] p-8" style={{ background: 'var(--md-surface-container-low)', border: '1px solid var(--md-outline-variant)' }}>
          <div className="flex flex-wrap gap-2 mb-6">
            <span className="md-label-small px-3 py-1 rounded-full uppercase tracking-wider" style={{ background: 'var(--md-tertiary-container)', color: 'var(--md-on-tertiary-container)' }}>{announcement.category}</span>
            {announcement.department && <span className="md-label-small px-3 py-1 rounded-full" style={{ background: 'var(--md-surface-container-high)', color: 'var(--md-on-surface-variant)' }}>{announcement.department}</span>}
          </div>
          <h1 className="md-display-small font-extrabold mb-4" style={{ color: 'var(--md-on-surface)' }}>{announcement.title}</h1>
          <div className="flex flex-wrap gap-6 mb-8 md-body-medium" style={{ color: 'var(--md-on-surface-variant)' }}>
            <span className="flex items-center gap-2"><CalendarDays size={18} />تاريخ النشر: {announcement.publishDate}</span>
            <span>ينتهي في: {announcement.expiryDate}</span>
          </div>
          <p className="md-body-large whitespace-pre-line" style={{ color: 'var(--md-on-surface-variant)' }}>{announcement.content}</p>
          {announcement.attachments?.length ? (
            <section className="mt-10">
              <h2 className="md-title-large mb-4" style={{ color: 'var(--md-on-surface)' }}>المرفقات</h2>
              <div className="space-y-3">
                {announcement.attachments.map((file, index) => (
                  <a key={index} href={file.url} target="_blank" rel="noreferrer" className="flex items-center justify-between p-4 rounded-[16px]" style={{ background: 'var(--md-surface-container)', border: '1px solid var(--md-outline-variant)' }}>
                    <span className="flex items-center gap-3 md-title-small"><Paperclip size={16} />{file.name}</span>
                    <span className="md-label-large" style={{ color: 'var(--md-primary)' }}>فتح</span>
                  </a>
                ))}
              </div>
            </section>
          ) : null}
        </article>
      </div>
    </>
  );
}
