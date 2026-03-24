"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Images,
  MapPin,
  School,
  UserCircle2,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { IMAGE_BLUR_DATA_URL, formatDate } from "@/lib/utils";
import type { Event, EventPerson } from "@/types";

const headingFont = '"IBM Plex Sans Arabic", "Tajawal", system-ui, sans-serif';
const bodyFont = '"Tajawal", "IBM Plex Sans Arabic", system-ui, sans-serif';
const schoolName = "ISTA Ait Melloul";

const pageTheme = {
  "--event-primary": "var(--md-primary)",
  "--event-secondary": "var(--md-tertiary)",
  "--event-text": "var(--md-on-surface)",
  "--event-text-secondary": "var(--md-on-surface-variant)",
  "--event-divider": "var(--md-outline-variant)",
  "--event-workshop": "var(--md-primary)",
  "--event-competition": "var(--md-tertiary)",
  "--event-celebration": "var(--md-secondary)",
  "--event-academic": "var(--md-primary-container)",
  "--event-sports": "var(--md-secondary-container)",
} as CSSProperties;

function toDate(value?: string) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatEventDateRange(start?: string, end?: string) {
  const startDate = toDate(start);
  const endDate = toDate(end);

  if (!startDate && !endDate) return "غير محدد";
  if (startDate && !endDate) {
    return formatDate(startDate, "ar-MA", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }
  if (!startDate && endDate) {
    return formatDate(endDate, "ar-MA", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }
  if (!startDate || !endDate) return "غير محدد";

  if (startDate.toDateString() === endDate.toDateString()) {
    return formatDate(startDate, "ar-MA", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  const sameMonth =
    startDate.getMonth() === endDate.getMonth() &&
    startDate.getFullYear() === endDate.getFullYear();

  if (sameMonth) {
    return `${new Intl.NumberFormat("ar-MA").format(startDate.getDate())} - ${formatDate(
      endDate,
      "ar-MA",
      {
        day: "numeric",
        month: "long",
        year: "numeric",
      },
    )}`;
  }

  return `${formatDate(startDate, "ar-MA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })} - ${formatDate(endDate, "ar-MA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })}`;
}

function formatEventTimeRange(start?: string, end?: string) {
  const startDate = toDate(start);
  const endDate = toDate(end);

  if (!startDate && !endDate) return "غير محدد";

  const formatter = new Intl.DateTimeFormat("ar-MA", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (startDate && endDate) {
    return `${formatter.format(startDate)} - ${formatter.format(endDate)}`;
  }

  return formatter.format((startDate || endDate) as Date);
}

function getStatus(event: Event) {
  const now = Date.now();
  const start = toDate(event.startsAt)?.getTime();
  const end = toDate(event.endsAt)?.getTime();

  if (typeof start === "number" && typeof end === "number" && now >= start && now <= end) {
    return {
      label: "جارية الآن",
      style: {
        backgroundColor: "var(--event-secondary)",
        color: "var(--md-on-tertiary)",
      } as CSSProperties,
    };
  }

  if (typeof end === "number" && now > end) {
    return {
      label: "انتهت",
      style: {
        backgroundColor: "var(--md-surface-container-highest)",
        color: "var(--md-on-surface-variant)",
      } as CSSProperties,
    };
  }

  return {
    label: "قريبة",
    style: {
      backgroundColor: "var(--event-primary)",
      color: "var(--md-on-primary)",
    } as CSSProperties,
  };
}

function getDescriptionParagraphs(event: Event) {
  const source = event.detailedDescription || event.shortDescription || "لا يوجد وصف متاح لهذه الفعالية.";

  return source
    .split(/\n+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function getHighlights(event: Event, organizers: EventPerson[], participants: EventPerson[]) {
  return [
    event.category ? `تصنيف الفعالية: ${event.category}.` : null,
    event.attendeeCount && event.attendeeCount > 0
      ? `عدد الحضور المتوقع: ${new Intl.NumberFormat("ar-MA").format(event.attendeeCount)} مشاركًا.`
      : null,
    organizers.length > 0
      ? `اللجنة المنظمة تضم ${new Intl.NumberFormat("ar-MA").format(organizers.length)} عضوًا.`
      : null,
    participants.length > 0
      ? `المشاركون الرئيسيون: ${new Intl.NumberFormat("ar-MA").format(participants.length)}.`
      : null,
  ].filter((value): value is string => Boolean(value));
}

function dedupeGallery(images?: string[]) {
  if (!images?.length) return [];
  return [...new Set(images.filter(Boolean))];
}

function getCategoryTone(category?: string) {
  const value = (category ?? "").toLowerCase();

  if (value.includes("ورش") || value.includes("workshop") || value.includes("atelier")) {
    return {
      backgroundColor: "var(--event-workshop)",
      color: "var(--md-on-primary)",
    } as CSSProperties;
  }

  if (value.includes("مساب") || value.includes("competition") || value.includes("concours")) {
    return {
      backgroundColor: "var(--event-competition)",
      color: "var(--md-on-tertiary)",
    } as CSSProperties;
  }

  if (value.includes("احتفال") || value.includes("celebration") || value.includes("festival")) {
    return {
      backgroundColor: "var(--event-celebration)",
      color: "var(--md-on-secondary)",
    } as CSSProperties;
  }

  if (value.includes("رياض") || value.includes("sport")) {
    return {
      backgroundColor: "var(--event-sports)",
      color: "var(--md-on-secondary-container)",
    } as CSSProperties;
  }

  return {
    backgroundColor: "var(--event-academic)",
    color: "var(--md-on-primary-container)",
  } as CSSProperties;
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div
      className="flex items-start gap-4 rounded-[12px] px-1 py-2 lg:px-4"
      style={{ borderColor: "var(--event-divider)" }}
    >
      <div
        className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: "var(--md-primary-container)", color: "var(--md-on-primary-container)" }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="mb-1 text-sm" style={{ color: "var(--event-text-secondary)" }}>
          {label}
        </p>
        <p className="text-base font-bold leading-7" style={{ color: "var(--event-text)" }}>
          {value}
        </p>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div className="mb-6 flex items-center justify-between gap-4">
      <h2
        className="text-[24px] font-bold leading-tight"
        style={{ color: "var(--event-text)", fontFamily: headingFont }}
      >
        {children}
      </h2>
      <span
        className="h-[3px] w-16 rounded-full"
        style={{ backgroundColor: "var(--event-primary)" }}
      />
    </div>
  );
}

function PersonCard({
  person,
  badge,
  badgeStyle,
}: {
  person: EventPerson;
  badge: string;
  badgeStyle: CSSProperties;
}) {
  return (
    <div
      className="flex items-center gap-4 rounded-[12px] p-4 transition duration-200 hover:-translate-y-0.5"
      style={{
        backgroundColor: "var(--md-surface-container-low)",
        border: "1px solid var(--event-divider)",
      }}
    >
      <div
        className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full"
        style={{ backgroundColor: "var(--md-secondary-container)" }}
      >
        {person.image ? (
          <Image
            src={person.image}
            alt={person.name}
            fill
            sizes="48px"
            className="object-cover"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center"
            style={{ color: "var(--md-on-secondary-container)" }}
          >
            <UserCircle2 className="h-6 w-6" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-bold" style={{ color: "var(--event-text)" }}>
          {person.name}
        </p>
        <p className="truncate text-sm" style={{ color: "var(--event-text-secondary)" }}>
          {person.role}
        </p>
      </div>

      <span
        className="rounded-full px-3 py-1 text-xs font-bold"
        style={badgeStyle}
      >
        {badge}
      </span>
    </div>
  );
}

function LightboxControls({
  onPrevious,
  onNext,
  total,
}: {
  onPrevious: () => void;
  onNext: () => void;
  total: number;
}) {
  if (total <= 1) return null;

  return (
    <>
      <button
        type="button"
        onClick={onPrevious}
        aria-label="الصورة السابقة"
        className="absolute left-3 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20 md:left-6"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        type="button"
        onClick={onNext}
        aria-label="الصورة التالية"
        className="absolute right-3 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20 md:right-6"
      >
        <ChevronRight className="h-6 w-6" />
      </button>
    </>
  );
}

export default function EventDetailPage({ event }: { event: Event }) {
  const organizers =
    event.organizers ?? event.people?.filter((person) => person.type === "organizer") ?? [];
  const participants =
    event.participants ?? event.people?.filter((person) => person.type === "participant") ?? [];
  const status = getStatus(event);
  const descriptionParagraphs = getDescriptionParagraphs(event);
  const highlights = getHighlights(event, organizers, participants);
  const galleryImages = dedupeGallery(event.gallery);
  const heroImage = galleryImages[0] ?? event.logo;
  const gallery = galleryImages.filter((image, index) => !(index === 0 && image === heroImage));
  const hasPeople = organizers.length > 0 || participants.length > 0;
  const attendeeText =
    event.attendeeCount && event.attendeeCount > 0
      ? `${new Intl.NumberFormat("ar-MA").format(event.attendeeCount)}+`
      : "الحضور مفتوح";
  const quickDescription = descriptionParagraphs[0] ?? "تفاصيل الفعالية ستظهر هنا حال توفرها.";
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);

  const showPreviousImage = () => {
    setActiveImageIndex((current) => {
      if (current === null || gallery.length <= 1) return current;
      return current === 0 ? gallery.length - 1 : current - 1;
    });
  };

  const showNextImage = () => {
    setActiveImageIndex((current) => {
      if (current === null || gallery.length <= 1) return current;
      return current === gallery.length - 1 ? 0 : current + 1;
    });
  };

  useEffect(() => {
    if (activeImageIndex === null) return;

    const handleKeyDown = (keyboardEvent: KeyboardEvent) => {
      if (keyboardEvent.key === "Escape") {
        setActiveImageIndex(null);
        return;
      }

      if (keyboardEvent.key === "ArrowLeft") {
        setActiveImageIndex((current) => {
          if (current === null || gallery.length <= 1) return current;
          return current === 0 ? gallery.length - 1 : current - 1;
        });
      }

      if (keyboardEvent.key === "ArrowRight") {
        setActiveImageIndex((current) => {
          if (current === null || gallery.length <= 1) return current;
          return current === gallery.length - 1 ? 0 : current + 1;
        });
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeImageIndex, gallery.length]);

  return (
    <div
      className="min-h-screen"
      style={{
        ...pageTheme,
        fontFamily: bodyFont,
        color: "var(--event-text)",
      }}
    >
      <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <nav
          aria-label="Breadcrumb"
          className="mb-6 flex flex-wrap items-center gap-2 text-sm"
          style={{ color: "var(--event-text-secondary)" }}
        >
          <Link href="/" className="transition hover:text-[var(--md-primary)]">
            الرئيسية
          </Link>
          <span aria-hidden="true">←</span>
          <Link href="/events" className="transition hover:text-[var(--md-primary)]">
            الفعاليات
          </Link>
          <span aria-hidden="true">←</span>
          <span className="font-semibold" style={{ color: "var(--event-text)" }}>
            {event.title}
          </span>
        </nav>

        <section
          className="md-card-elevated relative overflow-hidden"
          style={{ backgroundColor: "var(--md-surface-container-high)" }}
        >
          <div className="relative h-[250px] w-full sm:h-[320px] lg:h-[450px]">
            {heroImage ? (
              <Image
                src={heroImage}
                alt={event.title}
                fill
                priority
                sizes="(min-width: 1200px) 1200px, 100vw"
                placeholder="blur"
                blurDataURL={IMAGE_BLUR_DATA_URL}
                className="object-cover"
              />
            ) : (
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(135deg, var(--md-surface-container-highest), var(--md-surface-container))",
                }}
              >
                <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
                  <span
                    className="flex h-16 w-16 items-center justify-center rounded-full bg-white/70"
                    style={{ color: "var(--md-primary)" }}
                    aria-hidden="true"
                  >
                    <School className="h-8 w-8" />
                  </span>
                  <div>
                    <p
                      className="text-[28px] font-bold leading-tight sm:text-[34px]"
                      style={{ color: "var(--md-on-surface-variant)", fontFamily: headingFont }}
                    >
                      {schoolName}
                    </p>
                    <p className="mt-2 text-sm sm:text-base" style={{ color: "var(--md-on-surface-variant)" }}>
                      صفحة فعالية رسمية للمعهد المتخصص للتكنولوجيا التطبيقية بأيت ملول
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.08),rgba(0,0,0,0.72))]" />

            <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8 lg:p-10">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span
                  className="rounded-full px-3 py-1 text-xs font-bold"
                  style={getCategoryTone(event.category)}
                >
                  {event.category || "فعالية"}
                </span>
                <span
                  className="rounded-full px-3 py-1 text-xs font-bold"
                  style={status.style}
                >
                  {status.label}
                </span>
              </div>

              <h1
                className="max-w-[800px] text-[28px] font-bold leading-tight text-white sm:text-[32px] lg:text-[36px]"
                style={{ fontFamily: headingFont }}
              >
                {event.title}
              </h1>
            </div>
          </div>
        </section>

        <section className="md-card-filled mt-6 px-4 py-5 sm:px-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-3">
            <StatCard
              icon={<MapPin className="h-5 w-5" />}
              label="الموقع"
              value={event.location || "غير محدد"}
            />
            <StatCard
              icon={<CalendarDays className="h-5 w-5" />}
              label="التاريخ"
              value={formatEventDateRange(event.startsAt || event.date, event.endsAt || event.endDate)}
            />
            <StatCard
              icon={<Clock3 className="h-5 w-5" />}
              label="الوقت"
              value={formatEventTimeRange(event.startsAt, event.endsAt)}
            />
            <StatCard
              icon={<Users className="h-5 w-5" />}
              label="الحضور"
              value={attendeeText}
            />
          </div>
        </section>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(280px,3fr)] lg:items-start">
          <div className="space-y-8">
            <section className="md-card-outlined p-6 sm:p-8">
              <SectionTitle>نبذة عن الفعالية</SectionTitle>

              <div
                className="space-y-4 text-base leading-[1.8]"
                style={{ color: "var(--event-text-secondary)" }}
              >
                {descriptionParagraphs.map((paragraph, index) => (
                  <p key={`${event.id}-paragraph-${index}`}>{paragraph}</p>
                ))}
              </div>

              {highlights.length > 0 && (
                <div
                  className="mt-8 grid gap-3 sm:grid-cols-2"
                  aria-label="أبرز المعلومات"
                >
                  {highlights.map((highlight) => (
                    <div
                      key={highlight}
                      className="flex items-start gap-3 rounded-[12px] p-4"
                      style={{
                        backgroundColor: "var(--md-surface-container-low)",
                        border: "1px solid var(--event-divider)",
                      }}
                    >
                      <span
                        className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full"
                        style={{ backgroundColor: "var(--md-primary-container)", color: "var(--md-on-primary-container)" }}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </span>
                      <p className="text-sm leading-7" style={{ color: "var(--event-text)" }}>
                        {highlight}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {gallery.length > 0 && (
              <section className="md-card-outlined p-6 sm:p-8">
                <SectionTitle>معرض الصور</SectionTitle>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {gallery.map((image, index) => (
                    <button
                      key={`${event.id}-gallery-${index}`}
                      type="button"
                      onClick={() => setActiveImageIndex(index)}
                      className="group relative aspect-square overflow-hidden rounded-[12px] text-right"
                      aria-label={`فتح الصورة ${index + 1} من ${gallery.length}`}
                    >
                      <Image
                        src={image}
                        alt={`${event.title} - صورة ${index + 1}`}
                        fill
                        sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
                        placeholder="blur"
                        blurDataURL={IMAGE_BLUR_DATA_URL}
                        className="object-cover transition duration-200 ease-out group-hover:scale-[1.05]"
                      />
                      <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.38))] opacity-0 transition duration-200 group-hover:opacity-100" />
                    </button>
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="lg:sticky lg:top-24">
            <div className="space-y-6">
              <section className="md-card-outlined p-6">
                <p
                  className="mb-2 text-sm font-semibold"
                  style={{ color: "var(--event-primary)" }}
                >
                  بطاقة الفعالية
                </p>
                <h2
                  className="text-[18px] font-bold leading-8"
                  style={{ color: "var(--event-text)", fontFamily: headingFont }}
                >
                  {event.title}
                </h2>
                <p className="mt-3 text-sm leading-7" style={{ color: "var(--event-text-secondary)" }}>
                  {quickDescription}
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  <span
                    className="rounded-full px-3 py-1 text-xs font-bold"
                    style={getCategoryTone(event.category)}
                  >
                    {event.category || "فعالية"}
                  </span>
                  <span
                    className="rounded-full px-3 py-1 text-xs font-bold"
                    style={status.style}
                  >
                    {status.label}
                  </span>
                </div>

                <div
                  className="mt-6 space-y-4 border-t pt-5"
                  style={{ borderColor: "var(--event-divider)" }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-sm" style={{ color: "var(--event-text-secondary)" }}>
                      المؤسسة
                    </span>
                    <span className="text-sm font-semibold" style={{ color: "var(--event-text)" }}>
                      {schoolName}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-sm" style={{ color: "var(--event-text-secondary)" }}>
                      التاريخ
                    </span>
                    <span className="text-sm font-semibold text-right" style={{ color: "var(--event-text)" }}>
                      {formatEventDateRange(event.startsAt || event.date, event.endsAt || event.endDate)}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-sm" style={{ color: "var(--event-text-secondary)" }}>
                      المكان
                    </span>
                    <span className="text-sm font-semibold text-right" style={{ color: "var(--event-text)" }}>
                      {event.location || "غير محدد"}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-sm" style={{ color: "var(--event-text-secondary)" }}>
                      الصور
                    </span>
                    <span className="text-sm font-semibold" style={{ color: "var(--event-text)" }}>
                      {new Intl.NumberFormat("ar-MA").format(gallery.length)}
                    </span>
                  </div>
                </div>
              </section>

              {hasPeople && (
                <section className="md-card-outlined p-6">
                  <SectionTitle>الأشخاص المرتبطون بالفعالية</SectionTitle>

                  {organizers.length > 0 && (
                    <div>
                      <p
                        className="mb-4 text-sm font-bold"
                        style={{ color: "var(--event-primary)" }}
                      >
                        اللجنة المنظمة
                      </p>
                      <div className="space-y-3">
                        {organizers.map((person) => (
                          <PersonCard
                            key={person.id}
                            person={person}
                            badge="منظم"
                            badgeStyle={{
                              backgroundColor: "var(--md-primary-container)",
                              color: "var(--md-on-primary-container)",
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {participants.length > 0 && (
                    <div className={organizers.length > 0 ? "mt-6" : ""}>
                      <p
                        className="mb-4 text-sm font-bold"
                        style={{ color: "var(--event-primary)" }}
                      >
                        المشاركون
                      </p>
                      <div className="space-y-3">
                        {participants.map((person) => (
                          <PersonCard
                            key={person.id}
                            person={person}
                            badge="مشارك"
                            badgeStyle={{
                              backgroundColor: "var(--md-secondary-container)",
                              color: "var(--md-on-secondary-container)",
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              )}

              <section
                className="md-card-filled p-6"
                style={{ backgroundColor: "var(--md-primary-container)", color: "var(--md-on-primary-container)" }}
              >
                <div
                  className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full"
                  style={{ backgroundColor: "var(--md-primary)", color: "var(--md-on-primary)" }}
                >
                  <Images className="h-5 w-5" />
                </div>
                <h2
                  className="text-[18px] font-bold leading-8"
                  style={{ color: "var(--md-on-primary-container)", fontFamily: headingFont }}
                >
                  متابعة أنشطة المؤسسة
                </h2>
                <p className="mt-3 text-sm leading-7" style={{ color: "var(--md-on-primary-container)" }}>
                  استعرض أرشيف الفعاليات للتعرف على الأنشطة الأكاديمية والثقافية والرياضية المنشورة من طرف المؤسسة.
                </p>
                <Link
                  href="/events"
                  className="md-btn md-btn-filled md-state mt-5 w-full"
                  style={{ fontFamily: bodyFont }}
                >
                  <ArrowRight className="h-4 w-4" />
                  تصفح جميع الفعاليات
                </Link>
              </section>
            </div>
          </aside>
        </div>

        <div className="mt-10 flex justify-start lg:justify-center">
          <Link
            href="/events"
            className="md-btn md-btn-tonal md-state"
            style={{ fontFamily: bodyFont }}
          >
            <ArrowRight className="h-4 w-4" />
            العودة إلى الفعاليات
          </Link>
        </div>
      </div>

      {activeImageIndex !== null && gallery[activeImageIndex] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 px-4 py-8"
          role="dialog"
          aria-modal="true"
          aria-label="معاينة الصورة"
          onClick={() => setActiveImageIndex(null)}
        >
          <div
            className="relative flex w-full max-w-6xl items-center justify-center"
            onClick={(eventObject) => eventObject.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setActiveImageIndex(null)}
              aria-label="إغلاق المعاينة"
              className="absolute right-0 top-[-56px] z-20 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </button>

            <LightboxControls
              onPrevious={showPreviousImage}
              onNext={showNextImage}
              total={gallery.length}
            />

            <div className="relative h-[70vh] w-full max-w-[90vw] overflow-hidden rounded-[16px]">
              <Image
                src={gallery[activeImageIndex]}
                alt={`${event.title} - صورة ${activeImageIndex + 1}`}
                fill
                sizes="90vw"
                className="object-contain"
              />
            </div>

            <div className="absolute bottom-[-40px] left-1/2 -translate-x-1/2 text-sm text-white">
              {new Intl.NumberFormat("ar-MA").format(activeImageIndex + 1)} / {new Intl.NumberFormat("ar-MA").format(gallery.length)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
