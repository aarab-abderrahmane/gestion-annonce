"use client";

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AlertTriangle, BellRing, Building2, CalendarDays, FolderTree, House, Images, Newspaper, Settings, Users, X } from 'lucide-react';
import type { AdminNavIconKey, AdminNavItem } from '@/lib/admin-permissions';

const iconMap: Record<AdminNavIconKey, typeof House> = {
  house: House,
  bell: BellRing,
  alert: AlertTriangle,
  images: Images,
  newspaper: Newspaper,
  calendar: CalendarDays,
  folder: FolderTree,
  building: Building2,
  users: Users,
  settings: Settings,
};

export default function Sidebar({
  items,
  displayName,
  variant = 'desktop',
  mobileOpen = false,
  onClose,
}: {
  items: AdminNavItem[];
  displayName?: string;
  variant?: 'desktop' | 'mobile';
  mobileOpen?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const isMobile = variant === 'mobile';

  return (
    <aside
      id={isMobile ? 'admin-sidebar' : undefined}
      className={
        isMobile
          ? `fixed inset-y-0 right-0 z-40 flex h-[100dvh] max-h-[100dvh] w-[280px] shrink-0 flex-col overflow-hidden transition-transform duration-300 ease-out lg:hidden ${
              mobileOpen ? 'translate-x-0' : 'translate-x-full'
            }`
          : 'hidden h-full w-[280px] shrink-0 self-stretch flex-col overflow-hidden lg:flex'
      }
      style={{ background: 'var(--md-surface-container-low)' }}
    >
      {/* Drawer header */}
      <div className="px-4 pt-6 pb-2">
        <div className={`mb-3 items-center justify-end ${isMobile ? 'flex' : 'hidden'}`}>
          <button
            type="button"
            className="md-icon-btn"
            onClick={onClose}
            aria-label="إغلاق القائمة"
          >
            <X size={20} />
          </button>
        </div>
        <div
          className="flex items-center gap-3 px-4 py-4 rounded-[var(--md-shape-xl)]"
          style={{ background: 'var(--md-secondary-container)' }}
        >
           <span
                  className={'site-logo-ring'}
                >
                  <span
                  className={`flex h-10 w-10 items-center justify-center overflow-hidden rounded-full 
                      relative site-logo-ring__inner
                    `}
                    style={{ background: 'var(--md-secondary-container)' }}
                  >
                    <Image
                      src="/images/ofppt-logo.jpeg"
                      alt="ISTA Ait Melloul logo"
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  </span>
                </span>
          <div className="min-w-0">
            <p
              className="md-label-small uppercase tracking-widest"
              style={{ color: 'var(--md-on-secondary-container)', opacity: 0.7 }}
            >
              ISTA
            </p>
            <p
              className="md-title-medium truncate"
              style={{ color: 'var(--md-on-secondary-container)' }}
            >
              Ait Melloul
            </p>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-4 my-3" style={{ borderBottom: '1px solid var(--md-outline-variant)' }} />

      {/* Navigation destinations */}
      <nav
        className={
          isMobile
            ? 'min-h-0 flex-1 overflow-y-auto px-4 space-y-1 no-scrollbar'
            : 'flex-1 px-4 space-y-1'
        }
      >
        {items.map(({ href, label, icon }) => {
          const Icon = iconMap[icon];
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(`${href}/`));
          return (
            <Link
              key={href}
              href={href}
              onClick={() => onClose?.()}
              className="md-state flex items-center gap-4 px-4 py-3 rounded-[var(--md-shape-full)] transition-all"
              style={{
                background: active ? 'var(--md-secondary-container)' : 'transparent',
                color: active ? 'var(--md-on-secondary-container)' : 'var(--md-on-surface-variant)',
                fontWeight: active ? 700 : 500,
              }}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
              <span className="md-label-large">{label}</span>
              {active && (
                <span
                  className="mr-auto w-1.5 h-5 rounded-full"
                  style={{ background: 'var(--md-primary)' }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div
        className="mx-4 mb-4 mt-3 px-4 py-3 rounded-[var(--md-shape-xl)]"
        style={{ background: 'var(--md-surface-container)' }}
      >
        <p className="md-body-small" style={{ color: 'var(--md-on-surface-variant)' }}>
          {displayName ? `الحساب: ${displayName}` : 'نظام إدارة المحتوى'}
        </p>
        <p className="md-label-small" style={{ color: 'var(--md-outline)' }}>
          ISTA Ait Melloul © 2026
        </p>
      </div>
    </aside>
  );
}
