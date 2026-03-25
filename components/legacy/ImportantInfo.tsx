"use client";


import React, { useState } from 'react';
import { NewsAlert } from '@/types';
import { AlertCircle, CheckCircle2, AlertTriangle, EyeOff, Eye, Clock } from 'lucide-react';
import Pagination from '@/components/shared/Pagination';

const ITEMS_PER_PAGE = 6;

interface ImportantInfoProps {
  newsItems: NewsAlert[];
}

const ImportantInfo: React.FC<ImportantInfoProps> = ({ newsItems }) => {
  const [showExpired, setShowExpired] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const now = new Date();

  const isExpiredNotice = (news: NewsAlert) => new Date(news.expiryDate).getTime() < now.getTime();

  const activeNews = newsItems.filter(news => !isExpiredNotice(news));
  const archivedNews = newsItems.filter(isExpiredNotice);
  const newsList = showExpired ? archivedNews : activeNews;

  const totalPages = Math.ceil(newsList.length / ITEMS_PER_PAGE);
  const safeCurrentPage = totalPages === 0 ? 1 : Math.min(currentPage, totalPages);
  const displayedNews = newsList.slice((safeCurrentPage - 1) * ITEMS_PER_PAGE, safeCurrentPage * ITEMS_PER_PAGE);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">

      {/* ── Page Header ───────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="md-display-small font-extrabold mb-2" style={{ color: 'var(--md-on-surface)' }}>
            تنبيهات هامة
          </h1>
          <p className="md-body-large" style={{ color: 'var(--md-on-surface-variant)' }}>
            مركز الإشعارات والتنبيهات الرسمية العاجلة للموظفين والجمهور.
          </p>
        </div>

        {/* Toggle — MD3 Outlined Button */}
        <button
          onClick={() => {
            setShowExpired(!showExpired);
            setCurrentPage(1);
          }}
          className="flex items-center gap-2 rounded-full px-6 py-2.5 md-label-large transition-all shrink-0"
          style={{
            border: '1px solid var(--md-outline)',
            background: showExpired ? 'var(--md-secondary-container)' : 'transparent',
            color: showExpired ? 'var(--md-on-secondary-container)' : 'var(--md-primary)',
            fontFamily: 'var(--md-font-brand)',
            fontWeight: 600,
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {showExpired ? <EyeOff size={18} /> : <Eye size={18} />}
          {showExpired ? 'إخفاء الأرشيف' : 'عرض أرشيف التنبيهات'}
        </button>
      </div>

      {/* ── Alert Cards ───────────────────────────────────────────── */}
      <div className="space-y-4">
        {displayedNews.length === 0 && (
          <div
            className="rounded-[24px] px-6 py-10 text-center"
            style={{
              background: 'var(--md-surface-container-low)',
              border: '1px solid var(--md-outline-variant)',
            }}
          >
            <h2 className="md-title-large mb-2" style={{ color: 'var(--md-on-surface)' }}>
              {showExpired ? 'لا توجد تنبيهات مؤرشفة حالياً' : 'لا توجد تنبيهات نشطة حالياً'}
            </h2>
            <p className="md-body-large" style={{ color: 'var(--md-on-surface-variant)' }}>
              {showExpired
                ? 'عند انتهاء صلاحية أي تنبيه منشور سيظهر هنا ضمن الأرشيف.'
                : 'سيتم عرض التنبيهات الرسمية هنا فور نشرها.'}
            </p>
          </div>
        )}

        {displayedNews.map(news => {
          const isExpired = isExpiredNotice(news);
          const isHigh = news.riskLevel === 'high';
          const isMed = news.riskLevel === 'medium';

          /* Expired — MD3 disabled state (opacity 38%, no grayscale filter) */
          if (isExpired) {
            return (
              <div
                key={news.id}
                className="flex items-center gap-4 px-5 py-4 rounded-[16px]"
                style={{
                  background: 'var(--md-surface-container)',
                  border: '1px solid var(--md-outline-variant)',
                  opacity: 0.38,
                }}
              >
                <span className="md-title-small line-through" style={{ color: 'var(--md-on-surface)' }}>
                  {news.title}
                </span>
                <span
                  className="md-label-small px-3 py-1 rounded-full uppercase tracking-wider mr-auto shrink-0"
                  style={{ background: 'var(--md-surface-container-high)', color: 'var(--md-on-surface-variant)' }}
                >
                  منتهي الصلاحية
                </span>
              </div>
            );
          }

          /* Determine color roles */
          const containerBg = isHigh ? 'var(--md-error-container)' : isMed ? 'var(--md-warning-container)' : 'var(--md-secondary-container)';
          const containerText = isHigh ? 'var(--md-on-error-container)' : isMed ? 'var(--md-on-warning-container)' : 'var(--md-on-secondary-container)';
          const accentColor = isHigh ? 'var(--md-error)' : isMed ? '#984E00' : 'var(--md-primary)';
          const icon = isHigh ? <AlertTriangle size={22} /> : isMed ? <AlertCircle size={22} /> : <CheckCircle2 size={22} />;
          const label = isHigh ? 'عاجل جداً' : isMed ? 'تنبيه هام' : 'تنبيه عادي';

          return (
            <div
              key={news.id}
              className="flex overflow-hidden transition-all duration-200 hover:translate-y-[-1px]"
              style={{
                background: 'var(--md-surface)',
                border: '1px solid var(--md-outline-variant)',
                borderRadius: 'var(--md-shape-xl)',
                boxShadow: '0px 1px 2px rgba(0,0,0,0.3), 0px 1px 3px 1px rgba(0,0,0,0.15)',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = '0px 1px 2px rgba(0,0,0,0.3), 0px 2px 6px 2px rgba(0,0,0,0.15)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = '0px 1px 2px rgba(0,0,0,0.3), 0px 1px 3px 1px rgba(0,0,0,0.15)'}
            >
              {/* MD3 left accent bar (4px, full height, risk-colored) */}
              <div className="w-1.5 shrink-0 self-stretch" style={{ background: accentColor }} />

              {/* Card body */}
              <div className="flex flex-col md:flex-row gap-6 p-6 flex-1">

                {/* Icon */}
                <div
                  className="w-12 h-12 rounded-full shrink-0 flex items-center justify-center"
                  style={{ background: containerBg, color: containerText }}
                >
                  {icon}
                </div>

                <div className="flex-1 min-w-0">
                  {/* Title row */}
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                    <h3 className="md-headline-small leading-tight" style={{ color: 'var(--md-on-surface)' }}>
                      {news.title}
                    </h3>
                    <span
                      className="md-label-medium px-4 py-1.5 rounded-full uppercase tracking-wider shrink-0"
                      style={{ background: containerBg, color: containerText }}
                    >
                      {label}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="md-body-large leading-relaxed mb-6" style={{ color: 'var(--md-on-surface-variant)' }}>
                    {news.description}
                  </p>

                  {/* Footer dates */}
                  <div
                    className="flex flex-wrap items-center gap-6 md-label-medium pt-4"
                    style={{
                      borderTop: '1px solid var(--md-outline-variant)',
                      color: 'var(--md-on-surface-variant)',
                    }}
                  >
                    <span className="flex items-center gap-2">
                      <Clock size={16} />
                      تاريخ النشر: {new Date(news.publishDate).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        timeZone: 'Africa/Casablanca'
                      })}
                    </span>
                    <span className="flex items-center gap-2">
                      صالح حتى: {new Date(news.expiryDate).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        timeZone: 'Africa/Casablanca'
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      <div className="mt-10">
        <Pagination currentPage={safeCurrentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>
    </div>
  );
};

export default ImportantInfo;
