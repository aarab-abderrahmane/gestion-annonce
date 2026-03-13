"use client";


import React, { useState, useEffect } from 'react';
import { Event } from '@/types';
import {
  Calendar as CalendarIcon,
  MapPin,
  Users,
  CheckCircle2,
  Download,
  Share2,
  ArrowRight,
  ChevronLeft,
  PlayCircle,
  Ticket,
  X as CloseIcon,
  Copy,
  Check,
  Twitter,
  Linkedin,
  MessageCircle,
} from 'lucide-react';

interface EventDetailProps {
  event: Event;
  onBack: () => void;
  onNavigate: (page: string) => void;
}

const EventDetail: React.FC<EventDetailProps> = ({ event, onBack }) => {
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const eventUrl = typeof window !== "undefined" ? window.location.href : "";

  const handleCopyLink = () => {
    navigator.clipboard.writeText(eventUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOptions = [
    { name: 'واتساب', icon: <MessageCircle size={24} />, color: '#25D366', url: `https://wa.me/?text=${encodeURIComponent(event.title + ' ' + eventUrl)}` },
    { name: 'لينكد إن', icon: <Linkedin size={24} />, color: '#0077B5', url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(eventUrl)}` },
    { name: 'إكس', icon: <Twitter size={24} />, color: '#000000', url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(event.title)}&url=${encodeURIComponent(eventUrl)}` },
  ];

  useEffect(() => {
    document.body.style.overflow = isShareOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isShareOpen]);

  return (
    <div style={{ background: 'var(--md-surface)', minHeight: '100vh', paddingBottom: '96px' }}>

      {/* ── Hero Image ──────────────────────────────────────────────── */}
      <div
        className="relative w-full overflow-hidden"
        style={{ height: '480px', borderRadius: '0 0 var(--md-shape-xl) var(--md-shape-xl)' }}
      >
        <img
          src={event.gallery?.[0] || `https://picsum.photos/seed/${event.id}/1600/800`}
          className="w-full h-full object-cover"
          style={{ opacity: 0.65 }}
          alt="صورة الفعالية"
        />
        {/* Gradient scrim */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, rgba(0,20,16,0.95) 0%, rgba(0,0,0,0.25) 60%, transparent 100%)' }}
        />

        {/* Top bar */}
        <div className="absolute top-6 right-0 left-0 px-6 md:px-12 max-w-7xl mx-auto z-20">
          <button
            onClick={onBack}
            className="flex items-center gap-2 rounded-full px-5 py-2.5 md-label-large"
            style={{
              background: 'rgba(255,255,255,0.12)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.24)',
              color: 'white',
              fontFamily: 'var(--md-font-brand)',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <ArrowRight size={18} /> العودة
          </button>
        </div>

        {/* Hero Content */}
        <div className="absolute bottom-0 right-0 left-0 px-8 md:px-16 pb-12 max-w-7xl mx-auto z-20">
          <div className="flex flex-col md:flex-row items-end justify-between gap-8">
            <div className="max-w-3xl">
              {event.logo && (
                <div
                  className="w-16 h-16 bg-white rounded-[16px] overflow-hidden mb-4"
                  style={{ boxShadow: '0px 4px 8px 3px rgba(0,0,0,0.15)' }}
                >
                  <img src={event.logo} alt="شعار الفعالية" className="w-full h-full object-contain" />
                </div>
              )}
              <h1 className="md-display-small font-extrabold text-white mb-4 leading-tight">
                {event.title}
              </h1>
              <div className="flex flex-wrap gap-3">
                <span
                  className="md-label-large flex items-center gap-2 px-4 py-2 rounded-full"
                  style={{ background: 'var(--md-primary-container)', color: 'var(--md-on-primary-container)' }}
                >
                  <CalendarIcon size={16} /> {event.date}
                </span>
                <span
                  className="md-label-large flex items-center gap-2 px-4 py-2 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', color: 'white', border: '1px solid rgba(255,255,255,0.24)' }}
                >
                  <MapPin size={16} /> {event.location}
                </span>
              </div>
            </div>

            {/* CTA (desktop) */}
            <div className="hidden md:flex gap-3 shrink-0">
              <button
                className="md-btn md-btn-filled md-btn-lg flex items-center gap-2"
                style={{ background: 'var(--md-primary-container)', color: 'var(--md-on-primary-container)', fontFamily: 'var(--md-font-brand)', fontWeight: 700, cursor: 'pointer' }}
              >
                <Ticket size={20} /> سجل حضورك
              </button>
              <button
                onClick={() => setIsShareOpen(true)}
                className="md-icon-btn"
                style={{
                  width: '56px', height: '56px',
                  background: 'rgba(255,255,255,0.12)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.24)',
                  color: 'white',
                }}
                aria-label="مشاركة"
              >
                <Share2 size={22} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content ─────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 md:gap-16">

          {/* Main column */}
          <div className="lg:col-span-2 space-y-12">

            {/* Description */}
            {(event.detailedDescription || event.shortDescription) && (
              <section>
                <h2 className="md-headline-medium mb-5" style={{ color: 'var(--md-on-surface)' }}>نبذة تفصيلية</h2>
                <p className="md-body-large leading-relaxed whitespace-pre-line" style={{ color: 'var(--md-on-surface-variant)' }}>
                  {event.detailedDescription || event.shortDescription}
                </p>
              </section>
            )}

            {/* Activities & Audience */}
            {(event.activities || event.targetAudience) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {event.activities && (
                  <section
                    className="p-6 rounded-[28px]"
                    style={{ background: 'var(--md-secondary-container)', border: '1px solid var(--md-outline-variant)' }}
                  >
                    <h3 className="md-title-large mb-5 flex items-center gap-3" style={{ color: 'var(--md-on-secondary-container)' }}>
                      <CheckCircle2 size={22} /> أبرز الأنشطة
                    </h3>
                    <ul className="space-y-3">
                      {event.activities.map((act, i) => (
                        <li key={i} className="flex items-start gap-3 md-body-medium" style={{ color: 'var(--md-on-secondary-container)' }}>
                          <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: 'var(--md-primary)' }} />
                          {act}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
                {event.targetAudience && (
                  <section
                    className="p-6 rounded-[28px]"
                    style={{ background: 'var(--md-warning-container)', border: '1px solid var(--md-outline-variant)' }}
                  >
                    <h3 className="md-title-large mb-5 flex items-center gap-3" style={{ color: 'var(--md-on-warning-container)' }}>
                      <Users size={22} /> الجمهور المستهدف
                    </h3>
                    <ul className="space-y-3">
                      {event.targetAudience.map((aud, i) => (
                        <li key={i} className="flex items-start gap-3 md-body-medium" style={{ color: 'var(--md-on-warning-container)' }}>
                          <ChevronLeft size={18} className="mt-0.5 shrink-0 opacity-60" />
                          {aud}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </div>
            )}

            {/* Program */}
            {event.program && (
              <section>
                <h2 className="md-headline-medium mb-6" style={{ color: 'var(--md-on-surface)' }}>الجدول الزمني</h2>
                <div
                  className="overflow-hidden"
                  style={{
                    background: 'var(--md-surface-container-lowest)',
                    border: '1px solid var(--md-outline-variant)',
                    borderRadius: 'var(--md-shape-xl)',
                  }}
                >
                  {event.program.map((item, idx) => (
                    <React.Fragment key={idx}>
                      <div
                        className="flex flex-col md:flex-row md:items-center gap-4 px-6 py-5 md-state"
                        style={{ color: 'var(--md-on-surface)' }}
                      >
                        {/* Time badge */}
                        <span
                          className="md-label-large px-4 py-2 rounded-[12px] shrink-0 font-mono w-fit"
                          style={{ background: 'var(--md-tertiary-container)', color: 'var(--md-on-tertiary-container)' }}
                        >
                          {item.time}
                        </span>
                        <span className="md-title-medium" style={{ color: 'var(--md-on-surface)' }}>{item.activity}</span>
                      </div>
                      {idx < event.program!.length - 1 && (
                        <div style={{ height: '1px', background: 'var(--md-outline-variant)', margin: '0 24px' }} />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </section>
            )}

            {/* Gallery */}
            {event.gallery && (
              <section>
                <h2 className="md-headline-medium mb-6" style={{ color: 'var(--md-on-surface)' }}>معرض الوسائط</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {event.gallery.map((img, i) => (
                    <div
                      key={i}
                      className="relative aspect-square overflow-hidden cursor-pointer"
                      style={{ borderRadius: 'var(--md-shape-l)' }}
                    >
                      <img
                        src={img}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                        alt={`صورة ${i + 1}`}
                      />
                      {i === 2 && (
                        <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.35)' }}>
                          <PlayCircle className="text-white w-14 h-14" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-8">

            {/* Speakers */}
            {event.speakers && (
              <section
                className="p-6 rounded-[28px]"
                style={{
                  background: 'var(--md-surface-container-low)',
                  border: '1px solid var(--md-outline-variant)',
                  boxShadow: '0px 1px 2px rgba(0,0,0,0.3), 0px 1px 3px 1px rgba(0,0,0,0.15)',
                }}
              >
                <h3 className="md-title-large mb-6" style={{ color: 'var(--md-on-surface)' }}>المتحدثون</h3>
                <div className="space-y-6">
                  {event.speakers.map(speaker => (
                    <div key={speaker.id} className="flex items-start gap-4">
                      <img
                        src={speaker.image}
                        className="w-12 h-12 rounded-full object-cover shrink-0"
                        style={{ border: '2px solid var(--md-secondary-container)' }}
                        alt={speaker.name}
                      />
                      <div>
                        <h4 className="md-title-small" style={{ color: 'var(--md-on-surface)' }}>{speaker.name}</h4>
                        <span
                          className="md-label-small uppercase tracking-wider px-2 py-0.5 rounded-full inline-block mt-1"
                          style={{ background: 'var(--md-secondary-container)', color: 'var(--md-on-secondary-container)' }}
                        >
                          {speaker.role}
                        </span>
                        <p className="md-body-small mt-2 line-clamp-3 leading-relaxed" style={{ color: 'var(--md-on-surface-variant)' }}>
                          {speaker.bio}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Results */}
            {event.results && (
              <section
                className="p-6 rounded-[28px] overflow-hidden relative"
                style={{ background: 'var(--md-on-primary-container)', color: 'var(--md-primary-container)' }}
              >
                <div
                  className="absolute -left-10 -top-10 w-40 h-40 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.05)', filter: 'blur(20px)' }}
                />
                <h3 className="md-title-large mb-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.12)', paddingBottom: '12px' }}>
                  نتائج الحدث
                </h3>
                <ul className="space-y-4">
                  {event.results.map((res, i) => (
                    <li key={i} className="flex items-start gap-3 md-body-medium">
                      <CheckCircle2 size={18} className="mt-0.5 shrink-0" style={{ color: 'var(--md-inverse-primary)' }} />
                      {res}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Documents */}
            {event.documents && (
              <section>
                <h3 className="md-title-medium mb-4 px-1" style={{ color: 'var(--md-on-surface)' }}>وثائق هامة</h3>
                <div className="space-y-3">
                  {event.documents.map((doc, i) => (
                    <a
                      key={i}
                      href={doc.url}
                      className="md-state flex items-center justify-between p-4 rounded-[16px] transition-all"
                      style={{
                        background: 'var(--md-surface-container)',
                        border: '1px solid var(--md-outline-variant)',
                        color: 'var(--md-on-surface)',
                        textDecoration: 'none',
                      }}
                    >
                      <span className="md-title-small">{doc.name}</span>
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ background: 'var(--md-surface-container-low)', color: 'var(--md-on-surface-variant)' }}
                      >
                        <Download size={16} />
                      </div>
                    </a>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Sticky Action Bar */}
      <div
        className="md:hidden fixed bottom-0 left-0 right-0 flex gap-3 p-4 z-40"
        style={{
          background: 'var(--md-surface-container)',
          borderRadius: 'var(--md-shape-xl) var(--md-shape-xl) 0 0',
          boxShadow: '0px -4px 8px rgba(0,0,0,0.12)',
        }}
      >
        <button
          className="flex-1 md-btn md-btn-filled flex items-center justify-center gap-2"
          style={{ height: '52px', fontFamily: 'var(--md-font-brand)', fontWeight: 700, cursor: 'pointer', fontSize: '16px' }}
        >
          <Ticket size={20} /> سجل الآن
        </button>
        <button
          onClick={() => setIsShareOpen(true)}
          className="md-icon-btn"
          style={{ width: '52px', height: '52px', background: 'var(--md-surface-container-high)', color: 'var(--md-on-surface-variant)' }}
          aria-label="مشاركة"
        >
          <Share2 size={20} />
        </button>
      </div>

      {/* MD3 Share Dialog */}
      {isShareOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="md-scrim absolute inset-0" onClick={() => setIsShareOpen(false)} />

          <div
            className="relative w-full max-w-[520px] overflow-hidden"
            style={{
              background: 'var(--md-surface-container-high)',
              borderRadius: 'var(--md-shape-xl)',
              boxShadow: '0px 8px 12px 6px rgba(0,0,0,0.15), 0px 4px 4px rgba(0,0,0,0.3)',
            }}
          >
            {/* Dialog Header */}
            <div className="flex items-start justify-between p-6">
              <h3 className="md-headline-small" style={{ color: 'var(--md-on-surface)' }}>مشاركة الفعالية</h3>
              <button className="md-icon-btn" onClick={() => setIsShareOpen(false)} aria-label="إغلاق">
                <CloseIcon size={20} />
              </button>
            </div>

            {/* Divider */}
            <div style={{ height: '1px', background: 'var(--md-outline-variant)', margin: '0 24px' }} />

            {/* Event preview */}
            <div className="p-6">
              <div
                className="flex gap-4 p-4 rounded-[16px] mb-6"
                style={{ background: 'var(--md-surface-container)' }}
              >
                <img
                  src={event.gallery?.[0] || `https://picsum.photos/seed/${event.id}/200/200`}
                  className="w-16 h-16 rounded-[12px] object-cover shrink-0"
                  alt=""
                />
                <div>
                  <h4 className="md-title-medium line-clamp-1" style={{ color: 'var(--md-on-surface)' }}>{event.title}</h4>
                  <p className="md-body-small mt-1" style={{ color: 'var(--md-on-surface-variant)' }}>بوابة المؤسسة الرقمية</p>
                </div>
              </div>

              {/* Share buttons */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                {shareOptions.map(option => (
                  <a
                    key={option.name}
                    href={option.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-2 group"
                  >
                    <div
                      className="w-14 h-14 rounded-[16px] flex items-center justify-center text-white transition-transform duration-200 group-hover:scale-110"
                      style={{ background: option.color, boxShadow: '0px 4px 8px rgba(0,0,0,0.2)' }}
                    >
                      {option.icon}
                    </div>
                    <span className="md-label-medium" style={{ color: 'var(--md-on-surface-variant)' }}>{option.name}</span>
                  </a>
                ))}
              </div>

              {/* Copy Link */}
              <div>
                <label className="md-label-small uppercase tracking-widest block mb-2" style={{ color: 'var(--md-on-surface-variant)' }}>
                  رابط الفعالية
                </label>
                <div
                  className="flex items-center gap-2 p-2 rounded-[12px]"
                  style={{ background: 'var(--md-surface-container)', border: '1px solid var(--md-outline-variant)' }}
                >
                  <input
                    type="text"
                    readOnly
                    value={eventUrl}
                    className="flex-1 bg-transparent outline-none md-body-small font-mono"
                    style={{ color: 'var(--md-on-surface-variant)', fontFamily: 'monospace' }}
                  />
                  <button
                    onClick={handleCopyLink}
                    className="md-btn md-btn-tonal flex items-center gap-2"
                    style={{ height: '36px', padding: '0 16px', fontFamily: 'var(--md-font-brand)', fontWeight: 600, cursor: 'pointer' }}
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    {copied ? 'تم!' : 'نسخ'}
                  </button>
                </div>
              </div>
            </div>

            {/* Dialog Actions */}
            <div
              className="px-6 py-4 flex justify-end"
              style={{ borderTop: '1px solid var(--md-outline-variant)' }}
            >
              <button
                onClick={() => setIsShareOpen(false)}
                className="md-btn md-btn-text"
                style={{ color: 'var(--md-primary)', fontFamily: 'var(--md-font-brand)', fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer' }}
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetail;
