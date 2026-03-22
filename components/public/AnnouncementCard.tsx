"use client";

import Link from "next/link";
import { useState } from "react";
import { CalendarDays, ExternalLink, FileText, FolderOpen } from "lucide-react";
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

function getAttachmentKind(file: NonNullable<Announcement["attachments"]>[number]) {
  if (file.fileType) return file.fileType;

  const rawExtension = file.name.split(".").pop() ?? file.url.split(".").pop() ?? "";
  const extension = rawExtension.toLowerCase().split("?")[0];

  if (["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg", "avif"].includes(extension)) {
    return "image";
  }

  if (extension === "pdf") {
    return "pdf";
  }

  return "file";
}

export default function AnnouncementCard({
  announcement,
  hrefBase = "/announcements",
}: AnnouncementCardProps) {
  const attachmentCount = announcement.attachments?.length ?? 0;
  const visibleAttachments = announcement.attachments?.slice(0, 2) ?? [];
  const [brokenAttachmentUrls, setBrokenAttachmentUrls] = useState<Record<string, boolean>>({});

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

      {visibleAttachments.length > 0 ? (
        <div className="mt-5 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            {visibleAttachments.map((file, index) => {
              const key = `${file.url}-${index}`;
              const attachmentKind = getAttachmentKind(file);
              const showImagePreview = attachmentKind === "image" && !brokenAttachmentUrls[key];

              return (
                <a
                  key={key}
                  href={file.url}
                  target="_blank"
                  rel="noreferrer"
                  className="overflow-hidden rounded-[22px] border transition-transform duration-200 hover:-translate-y-0.5"
                  style={{
                    borderColor: "var(--md-outline-variant)",
                    background: "var(--md-surface-container-low)",
                  }}
                >
                  <div
                    className="flex h-36 items-center justify-center overflow-hidden border-b"
                    style={{
                      borderColor: "var(--md-outline-variant)",
                      background: showImagePreview ? "var(--md-surface-container-lowest)" : "var(--md-surface-container)",
                    }}
                  >
                    {showImagePreview ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={file.url}
                        alt={file.name}
                        className="h-full w-full object-cover"
                        onError={() => {
                          setBrokenAttachmentUrls((current) => ({ ...current, [key]: true }));
                        }}
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-3 px-4 text-center">
                        <FileText size={28} style={{ color: "var(--md-primary)" }} />
                        <span className="md-label-medium" style={{ color: "var(--md-on-surface-variant)" }}>
                          {attachmentKind === "pdf" ? "ملف PDF" : "ملف مرفق"}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-3 px-4 py-3">
                    <p
                      className="min-w-0 truncate md-body-small font-semibold"
                      style={{ color: "var(--md-on-surface)" }}
                    >
                      {file.name}
                    </p>
                    <span
                      className="inline-flex shrink-0 items-center gap-1 md-label-medium"
                      style={{ color: "var(--md-primary)" }}
                    >
                      فتح
                      <ExternalLink size={14} />
                    </span>
                  </div>
                </a>
              );
            })}
          </div>

          {attachmentCount > visibleAttachments.length ? (
            <p className="md-body-small" style={{ color: "var(--md-on-surface-variant)" }}>
              +{attachmentCount - visibleAttachments.length} مرفقات إضافية داخل الإعلان
            </p>
          ) : null}
        </div>
      ) : null}

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
