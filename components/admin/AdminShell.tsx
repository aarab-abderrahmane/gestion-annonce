"use client";

import { useEffect, useState } from 'react';
import AdminHeader from '@/components/admin/AdminHeader';
import Sidebar from '@/components/admin/Sidebar';
import type { AdminNavItem } from '@/lib/admin-permissions';

export default function AdminShell({
  email,
  displayName,
  isFullAdmin,
  navigationItems,
  children,
}: Readonly<{
  email: string;
  displayName?: string;
  isFullAdmin?: boolean;
  navigationItems: AdminNavItem[];
  children: React.ReactNode;
}>) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [desktopMenuOpen, setDesktopMenuOpen] = useState(true);
  const [isDesktopViewport, setIsDesktopViewport] = useState(false);

  function handleMenuToggle() {
    if (isDesktopViewport) {
      setDesktopMenuOpen((current) => !current);
      return;
    }

    setMobileMenuOpen((current) => !current);
  }

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const syncViewport = () => {
      const desktop = window.innerWidth >= 1024;
      setIsDesktopViewport(desktop);

      if (desktop) {
        setMobileMenuOpen(false);
      }
    };

    syncViewport();
    window.addEventListener('resize', syncViewport);

    return () => {
      window.removeEventListener('resize', syncViewport);
    };
  }, []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;

    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileMenuOpen]);

  return (
    <div
      className="h-screen overflow-hidden"
      style={{ background: 'var(--md-surface)', color: 'var(--md-on-surface)', fontFamily: 'var(--md-font-brand)' }}
    >
      <div className="mx-auto flex h-full w-full items-stretch overflow-hidden">
        <div
          className={`hidden shrink-0 self-stretch overflow-hidden transition-[width] duration-300 ease-out lg:block ${
            desktopMenuOpen ? 'w-[280px]' : 'w-0'
          }`}
        >
          <Sidebar items={navigationItems} displayName={displayName} variant="desktop" />
        </div>

        <Sidebar
          items={navigationItems}
          displayName={displayName}
          variant="mobile"
          mobileOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
        />

        {mobileMenuOpen ? (
          <button
            type="button"
            className="fixed inset-0 z-30 bg-black/35 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="إغلاق القائمة الجانبية"
          />
        ) : null}

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <AdminHeader
            email={email}
            displayName={displayName}
            isFullAdmin={isFullAdmin}
            onMenuToggle={handleMenuToggle}
            menuOpen={isDesktopViewport ? desktopMenuOpen : mobileMenuOpen}
          />
          <main className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6">
            <div className="space-y-6">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
