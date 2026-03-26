import TrashManager, {
  type TrashManagerItem,
} from '@/components/admin/TrashManager';
import ErrorToastTrigger from '@/components/ui/ErrorToastTrigger';
import { requireFullAdminAccess } from '@/lib/admin-access';
import { collectErrorMessages } from '@/lib/errors';
import { createClient } from '@/lib/supabase/server';
import type { ContentStatus } from '@/types';

type BreakingNewsTrashRow = {
  id: string;
  title: string;
  level: 'dangerous' | 'urgent' | 'warning';
  status: ContentStatus;
  expires_at: string;
  deleted_at: string;
};

type DangerNewsTrashRow = {
  id: string;
  title: string;
  status: ContentStatus;
  expires_at: string;
  deleted_at: string;
};

type HomeCarouselTrashRow = {
  id: string;
  title: string;
  subtitle: string;
  target: 'home' | 'announcements' | 'important-info' | 'events';
  sort_order: number;
  status: ContentStatus;
  deleted_at: string;
};

type AnnouncementTrashRow = {
  id: string;
  title: string;
  status: ContentStatus;
  published_at: string | null;
  deleted_at: string;
  divisions?:
    | {
        name?: string | null;
      }
    | Array<{
        name?: string | null;
      }>
    | null;
};

type EventTrashRow = {
  id: string;
  title: string;
  status: ContentStatus;
  starts_at: string;
  location: string | null;
  deleted_at: string;
};

const BREAKING_LEVEL_LABELS: Record<BreakingNewsTrashRow['level'], string> = {
  dangerous: 'خطير',
  urgent: 'عاجل',
  warning: 'تحذير',
};

const HOME_CAROUSEL_TARGET_LABELS: Record<HomeCarouselTrashRow['target'], string> = {
  home: 'الرئيسية',
  announcements: 'الإعلانات',
  'important-info': 'المعلومات المهمة',
  events: 'الفعاليات',
};

function formatShortDate(value?: string | null) {
  if (!value) return 'غير محدد';

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat('ar-MA', {
    dateStyle: 'medium',
  }).format(parsed);
}

function getDivisionName(record?: AnnouncementTrashRow['divisions']) {
  if (Array.isArray(record)) return record[0]?.name ?? 'غير محدد';
  return record?.name ?? 'غير محدد';
}

function joinSummary(parts: Array<string | null | undefined>) {
  return parts.filter(Boolean).join(' • ');
}

export default async function TrashDashboardPage() {
  await requireFullAdminAccess();
  const supabase = await createClient();

  const [
    breakingNewsResult,
    dangerNewsResult,
    homeCarouselResult,
    announcementsResult,
    eventsResult,
  ] = await Promise.all([
    supabase
      .from('breaking_news')
      .select('id, title, level, status, expires_at, deleted_at')
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false }),
    supabase
      .from('danger_news')
      .select('id, title, status, expires_at, deleted_at')
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false }),
    supabase
      .from('home_carousel_slides')
      .select('id, title, subtitle, target, sort_order, status, deleted_at')
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false }),
    supabase
      .from('announcements')
      .select('id, title, status, published_at, deleted_at, divisions(name)')
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false }),
    supabase
      .from('events')
      .select('id, title, status, starts_at, location, deleted_at')
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false }),
  ]);

  const pageErrors = collectErrorMessages([
    breakingNewsResult.error,
    dangerNewsResult.error,
    homeCarouselResult.error,
    announcementsResult.error,
    eventsResult.error,
  ]);

  const items: TrashManagerItem[] = [
    ...((announcementsResult.data ?? []) as AnnouncementTrashRow[]).map((item) => ({
      key: `announcements:${item.id}`,
      id: item.id,
      resource: 'announcements' as const,
      title: item.title,
      summary: joinSummary([
        `القسم: ${getDivisionName(item.divisions)}`,
        `النشر: ${formatShortDate(item.published_at)}`,
      ]),
      deletedAt: item.deleted_at,
      status: item.status,
      href: '/dashboard/announcements',
    })),
    ...((eventsResult.data ?? []) as EventTrashRow[]).map((item) => ({
      key: `events:${item.id}`,
      id: item.id,
      resource: 'events' as const,
      title: item.title,
      summary: joinSummary([
        `المكان: ${item.location || 'غير محدد'}`,
        `البداية: ${formatShortDate(item.starts_at)}`,
      ]),
      deletedAt: item.deleted_at,
      status: item.status,
      href: '/dashboard/events',
    })),
    ...((breakingNewsResult.data ?? []) as BreakingNewsTrashRow[]).map((item) => ({
      key: `breaking_news:${item.id}`,
      id: item.id,
      resource: 'breaking_news' as const,
      title: item.title,
      summary: joinSummary([
        `المستوى: ${BREAKING_LEVEL_LABELS[item.level]}`,
        `الانتهاء: ${formatShortDate(item.expires_at)}`,
      ]),
      deletedAt: item.deleted_at,
      status: item.status,
      href: '/dashboard/breaking-news',
    })),
    ...((dangerNewsResult.data ?? []) as DangerNewsTrashRow[]).map((item) => ({
      key: `danger_news:${item.id}`,
      id: item.id,
      resource: 'danger_news' as const,
      title: item.title,
      summary: `الانتهاء: ${formatShortDate(item.expires_at)}`,
      deletedAt: item.deleted_at,
      status: item.status,
      href: '/dashboard/danger-news',
    })),
    ...((homeCarouselResult.data ?? []) as HomeCarouselTrashRow[]).map((item) => ({
      key: `home_carousel:${item.id}`,
      id: item.id,
      resource: 'home_carousel' as const,
      title: item.title,
      summary: joinSummary([
        item.subtitle,
        `الوجهة: ${HOME_CAROUSEL_TARGET_LABELS[item.target]}`,
        `الترتيب: ${item.sort_order}`,
      ]),
      deletedAt: item.deleted_at,
      status: item.status,
      href: '/dashboard/home-carousel',
    })),
  ];

  return (
    <>
      <ErrorToastTrigger messages={pageErrors} />
      <TrashManager initialItems={items} />
    </>
  );
}
