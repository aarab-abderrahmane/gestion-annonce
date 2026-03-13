"use client";


import React from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - 1 && i <= currentPage + 1)
      ) {
        pages.push(i);
      } else if (
        (i === currentPage - 2 && currentPage > 3) ||
        (i === currentPage + 2 && currentPage < totalPages - 2)
      ) {
        pages.push('...');
      }
    }
    return pages.filter((val, index, arr) => val !== arr[index - 1]);
  };

  return (
    <div className="flex items-center justify-center gap-2 py-4" dir="rtl">
      {/* Previous */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="md-icon-btn"
        style={{
          opacity: currentPage === 1 ? 0.38 : 1,
          pointerEvents: currentPage === 1 ? 'none' : 'auto',
          color: 'var(--md-on-surface-variant)',
        }}
        aria-label="الصفحة السابقة"
      >
        <ChevronRight size={24} />
      </button>

      {/* Page Numbers */}
      <div className="flex items-center gap-1">
        {getPageNumbers().map((page, index) =>
          page === '...' ? (
            <span
              key={`ellipsis-${index}`}
              className="w-10 text-center md-label-large"
              style={{ color: 'var(--md-on-surface-variant)' }}
            >
              …
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page as number)}
              className="w-10 h-10 rounded-full md-label-large transition-all duration-200"
              style={{
                background: currentPage === page ? 'var(--md-primary)' : 'transparent',
                color: currentPage === page ? 'var(--md-on-primary)' : 'var(--md-on-surface-variant)',
                fontFamily: 'var(--md-font-brand)',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                outline: 'none',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {page}
            </button>
          )
        )}
      </div>

      {/* Next */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="md-icon-btn"
        style={{
          opacity: currentPage === totalPages ? 0.38 : 1,
          pointerEvents: currentPage === totalPages ? 'none' : 'auto',
          color: 'var(--md-on-surface-variant)',
        }}
        aria-label="الصفحة التالية"
      >
        <ChevronLeft size={24} />
      </button>
    </div>
  );
};

export default Pagination;
