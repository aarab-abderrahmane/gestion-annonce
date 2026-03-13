"use client";


import React, { useState, useMemo, useEffect } from 'react';
import { MOCK_EVENTS } from '@/lib/mock-data';
import { MapPin, Calendar as CalendarIcon, ArrowLeft, Search, X, ChevronDown, Check } from 'lucide-react';
import Pagination from '@/components/shared/Pagination';

interface EventsProps {
  onNavigate: (page: string) => void;
}

const ITEMS_PER_PAGE = 6;

const Events: React.FC<EventsProps> = ({ onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [selectedYear, setSelectedYear] = useState('الكل');
  const [viewStatus, setViewStatus] = useState<'all' | 'upcoming' | 'past'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const categories = useMemo(() => ['الكل', ...Array.from(new Set(MOCK_EVENTS.map(e => e.category || 'عام')))], []);
  const years = useMemo(() => {
    const allYears = MOCK_EVENTS.map(e => new Date(e.date).getFullYear().toString());
    return ['الكل', ...Array.from(new Set(allYears)).sort((a, b) => b.localeCompare(a))];
  }, []);

  const filteredEvents = useMemo(() =>
    MOCK_EVENTS.filter(event => {
      const matchesSearch = event.title.includes(searchQuery) || event.shortDescription.includes(searchQuery) || event.location.includes(searchQuery);
      const matchesCategory = selectedCategory === 'الكل' || event.category === selectedCategory;
      const eventYear = new Date(event.date).getFullYear().toString();
      const matchesYear = selectedYear === 'الكل' || eventYear === selectedYear;
      const matchesStatus = viewStatus === 'all' || (viewStatus === 'upcoming' && event.isUpcoming) || (viewStatus === 'past' && !event.isUpcoming);
      return matchesSearch && matchesCategory && matchesYear && matchesStatus;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [searchQuery, selectedCategory, selectedYear, viewStatus]
  );

  const totalPages = Math.ceil(filteredEvents.length / ITEMS_PER_PAGE);
  const displayedEvents = filteredEvents.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => { setCurrentPage(1); }, [searchQuery, selectedCategory, selectedYear, viewStatus]);

  const clearFilters = () => { setSearchQuery(''); setSelectedCategory('الكل'); setSelectedYear('الكل'); setViewStatus('all'); };
  const isFiltering = searchQuery !== '' || selectedCategory !== 'الكل' || selectedYear !== 'الكل' || viewStatus !== 'all';

  const statusButtons = [
    { id: 'all', label: 'الكل' },
    { id: 'upcoming', label: 'القادمة' },
    { id: 'past', label: 'الأرشيف' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-8">

      {/* ── Page Header ───────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="md-display-small font-extrabold mb-2" style={{ color: 'var(--md-on-surface)' }}>
            فعاليات المؤسسة
          </h1>
          <p className="md-body-large" style={{ color: 'var(--md-on-surface-variant)' }}>
            استكشف المبادرات، ورش العمل، والمؤتمرات.
          </p>
        </div>

        {/* MD3 Search Bar */}
        <div
          className="relative w-full md:w-[380px] flex items-center gap-3 rounded-full px-5"
          style={{ background: 'var(--md-surface-container-high)', height: '56px' }}
        >
          <Search size={20} style={{ color: 'var(--md-on-surface-variant)', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="البحث عن فعالية..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent outline-none md-body-large"
            style={{ color: 'var(--md-on-surface)', fontFamily: 'var(--md-font-brand)' }}
          />
          {searchQuery && (
            <button className="md-icon-btn" onClick={() => setSearchQuery('')} aria-label="مسح">
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* ── Filter Tray ───────────────────────────────────────────── */}
      <div
        className="p-5 rounded-[28px]"
        style={{ background: 'var(--md-surface-container-low)', border: '1px solid var(--md-outline-variant)' }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center gap-5">

          {/* MD3 Segmented Button — status */}
          <div
            className="inline-flex p-1 rounded-full shrink-0"
            style={{ background: 'var(--md-surface-container-high)', border: '1px solid var(--md-outline-variant)' }}
          >
            {statusButtons.map(s => (
              <button
                key={s.id}
                onClick={() => setViewStatus(s.id as any)}
                className="px-5 py-2 rounded-full md-label-large transition-all duration-200 flex items-center gap-2"
                style={{
                  background: viewStatus === s.id ? 'var(--md-secondary-container)' : 'transparent',
                  color: viewStatus === s.id ? 'var(--md-on-secondary-container)' : 'var(--md-on-surface-variant)',
                  fontFamily: 'var(--md-font-brand)',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {viewStatus === s.id && <Check size={14} />}
                {s.label}
              </button>
            ))}
          </div>

          {/* Vertical divider — desktop */}
          <div className="hidden lg:block h-8 w-px" style={{ background: 'var(--md-outline-variant)' }} />

          {/* Category Filter Chips (horizontal scroll) */}
          <div className="flex-1 flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 lg:pb-0">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`md-chip ${selectedCategory === cat ? 'md-chip-selected' : ''}`}
                style={{ flexShrink: 0 }}
              >
                {selectedCategory === cat && <Check size={14} />}
                {cat}
              </button>
            ))}
          </div>

          {/* Year + Reset */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="relative">
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(e.target.value)}
                className="appearance-none rounded-[12px] py-2.5 px-4 pl-9 md-label-large outline-none cursor-pointer"
                style={{
                  background: 'var(--md-surface-container)',
                  color: 'var(--md-on-surface)',
                  border: '1px solid var(--md-outline-variant)',
                  fontFamily: 'var(--md-font-brand)',
                  fontWeight: 600,
                }}
              >
                {years.map(y => <option key={y} value={y}>{y === 'الكل' ? 'كل السنوات' : y}</option>)}
              </select>
              <ChevronDown size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--md-on-surface-variant)' }} />
            </div>

            {isFiltering && (
              <button
                onClick={clearFilters}
                className="md-btn md-btn-text md-label-large flex items-center gap-1"
                style={{ color: 'var(--md-error)', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'var(--md-font-brand)', fontWeight: 600 }}
              >
                <X size={16} /> مسح
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Results Header ────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-1">
        <h2 className="md-title-large" style={{ color: 'var(--md-on-surface)' }}>
          {isFiltering ? `نتائج البحث (${filteredEvents.length})` : 'أحدث الفعاليات'}
        </h2>
      </div>

      {/* ── Event Grid ────────────────────────────────────────────── */}
      {displayedEvents.length > 0 ? (
        <div className="space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedEvents.map(event => (
              <div
                key={event.id}
                onClick={() => onNavigate(`event-${event.id}`)}
                className="md-state flex flex-col overflow-hidden cursor-pointer transition-all duration-300 relative group"
                style={{
                  background: 'var(--md-surface-container-low)',
                  borderRadius: 'var(--md-shape-xl)',
                  border: '1px solid var(--md-outline-variant)',
                  boxShadow: '0px 1px 2px rgba(0,0,0,0.3), 0px 1px 3px 1px rgba(0,0,0,0.15)',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0px 1px 2px rgba(0,0,0,0.3), 0px 2px 6px 2px rgba(0,0,0,0.15)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0px 1px 2px rgba(0,0,0,0.3), 0px 1px 3px 1px rgba(0,0,0,0.15)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
              >
                {/* Status chip */}
                <div
                  className="absolute top-4 left-4 z-10 md-label-small px-3 py-1 rounded-full"
                  style={{
                    background: event.isUpcoming ? 'var(--md-primary)' : 'rgba(0,0,0,0.6)',
                    color: 'white',
                    backdropFilter: 'blur(4px)',
                  }}
                >
                  {event.isUpcoming ? 'قادمة' : 'منتهية'}
                </div>

                {/* Card Media */}
                <div className="relative aspect-video overflow-hidden" style={{ borderRadius: 'var(--md-shape-xl) var(--md-shape-xl) 0 0' }}>
                  <img
                    src={event.gallery?.[0] || `https://picsum.photos/seed/${event.id}/800/600`}
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </div>

                {/* Card Content */}
                <div className="p-5 flex flex-col flex-1">
                  {/* Category chip */}
                  <div className="mb-3">
                    <span
                      className="md-label-small px-3 py-1 rounded-full uppercase tracking-wider"
                      style={{ background: 'var(--md-tertiary-container)', color: 'var(--md-on-tertiary-container)' }}
                    >
                      {event.category || 'عام'}
                    </span>
                  </div>

                  {/* Title */}
                  <h3
                    className="md-title-large mb-2 line-clamp-2 leading-snug"
                    style={{ color: 'var(--md-on-surface)' }}
                  >
                    {event.title}
                  </h3>

                  <p className="md-body-medium line-clamp-2 mb-5" style={{ color: 'var(--md-on-surface-variant)' }}>
                    {event.shortDescription}
                  </p>

                  {/* Card Actions */}
                  <div
                    className="mt-auto pt-4 flex items-center justify-between"
                    style={{ borderTop: '1px solid var(--md-outline-variant)' }}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 md-label-medium" style={{ color: 'var(--md-primary)' }}>
                        <CalendarIcon size={14} />
                        <span>{event.date}</span>
                      </div>
                      <div className="flex items-center gap-2 md-label-medium" style={{ color: 'var(--md-on-surface-variant)' }}>
                        <MapPin size={14} />
                        <span className="line-clamp-1">{event.location}</span>
                      </div>
                    </div>

                    {/* Tonal action button */}
                    <span
                      className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300"
                      style={{ background: 'var(--md-surface-container-high)', color: 'var(--md-on-surface-variant)' }}
                    >
                      <ArrowLeft size={18} />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      ) : (
        /* MD3 Empty State */
        <div
          className="flex flex-col items-center py-24 rounded-[28px]"
          style={{ background: 'var(--md-surface-container-low)', border: '1px dashed var(--md-outline-variant)' }}
        >
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
            style={{ background: 'var(--md-surface-container-high)', color: 'var(--md-on-surface-variant)' }}
          >
            <Search size={36} />
          </div>
          <h3 className="md-headline-small mb-3" style={{ color: 'var(--md-on-surface)' }}>لم نجد أي نتائج</h3>
          <p className="md-body-large text-center max-w-sm leading-relaxed mb-8" style={{ color: 'var(--md-on-surface-variant)' }}>
            جرب تغيير كلمات البحث أو استخدام فلاتر مختلفة.
          </p>
          <button
            onClick={clearFilters}
            className="md-btn md-btn-filled"
            style={{ fontFamily: 'var(--md-font-brand)', fontWeight: 600, cursor: 'pointer' }}
          >
            إعادة ضبط البحث
          </button>
        </div>
      )}
    </div>
  );
};

export default Events;
