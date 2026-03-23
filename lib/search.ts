import type { SupabaseClient } from '@supabase/supabase-js';
import { hydrateAnnouncementFiles } from '@/lib/announcement-files';
import {
  normalizeAnnouncement,
  normalizeEvent,
  normalizeNews,
  type PortalAnnouncementRow,
} from '@/lib/portal-data';
import type { SearchResultItem, SearchResultType } from '@/types';

type SearchFilters = {
  q?: string;
  type?: SearchResultType | 'all';
  from?: string;
  to?: string;
};

type SearchRpcRow = {
  id: string;
  slug: string;
  type: SearchResultType;
  title: string;
  excerpt: string | null;
  happened_at: string;
  badge: string | null;
};

function inDateRange(dateValue: string, from?: string, to?: string) {
  const value = new Date(dateValue);
  if (Number.isNaN(value.getTime())) return false;
  if (from) {
    const start = new Date(from);
    if (!Number.isNaN(start.getTime()) && value < start) return false;
  }
  if (to) {
    const end = new Date(to);
    if (!Number.isNaN(end.getTime()) && value > end) return false;
  }
  return true;
}

function includesQuery(haystack: string, query: string) {
  return haystack.toLocaleLowerCase().includes(query.toLocaleLowerCase());
}

function toSearchItem(row: SearchRpcRow): SearchResultItem {
  const href =
    row.type === 'announcement'
      ? `/announcements/${encodeURIComponent(row.slug)}`
      : row.type === 'event'
        ? `/events/${encodeURIComponent(row.slug)}`
        : `/search?q=${encodeURIComponent(row.title)}&type=breaking-news`;

  return {
    id: row.id,
    slug: row.slug,
    type: row.type,
    title: row.title,
    excerpt: row.excerpt ?? '',
    date: row.happened_at,
    badge: row.badge ?? '',
    href,
  };
}

async function fallbackSearch(supabase: SupabaseClient, filters: Required<SearchFilters>) {
  const query = filters.q.trim();
  const nowIso = new Date().toISOString();

  const [{ data: newsRows }, { data: announcementRows }, { data: eventRows }] = await Promise.all([
    supabase
      .from('breaking_news')
      .select('id, slug, title, level, created_at, expires_at, status')
      .eq('status', 'published')
      .gt('expires_at', nowIso)
      .order('created_at', { ascending: false }),
    supabase
      .from('announcements')
      .select(`
        id, slug, title, description, published_at, expires_at, status,
        divisions(name),
        groups(name),
        announcement_category_links(announcement_categories(name, slug))
      `)
      .eq('status', 'published')
      .order('published_at', { ascending: false }),
    supabase
      .from('events')
      .select(`
        id, slug, title, description, cover_image, location, starts_at, ends_at, total_attendees, status,
        event_people(id, name, role, type),
        event_photos(photo_url),
        event_category_links(event_categories(name, slug))
      `)
      .eq('status', 'published')
      .order('starts_at', { ascending: false }),
  ]);

  const announcementsWithFiles = await hydrateAnnouncementFiles(
    supabase as never,
    (announcementRows ?? []) as PortalAnnouncementRow[],
  );
  const announcements = announcementsWithFiles.map(normalizeAnnouncement);
  const news = (newsRows ?? []).map(normalizeNews);
  const events = (eventRows ?? []).map(normalizeEvent);

  const rows: SearchResultItem[] = [];

  if (filters.type === 'all' || filters.type === 'breaking-news') {
    rows.push(
      ...news
        .filter(
          (item) =>
            (!query || includesQuery(`${item.title} ${item.description}`, query)) &&
            inDateRange(item.publishDate, filters.from, filters.to)
        )
        .map((item) => ({
          id: item.id,
          slug: item.slug,
          type: 'breaking-news' as const,
          title: item.title,
          excerpt: item.description,
          date: item.publishDate,
          badge:
            item.riskLevel === 'high'
              ? 'خطير'
              : item.riskLevel === 'medium'
                ? 'عاجل'
                : 'تحذير',
          href: `/search?q=${encodeURIComponent(item.title)}&type=breaking-news`,
        }))
    );
  }

  if (filters.type === 'all' || filters.type === 'announcement') {
    rows.push(
      ...announcements
        .filter(
          (item) =>
            (!query || includesQuery(`${item.title} ${item.content}`, query)) &&
            inDateRange(item.publishDate, filters.from, filters.to)
        )
        .map((item) => ({
          id: item.id,
          slug: item.slug,
          type: 'announcement' as const,
          title: item.title,
          excerpt: item.content,
          date: item.publishDate,
          badge: item.categories?.[0] ?? item.category,
          href: `/announcements/${encodeURIComponent(item.slug)}`,
        }))
    );
  }

  if (filters.type === 'all' || filters.type === 'event') {
    rows.push(
      ...events
        .filter(
          (item) =>
            (!query ||
              includesQuery(
                `${item.title} ${item.shortDescription} ${item.location}`,
                query
              )) &&
            inDateRange(item.date, filters.from, filters.to)
        )
        .map((item) => ({
          id: item.id,
          slug: item.slug,
          type: 'event' as const,
          title: item.title,
          excerpt: item.shortDescription,
          date: item.date,
          badge: item.categories?.[0] ?? item.category ?? 'عام',
          href: `/events/${encodeURIComponent(item.slug)}`,
        }))
    );
  }

  return rows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function searchPublicContent(
  supabase: SupabaseClient,
  input: SearchFilters
): Promise<SearchResultItem[]> {
  const filters: Required<SearchFilters> = {
    q: input.q?.trim() ?? '',
    type: input.type ?? 'all',
    from: input.from ?? '',
    to: input.to ?? '',
  };

  if (!filters.q) {
    return fallbackSearch(supabase, filters);
  }

  const { data, error } = await supabase.rpc('search_public_content', {
    search_query: filters.q,
    filter_type: filters.type === 'all' ? null : filters.type,
    date_from: filters.from || null,
    date_to: filters.to || null,
  });

  if (error) {
    return fallbackSearch(supabase, filters);
  }

  return ((data ?? []) as SearchRpcRow[]).map(toSearchItem);
}
