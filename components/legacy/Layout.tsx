"use client";


import React, { useState, useEffect } from 'react';
import { Menu, X, Home, Bell, Info, Calendar, Building2 } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentPage, onNavigate }) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const showAnimatedLogo = currentPage === 'home';

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { id: 'home', label: 'الرئيسية', icon: <Home className="w-5 h-5" /> },
    { id: 'announcements', label: 'الإعلانات', icon: <Bell className="w-5 h-5" /> },
    { id: 'important-info', label: 'أخبار عاجلة', icon: <Info className="w-5 h-5" /> },
    { id: 'events', label: 'الفعاليات', icon: <Calendar className="w-5 h-5" /> },
  ];

  const handleNavClick = (id: string) => {
    onNavigate(id);
    setIsDrawerOpen(false);
  };

  const isActive = (id: string) =>
    currentPage === id || (currentPage.startsWith('event-') && id === 'events');

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'var(--md-surface)', color: 'var(--md-on-surface)', fontFamily: 'var(--md-font-brand)' }}
    >
      {/* ── MD3 Top App Bar ─────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-40 transition-all duration-300"
        style={{
          background: scrolled ? 'var(--md-surface-container)' : 'var(--md-surface)',
          boxShadow: scrolled ? '0px 1px 2px rgba(0,0,0,0.3), 0px 1px 3px 1px rgba(0,0,0,0.15)' : 'none',
        }}
      >
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Leading — Menu (mobile) + Logo */}
            <div className="flex items-center gap-2">
              {/* MD3 Icon Button — menu */}
              <button
                className=" md:hidden"
                onClick={() => setIsDrawerOpen(true)}
                aria-label="القائمة"
              >
                <Menu size={24} />
              </button>

              {/* Logo / Brand */}
              <button
                className="flex items-center gap-3 md-state rounded-full px-3 py-1.5"
                style={{ color: 'var(--md-on-surface)' }}
                onClick={() => onNavigate('home')}
              >
                <span
                  className={showAnimatedLogo ? 'site-logo-ring' : 'inline-flex'}
                >
                  <span
                    className={`flex h-10 w-10 items-center justify-center overflow-hidden rounded-full ${
                      showAnimatedLogo ? 'site-logo-ring__inner' : ''
                    }`}
                    style={{ background: 'var(--md-surface-container-low)' }}
                  >
                    <img
                      src="/images/ofppt-logo.jpeg"
                      alt="ISTA Ait Melloul logo"
                      className="h-full w-full object-cover"
                    />
                  </span>
                </span>
                <span className="md-title-medium hidden sm:block" style={{ color: 'var(--md-on-surface)' }}>
                 ISTA AIT MELLOUL
                </span>
              </button>
            </div>

            {/* Center — Desktop Navigation (MD3 Segmented Navigation) */}
            <nav
              className="hidden md:flex items-center p-1 rounded-full gap-1"
              style={{ background: 'var(--md-surface-container-high)' }}
            >
              {navItems.map((item) => {
                const active = isActive(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full transition-all duration-200"
                    style={{
                      background: active ? 'var(--md-secondary-container)' : 'transparent',
                      color: active ? 'var(--md-on-secondary-container)' : 'var(--md-on-surface-variant)',
                      fontFamily: 'var(--md-font-brand)',
                      fontSize: '14px',
                      fontWeight: 600,
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Trailing — Avatar */}
            <div
              className="hidden md:flex w-8 h-8 rounded-full items-center justify-center md-title-small cursor-pointer"
             
            >
            </div>
          </div>
        </div>
      </header>

      {/* ── MD3 Modal Navigation Drawer (mobile) ────────────────────── */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex" dir="rtl">
          {/* Scrim */}
          <div
            className="absolute inset-0"
            style={{ background: 'var(--md-scrim)' }}
            onClick={() => setIsDrawerOpen(false)}
          />

          {/* Drawer Panel */}
          <div
            className="relative w-[360px] max-w-[85vw] h-full flex flex-col"
            style={{
              background: 'var(--md-surface-container-low)',
              borderRadius: '  var(--md-shape-xl) 0 0 var(--md-shape-xl)  ',
              boxShadow: '0px 8px 12px 6px rgba(0,0,0,0.15), 0px 4px 4px rgba(0,0,0,0.3)',
            }}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4">
              <div className="flex items-center gap-3">
                <span
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: 'var(--md-primary)', color: 'var(--md-on-primary)' }}
                >
                  <Building2 size={18} />
                </span>
                <span className="md-title-medium" style={{ color: 'var(--md-on-surface)' }}>مؤسسة التطوير</span>
              </div>
              <button
                className="md-icon-btn"
                onClick={() => setIsDrawerOpen(false)}
                aria-label="إغلاق القائمة"
              >
                <X size={24} />
              </button>
            </div>

            {/* Divider */}
            <div style={{ height: '1px', background: 'var(--md-outline-variant)', margin: '0 0 8px' }} />

            {/* Navigation Items */}
            <nav className="flex flex-col gap-1 px-3 flex-grow">
              {navItems.map((item) => {
                const active = isActive(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className="flex items-center gap-4 w-full px-4 py-4 rounded-full transition-all duration-200 md-state"
                    style={{
                      background: active ? 'var(--md-secondary-container)' : 'transparent',
                      color: active ? 'var(--md-on-secondary-container)' : 'var(--md-on-surface-variant)',
                      fontFamily: 'var(--md-font-brand)',
                      fontSize: '14px',
                      fontWeight: 600,
                      textAlign: 'right',
                    }}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Drawer Footer */}
            <div
              className="px-6 py-6 text-center"
              style={{ borderTop: '1px solid var(--md-outline-variant)' }}
            >
              <p className="md-label-small" style={{ color: 'var(--md-on-surface-variant)' }}>
                الإصدار 1.0.0
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Page Content ────────────────────────────────────────────── */}
      <main className="flex-grow">
        {children}
      </main>

      {/* ── MD3 Footer ──────────────────────────────────────────────── */}
      <footer
        className="mt-16 mx-4 md:mx-6 mb-6 rounded-[28px] py-14"
        style={{ background: 'var(--md-surface-container-low)' }}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">

            {/* Brand column */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <span
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: 'var(--md-primary)', color: 'var(--md-on-primary)' }}
                >
                  <Building2 size={20} />
                </span>
                <h3 className="md-title-large" style={{ color: 'var(--md-on-surface)' }}>مؤسسة التطوير</h3>
              </div>
              <p className="md-body-medium leading-relaxed" style={{ color: 'var(--md-on-surface-variant)' }}>
                نسعى دائماً لتقديم أفضل الحلول والخدمات لمجتمعنا، مع الالتزام التام بمعايير الجودة والشفافية.
              </p>
            </div>

            {/* Quick links */}
            <div>
              <h3 className="md-title-medium mb-5" style={{ color: 'var(--md-on-surface)' }}>روابط سريعة</h3>
              <ul className="space-y-3">
                {[
                  { page: 'announcements', label: 'قائمة الإعلانات' },
                  { page: 'important-info', label: 'تنبيهات هامة' },
                  { page: 'events', label: 'أرشيف الفعاليات' },
                ].map(link => (
                  <li key={link.page}>
                    <button
                      onClick={() => onNavigate(link.page)}
                      className="md-btn-text !px-0 md-body-medium"
                      style={{ color: 'var(--md-primary)', minHeight: 0, height: 'auto', padding: 0, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--md-font-brand)', fontWeight: 600 }}
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="md-title-medium mb-5" style={{ color: 'var(--md-on-surface)' }}>تواصل معنا</h3>
              <div className="space-y-2">
                <p className="md-body-medium" style={{ color: 'var(--md-on-surface-variant)' }}>الهاتف الموحد: 92000XXXX</p>
                <p className="md-body-medium" style={{ color: 'var(--md-on-surface-variant)' }}>البريد الإلكتروني: info@institution.sa</p>
              </div>
            </div>
          </div>

          {/* Footer bottom */}
          <div
            className="flex flex-col md:flex-row justify-between items-center gap-4 pt-6"
            style={{ borderTop: '1px solid var(--md-outline-variant)' }}
          >
            <p className="md-body-small" style={{ color: 'var(--md-on-surface-variant)' }}>
              © 2024 جميع الحقوق محفوظة للمؤسسة
            </p>
            <div className="flex gap-6">
              {['تويتر', 'لينكد إن', 'فيسبوك'].map(sn => (
                <span
                  key={sn}
                  className="md-label-medium cursor-pointer transition-colors"
                  style={{ color: 'var(--md-on-surface-variant)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--md-primary)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--md-on-surface-variant)')}
                >
                  {sn}
                </span>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
