"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Bell, Calendar, Info, Search } from "lucide-react";
import { MOCK_ANNOUNCEMENTS, MOCK_EVENTS, MOCK_NEWS } from "@/lib/mock-data";

export default function Page() {
  const [query, setQuery] = useState("");
  const trimmed = query.trim();

  const results = useMemo(() => {
    if (!trimmed) return { announcements: [], news: [], events: [] };
    return {
      announcements: MOCK_ANNOUNCEMENTS.filter((item) => item.title.includes(trimmed) || item.content.includes(trimmed)),
      news: MOCK_NEWS.filter((item) => item.title.includes(trimmed) || item.description.includes(trimmed)),
      events: MOCK_EVENTS.filter((item) => item.title.includes(trimmed) || item.shortDescription.includes(trimmed) || item.location.includes(trimmed)),
    };
  }, [trimmed]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <div className="max-w-3xl mb-8">
        <h1 className="md-display-small font-extrabold mb-3" style={{ color: 'var(--md-on-surface)' }}>البحث الشامل</h1>
        <p className="md-body-large" style={{ color: 'var(--md-on-surface-variant)' }}>ابحث في الإعلانات والتنبيهات والفعاليات من نفس الواجهة البصرية للموقع.</p>
      </div>
      <div className="w-full flex items-center rounded-full px-5 gap-3 mb-8" style={{ background: 'var(--md-surface-container-high)', height: '56px' }}>
        <Search size={20} style={{ color: 'var(--md-on-surface-variant)', flexShrink: 0 }} />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ابحث في كل المحتوى..." className="flex-1 bg-transparent outline-none md-body-large" style={{ color: 'var(--md-on-surface)', fontFamily: 'var(--md-font-brand)' }} />
      </div>
      <div className="space-y-8">
        <section>
          <div className="flex items-center gap-3 mb-4"><Bell size={18} /><h2 className="md-title-large">الإعلانات</h2></div>
          <div className="space-y-3">
            {results.announcements.map((item) => <Link key={item.id} href={`/announcements/${encodeURIComponent((item as any).slug)}`} className="block p-4 rounded-[16px]" style={{ background: 'var(--md-surface-container-low)', border: '1px solid var(--md-outline-variant)' }}><h3 className="md-title-medium mb-1">{item.title}</h3><p className="md-body-medium line-clamp-2" style={{ color: 'var(--md-on-surface-variant)' }}>{item.content}</p></Link>)}
          </div>
        </section>
        <section>
          <div className="flex items-center gap-3 mb-4"><Info size={18} /><h2 className="md-title-large">التنبيهات</h2></div>
          <div className="space-y-3">
            {results.news.map((item) => <Link key={item.id} href="/important-info" className="block p-4 rounded-[16px]" style={{ background: 'var(--md-surface-container-low)', border: '1px solid var(--md-outline-variant)' }}><h3 className="md-title-medium mb-1">{item.title}</h3><p className="md-body-medium line-clamp-2" style={{ color: 'var(--md-on-surface-variant)' }}>{item.description}</p></Link>)}
          </div>
        </section>
        <section>
          <div className="flex items-center gap-3 mb-4"><Calendar size={18} /><h2 className="md-title-large">الفعاليات</h2></div>
          <div className="space-y-3">
            {results.events.map((item) => <Link key={item.id} href={`/events/${encodeURIComponent((item as any).slug)}`} className="block p-4 rounded-[16px]" style={{ background: 'var(--md-surface-container-low)', border: '1px solid var(--md-outline-variant)' }}><h3 className="md-title-medium mb-1">{item.title}</h3><p className="md-body-medium" style={{ color: 'var(--md-on-surface-variant)' }}>{item.location}</p></Link>)}
          </div>
        </section>
      </div>
    </div>
  );
}
