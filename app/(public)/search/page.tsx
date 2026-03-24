import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, Bell, Calendar, Info, Search } from "lucide-react";
import ErrorToastTrigger from "@/components/ui/ErrorToastTrigger";
import { hydrateAnnouncementFiles } from "@/lib/announcement-files";
import { collectErrorMessages } from "@/lib/errors";
import {
  normalizeAnnouncement,
  normalizeEvent,
  normalizeNews,
  type PortalAnnouncementRow,
} from "@/lib/portal-data";
import { buildPublicMetadata } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

const headingFont = '"IBM Plex Sans Arabic", "Noto Sans Arabic", system-ui, sans-serif';
const brandFont = '"Plus Jakarta Sans", "Inter", system-ui, sans-serif';

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; from?: string; to?: string; sort?: string; expiry?: string }>;
}): Promise<Metadata> {
  const params = await searchParams;
  const query = (params.q || "").trim();

  return buildPublicMetadata({
    title: query ? `نتائج البحث: ${query} | ISTA Ait Melloul` : "البحث | ISTA Ait Melloul",
    description: query
      ? `نتائج البحث عن "${query}" في الإعلانات والتنبيهات والفعاليات الخاصة بـ ISTA Ait Melloul.`
      : "ابحث في الإعلانات والتنبيهات والفعاليات المنشورة على منصة ISTA Ait Melloul.",
    path: query ? `/search?q=${encodeURIComponent(query)}` : "/search",
  });
}

const filterOptions = [
  { value: "all", label: "الكل" },
  { value: "announcements", label: "الإعلانات" },
  { value: "news", label: "التنبيهات" },
  { value: "events", label: "الفعاليات" },
] as const;

const sortOptions = [
  { value: "newest", label: "الأحدث أولاً" },
  { value: "oldest", label: "الأقدم أولاً" },
] as const;

const expiryOptions = [
  { value: "all", label: "الكل" },
  { value: "active", label: "سارية" },
  { value: "expired", label: "منتهية" },
] as const;

function parseDateTimestamp(value?: string | null) {
  if (!value) return null;
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
}

function parseEndDateTimestamp(value?: string | null) {
  if (!value) return null;
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T23:59:59` : value;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
}

function isWithinDateRange(
  value: string | undefined,
  fromTimestamp: number | null,
  toTimestamp: number | null,
) {
  const current = parseDateTimestamp(value);
  if (current === null) return false;
  if (fromTimestamp !== null && current < fromTimestamp) return false;
  if (toTimestamp !== null && current > toTimestamp) return false;
  return true;
}

function sortByDate<T>(
  items: T[],
  getDate: (item: T) => string | undefined,
  sortOrder: string,
) {
  return [...items].sort((left, right) => {
    const leftTime = parseDateTimestamp(getDate(left)) ?? 0;
    const rightTime = parseDateTimestamp(getDate(right)) ?? 0;
    return sortOrder === "oldest" ? leftTime - rightTime : rightTime - leftTime;
  });
}

function matchesExpiryFilter(
  expiryValue: string | undefined,
  expiryFilter: string,
  nowTimestamp: number,
) {
  if (expiryFilter === "all") return true;
  const expiryTimestamp = parseEndDateTimestamp(expiryValue);
  if (expiryTimestamp === null) return expiryFilter === "active";
  const isExpired = expiryTimestamp < nowTimestamp;
  return expiryFilter === "expired" ? isExpired : !isExpired;
}

function SectionHeader({
  icon,
  title,
  count,
}: {
  icon: ReactNode;
  title: string;
  count: number;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{
            background: "var(--md-primary-container)",
            color: "var(--md-on-primary-container)",
          }}
        >
          {icon}
        </div>
        <h2
          className="text-xl font-bold"
          style={{ color: "var(--md-on-surface)" }}
        >
          <span style={{ fontFamily: headingFont }}>{title}</span>
        </h2>
      </div>

      <span
        className="rounded-full px-3 py-1 text-sm font-semibold"
        style={{
          background: "var(--md-surface-container)",
          color: "var(--md-on-surface-variant)",
        }}
      >
        {count}
      </span>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div
      className="rounded-2xl border border-dashed px-4 py-8 text-center text-sm"
      style={{
        borderColor: "var(--md-outline-variant)",
        background: "var(--md-surface-container-low)",
        color: "var(--md-on-surface-variant)",
      }}
    >
      {text}
    </div>
  );
}

function FilterField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label
      className="flex items-center gap-3 rounded-2xl border px-4 py-3"
      style={{
        borderColor: "var(--md-outline-variant)",
        background: "var(--md-surface-container-low)",
      }}
    >
      <span
        className="shrink-0 text-sm font-semibold"
        style={{ color: "var(--md-on-surface-variant)" }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

function ResultCard({
  href,
  badge,
  title,
  description,
}: {
  href: string;
  badge: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group block rounded-2xl border bg-white p-4 transition-colors"
      style={{
        borderColor: "var(--md-outline-variant)",
        background: "var(--md-surface-container-lowest)",
      }}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <span
          className="rounded-full px-3 py-1 text-xs font-bold"
          style={{
            background: "var(--md-surface-container)",
            color: "var(--md-on-surface-variant)",
          }}
        >
          {badge}
        </span>
        <ArrowLeft
          className="h-4 w-4 transition-transform group-hover:-translate-x-1"
          style={{ color: "var(--md-on-surface-variant)" }}
        />
      </div>

      <h3 className="text-base font-bold leading-7" style={{ color: "var(--md-on-surface)" }}>
        {title}
      </h3>
      <p className="mt-2 line-clamp-3 text-sm leading-7" style={{ color: "var(--md-on-surface-variant)" }}>
        {description}
      </p>
    </Link>
  );
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; from?: string; to?: string; sort?: string; expiry?: string }>;
}) {
  const params = await searchParams;
  const query = (params.q || "").trim();
  const rawType = (params.type || "all").trim();
  const from = (params.from || "").trim();
  const to = (params.to || "").trim();
  const rawSort = (params.sort || "newest").trim();
  const rawExpiry = (params.expiry || "all").trim();
  const activeType = filterOptions.some((option) => option.value === rawType)
    ? rawType
    : "all";
  const activeSort = sortOptions.some((option) => option.value === rawSort)
    ? rawSort
    : "newest";
  const activeExpiry = expiryOptions.some((option) => option.value === rawExpiry)
    ? rawExpiry
    : "all";
  const fromTimestamp = parseDateTimestamp(from || null);
  const toTimestamp = parseDateTimestamp(to ? `${to}T23:59:59` : null);
  const nowTimestamp = Date.now();
  const hasActiveSearch = Boolean(
    query || from || to || activeType !== "all" || activeSort !== "newest" || activeExpiry !== "all",
  );
  const supabase = await createClient();

  const [
    { data: breakingNewsData, error: newsError },
    { data: announcementsData, error: announcementsError },
    { data: eventsData, error: eventsError },
  ] = await Promise.all([
    supabase
      .from("breaking_news")
      .select("id, title, slug, level, status, created_at, expires_at")
      .eq("status", "published")
      .order("created_at", { ascending: false }),
    supabase
      .from("announcements")
      .select(`
        id, title, slug, description, published_at, expires_at, status,
        divisions(name),
        groups(name),
        announcement_category_links(announcement_categories(name, slug))
      `)
      .eq("status", "published")
      .order("published_at", { ascending: false }),
    supabase
      .from("events")
      .select(`
        id, title, slug, description, cover_image, location, starts_at, ends_at, total_attendees, status,
        event_people(id, name, role, type),
        event_photos(photo_url),
        event_category_links(event_categories(name, slug))
      `)
      .eq("status", "published")
      .order("starts_at", { ascending: false }),
  ]);

  const announcementFileErrors: string[] = [];

  const announcementsWithFiles = await hydrateAnnouncementFiles(
    supabase as never,
    (announcementsData ?? []) as PortalAnnouncementRow[],
    {
      onError: (message) => announcementFileErrors.push(message),
    },
  );

  const pageErrors = collectErrorMessages([
    newsError,
    announcementsError,
    eventsError,
    ...announcementFileErrors,
  ]);

  const announcements = announcementsWithFiles.map(normalizeAnnouncement);
  const news = (breakingNewsData ?? []).map(normalizeNews);
  const events = (eventsData ?? []).map(normalizeEvent);

  const filteredAnnouncements = hasActiveSearch
    ? announcements.filter(
        (item) =>
          (!query || item.title.includes(query) || item.content.includes(query)) &&
          matchesExpiryFilter(item.expiryDate, activeExpiry, nowTimestamp) &&
          isWithinDateRange(item.publishDate, fromTimestamp, toTimestamp),
      )
    : [];
  const filteredNews = hasActiveSearch
    ? news.filter(
        (item) =>
          (!query || item.title.includes(query) || item.description.includes(query)) &&
          matchesExpiryFilter(item.expiryDate, activeExpiry, nowTimestamp) &&
          isWithinDateRange(item.publishDate, fromTimestamp, toTimestamp),
      )
    : [];
  const filteredEvents = hasActiveSearch
    ? events.filter(
        (item) =>
          (!query ||
            item.title.includes(query) ||
            item.shortDescription.includes(query) ||
            item.location.includes(query)) &&
          matchesExpiryFilter(item.endsAt || item.endDate, activeExpiry, nowTimestamp) &&
          isWithinDateRange(item.startsAt || item.date, fromTimestamp, toTimestamp),
      )
    : [];

  const totalResults =
    filteredAnnouncements.length + filteredNews.length + filteredEvents.length;
  const visibleAnnouncements =
    activeType === "all" || activeType === "announcements"
      ? sortByDate(filteredAnnouncements, (item) => item.publishDate, activeSort)
      : [];
  const visibleNews =
    activeType === "all" || activeType === "news"
      ? sortByDate(filteredNews, (item) => item.publishDate, activeSort)
      : [];
  const visibleEvents =
    activeType === "all" || activeType === "events"
      ? sortByDate(filteredEvents, (item) => item.startsAt || item.date, activeSort)
      : [];
  const visibleTotal =
    visibleAnnouncements.length + visibleNews.length + visibleEvents.length;
  const hasCustomFilters = Boolean(
    query || from || to || activeType !== "all" || activeSort !== "newest" || activeExpiry !== "all",
  );

  return (
    <>
      <ErrorToastTrigger messages={pageErrors} />

      <div className="min-h-screen" style={{ background: "var(--md-surface)" }}>
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <section
            className="mb-8 rounded-[28px] border bg-white p-6 shadow-sm md:p-8"
            style={{
              borderColor: "var(--md-outline-variant)",
              background: "var(--md-surface-container-lowest)",
            }}
          >
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p
                  className="mb-2 text-xs font-bold uppercase tracking-[0.24em]"
                  style={{
                    fontFamily: brandFont,
                    color: "var(--md-primary)",
                  }}
                >
                  Search
                </p>
                <h1
                  className="text-3xl font-bold md:text-4xl"
                  style={{
                    fontFamily: headingFont,
                    color: "var(--md-on-surface)",
                  }}
                >
                  البحث الشامل
                </h1>
                <p
                  className="mt-3 max-w-2xl text-sm leading-7 md:text-base"
                  style={{ color: "var(--md-on-surface-variant)" }}
                >
                  تصميم أبسط وأسرع للعثور على الإعلانات والتنبيهات والفعاليات بدون
                  تشتيت بصري.
                </p>
              </div>

              <div
                className="rounded-2xl px-4 py-3 text-right"
                style={{ background: "var(--md-surface-container-low)" }}
              >
                <div className="text-2xl font-bold" style={{ color: "var(--md-on-surface)" }}>
                  {visibleTotal}
                </div>
                <div className="text-sm" style={{ color: "var(--md-on-surface-variant)" }}>
                  إجمالي النتائج
                </div>
              </div>
            </div>

            <form>
              <div
                className="flex items-center gap-3 rounded-2xl border px-4 py-3"
                style={{
                  borderColor: "var(--md-outline-variant)",
                  background: "var(--md-surface-container-low)",
                }}
              >
                <Search
                  className="h-5 w-5 flex-shrink-0"
                  style={{ color: "var(--md-on-surface-variant)" }}
                />
                <input
                  name="q"
                  defaultValue={query}
                  placeholder="ابحث في كل المحتوى..."
                  className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-[#98a2ab]"
                  style={{
                    fontFamily: brandFont,
                    color: "var(--md-on-surface)",
                  }}
                />
                <button
                  type="submit"
                  className="rounded-xl px-4 py-2 text-sm font-bold transition-opacity hover:opacity-90"
                  style={{
                    background: "var(--md-primary)",
                    color: "var(--md-on-primary)",
                  }}
                >
                  بحث
                </button>
              </div>

              <div
                className="mt-4 rounded-[24px] border p-4"
                style={{
                  borderColor: "var(--md-outline-variant)",
                  background: "var(--md-surface-container-lowest)",
                }}
              >
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p
                      className="text-sm font-semibold"
                      style={{ color: "var(--md-on-surface)" }}
                    >
                      الفلاتر
                    </p>
                    <p
                      className="mt-1 text-xs"
                      style={{ color: "var(--md-on-surface-variant)" }}
                    >
                      حدّد النوع، الترتيب، الحالة، أو النطاق الزمني.
                    </p>
                  </div>

                  {hasCustomFilters ? (
                    <Link
                      href="/search"
                      className="rounded-full px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90"
                      style={{
                        background: "var(--md-surface-container-high)",
                        color: "var(--md-on-surface)",
                      }}
                    >
                      مسح جميع الفلاتر
                    </Link>
                  ) : null}
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <FilterField label="الترتيب">
                    <select
                      name="sort"
                      defaultValue={activeSort}
                      className="min-w-0 flex-1 bg-transparent outline-none"
                      style={{ color: "var(--md-on-surface)", fontFamily: brandFont }}
                    >
                      {sortOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </FilterField>

                  <FilterField label="الحالة">
                    <select
                      name="expiry"
                      defaultValue={activeExpiry}
                      className="min-w-0 flex-1 bg-transparent outline-none"
                      style={{ color: "var(--md-on-surface)", fontFamily: brandFont }}
                    >
                      {expiryOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </FilterField>

                  <FilterField label="من">
                    <input
                      type="date"
                      name="from"
                      defaultValue={from}
                      className="min-w-0 flex-1 bg-transparent outline-none"
                      style={{ color: "var(--md-on-surface)", fontFamily: brandFont }}
                    />
                  </FilterField>

                  <FilterField label="إلى">
                    <input
                      type="date"
                      name="to"
                      defaultValue={to}
                      className="min-w-0 flex-1 bg-transparent outline-none"
                      style={{ color: "var(--md-on-surface)", fontFamily: brandFont }}
                    />
                  </FilterField>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {filterOptions.map((option) => {
                    const active = activeType === option.value;

                    return (
                      <button
                        key={option.value}
                        type="submit"
                        name="type"
                        value={option.value}
                        className="rounded-full px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90"
                        style={{
                          background: active
                            ? "var(--md-primary)"
                            : "var(--md-surface-container)",
                          color: active
                            ? "var(--md-on-primary)"
                            : "var(--md-on-surface-variant)",
                        }}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </form>

            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              <span
                className="rounded-full px-3 py-1"
                style={{
                  background: "var(--md-surface-container)",
                  color: "var(--md-on-surface-variant)",
                }}
              >
                {query ? `العبارة: ${query}` : "لا توجد عبارة بحث"}
              </span>
              <span className="rounded-full px-3 py-1" style={{ background: "var(--md-surface-container)", color: "var(--md-on-surface-variant)" }}>
                إعلانات: {visibleAnnouncements.length}
              </span>
              <span className="rounded-full px-3 py-1" style={{ background: "var(--md-surface-container)", color: "var(--md-on-surface-variant)" }}>
                تنبيهات: {visibleNews.length}
              </span>
              <span className="rounded-full px-3 py-1" style={{ background: "var(--md-surface-container)", color: "var(--md-on-surface-variant)" }}>
                فعاليات: {visibleEvents.length}
              </span>
              <span className="rounded-full px-3 py-1" style={{ background: "var(--md-surface-container)", color: "var(--md-on-surface-variant)" }}>
                الفلتر: {filterOptions.find((option) => option.value === activeType)?.label}
              </span>
              <span className="rounded-full px-3 py-1" style={{ background: "var(--md-surface-container)", color: "var(--md-on-surface-variant)" }}>
                الترتيب: {sortOptions.find((option) => option.value === activeSort)?.label}
              </span>
              <span className="rounded-full px-3 py-1" style={{ background: "var(--md-surface-container)", color: "var(--md-on-surface-variant)" }}>
                الحالة: {expiryOptions.find((option) => option.value === activeExpiry)?.label}
              </span>
              {from ? (
                <span className="rounded-full px-3 py-1" style={{ background: "var(--md-surface-container)", color: "var(--md-on-surface-variant)" }}>
                  من: {from}
                </span>
              ) : null}
              {to ? (
                <span className="rounded-full px-3 py-1" style={{ background: "var(--md-surface-container)", color: "var(--md-on-surface-variant)" }}>
                  إلى: {to}
                </span>
              ) : null}
            </div>
          </section>

          {!hasActiveSearch ? (
            <section
              className="rounded-[24px] border bg-white p-8 text-center shadow-sm"
              style={{
                borderColor: "var(--md-outline-variant)",
                background: "var(--md-surface-container-lowest)",
              }}
            >
              <h2
                className="text-2xl font-bold"
                style={{ fontFamily: headingFont, color: "var(--md-on-surface)" }}
              >
                ابدأ بالبحث
              </h2>
              <p className="mt-3 text-sm leading-7 md:text-base" style={{ color: "var(--md-on-surface-variant)" }}>
                اكتب كلمة مفتاحية أو حدّد نطاقاً زمنياً لعرض النتائج بسرعة في صفحة واحدة واضحة.
              </p>
            </section>
          ) : visibleTotal === 0 ? (
            <section
              className="rounded-[24px] border bg-white p-8 text-center shadow-sm"
              style={{
                borderColor: "var(--md-outline-variant)",
                background: "var(--md-surface-container-lowest)",
              }}
            >
              <h2
                className="text-2xl font-bold"
                style={{ fontFamily: headingFont, color: "var(--md-on-surface)" }}
              >
                لا توجد نتائج
              </h2>
              <p className="mt-3 text-sm leading-7 md:text-base" style={{ color: "var(--md-on-surface-variant)" }}>
                جرّب عبارة بحث مختلفة أو غيّر الفلتر المحدد.
              </p>
            </section>
          ) : (
            <div className="space-y-8">
              {(activeType === "all" || activeType === "announcements") && (
                <section className="rounded-[24px] border bg-white p-5 shadow-sm md:p-6" style={{ borderColor: "var(--md-outline-variant)", background: "var(--md-surface-container-lowest)" }}>
                  <SectionHeader
                    icon={<Bell className="h-5 w-5" />}
                    title="الإعلانات"
                    count={visibleAnnouncements.length}
                  />
                  {visibleAnnouncements.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      {visibleAnnouncements.map((item) => (
                        <ResultCard
                          key={item.id}
                          href={`/announcements/${encodeURIComponent(item.slug)}`}
                          badge="إعلان"
                          title={item.title}
                          description={item.content}
                        />
                      ))}
                    </div>
                  ) : (
                    <EmptyState text="لا توجد إعلانات مطابقة لهذه العبارة." />
                  )}
                </section>
              )}

              {(activeType === "all" || activeType === "news") && (
                <section className="rounded-[24px] border bg-white p-5 shadow-sm md:p-6" style={{ borderColor: "var(--md-outline-variant)", background: "var(--md-surface-container-lowest)" }}>
                  <SectionHeader
                    icon={<Info className="h-5 w-5" />}
                    title="التنبيهات"
                    count={visibleNews.length}
                  />
                  {visibleNews.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      {visibleNews.map((item) => (
                        <ResultCard
                          key={item.id}
                          href="/important-info"
                          badge="تنبيه"
                          title={item.title}
                          description={item.description}
                        />
                      ))}
                    </div>
                  ) : (
                    <EmptyState text="لا توجد تنبيهات مطابقة لهذه العبارة." />
                  )}
                </section>
              )}

              {(activeType === "all" || activeType === "events") && (
                <section className="rounded-[24px] border bg-white p-5 shadow-sm md:p-6" style={{ borderColor: "var(--md-outline-variant)", background: "var(--md-surface-container-lowest)" }}>
                  <SectionHeader
                    icon={<Calendar className="h-5 w-5" />}
                    title="الفعاليات"
                    count={visibleEvents.length}
                  />
                  {visibleEvents.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {visibleEvents.map((item) => (
                        <ResultCard
                          key={item.id}
                          href={`/events/${encodeURIComponent(item.slug)}`}
                          badge="فعالية"
                          title={item.title}
                          description={item.location || "المكان غير محدد"}
                        />
                      ))}
                    </div>
                  ) : (
                    <EmptyState text="لا توجد فعاليات مطابقة لهذه العبارة." />
                  )}
                </section>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
