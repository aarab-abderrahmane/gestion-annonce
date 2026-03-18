"use client";

import type { Announcement } from "@/types";
import AnnouncementCard from "@/components/public/AnnouncementCard";

type AnnouncementListProps = {
  announcements: Announcement[];
  emptyMessage?: string;
  hrefBase?: string;
};

export default function AnnouncementList({
  announcements,
  emptyMessage = "لا توجد إعلانات متاحة حالياً.",
  hrefBase,
}: AnnouncementListProps) {
  if (announcements.length === 0) {
    return (
      <div
        className="rounded-[var(--md-shape-xl)] border border-dashed px-5 py-12 text-center md-body-medium"
        style={{ borderColor: "var(--md-outline-variant)", color: "var(--md-on-surface-variant)" }}
      >
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {announcements.map((announcement) => (
        <AnnouncementCard
          key={announcement.id}
          announcement={announcement}
          hrefBase={hrefBase}
        />
      ))}
    </div>
  );
}
