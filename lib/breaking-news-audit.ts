import 'server-only';

import type { SupabaseClient, User } from '@supabase/supabase-js';
import type {
  BreakingNewsAuditAction,
  BreakingNewsEditorialStatus,
} from '@/lib/breaking-news-workflow';

export type BreakingNewsStatus = 'draft' | 'published';

export type BreakingNewsMutationPayload = {
  title?: string;
  slug?: string;
  level: 'dangerous' | 'urgent' | 'warning';
  status: BreakingNewsStatus;
  editorial_status: BreakingNewsEditorialStatus;
  expires_at?: string;
  review_notes: string | null;
};

export type BreakingNewsWorkflowRow = {
  id: string;
  title: string;
  slug: string;
  level: string;
  status: BreakingNewsStatus;
  editorial_status: BreakingNewsEditorialStatus | null;
  expires_at: string | null;
  published_at?: string | null;
  review_notes?: string | null;
  deleted_at?: string | null;
};

type WorkflowResult = {
  payload: Record<string, unknown>;
  action: BreakingNewsAuditAction;
  notes: string | null;
};

export function buildBreakingNewsPayload(
  body: Record<string, unknown>,
): BreakingNewsMutationPayload {
  return {
    title: typeof body.title === 'string' ? body.title.trim() : undefined,
    slug: typeof body.slug === 'string' ? body.slug.trim() : undefined,
    level:
      body.level === 'dangerous' || body.level === 'warning'
        ? body.level
        : 'urgent',
    status: body.status === 'published' ? 'published' : 'draft',
    editorial_status:
      body.editorial_status === 'in_review' ||
      body.editorial_status === 'changes_requested' ||
      body.editorial_status === 'approved'
        ? body.editorial_status
        : 'draft',
    expires_at:
      typeof body.expires_at === 'string' && body.expires_at
        ? body.expires_at
        : undefined,
    review_notes:
      typeof body.review_notes === 'string' && body.review_notes.trim()
        ? body.review_notes.trim()
        : null,
  };
}

export async function canPublishBreakingNews(supabase: SupabaseClient) {
  const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin');
  if (!adminError && isAdmin) return true;

  const { data, error } = await supabase.rpc('has_admin_permission', {
    resource_name: 'breaking_news',
    action_name: 'publish',
  });

  return !error && Boolean(data);
}

export function enforceBreakingNewsWorkflowPermission(
  payload: BreakingNewsMutationPayload,
  canPublish: boolean,
) {
  if (payload.status === 'published' && !canPublish) {
    return 'ليس لديك صلاحية نشر الخبر.';
  }

  if (
    (payload.editorial_status === 'approved' ||
      payload.editorial_status === 'changes_requested') &&
    !canPublish
  ) {
    return 'ليس لديك صلاحية اعتماد الخبر أو طلب تعديلات عليه.';
  }

  if (payload.review_notes && !canPublish) {
    return 'ملاحظات المراجعة متاحة للمراجع فقط.';
  }

  return null;
}

export function prepareBreakingNewsWorkflowUpdate(args: {
  existing?: BreakingNewsWorkflowRow | null;
  payload: BreakingNewsMutationPayload;
  actorUserId: string;
  canPublish: boolean;
}): WorkflowResult {
  const { existing = null, payload, actorUserId, canPublish } = args;
  const now = new Date().toISOString();
  const nextStatus = payload.status;
  const nextEditorialStatus =
    nextStatus === 'published' ? 'approved' : payload.editorial_status;

  const nextPayload: Record<string, unknown> = {
    title: payload.title,
    slug: payload.slug,
    level: payload.level,
    status: nextStatus,
    editorial_status: nextEditorialStatus,
    expires_at: payload.expires_at,
    published_at:
      nextStatus === 'published'
        ? existing?.published_at ?? now
        : null,
  };

  if (canPublish) {
    nextPayload.review_notes = payload.review_notes;
  }

  if (!existing) {
    if (nextEditorialStatus === 'in_review') {
      nextPayload.submitted_for_review_at = now;
      nextPayload.submitted_for_review_by = actorUserId;
    }

    if (
      nextStatus === 'published' ||
      nextEditorialStatus === 'approved' ||
      nextEditorialStatus === 'changes_requested'
    ) {
      nextPayload.reviewed_at = now;
      nextPayload.reviewed_by = actorUserId;
    }

    return {
      payload: nextPayload,
      action: 'created',
      notes: canPublish ? payload.review_notes : null,
    };
  }

  let action: BreakingNewsAuditAction = 'updated';

  if (existing.status !== nextStatus) {
    action = nextStatus === 'published' ? 'published' : 'unpublished';
  }

  if (existing.editorial_status !== nextEditorialStatus) {
    if (nextEditorialStatus === 'in_review') {
      nextPayload.submitted_for_review_at = now;
      nextPayload.submitted_for_review_by = actorUserId;
      action = 'submitted_for_review';
    }

    if (nextEditorialStatus === 'changes_requested') {
      nextPayload.reviewed_at = now;
      nextPayload.reviewed_by = actorUserId;
      action = 'changes_requested';
    }

    if (nextEditorialStatus === 'approved') {
      nextPayload.reviewed_at = now;
      nextPayload.reviewed_by = actorUserId;
      if (action !== 'published') {
        action = 'approved';
      }
    }
  }

  if (nextStatus === 'published') {
    nextPayload.reviewed_at = now;
    nextPayload.reviewed_by = actorUserId;
  }

  return {
    payload: nextPayload,
    action,
    notes: canPublish ? payload.review_notes : existing.review_notes ?? null,
  };
}

export function buildBreakingNewsAuditLogEntry(args: {
  action: BreakingNewsAuditAction;
  user: User;
  existing?: BreakingNewsWorkflowRow | null;
  next?: Partial<BreakingNewsWorkflowRow> | null;
  notes?: string | null;
  payload?: Record<string, unknown>;
}) {
  const { action, user, existing = null, next = null, notes = null, payload } = args;
  const breakingNewsId =
    action === 'purged'
      ? null
      : ((next?.id as string | undefined) ?? existing?.id ?? null);

  return {
    breaking_news_id: breakingNewsId,
    breaking_news_title:
      (next?.title as string | undefined) ??
      existing?.title ??
      'خبر عاجل',
    breaking_news_slug:
      (next?.slug as string | undefined) ??
      existing?.slug ??
      null,
    action,
    actor_user_id: user.id,
    actor_email: user.email ?? null,
    actor_name:
      String(user.user_metadata?.full_name ?? '').trim() ||
      user.email ||
      'Admin',
    previous_status: existing?.status ?? null,
    next_status:
      (next?.status as string | undefined) ??
      null,
    previous_editorial_status: existing?.editorial_status ?? null,
    next_editorial_status:
      (next?.editorial_status as string | undefined) ??
      null,
    notes,
    payload: payload ?? {},
  };
}

export async function insertBreakingNewsAuditLog(
  supabase: SupabaseClient,
  entry: ReturnType<typeof buildBreakingNewsAuditLogEntry>,
) {
  return supabase.from('breaking_news_audit_log').insert(entry);
}
