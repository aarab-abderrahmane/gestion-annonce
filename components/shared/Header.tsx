"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Building2, Calendar, Home, Info, Menu, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const items = [
  { href: "/", label: "الرئيسية", icon: Home },
  { href: "/announcements", label: "الإعلانات", icon: Bell },
  { href: "/important-info", label: "أخبار عاجلة", icon: Info },
  { href: "/events", label: "الفعاليات", icon: Calendar },
  { href: "/search", label: "البحث", icon: Search },
];

export default function Header() {
  const pathname = usePathname();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 4);
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        active:
          item.href === "/"
            ? pathname === "/"
            : pathname === item.href || pathname.startsWith(`${item.href}/`),
      })),
    [pathname],
  );

  return (
    <>
      <header
        className="sticky top-0 z-40 transition-all duration-300"
        style={{
          background: scrolled ? "var(--md-surface-container)" : "var(--md-surface)",
          boxShadow: scrolled ? "0 1px 3px rgba(0,0,0,0.15)" : "none",
        }}
      >
        <div className="mx-auto flex h-16 max-w-screen-xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <button className="md-icon-btn md:hidden" onClick={() => setIsDrawerOpen(true)} aria-label="القائمة">
              <Menu size={24} />
            </button>
            <Link href="/" className="md-state flex items-center gap-3 rounded-full px-3 py-1.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: "var(--md-primary)", color: "var(--md-on-primary)" }}>
                <Building2 size={18} />
              </span>
              <span className="md-title-medium hidden sm:block">ISTA Ait Melloul</span>
            </Link>
          </div>

          <nav className="hidden items-center gap-1 rounded-full p-1 md:flex" style={{ background: "var(--md-surface-container-high)" }}>
            {navItems.map(({ href, label, icon: Icon, active }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all"
                style={{
                  background: active ? "var(--md-secondary-container)" : "transparent",
                  color: active ? "var(--md-on-secondary-container)" : "var(--md-on-surface-variant)",
                }}
              >
                <Icon size={18} />
                <span>{label}</span>
              </Link>
            ))}
          </nav>

          <div className="hidden h-8 min-w-8 items-center justify-center rounded-full px-2 md:flex" style={{ background: "var(--md-primary)", color: "var(--md-on-primary)" }}>
            <span className="md-label-medium font-bold">ISTA</span>
          </div>
        </div>
      </header>

      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0" style={{ background: "var(--md-scrim)" }} onClick={() => setIsDrawerOpen(false)} />
          <div className="relative flex h-full w-[360px] max-w-[85vw] flex-col" style={{ background: "var(--md-surface-container-low)", boxShadow: "0 8px 12px rgba(0,0,0,0.2)" }}>
            <div className="flex items-center justify-between px-6 pt-6 pb-4">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: "var(--md-primary)", color: "var(--md-on-primary)" }}>
                  <Building2 size={18} />
                </span>
                <span className="md-title-medium">ISTA Ait Melloul</span>
              </div>
              <button className="md-icon-btn" onClick={() => setIsDrawerOpen(false)} aria-label="إغلاق القائمة">
                <X size={24} />
              </button>
            </div>
            <div style={{ height: 1, background: "var(--md-outline-variant)" }} />
            <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
              {navItems.map(({ href, label, icon: Icon, active }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setIsDrawerOpen(false)}
                  className="md-state flex items-center gap-4 rounded-full px-4 py-4 text-sm font-semibold"
                  style={{
                    background: active ? "var(--md-secondary-container)" : "transparent",
                    color: active ? "var(--md-on-secondary-container)" : "var(--md-on-surface-variant)",
                  }}
                >
                  <Icon size={18} />
                  <span>{label}</span>
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
