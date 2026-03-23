"use client";

import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { LogOut, Menu, X } from 'lucide-react';

const titleMap: Record<string, string> = {
  '/dashboard': 'لوحة التحكم',
  '/dashboard/breaking-news': 'أخبار عاجلة',
  '/dashboard/home-carousel': 'كاروسيل الرئيسية',
  '/dashboard/announcements': 'الإعلانات',
  '/dashboard/events': 'الفعاليات',
  '/dashboard/categories': 'الأصناف',
  '/dashboard/structure': 'الأقسام والمجموعات',
  '/dashboard/settings': 'الإعدادات',
};

export default function AdminHeader({
  email,
  onMenuToggle,
  menuOpen = false,
}: {
  email: string;
  onMenuToggle?: () => void;
  menuOpen?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const title =
    Object.entries(titleMap).find(
      ([key]) => pathname === key || pathname.startsWith(`${key}/`)
    )?.[1] ?? 'لوحة التحكم';

  const initials = email?.slice(0, 2).toUpperCase() ?? 'A';

  return (
    <header
      className="relative z-20 flex shrink-0 items-center justify-between px-4 py-3"
      style={{
        background: 'var(--md-surface-container-low)',
        borderBottom: '1px solid var(--md-outline-variant)',
      }}
    >
      {/* Leading – page title */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="md-icon-btn"
          onClick={onMenuToggle}
          aria-label={menuOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
          aria-expanded={menuOpen}
          aria-controls="admin-sidebar"
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <h1 className="md-title-large" style={{ color: 'var(--md-on-surface)' }}>
          {title}
        </h1>
      </div>

      {/* Trailing actions */}
      <div className="flex items-center gap-2">
        {/* Email chip */}
        <div
          className="hidden sm:flex items-center gap-2 px-3 h-8 rounded-[var(--md-shape-s)] md-label-medium"
          style={{
            background: 'var(--md-surface-container)',
            color: 'var(--md-on-surface-variant)',
          }}
        >
          <span
            className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold"
            style={{ background: 'var(--md-primary)', color: 'var(--md-on-primary)' }}
          >
            {initials}
          </span>
          <span className="max-w-[160px] truncate">{email}</span>
        </div>

        {/* Logout icon-button */}
        <button
          onClick={async () => {
            const supabase = createClient();
            await supabase.auth.signOut();
            router.push('/login');
            router.refresh();
          }}
          className="md-icon-btn md-icon-btn-tonal"
          title="تسجيل الخروج"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
