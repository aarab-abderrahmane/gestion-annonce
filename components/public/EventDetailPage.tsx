import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  Sparkles,
  Users,
} from "lucide-react";
import { IMAGE_BLUR_DATA_URL, formatDate } from "@/lib/utils";
import type { Event, EventPerson } from "@/types";

const headingFont = '"IBM Plex Sans Arabic", "Noto Sans Arabic", system-ui, sans-serif';
const brandFont = '"Plus Jakarta Sans", "Inter", system-ui, sans-serif';
const bodyFont = '"Noto Sans Arabic", "Inter", system-ui, sans-serif';

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
      className: "bg-[#92000f] text-white",
    };
  }

  if (typeof end === "number" && now > end) {
    return {
      label: "انتهت",
      className: "bg-[#d0e6f3] text-[#004d64]",
    };
  }

  return {
    label: "قريبة",
    className: "bg-[#b91a20] text-white",
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
    event.category ? `التصنيف الرئيسي للفعالية: ${event.category}.` : null,
    event.attendeeCount && event.attendeeCount > 0
      ? `عدد الحضور المسجلين حتى الآن: ${new Intl.NumberFormat("ar-MA").format(event.attendeeCount)}.`
      : null,
    organizers.length > 0 ? `اللجنة المنظمة تضم ${new Intl.NumberFormat("ar-MA").format(organizers.length)} عضوًا.` : null,
    participants.length > 0
      ? `المشاركون الرئيسيون في البرنامج: ${new Intl.NumberFormat("ar-MA").format(participants.length)}.`
      : null,
  ].filter((value): value is string => Boolean(value));
}

function dedupeGallery(images?: string[]) {
  if (!images?.length) return [];
  return [...new Set(images.filter(Boolean))];
}

function PersonRow({
  person,
  roleLabel,
  badgeClassName,
}: {
  person: EventPerson;
  roleLabel: string;
  badgeClassName: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-[22px] bg-white p-3 transition-transform duration-200 hover:-translate-x-1">
      <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-[#d0e6f3]">
        {person.image ? (
          <Image
            src={person.image}
            alt={person.name}
            fill
            sizes="48px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm font-bold text-[#004d64]">
            {person.name.charAt(0)}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-[#181c1f]">{person.name}</p>
        <p className="truncate text-xs text-[#3f484d]">{person.role}</p>
      </div>

      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${badgeClassName}`}>
        {roleLabel}
      </span>
    </div>
  );
}

function DetailStat({
  icon,
  label,
  value,
  extraClassName,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  extraClassName?: string;
}) {
  return (
    <div className={`flex items-center gap-4 py-2 md:py-0 ${extraClassName ?? ""}`}>
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#004d64]/10 text-[#004d64]">
        {icon}
      </div>

      <div>
        <p className="mb-1 text-xs text-[#3f484d]">{label}</p>
        <p className="font-bold text-[#181c1f]">{value}</p>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="mb-6 flex items-center gap-3 text-2xl font-bold text-[#004d64]"
      style={{ fontFamily: headingFont }}
    >
      <span className="h-1 w-8 rounded-full bg-[#004d64]" />
      {children}
    </h2>
  );
}

export default function EventDetailPage({ event }: { event: Event }) {
  const status = getStatus(event);
  const organizers = event.organizers ?? event.people?.filter((person) => person.type === "organizer") ?? [];
  const participants = event.participants ?? event.people?.filter((person) => person.type === "participant") ?? [];
  const galleryImages = dedupeGallery(event.gallery);
  const heroImage = galleryImages[0] ?? event.logo;
  const gallery = galleryImages.length > 1 ? galleryImages.slice(1, 6) : galleryImages.slice(0, 5);
  const descriptionParagraphs = getDescriptionParagraphs(event);
  const highlights = getHighlights(event, organizers, participants);
  const attendeeText =
    event.attendeeCount && event.attendeeCount > 0
      ? `${new Intl.NumberFormat("ar-MA").format(event.attendeeCount)}+`
      : "الحضور مفتوح";

  return (
    <div
      className="min-h-screen bg-[#f7f9fe] text-right text-[#181c1f]"
      style={{ fontFamily: bodyFont }}
    >
      <div className="mx-auto max-w-screen-2xl px-4 py-8 sm:px-6 lg:px-8 xl:px-12">
        <nav
          aria-label="Breadcrumb"
          className="mb-8 flex flex-wrap items-center justify-end gap-2 text-sm text-[#3f484d]"
        >
          <Link href="/" className="transition-colors hover:text-[#004d64]">
            الرئيسية
          </Link>
          <span className="text-[#70787e]">/</span>
          <Link href="/events" className="transition-colors hover:text-[#004d64]">
            الفعاليات
          </Link>
          <span className="text-[#70787e]">/</span>
          <span className="font-semibold text-[#181c1f]">{event.title}</span>
        </nav>

        <div className="mb-6">
          <Link
            href="/events"
            className="inline-flex items-center gap-2 font-semibold text-[#004d64] transition-all duration-300 hover:gap-4"
          >
            <ArrowRight className="h-4 w-4" />
            <span>العودة إلى الفعاليات</span>
          </Link>
        </div>

        <section className="relative mb-6 overflow-hidden rounded-[40px] bg-[#ebeef3] shadow-[0_24px_60px_rgba(0,77,100,0.14)]">
          <div className="relative aspect-[21/9] min-h-[320px] w-full md:min-h-[420px]">
            {heroImage ? (
              <Image
                src={heroImage}
                alt={event.title}
                fill
                priority
                sizes="(min-width: 1536px) 1400px, 100vw"
                placeholder="blur"
                blurDataURL={IMAGE_BLUR_DATA_URL}
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(135,208,242,0.65),_transparent_35%),linear-gradient(135deg,_#006684,_#003949)]" />
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-[#004d64]/95 via-[#004d64]/35 to-transparent" />

            <div className="absolute inset-x-0 bottom-0 p-6 md:p-10 lg:p-12">
              <div className="mb-4 flex flex-wrap justify-end gap-3">
                <span className="rounded-xl bg-[#006684] px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-[#a2e1ff]">
                  {event.category || "فعالية"}
                </span>
                <span className={`rounded-xl px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] ${status.className}`}>
                  {status.label}
                </span>
              </div>

              <h1
                className="max-w-4xl text-3xl font-bold leading-tight text-white md:text-5xl lg:text-6xl"
                style={{ fontFamily: headingFont }}
              >
                {event.title}
              </h1>
            </div>
          </div>
        </section>

        <section className="mb-12 rounded-[28px] border border-[#bfc8cd]/40 bg-[#ebeef3] p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-6 divide-y divide-[#bfc8cd]/40 md:grid-cols-4 md:divide-x md:divide-x-reverse md:divide-y-0">
            <DetailStat
              icon={<MapPin className="h-5 w-5" />}
              label="الموقع"
              value={event.location || "غير محدد"}
            />
            <DetailStat
              icon={<CalendarDays className="h-5 w-5" />}
              label="التاريخ"
              value={formatEventDateRange(event.startsAt || event.date, event.endsAt || event.endDate)}
              extraClassName="md:pr-8"
            />
            <DetailStat
              icon={<Clock3 className="h-5 w-5" />}
              label="الوقت"
              value={formatEventTimeRange(event.startsAt, event.endsAt)}
              extraClassName="md:pr-8"
            />
            <DetailStat
              icon={<Users className="h-5 w-5" />}
              label="الحضور"
              value={attendeeText}
              extraClassName="md:pr-8"
            />
          </div>
        </section>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
          <div className="space-y-12 lg:col-span-8">
            <section className="rounded-[36px] bg-white p-8 shadow-sm md:p-10">
              <SectionTitle>حول هذه الفعالية</SectionTitle>

              <div className="space-y-4 leading-8 text-[#3f484d]">
                {descriptionParagraphs.map((paragraph, index) => (
                  <p key={`${event.id}-paragraph-${index}`}>{paragraph}</p>
                ))}
              </div>

              {highlights.length > 0 && (
                <ul className="mt-6 list-inside list-disc space-y-2 pr-4 text-[#3f484d]">
                  {highlights.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </section>

            {gallery.length > 0 && (
              <section id="event-gallery" className="space-y-6">
                <SectionTitle>معرض الصور</SectionTitle>

                <div className="grid auto-rows-[150px] grid-cols-2 gap-4 md:auto-rows-[180px] md:grid-cols-4">
                  {gallery.map((image, index) => (
                    <div
                      key={`${event.id}-gallery-${index}`}
                      className={`group relative overflow-hidden rounded-[24px] ${
                        index === 2 ? "md:col-span-2 md:row-span-2" : ""
                      }`}
                    >
                      <Image
                        src={image}
                        alt={`${event.title} - صورة ${index + 1}`}
                        fill
                        sizes="(min-width: 1024px) 25vw, 50vw"
                        placeholder="blur"
                        blurDataURL={IMAGE_BLUR_DATA_URL}
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="space-y-8 lg:col-span-4">
            <section className="rounded-[36px] border-r-4 border-[#004d64] bg-[#f1f4f8] p-8">
              <h2
                className="mb-8 text-xl font-bold text-[#181c1f]"
                style={{ fontFamily: headingFont }}
              >
                المشاركون والمنظمون
              </h2>

              {organizers.length > 0 && (
                <div className="mb-10">
                  <h3 className="mb-4 border-b border-[#bfc8cd]/40 pb-2 text-sm font-bold uppercase tracking-[0.18em] text-[#004d64]">
                    اللجنة المنظمة
                  </h3>

                  <div className="space-y-4">
                    {organizers.map((person) => (
                      <PersonRow
                        key={person.id}
                        person={person}
                        roleLabel="منظم"
                        badgeClassName="bg-[#004d64]/10 text-[#004d64]"
                      />
                    ))}
                  </div>
                </div>
              )}

              {participants.length > 0 && (
                <div>
                  <h3 className="mb-4 border-b border-[#bfc8cd]/40 pb-2 text-sm font-bold uppercase tracking-[0.18em] text-[#3f484d]">
                    المتحدثون الرئيسيون
                  </h3>

                  <div className="space-y-4">
                    {participants.map((person) => (
                      <PersonRow
                        key={person.id}
                        person={person}
                        roleLabel="مشارك"
                        badgeClassName="bg-[#d0e6f3] text-[#364954]"
                      />
                    ))}
                  </div>
                </div>
              )}

              {organizers.length === 0 && participants.length === 0 && (
                <div className="rounded-[24px] border border-dashed border-[#bfc8cd] bg-white px-5 py-6 text-sm text-[#3f484d]">
                  لم يتم نشر قائمة المشاركين والمنظمين لهذه الفعالية بعد.
                </div>
              )}
            </section>

            <section className="group relative overflow-hidden rounded-[36px] bg-[#004d64] p-8 text-white shadow-[0_24px_60px_rgba(0,77,100,0.24)]">
              <div className="absolute -left-12 -top-12 h-32 w-32 rounded-full bg-white/10 blur-2xl transition-transform duration-500 group-hover:scale-150" />

              <div className="relative z-10">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-[#bee9ff]">
                  <Sparkles className="h-5 w-5" />
                </div>

                <h3
                  className="mb-4 text-xl font-bold"
                  style={{ fontFamily: headingFont }}
                >
                  هل ترغب بمتابعة المزيد؟
                </h3>

                <p className="mb-6 text-sm leading-7 text-[#bee9ff]">
                  احتفظ بهذه الصفحة للرجوع إلى تفاصيل الفعالية، أو عد إلى أرشيف الفعاليات لاستكشاف الأنشطة المنشورة الأخرى.
                </p>

                <Link
                  href="/events"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-[18px] bg-white px-5 py-3 text-center font-bold text-[#004d64] transition-colors hover:bg-[#bee9ff]"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  تصفح جميع الفعاليات
                </Link>
              </div>
            </section>
          </aside>
        </div>

        <section className="mt-12 rounded-[36px] border border-[#bfc8cd]/35 bg-white/80 p-6 shadow-sm backdrop-blur md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p
                className="mb-2 text-lg font-bold text-[#004d64]"
                style={{ fontFamily: headingFont }}
              >
                {event.title}
              </p>
              <p className="text-sm text-[#3f484d]">
                صفحة تفصيلية خاصة بفعاليات {` `}
                <span style={{ fontFamily: brandFont }} className="font-semibold text-[#004d64]">
                  ISTA Ait Melloul
                </span>
                .
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 text-sm text-[#3f484d]">
              <span className="rounded-full bg-[#f1f4f8] px-4 py-2">{formatEventDateRange(event.startsAt || event.date, event.endsAt || event.endDate)}</span>
              <span className="rounded-full bg-[#f1f4f8] px-4 py-2">{event.location || "غير محدد"}</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
