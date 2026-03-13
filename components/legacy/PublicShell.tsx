"use client";

import { usePathname, useRouter } from "next/navigation";
import { useMemo } from "react";
import LegacyLayout from "@/components/legacy/Layout";
import { MOCK_EVENTS } from "@/lib/mock-data";

const pageToHref = (page: string) => {
  if (page === "home") return "/";
  if (page === "announcements") return "/announcements";
  if (page === "important-info") return "/important-info";
  if (page === "events") return "/events";
  if (page.startsWith("event-")) {
    const eventId = page.replace("event-", "");
    const event = MOCK_EVENTS.find((item) => item.id === eventId);
    return event ? `/events/${encodeURIComponent((event as any).slug ?? eventId)}` : "/events";
  }
  return "/";
};

const hrefToPage = (pathname: string) => {
  if (pathname === "/") return "home";
  if (pathname === "/announcements") return "announcements";
  if (pathname.startsWith("/announcements/")) return "announcements";
  if (pathname === "/important-info") return "important-info";
  if (pathname === "/events") return "events";
  if (pathname.startsWith("/events/")) return "event-detail";
  return "home";
};

export default function PublicShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const router = useRouter();
  const pathname = usePathname();
  const currentPage = useMemo(() => hrefToPage(pathname), [pathname]);

  return (
    <LegacyLayout currentPage={currentPage} onNavigate={(page) => router.push(pageToHref(page))}>
      {children}
    </LegacyLayout>
  );
}
