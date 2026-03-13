"use client";


import React, { useState, useEffect, useMemo } from 'react';
import { Search, Download, FileText, Check, X, Paperclip, Eye, FileJson, Filter, ChevronDown } from 'lucide-react';
import { Announcement } from '@/types';
import Pagination from '@/components/shared/Pagination';

const ITEMS_PER_PAGE = 8;

interface FilesModalProps {
  announcement: Announcement;
  onClose: () => void;
}

const FilesModal: React.FC<FilesModalProps> = ({ announcement, onClose }) => {
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const isImage = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext || '');
  };

  const getFileIcon = (fileName: string, url: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (isImage(fileName) && url !== '#') {
      return <img src={url} className="w-full h-full object-cover rounded" alt="Thumbnail" />;
    }
    if (ext === 'pdf') return <FileText size={22} style={{ color: 'var(--md-error)' }} />;
    if (ext === 'docx' || ext === 'doc') return <FileText size={22} style={{ color: '#005FB0' }} />;
    return <FileJson size={22} style={{ color: 'var(--md-primary)' }} />;
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* MD3 Scrim */}
      <div className="md-scrim absolute inset-0" onClick={onClose} />

      {/* MD3 Dialog */}
      <div
        className="relative w-full max-w-[560px] overflow-hidden"
        style={{
          background: 'var(--md-surface-container-high)',
          borderRadius: 'var(--md-shape-xl)',
          boxShadow: '0px 8px 12px 6px rgba(0,0,0,0.15), 0px 4px 4px rgba(0,0,0,0.3)',
        }}
      >
        {/* Dialog content */}
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <span
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: 'var(--md-secondary-container)', color: 'var(--md-on-secondary-container)' }}
              >
                <Paperclip size={20} />
              </span>
              <div>
                <h3 className="md-headline-small" style={{ color: 'var(--md-on-surface)' }}>الملفات المرفقة</h3>
                <p className="md-body-small mt-0.5" style={{ color: 'var(--md-on-surface-variant)' }}>
                  {announcement.title}
                </p>
              </div>
            </div>
            <button className="md-icon-btn" onClick={onClose} aria-label="إغلاق">
              <X size={20} />
            </button>
          </div>

          {/* Divider */}
          <div style={{ height: '1px', background: 'var(--md-outline-variant)', marginBottom: '16px' }} />

          {/* File List */}
          <div className="space-y-2 max-h-[420px] overflow-y-auto">
            {announcement.attachments?.map((file, idx) => {
              const imageFile = isImage(file.name) && file.url !== '#';
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 rounded-[16px] md-state transition-all"
                  style={{
                    background: 'var(--md-surface-container)',
                    color: 'var(--md-on-surface)',
                  }}
                >
                  <div className="flex items-center gap-4 overflow-hidden">
                    {/* File icon */}
                    <div
                      className="w-12 h-12 rounded-[12px] flex items-center justify-center shrink-0 overflow-hidden"
                      style={{ background: 'var(--md-surface-container-lowest)', border: '1px solid var(--md-outline-variant)' }}
                    >
                      {getFileIcon(file.name, file.url)}
                    </div>
                    <div className="overflow-hidden">
                      <span className="md-title-small block truncate" style={{ color: 'var(--md-on-surface)' }}>
                        {file.name}
                      </span>
                      {imageFile && (
                        <span className="md-label-small uppercase tracking-wider" style={{ color: 'var(--md-primary)' }}>
                          صورة – قابلة للمعاينة
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {imageFile && (
                      <button
                        onClick={() => setPreviewImage(file.url)}
                        className="md-icon-btn"
                        style={{ color: 'var(--md-primary)' }}
                        aria-label="معاينة"
                      >
                        <Eye size={20} />
                      </button>
                    )}
                    <a
                      href={file.url}
                      className="md-icon-btn"
                      style={{ color: 'var(--md-on-surface-variant)' }}
                      aria-label="تنزيل"
                    >
                      <Download size={20} />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Divider */}
          <div style={{ height: '1px', background: 'var(--md-outline-variant)', margin: '16px 0' }} />

          {/* Dialog Actions */}
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="md-btn md-btn-tonal"
              style={{ fontFamily: 'var(--md-font-brand)', fontWeight: 600, cursor: 'pointer' }}
            >
              إغلاق
            </button>
          </div>
        </div>

        {/* Image Preview overlay */}
        {previewImage && (
          <div
            className="absolute inset-0 z-10 flex flex-col"
            style={{ background: 'var(--md-inverse-surface)' }}
          >
            <div className="flex items-center justify-between p-4">
              <button
                className="md-icon-btn"
                style={{ color: 'var(--md-inverse-on-surface)' }}
                onClick={() => setPreviewImage(null)}
                aria-label="رجوع"
              >
                <X size={20} />
              </button>
              <span className="md-title-medium" style={{ color: 'var(--md-inverse-on-surface)' }}>
                معاينة المرفق
              </span>
              <div style={{ width: 40 }} />
            </div>
            <div className="flex-1 flex items-center justify-center p-4">
              <img
                src={previewImage}
                className="max-w-full max-h-full object-contain rounded-[16px]"
                alt="معاينة"
              />
            </div>
            <div className="p-4 flex justify-center">
              <a
                href={previewImage}
                download
                className="md-btn md-btn-filled"
                style={{ fontFamily: 'var(--md-font-brand)', fontWeight: 600 }}
              >
                <Download size={18} /> تحميل
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface AnnouncementsProps {
  announcements: Announcement[];
}

const Announcements: React.FC<AnnouncementsProps> = ({ announcements }) => {
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterOnlyWithAttachments, setFilterOnlyWithAttachments] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);

  const categories = useMemo(() => ['all', ...Array.from(new Set(announcements.map(a => a.category)))], []);
  const departments = useMemo(() => ['all', ...Array.from(new Set(announcements.filter(a => a.department).map(a => a.department as string)))], []);

  useEffect(() => { setCurrentPage(1); }, [filterCategory, filterDepartment, filterOnlyWithAttachments, searchQuery]);

  useEffect(() => {
    if (selectedAnnouncement) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [selectedAnnouncement]);

  const filtered = useMemo(() =>
    announcements.filter(ann => {
      const matchesCategory = filterCategory === 'all' || ann.category === filterCategory;
      const matchesDepartment = filterDepartment === 'all' || ann.department === filterDepartment;
      const matchesAttachments = !filterOnlyWithAttachments || (ann.attachments && ann.attachments.length > 0);
      const matchesSearch = ann.title.includes(searchQuery) || ann.content.includes(searchQuery);
      return matchesCategory && matchesDepartment && matchesAttachments && matchesSearch;
    }), [filterCategory, filterDepartment, filterOnlyWithAttachments, searchQuery]
  );

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const displayedAnnouncements = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const resetFilters = () => {
    setFilterCategory('all');
    setFilterDepartment('all');
    setFilterOnlyWithAttachments(false);
    setSearchQuery('');
  };

  const activeFiltersCount = [filterCategory !== 'all', filterDepartment !== 'all', filterOnlyWithAttachments].filter(Boolean).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">

      {/* ── Page Header + Search ────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-8">
        <div className="max-w-2xl">
          <h1 className="md-display-small font-extrabold mb-3" style={{ color: 'var(--md-on-surface)' }}>
            مركز الإعلانات
          </h1>
          <p className="md-body-large" style={{ color: 'var(--md-on-surface-variant)' }}>
            تصفح القرارات، التعاميم، والإعلانات الرسمية المصنفة حسب القسم والفئة.
          </p>
        </div>

        {/* MD3 Search Bar */}
        <div
          className="relative w-full lg:w-[440px] flex items-center rounded-full px-5 gap-3"
          style={{
            background: 'var(--md-surface-container-high)',
            height: '56px',
          }}
        >
          <Search size={20} style={{ color: 'var(--md-on-surface-variant)', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="ابحث في الإعلانات..."
            className="flex-1 bg-transparent outline-none md-body-large"
            style={{
              color: 'var(--md-on-surface)',
              fontFamily: 'var(--md-font-brand)',
            }}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              className="md-icon-btn"
              onClick={() => setSearchQuery('')}
              aria-label="مسح البحث"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* ── MD3 Filter Card (collapsible) ───────────────────────────── */}
      <div
        className="mb-8 overflow-hidden"
        style={{
          background: 'var(--md-surface-container-low)',
          border: '1px solid var(--md-outline-variant)',
          borderRadius: 'var(--md-shape-xl)',
        }}
      >
        {/* Filter header */}
        <button
          onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
          className="w-full flex items-center justify-between px-6 py-5 md-state"
          style={{ color: 'var(--md-on-surface)', textAlign: 'right' }}
        >
          <div className="flex items-center gap-3">
            <Filter size={20} style={{ color: 'var(--md-primary)' }} />
            <span className="md-title-medium">تصفية النتائج</span>
            {activeFiltersCount > 0 && (
              <span
                className="md-badge"
                style={{ background: 'var(--md-primary)', color: 'var(--md-on-primary)' }}
              >
                {activeFiltersCount}
              </span>
            )}
          </div>
          <ChevronDown
            size={22}
            style={{
              color: 'var(--md-on-surface-variant)',
              transform: isFiltersExpanded ? 'rotate(180deg)' : 'rotate(0)',
              transition: 'transform 300ms',
            }}
          />
        </button>

        {/* Filter body */}
        <div
          style={{
            maxHeight: isFiltersExpanded ? '500px' : '0',
            opacity: isFiltersExpanded ? 1 : 0,
            overflow: 'hidden',
            transition: 'max-height 300ms ease-in-out, opacity 300ms',
            borderTop: isFiltersExpanded ? '1px solid var(--md-outline-variant)' : 'none',
          }}
        >
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Category dropdown */}
            <div className="space-y-2">
              <label className="md-label-small uppercase tracking-widest" style={{ color: 'var(--md-on-surface-variant)' }}>
                الفئة
              </label>
              <div className="relative">
                <select
                  value={filterCategory}
                  onChange={e => setFilterCategory(e.target.value)}
                  className="w-full appearance-none rounded-[12px] py-3 px-4 pl-10 md-body-large outline-none cursor-pointer"
                  style={{
                    background: 'var(--md-surface-container)',
                    color: 'var(--md-on-surface)',
                    border: '1px solid var(--md-outline-variant)',
                    fontFamily: 'var(--md-font-brand)',
                    fontWeight: 600,
                  }}
                >
                  {categories.map(cat => <option key={cat} value={cat}>{cat === 'all' ? 'الكل' : cat}</option>)}
                </select>
                <ChevronDown size={18} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--md-on-surface-variant)' }} />
              </div>
            </div>

            {/* Department dropdown */}
            <div className="space-y-2">
              <label className="md-label-small uppercase tracking-widest" style={{ color: 'var(--md-on-surface-variant)' }}>
                القسم
              </label>
              <div className="relative">
                <select
                  value={filterDepartment}
                  onChange={e => setFilterDepartment(e.target.value)}
                  className="w-full appearance-none rounded-[12px] py-3 px-4 pl-10 md-body-large outline-none cursor-pointer"
                  style={{
                    background: 'var(--md-surface-container)',
                    color: 'var(--md-on-surface)',
                    border: '1px solid var(--md-outline-variant)',
                    fontFamily: 'var(--md-font-brand)',
                    fontWeight: 600,
                  }}
                >
                  {departments.map(dept => <option key={dept} value={dept}>{dept === 'all' ? 'الكل' : dept}</option>)}
                </select>
                <ChevronDown size={18} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--md-on-surface-variant)' }} />
              </div>
            </div>

            {/* Attachments filter chip */}
            <div className="flex flex-col justify-end">
              <button
                onClick={() => setFilterOnlyWithAttachments(!filterOnlyWithAttachments)}
                className={`md-chip flex items-center gap-2 ${filterOnlyWithAttachments ? 'md-chip-selected' : ''}`}
                style={{ height: '48px', borderRadius: 'var(--md-shape-m)' }}
              >
                <Paperclip size={16} />
                <span>يشمل مرفقات</span>
                {filterOnlyWithAttachments && <Check size={16} />}
              </button>
            </div>

            {/* Reset */}
            <div className="flex items-end">
              <button
                onClick={resetFilters}
                className="md-btn md-btn-text w-full"
                style={{ color: 'var(--md-error)', fontFamily: 'var(--md-font-brand)', fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer' }}
              >
                مسح الفلاتر
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Announcements Table / List ───────────────────────────────── */}
      <div
        className="overflow-hidden"
        style={{
          background: 'var(--md-surface-container-lowest)',
          border: '1px solid var(--md-outline-variant)',
          borderRadius: 'var(--md-shape-xl)',
          boxShadow: '0px 1px 2px rgba(0,0,0,0.3), 0px 1px 3px 1px rgba(0,0,0,0.15)',
        }}
      >
        {displayedAnnouncements.length > 0 ? (
          <div>
            {/* Table header (desktop) */}
            <div
              className="hidden md:flex items-center px-6 py-4 md-label-small uppercase tracking-widest"
              style={{
                background: 'var(--md-surface-container)',
                color: 'var(--md-on-surface-variant)',
                borderBottom: '1px solid var(--md-outline-variant)',
              }}
            >
              <div className="w-36">التاريخ</div>
              <div className="w-52">القسم / الفئة</div>
              <div className="flex-1">الموضوع</div>
              <div className="w-32 text-left">المرفقات</div>
            </div>

            {displayedAnnouncements.map((ann, i) => (
              <React.Fragment key={ann.id}>
                <div
                  className="md-state flex flex-col md:flex-row md:items-center px-6 py-5 cursor-pointer"
                  style={{ color: 'var(--md-on-surface)' }}
                  onClick={() => ann.attachments && ann.attachments.length > 0 && setSelectedAnnouncement(ann)}
                >
                  {/* Meta */}
                  <div className="flex items-center md:w-[352px] shrink-0 mb-3 md:mb-0 gap-4">
                    <div className="md:w-36 md-label-medium font-mono" style={{ color: 'var(--md-on-surface-variant)' }}>
                      {ann.publishDate}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span
                        className="md-label-small px-3 py-1 rounded-full uppercase tracking-wider"
                        style={{ background: 'var(--md-tertiary-container)', color: 'var(--md-on-tertiary-container)' }}
                      >
                        {ann.category}
                      </span>
                      {ann.department && (
                        <span
                          className="md-label-small px-3 py-1 rounded-full"
                          style={{ background: 'var(--md-surface-container-high)', color: 'var(--md-on-surface-variant)' }}
                        >
                          {ann.department}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 md:pr-4">
                    <h3 className="md-title-medium mb-1 leading-snug" style={{ color: 'var(--md-on-surface)' }}>
                      {ann.title}
                    </h3>
                    <p className="md-body-medium line-clamp-1" style={{ color: 'var(--md-on-surface-variant)' }}>
                      {ann.content}
                    </p>
                  </div>

                  {/* Attachment */}
                  <div className="md:w-32 mt-4 md:mt-0 flex justify-end">
                    {ann.attachments && ann.attachments.length > 0 ? (
                      <div className="relative">
                        <button
                          onClick={e => { e.stopPropagation(); setSelectedAnnouncement(ann); }}
                          className="md-chip md-chip-selected flex items-center gap-2"
                          style={{ borderRadius: 'var(--md-shape-s)' }}
                        >
                          <Paperclip size={14} />
                          <span className="hidden sm:inline md-label-medium">ملفات</span>
                        </button>
                        {ann.attachments.length > 1 && (
                          <span
                            className="md-badge absolute -top-2 -left-2 border-2"
                            style={{ borderColor: 'var(--md-surface-container-lowest)' }}
                          >
                            {ann.attachments.length}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="hidden md:block" style={{ color: 'var(--md-outline-variant)' }}>
                        <FileText size={22} />
                      </span>
                    )}
                  </div>
                </div>

                {i < displayedAnnouncements.length - 1 && (
                  <div style={{ height: '1px', background: 'var(--md-outline-variant)', margin: '0 24px' }} />
                )}
              </React.Fragment>
            ))}
          </div>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center py-24">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
              style={{ background: 'var(--md-surface-container-high)', color: 'var(--md-on-surface-variant)' }}
            >
              <Search size={36} />
            </div>
            <h3 className="md-headline-small mb-2" style={{ color: 'var(--md-on-surface)' }}>
              لا توجد نتائج
            </h3>
            <p className="md-body-large text-center max-w-sm" style={{ color: 'var(--md-on-surface-variant)' }}>
              جرب تعديل الفلاتر أو استخدام كلمات بحث مختلفة.
            </p>
            <button
              onClick={resetFilters}
              className="md-btn md-btn-tonal mt-8"
              style={{ fontFamily: 'var(--md-font-brand)', fontWeight: 600, cursor: 'pointer' }}
            >
              إعادة ضبط الفلاتر
            </button>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="mt-8">
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>

      {/* Files Modal */}
      {selectedAnnouncement && (
        <FilesModal announcement={selectedAnnouncement} onClose={() => setSelectedAnnouncement(null)} />
      )}
    </div>
  );
};

export default Announcements;
