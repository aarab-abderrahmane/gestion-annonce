"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BellRing, CalendarDays, FolderTree, House, Newspaper, Megaphone, Settings } from 'lucide-react';

const items = [
  { href: '/dashboard', label: 'Dashboard', icon: House },
  { href: '/dashboard/breaking-news', label: 'Breaking News', icon: BellRing },
  { href: '/dashboard/announcements', label: 'Announcements', icon: Newspaper },
  { href: '/dashboard/events', label: 'Events', icon: CalendarDays },
  { href: '/dashboard/categories', label: 'Categories', icon: FolderTree },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col border-r border-[#d9cdbb] bg-[#fbf7ef] px-5 py-6 lg:flex">
      <div className="mb-8 flex items-center gap-3 rounded-[28px] bg-[#123c3a] px-4 py-4 text-white">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f3b95f] text-[#123c3a]">
          <Megaphone size={22} />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[#cfe3d8]">ISTA</p>
          <h2 className="text-lg font-bold">Ait Melloul</h2>
        </div>
      </div>

      <nav className="space-y-2">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors"
              style={{
                background: active ? '#123c3a' : 'transparent',
                color: active ? '#ffffff' : '#38515a',
              }}
            >
              <Icon size={18} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
