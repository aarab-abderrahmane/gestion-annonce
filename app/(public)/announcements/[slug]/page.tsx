import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, ChevronLeft, Paperclip } from "lucide-react";
import { findAnnouncementBySlug } from "@/lib/mock-data";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const announcement = findAnnouncementBySlug(decodeURIComponent(slug));

  if (!announcement) {
    notFound();
  }

  return (
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
                <div key={index} className="flex items-center justify-between p-4 rounded-[16px]" style={{ background: 'var(--md-surface-container)', border: '1px solid var(--md-outline-variant)' }}>
                  <span className="flex items-center gap-3 md-title-small"><Paperclip size={16} />{file.name}</span>
                  <span className="md-label-large" style={{ color: 'var(--md-primary)' }}>تنزيل</span>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </article>
    </div>
  );
}
