
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Announcement, Event, NewsAlert } from '@/types';
import { Bell, Info, Calendar, ArrowLeft, ChevronLeft, ChevronRight, Search, X, FileText } from 'lucide-react';

interface HomeProps {
  announcements: Announcement[];
  newsItems: NewsAlert[];
  events: Event[];
  onNavigate: (page: string) => void;
}

const FEATURED_SLIDES = [
  {
    id: 1,
    title: 'مستقبل التحول الرقمي',
    subtitle: 'نحو آفاق جديدة من الابتكار والتميز المؤسسي',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1600',
    cta: 'استكشف الفعاليات',
    target: 'events',
  },
  {
    id: 2,
    title: 'بيئة عمل ذكية',
    subtitle: 'إطلاق الحزمة الجديدة من الخدمات الإلكترونية للموظفين',
    image: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=1600',
    cta: 'تصفح الإعلانات',
    target: 'announcements',
  },
  {
    id: 3,
    title: 'ملتقى الإبداع السنوي',
    subtitle: 'شاركنا أفكارك لتطوير مستقبل مؤسستنا نحو الأفضل',
    image: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=1600',
    cta: 'سجل الآن',
    target: 'events',
  },
];

const Home: React.FC<HomeProps> = ({ announcements, newsItems, events, onNavigate }) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const nextSlide = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setActiveSlide((prev) => (prev + 1) % FEATURED_SLIDES.length);
    setTimeout(() => setIsTransitioning(false), 500);
  }, [isTransitioning]);

  const prevSlide = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setActiveSlide((prev) => (prev - 1 + FEATURED_SLIDES.length) % FEATURED_SLIDES.length);
    setTimeout(() => setIsTransitioning(false), 500);
  };

  useEffect(() => {
    const timer = setInterval(nextSlide, 6000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  const latestAnnouncements = announcements.slice(0, 3);
  const breakingNews = newsItems.filter(n => new Date(n.expiryDate) > new Date()).slice(0, 3);
  const upcomingEvents = events.filter(e => e.isUpcoming).slice(0, 3);

  // ── Quick Search ────────────────────────────────────────────────
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const trimmed = query.trim();

  const searchResults = trimmed ? {
    announcements: announcements
      .filter(a => a.title.includes(trimmed) || a.content.includes(trimmed))
      .slice(0, 3),
    news: newsItems
      .filter(n => n.title.includes(trimmed) || n.description.includes(trimmed))
      .slice(0, 3),
    events: events
      .filter(e => e.title.includes(trimmed) || e.shortDescription.includes(trimmed) || e.location.includes(trimmed))
      .slice(0, 3),
  } : null;

  const totalResults = searchResults
    ? searchResults.announcements.length + searchResults.news.length + searchResults.events.length
    : 0;

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const handleResultClick = (page: string) => {
    onNavigate(page);
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-10">

      {/* ── Hero Carousel ──────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden rounded-[28px] h-[480px] md:h-[600px]"
        style={{ background: 'var(--md-inverse-surface)' }}
      >
        {FEATURED_SLIDES.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${index === activeSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
          >
            <div
              className={`absolute inset-0 transition-transform duration-[10s] ease-linear ${index === activeSlide ? 'scale-110' : 'scale-100'
                }`}
            >
              <img src={slide.image} alt={slide.title} className="w-full h-full object-cover opacity-50" />
            </div>

            {/* Scrim */}
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(to top, rgba(0,20,16,0.92) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)' }}
            />

            {/* Content */}
            <div className="relative h-full flex flex-col justify-end p-8 md:p-16 max-w-4xl">
              <div
                className={`transform transition-all duration-700 delay-200 ${index === activeSlide ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
                  }`}
              >
                {/* Assist Chip */}
                <span
                  className="inline-flex items-center px-4 py-1.5 rounded-full mb-5 md-label-medium uppercase tracking-widest"
                  style={{ background: 'var(--md-primary-container)', color: 'var(--md-on-primary-container)' }}
                >
                  محتوى مميز
                </span>

                <h1
                  className="md-display-medium font-extrabold text-white mb-4 leading-tight"
                  style={{ fontFamily: 'var(--md-font-brand)' }}
                >
                  {slide.title}
                </h1>
                <p
                  className="md-title-large mb-8 max-w-2xl leading-relaxed"
                  style={{ color: 'var(--md-primary-container)', fontWeight: 400 }}
                >
                  {slide.subtitle}
                </p>

                {/* Filled Button — large */}
                <button
                  onClick={() => onNavigate(slide.target)}
                  className="md-btn md-btn-filled md-btn-lg flex items-center gap-3"
                  style={{ background: 'white', color: '#003730' }}
                >
                  {slide.cta}
                  <ArrowLeft size={20} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Arrow Buttons */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-4 md:px-8 z-20 pointer-events-none">
          <button
            onClick={prevSlide}
            className="pointer-events-auto w-12 h-12 rounded-full flex items-center justify-center text-white border transition-all"
            style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', borderColor: 'rgba(255,255,255,0.24)' }}
            aria-label="السابق"
          >
            <ChevronRight size={28} />
          </button>
          <button
            onClick={nextSlide}
            className="pointer-events-auto w-12 h-12 rounded-full flex items-center justify-center text-white border transition-all"
            style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', borderColor: 'rgba(255,255,255,0.24)' }}
            aria-label="التالي"
          >
            <ChevronLeft size={28} />
          </button>
        </div>

        {/* Dot Indicators */}
        <div className="absolute bottom-6 right-1/2 translate-x-1/2 flex gap-2 z-20">
          {FEATURED_SLIDES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveSlide(idx)}
              className="h-2 rounded-full transition-all duration-300"
              style={{
                width: idx === activeSlide ? '24px' : '8px',
                background: idx === activeSlide ? 'var(--md-primary-container)' : 'rgba(255,255,255,0.4)',
              }}
              aria-label={`الشريحة ${idx + 1}`}
            />
          ))}
        </div>
      </section>

      {/* ── Quick Search Bar ──────────────────────────────────────── */}
      <div ref={searchRef} className="relative w-full max-w-2xl mx-auto">
        {/* MD3 Search Bar */}
        <div
          className="flex items-center gap-3 rounded-full px-5 transition-all duration-200"
          style={{
            background: isOpen || query ? 'var(--md-surface-container-highest)' : 'var(--md-surface-container-high)',
            height: '56px',
            boxShadow: isOpen ? '0px 4px 8px 3px rgba(0,0,0,0.15), 0px 1px 3px rgba(0,0,0,0.3)' : '0px 1px 2px rgba(0,0,0,0.3), 0px 1px 3px 1px rgba(0,0,0,0.15)',
          }}
        >
          <Search size={20} style={{ color: 'var(--md-on-surface-variant)', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="ابحث في الإعلانات، الأخبار، والفعاليات..."
            value={query}
            onChange={e => { setQuery(e.target.value); setIsOpen(true); }}
            onFocus={() => setIsOpen(true)}
            className="flex-1 bg-transparent outline-none md-title-small"
            style={{
              color: 'var(--md-on-surface)',
              fontFamily: 'var(--md-font-brand)',
              fontWeight: 500,
            }}
          />
          {query && (
            <button
              className="md-icon-btn shrink-0"
              style={{ color: 'var(--md-on-surface-variant)' }}
              onClick={() => { setQuery(''); setIsOpen(false); }}
              aria-label="مسح البحث"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Results Dropdown */}
        {isOpen && trimmed && (
          <div
            className="absolute top-full mt-2 w-full z-30 overflow-hidden"
            style={{
              background: 'var(--md-surface-container-high)',
              borderRadius: 'var(--md-shape-xl)',
              boxShadow: '0px 4px 8px 3px rgba(0,0,0,0.15), 0px 1px 3px rgba(0,0,0,0.3)',
              border: '1px solid var(--md-outline-variant)',
            }}
          >
            {totalResults === 0 ? (
              /* Empty state */
              <div className="flex flex-col items-center py-10 gap-3">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{ background: 'var(--md-surface-container)', color: 'var(--md-on-surface-variant)' }}
                >
                  <Search size={26} />
                </div>
                <p className="md-title-small" style={{ color: 'var(--md-on-surface)' }}>لا توجد نتائج لـ "{trimmed}"</p>
                <p className="md-body-small" style={{ color: 'var(--md-on-surface-variant)' }}>جرب كلمات بحث مختلفة</p>
              </div>
            ) : (
              <div className="max-h-[480px] overflow-y-auto">

                {/* Announcements results */}
                {searchResults!.announcements.length > 0 && (
                  <div>
                    <div
                      className="flex items-center justify-between px-5 py-3"
                      style={{ borderBottom: '1px solid var(--md-outline-variant)' }}
                    >
                      <span className="md-label-small uppercase tracking-widest" style={{ color: 'var(--md-on-surface-variant)' }}>الإعلانات</span>
                      <button
                        onClick={() => handleResultClick('announcements')}
                        className="md-label-small"
                        style={{ color: 'var(--md-primary)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--md-font-brand)', fontWeight: 600 }}
                      >
                        عرض الكل
                      </button>
                    </div>
                    {searchResults!.announcements.map(ann => (
                      <button
                        key={ann.id}
                        onClick={() => handleResultClick('announcements')}
                        className="md-state w-full text-right flex items-center gap-4 px-5 py-4"
                        style={{ color: 'var(--md-on-surface)', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'var(--md-font-brand)', borderBottom: '1px solid var(--md-outline-variant)' }}
                      >
                        <span
                          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                          style={{ background: 'var(--md-tertiary-container)', color: 'var(--md-on-tertiary-container)' }}
                        >
                          <Bell size={15} />
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="md-title-small truncate" style={{ color: 'var(--md-on-surface)' }}>{ann.title}</p>
                          <p className="md-body-small truncate" style={{ color: 'var(--md-on-surface-variant)' }}>{ann.category} · {ann.publishDate}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* News results */}
                {searchResults!.news.length > 0 && (
                  <div>
                    <div
                      className="flex items-center justify-between px-5 py-3"
                      style={{ borderBottom: '1px solid var(--md-outline-variant)' }}
                    >
                      <span className="md-label-small uppercase tracking-widest" style={{ color: 'var(--md-on-surface-variant)' }}>التنبيهات</span>
                      <button
                        onClick={() => handleResultClick('important-info')}
                        className="md-label-small"
                        style={{ color: 'var(--md-primary)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--md-font-brand)', fontWeight: 600 }}
                      >
                        عرض الكل
                      </button>
                    </div>
                    {searchResults!.news.map(n => (
                      <button
                        key={n.id}
                        onClick={() => handleResultClick('important-info')}
                        className="md-state w-full text-right flex items-center gap-4 px-5 py-4"
                        style={{ color: 'var(--md-on-surface)', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'var(--md-font-brand)', borderBottom: '1px solid var(--md-outline-variant)' }}
                      >
                        <span
                          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                          style={{
                            background: n.riskLevel === 'high' ? 'var(--md-error-container)' : 'var(--md-warning-container)',
                            color: n.riskLevel === 'high' ? 'var(--md-on-error-container)' : 'var(--md-on-warning-container)',
                          }}
                        >
                          <Info size={15} />
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="md-title-small truncate" style={{ color: 'var(--md-on-surface)' }}>{n.title}</p>
                          <p className="md-body-small truncate" style={{ color: 'var(--md-on-surface-variant)' }}>{n.riskLevel === 'high' ? 'عاجل' : 'تنبيه'}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Events results */}
                {searchResults!.events.length > 0 && (
                  <div>
                    <div
                      className="flex items-center justify-between px-5 py-3"
                      style={{ borderBottom: '1px solid var(--md-outline-variant)' }}
                    >
                      <span className="md-label-small uppercase tracking-widest" style={{ color: 'var(--md-on-surface-variant)' }}>الفعاليات</span>
                      <button
                        onClick={() => handleResultClick('events')}
                        className="md-label-small"
                        style={{ color: 'var(--md-primary)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--md-font-brand)', fontWeight: 600 }}
                      >
                        عرض الكل
                      </button>
                    </div>
                    {searchResults!.events.map(event => (
                      <button
                        key={event.id}
                        onClick={() => handleResultClick(`event-${event.id}`)}
                        className="md-state w-full text-right flex items-center gap-4 px-5 py-4"
                        style={{ color: 'var(--md-on-surface)', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'var(--md-font-brand)' }}
                      >
                        <span
                          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                          style={{ background: 'var(--md-secondary-container)', color: 'var(--md-on-secondary-container)' }}
                        >
                          <Calendar size={15} />
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="md-title-small truncate" style={{ color: 'var(--md-on-surface)' }}>{event.title}</p>
                          <p className="md-body-small truncate" style={{ color: 'var(--md-on-surface-variant)' }}>{event.location} · {event.date}</p>
                        </div>
                        <span
                          className="md-label-small px-2.5 py-1 rounded-full shrink-0"
                          style={{
                            background: event.isUpcoming ? 'var(--md-primary-container)' : 'var(--md-surface-container-highest)',
                            color: event.isUpcoming ? 'var(--md-on-primary-container)' : 'var(--md-on-surface-variant)',
                          }}
                        >
                          {event.isUpcoming ? 'قادمة' : 'منتهية'}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Footer */}
                <div
                  className="px-5 py-3 text-center"
                  style={{ background: 'var(--md-surface-container)', borderTop: '1px solid var(--md-outline-variant)' }}
                >
                  <p className="md-label-small" style={{ color: 'var(--md-on-surface-variant)' }}>
                    {totalResults} نتيجة لـ "{trimmed}"
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Main Grid ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left / Main column */}
        <div className="lg:col-span-8 flex flex-col gap-8">

          {/* Breaking News — MD3 Outlined Cards */}
          {breakingNews.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-5 px-1">
                <span
                  className="w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ background: 'var(--md-error-container)', color: 'var(--md-on-error-container)' }}
                >
                  <Info size={20} />
                </span>
                <h2 className="md-headline-small" style={{ color: 'var(--md-on-surface)' }}>أخبار عاجلة</h2>
              </div>

              <div className="space-y-4">
                {breakingNews.map(news => {
                  const isHigh = news.riskLevel === 'high';
                  const isMed = news.riskLevel === 'medium';
                  const accentColor = isHigh ? 'var(--md-error)' : isMed ? '#984E00' : 'var(--md-primary)';
                  const containerBg = isHigh ? 'var(--md-error-container)' : isMed ? 'var(--md-warning-container)' : 'var(--md-secondary-container)';
                  const textColor = isHigh ? 'var(--md-on-error-container)' : isMed ? 'var(--md-on-warning-container)' : 'var(--md-on-secondary-container)';

                  return (
                    <div
                      key={news.id}
                      onClick={() => onNavigate('important-info')}
                      className="md-state flex overflow-hidden cursor-pointer transition-all duration-200"
                      style={{
                        background: 'var(--md-surface)',
                        border: '1px solid var(--md-outline-variant)',
                        borderRadius: 'var(--md-shape-xl)',
                        color: 'var(--md-on-surface)',
                      }}
                    >
                      {/* Left accent bar */}
                      <div className="w-1.5 shrink-0 self-stretch" style={{ background: accentColor }} />

                      <div className="flex items-start gap-4 p-5 flex-1">
                        <div
                          className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center"
                          style={{ background: containerBg, color: textColor }}
                        >
                          <span className="text-xs font-bold">!</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3 mb-1">
                            <h3 className="md-title-medium" style={{ color: 'var(--md-on-surface)' }}>{news.title}</h3>
                            <span
                              className="md-label-small rounded-full px-3 py-1 shrink-0 uppercase tracking-wider"
                              style={{ background: containerBg, color: textColor }}
                            >
                              {isHigh ? 'عاجل' : isMed ? 'تنبيه' : 'معلومة'}
                            </span>
                          </div>
                          <p className="md-body-medium leading-relaxed" style={{ color: 'var(--md-on-surface-variant)' }}>
                            {news.description}
                          </p>
                          <p className="md-label-small mt-2" style={{ color: 'var(--md-on-surface-variant)' }}>
                            {new Date(news.publishDate).toLocaleDateString('ar-SA')}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Latest Announcements — MD3 Elevated Card + List */}
          <section
            className="rounded-[28px] overflow-hidden"
            style={{ background: 'var(--md-surface-container-low)', boxShadow: '0px 1px 2px rgba(0,0,0,0.3), 0px 1px 3px 1px rgba(0,0,0,0.15)' }}
          >
            {/* Card Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4">
              <div className="flex items-center gap-3">
                <span
                  className="w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ background: 'var(--md-tertiary-container)', color: 'var(--md-on-tertiary-container)' }}
                >
                  <Bell size={20} />
                </span>
                <h2 className="md-title-large" style={{ color: 'var(--md-on-surface)' }}>آخر الإعلانات</h2>
              </div>
              <button
                onClick={() => onNavigate('announcements')}
                className="md-btn md-btn-text md-label-large"
                style={{ color: 'var(--md-primary)', fontFamily: 'var(--md-font-brand)', fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer' }}
              >
                عرض الكل
              </button>
            </div>

            {/* Divider */}
            <div style={{ height: '1px', background: 'var(--md-outline-variant)', margin: '0 24px' }} />

            {/* List Items */}
            <div>
              {latestAnnouncements.map((ann, i) => (
                <React.Fragment key={ann.id}>
                  <div
                    onClick={() => onNavigate('announcements')}
                    className="md-state flex flex-col md:flex-row gap-4 px-6 py-5 cursor-pointer"
                    style={{ color: 'var(--md-on-surface)' }}
                  >
                    {/* Leading — category + date */}
                    <div className="md:w-40 shrink-0 flex items-center md:flex-col md:items-start gap-3 md:gap-1">
                      <span
                        className="md-label-medium px-3 py-1 rounded-full uppercase tracking-wider"
                        style={{ background: 'var(--md-secondary-container)', color: 'var(--md-on-secondary-container)' }}
                      >
                        {ann.category}
                      </span>
                      <span className="md-body-small" style={{ color: 'var(--md-on-surface-variant)' }}>
                        {ann.publishDate}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="md-title-medium mb-1 leading-snug" style={{ color: 'var(--md-on-surface)' }}>
                        {ann.title}
                      </h3>
                      <p className="md-body-medium line-clamp-2 leading-relaxed" style={{ color: 'var(--md-on-surface-variant)' }}>
                        {ann.content}
                      </p>
                    </div>

                    {/* Trailing arrow */}
                    <div className="hidden md:flex items-center shrink-0" style={{ color: 'var(--md-on-surface-variant)' }}>
                      <ChevronLeft size={24} />
                    </div>
                  </div>
                  {i < latestAnnouncements.length - 1 && (
                    <div style={{ height: '1px', background: 'var(--md-outline-variant)', margin: '0 24px' }} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </section>
        </div>

        {/* Right sidebar — Upcoming Events */}
        <div className="lg:col-span-4">
          <section
            className="rounded-[28px] p-6 flex flex-col h-full"
            style={{ background: 'var(--md-surface-container)' }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="md-title-large" style={{ color: 'var(--md-on-surface)' }}>فعاليات قادمة</h2>
              <span
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: 'var(--md-surface-container-low)', color: 'var(--md-primary)' }}
              >
                <Calendar size={20} />
              </span>
            </div>

            {/* Event List */}
            <div className="flex flex-col gap-3 flex-1">
              {upcomingEvents.map(event => (
                <div
                  key={event.id}
                  onClick={() => onNavigate(`event-${event.id}`)}
                  className="md-state flex gap-4 p-4 rounded-[16px] cursor-pointer transition-all duration-200"
                  style={{
                    background: 'var(--md-surface-container-low)',
                    color: 'var(--md-on-surface)',
                    boxShadow: '0px 1px 2px rgba(0,0,0,0.3), 0px 1px 3px 1px rgba(0,0,0,0.15)',
                  }}
                >
                  {/* Date badge — MD3 style (circular 40dp) */}
                  <div
                    className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center md-title-small"
                    style={{ background: 'var(--md-primary-container)', color: 'var(--md-on-primary-container)' }}
                  >
                    {event.date.split('-')[2]}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="md-title-small leading-snug mb-1 line-clamp-2" style={{ color: 'var(--md-on-surface)' }}>
                      {event.title}
                    </h4>
                    <p className="md-body-small" style={{ color: 'var(--md-on-surface-variant)' }}>
                      {event.location}
                    </p>
                    <span
                      className="md-label-small mt-2 inline-flex items-center gap-1"
                      style={{ color: 'var(--md-primary)' }}
                    >
                      التفاصيل <ArrowLeft size={12} />
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* View All — Outlined Button */}
            <button
              onClick={() => onNavigate('events')}
              className="md-btn md-btn-outlined w-full mt-6"
              style={{
                width: '100%',
                background: 'transparent',
                border: '1px solid var(--md-outline)',
                color: 'var(--md-primary)',
                fontFamily: 'var(--md-font-brand)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              مشاهدة كل الفعاليات
            </button>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Home;
