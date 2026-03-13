"use client";

import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { LogOut } from 'lucide-react';

const titleMap: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/breaking-news': 'Breaking News',
  '/dashboard/announcements': 'Announcements',
  '/dashboard/settings': 'Settings',
};

export default function AdminHeader({ email }: { email: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const title = Object.entries(titleMap).find(([key]) => pathname === key || pathname.startsWith(`${key}/`))?.[1] ?? 'Dashboard';

  return (
    <header className="mb-8 flex flex-col gap-4 rounded-[32px] border border-[#d9cdbb] bg-[#fffdf8] px-6 py-5 shadow-sm md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-[#9a7b4f]">Admin Panel</p>
        <h1 className="text-3xl font-black text-[#123c3a]">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-[#f5f1e8] px-4 py-2 text-sm text-[#38515a]">{email}</div>
        <button
          onClick={async () => {
            const supabase = createClient();
            await supabase.auth.signOut();
            router.push('/login');
            router.refresh();
          }}
          className="inline-flex items-center gap-2 rounded-2xl bg-[#123c3a] px-4 py-2 text-sm font-semibold text-white"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </header>
  );
}
