import type { AdminResource } from '@/lib/admin-permissions';

export const WORKFLOW_RESOURCE_VALUES = [
  'breaking_news',
  'danger_news',
  'announcements',
  'events',
  'home_carousel',
] as const satisfies readonly AdminResource[];

export type WorkflowResource = (typeof WORKFLOW_RESOURCE_VALUES)[number];

export const WORKFLOW_ACTION_VALUES = [
  'submit_for_review',
  'request_changes',
  'approve',
  'publish',
  'move_to_draft',
] as const;

export type WorkflowAction = (typeof WORKFLOW_ACTION_VALUES)[number];

export type WorkflowEditorialStatus =
  | 'draft'
  | 'in_review'
  | 'changes_requested'
  | 'approved';

export type WorkflowItemRow = {
  id: string;
  title: string;
  status: 'draft' | 'published';
  editorial_status: WorkflowEditorialStatus | null;
  created_at: string;
  published_at?: string | null;
  reviewed_at?: string | null;
  review_notes?: string | null;
  deleted_at?: string | null;
};

export const WORKFLOW_EDITORIAL_STATUS_LABELS: Record<
  WorkflowEditorialStatus,
  string
> = {
  draft: 'مسودة',
  in_review: 'قيد المراجعة',
  changes_requested: 'مطلوب تعديلات',
  approved: 'تمت الموافقة',
};

export const WORKFLOW_ACTION_LABELS: Record<WorkflowAction, string> = {
  submit_for_review: 'إرسال للمراجعة',
  request_changes: 'طلب تعديلات',
  approve: 'اعتماد',
  publish: 'نشر',
  move_to_draft: 'إعادة إلى مسودة',
};

export const WORKFLOW_RESOURCE_CONFIG: Record<
  WorkflowResource,
  {
    table: string;
    label: string;
    editHref: (id: string) => string;
    dashboardHref: string;
    publicRevalidatePaths: string[];
  }
> = {
  breaking_news: {
    table: 'breaking_news',
    label: 'الأخبار العاجلة',
    editHref: (id) => `/dashboard/breaking-news/${id}/edit`,
    dashboardHref: '/dashboard/breaking-news',
    publicRevalidatePaths: ['/', '/important-info', '/search'],
  },
  danger_news: {
    table: 'danger_news',
    label: 'الشريط الخطير',
    editHref: (id) => `/dashboard/danger-news/${id}/edit`,
    dashboardHref: '/dashboard/danger-news',
    publicRevalidatePaths: ['/', '/search'],
  },
  announcements: {
    table: 'announcements',
    label: 'الإعلانات',
    editHref: (id) => `/dashboard/announcements/${id}/edit`,
    dashboardHref: '/dashboard/announcements',
    publicRevalidatePaths: ['/', '/announcements', '/search'],
  },
  events: {
    table: 'events',
    label: 'الفعاليات',
    editHref: (id) => `/dashboard/events/${id}/edit`,
    dashboardHref: '/dashboard/events',
    publicRevalidatePaths: ['/', '/events', '/search'],
  },
  home_carousel: {
    table: 'home_carousel_slides',
    label: 'كاروسيل الرئيسية',
    editHref: () => '/dashboard/home-carousel',
    dashboardHref: '/dashboard/home-carousel',
    publicRevalidatePaths: ['/'],
  },
};

export function isWorkflowResource(value: string): value is WorkflowResource {
  return (WORKFLOW_RESOURCE_VALUES as readonly string[]).includes(value);
}

export function isWorkflowAction(value: string): value is WorkflowAction {
  return (WORKFLOW_ACTION_VALUES as readonly string[]).includes(value);
}

export function getWorkflowNextState(args: {
  existing: WorkflowItemRow;
  action: WorkflowAction;
  actorUserId: string;
  notes: string | null;
}) {
  const { existing, action, actorUserId, notes } = args;
  const now = new Date().toISOString();

  switch (action) {
    case 'submit_for_review':
      return {
        status: 'draft' as const,
        editorial_status: 'in_review' as const,
        submitted_for_review_at: now,
        submitted_for_review_by: actorUserId,
      };
    case 'request_changes':
      return {
        status: 'draft' as const,
        editorial_status: 'changes_requested' as const,
        reviewed_at: now,
        reviewed_by: actorUserId,
        review_notes: notes,
      };
    case 'approve':
      return {
        status: 'draft' as const,
        editorial_status: 'approved' as const,
        reviewed_at: now,
        reviewed_by: actorUserId,
        review_notes: notes,
      };
    case 'publish':
      return {
        status: 'published' as const,
        editorial_status: 'approved' as const,
        published_at: existing.published_at ?? now,
        reviewed_at: now,
        reviewed_by: actorUserId,
        review_notes: notes ?? existing.review_notes ?? null,
      };
    case 'move_to_draft':
      return {
        status: 'draft' as const,
        editorial_status: 'draft' as const,
        review_notes: existing.status === 'published' ? existing.review_notes ?? null : existing.review_notes ?? null,
      };
  }
}
