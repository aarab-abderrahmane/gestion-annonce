"use client";

import Link from "next/link";
import { CalendarDays, FileText, FolderOpen } from "lucide-react";
import type { Announcement } from "@/types";
import Badge from "@/components/ui/Badge";

type AnnouncementCardProps = {
  announcement: Announcement;
  hrefBase?: string;
};

function formatDate(value?: string) {
  if (!value) return "غير محدد";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ar-MA", { dateStyle: "medium" }).format(date);
}

export default function AnnouncementCard({
  announcement,
  hrefBase = "/announcements",
}: AnnouncementCardProps) {
  const attachmentCount = announcement.attachments?.length ?? 0;

  return (
    <article
      className="md-card-outlined p-5 transition-transform duration-200 hover:-translate-y-0.5"
      style={{ background: "var(--md-surface-container-lowest)" }}
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <Badge variant="primary">{announcement.category}</Badge>
          <Link
            href={`${hrefBase}/${encodeURIComponent(announcement.slug)}`}
            className="block md-title-large"
            style={{ color: "var(--md-on-surface)" }}
          >
            {announcement.title}
          </Link>
        </div>
        <Badge variant={attachmentCount > 0 ? "success" : "neutral"}>
          {attachmentCount > 0 ? `${attachmentCount} مرفق` : "بدون مرفقات"}
        </Badge>
      </div>

      <p className="line-clamp-3 md-body-medium" style={{ color: "var(--md-on-surface-variant)" }}>
        {announcement.content}
      </p>

      <div className="mt-5 flex flex-wrap gap-3">
        {announcement.department ? (
          <span
            className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 md-label-medium"
            style={{ background: "var(--md-surface-container)", color: "var(--md-on-surface-variant)" }}
          >
            <FolderOpen size={14} />
            {announcement.department}
          </span>
        ) : null}
        <span
          className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 md-label-medium"
          style={{ background: "var(--md-surface-container)", color: "var(--md-on-surface-variant)" }}
        >
          <CalendarDays size={14} />
          {formatDate(announcement.publishDate)}
        </span>
        {attachmentCount > 0 ? (
          <span
            className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 md-label-medium"
            style={{ background: "var(--md-surface-container)", color: "var(--md-on-surface-variant)" }}
          >
            <FileText size={14} />
            ملفات قابلة للتحميل
          </span>
        ) : null}
      </div>
    </article>
  );
}
