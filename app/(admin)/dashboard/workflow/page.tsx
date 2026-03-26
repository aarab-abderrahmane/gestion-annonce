import WorkflowControlPage from '@/components/admin/WorkflowControlPage';
import { requireFullAdminAccess } from '@/lib/admin-access';
import { createClient } from '@/lib/supabase/server';
import { WORKFLOW_RESOURCE_CONFIG } from '@/lib/workflow-control';

type RawWorkflowRow = {
  id: string;
  title: string;
  status: 'draft' | 'published';
  editorial_status: 'draft' | 'in_review' | 'changes_requested' | 'approved' | null;
  created_at: string;
  published_at?: string | null;
  reviewed_at?: string | null;
  review_notes?: string | null;
};

export default async function WorkflowDashboardPage() {
  await requireFullAdminAccess();
  const supabase = await createClient();

  const [breakingNews, dangerNews, announcements, events, homeCarousel] =
    await Promise.all([
      supabase
        .from('breaking_news')
        .select(
          'id, title, status, editorial_status, created_at, published_at, reviewed_at, review_notes',
        )
        .is('deleted_at', null)
        .order('created_at', { ascending: false }),
      supabase
        .from('danger_news')
        .select(
          'id, title, status, editorial_status, created_at, published_at, reviewed_at, review_notes',
        )
        .is('deleted_at', null)
        .order('created_at', { ascending: false }),
      supabase
        .from('announcements')
        .select(
          'id, title, status, editorial_status, created_at, published_at, reviewed_at, review_notes',
        )
        .is('deleted_at', null)
        .order('created_at', { ascending: false }),
      supabase
        .from('events')
        .select(
          'id, title, status, editorial_status, created_at, published_at, reviewed_at, review_notes',
        )
        .is('deleted_at', null)
        .order('created_at', { ascending: false }),
      supabase
        .from('home_carousel_slides')
        .select(
          'id, title, status, editorial_status, created_at, published_at, reviewed_at, review_notes',
        )
        .is('deleted_at', null)
        .order('created_at', { ascending: false }),
    ]);

  const items = [
    ...(breakingNews.data ?? []).map((item) => ({
      ...(item as RawWorkflowRow),
      editorial_status:
        (item.editorial_status as RawWorkflowRow['editorial_status']) ?? 'draft',
      published_at: item.published_at ?? null,
      reviewed_at: item.reviewed_at ?? null,
      review_notes: item.review_notes ?? null,
      resource: 'breaking_news' as const,
      edit_href: WORKFLOW_RESOURCE_CONFIG.breaking_news.editHref(item.id),
    })),
    ...(dangerNews.data ?? []).map((item) => ({
      ...(item as RawWorkflowRow),
      editorial_status:
        (item.editorial_status as RawWorkflowRow['editorial_status']) ?? 'draft',
      published_at: item.published_at ?? null,
      reviewed_at: item.reviewed_at ?? null,
      review_notes: item.review_notes ?? null,
      resource: 'danger_news' as const,
      edit_href: WORKFLOW_RESOURCE_CONFIG.danger_news.editHref(item.id),
    })),
    ...(announcements.data ?? []).map((item) => ({
      ...(item as RawWorkflowRow),
      editorial_status:
        (item.editorial_status as RawWorkflowRow['editorial_status']) ?? 'draft',
      published_at: item.published_at ?? null,
      reviewed_at: item.reviewed_at ?? null,
      review_notes: item.review_notes ?? null,
      resource: 'announcements' as const,
      edit_href: WORKFLOW_RESOURCE_CONFIG.announcements.editHref(item.id),
    })),
    ...(events.data ?? []).map((item) => ({
      ...(item as RawWorkflowRow),
      editorial_status:
        (item.editorial_status as RawWorkflowRow['editorial_status']) ?? 'draft',
      published_at: item.published_at ?? null,
      reviewed_at: item.reviewed_at ?? null,
      review_notes: item.review_notes ?? null,
      resource: 'events' as const,
      edit_href: WORKFLOW_RESOURCE_CONFIG.events.editHref(item.id),
    })),
    ...(homeCarousel.data ?? []).map((item) => ({
      ...(item as RawWorkflowRow),
      editorial_status:
        (item.editorial_status as RawWorkflowRow['editorial_status']) ?? 'draft',
      published_at: item.published_at ?? null,
      reviewed_at: item.reviewed_at ?? null,
      review_notes: item.review_notes ?? null,
      resource: 'home_carousel' as const,
      edit_href: WORKFLOW_RESOURCE_CONFIG.home_carousel.editHref(item.id),
    })),
  ].sort(
    (left, right) =>
      new Date(right.created_at).getTime() - new Date(left.created_at).getTime(),
  );

  return <WorkflowControlPage initialItems={items} />;
}
