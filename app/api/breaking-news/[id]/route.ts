import { cachedJson, json, requireAdminPermission } from '@/app/api/_utils'
import { getSupabaseRouteClient } from '@/app/api/_utils'
import {
  buildBreakingNewsAuditLogEntry,
  buildBreakingNewsPayload,
  canPublishBreakingNews,
  enforceBreakingNewsWorkflowPermission,
  insertBreakingNewsAuditLog,
  prepareBreakingNewsWorkflowUpdate,
  type BreakingNewsWorkflowRow,
} from '@/lib/breaking-news-audit'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(_: Request, context: RouteContext) {
  const { id } = await context.params
  const supabase = await getSupabaseRouteClient()
  const { data, error } = await supabase
    .from('breaking_news')
    .select('id, title, slug, level, status, editorial_status, published_at, created_at, expires_at')
    .eq('id', id)
    .eq('status', 'published')
    .is('deleted_at', null)
    .maybeSingle()

  if (error) {
    return json({ error: error.message }, { status: 500 })
  }

  if (!data) {
    return json({ error: 'Breaking news not found' }, { status: 404 })
  }

  return cachedJson(data)
}

export async function PUT(request: Request, context: RouteContext) {
  const auth = await requireAdminPermission('breaking_news', 'update')
  if (auth.response) return auth.response

  const { id } = await context.params
  const body = (await request.json()) as Record<string, unknown>
  const payload = buildBreakingNewsPayload(body)
  const canPublish = await canPublishBreakingNews(auth.supabase)
  const workflowError = enforceBreakingNewsWorkflowPermission(payload, canPublish)

  if (workflowError) {
    return json({ error: workflowError }, { status: 403 })
  }

  const { data: existing, error: existingError } = await auth.supabase
    .from('breaking_news')
    .select('id, title, slug, level, status, editorial_status, expires_at, published_at, review_notes, deleted_at')
    .eq('id', id)
    .single()

  if (existingError) {
    return json({ error: existingError.message }, { status: 500 })
  }

  const workflow = prepareBreakingNewsWorkflowUpdate({
    existing: existing as BreakingNewsWorkflowRow,
    payload,
    actorUserId: auth.user.id,
    canPublish,
  })

  const { data, error } = await auth.supabase
    .from('breaking_news')
    .update(workflow.payload)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return json({ error: error.message }, { status: 500 })
  }

  const { error: auditError } = await insertBreakingNewsAuditLog(
    auth.supabase,
    buildBreakingNewsAuditLogEntry({
      action: workflow.action,
      user: auth.user,
      existing: existing as BreakingNewsWorkflowRow,
      next: data,
      notes: workflow.notes,
      payload: {
        level: data.level,
        expires_at: data.expires_at,
      },
    }),
  )

  if (auditError) {
    return json({ error: auditError.message }, { status: 500 })
  }

  return json(data)
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireAdminPermission('breaking_news', 'delete')
  if (auth.response) return auth.response

  const { id } = await context.params
  const body = (await request.json().catch(() => null)) as { action?: string } | null

  if (body?.action !== 'restore') {
    return json({ error: 'Invalid action' }, { status: 400 })
  }

  const { data: existing, error: existingError } = await auth.supabase
    .from('breaking_news')
    .select('id, title, slug, level, status, editorial_status, expires_at, published_at, review_notes, deleted_at')
    .eq('id', id)
    .single()

  if (existingError) {
    return json({ error: existingError.message }, { status: 500 })
  }

  const { data, error } = await auth.supabase
    .from('breaking_news')
    .update({
      deleted_at: null,
      deleted_by: null,
    })
    .eq('id', id)
    .select('id, title, slug, level, status, editorial_status, expires_at, published_at, review_notes, deleted_at')
    .single()

  if (error) {
    return json({ error: error.message }, { status: 500 })
  }

  const { error: auditError } = await insertBreakingNewsAuditLog(
    auth.supabase,
    buildBreakingNewsAuditLogEntry({
      action: 'restored',
      user: auth.user,
      existing: existing as BreakingNewsWorkflowRow,
      next: data,
      payload: {
        deleted_at: null,
      },
    }),
  )

  if (auditError) {
    return json({ error: auditError.message }, { status: 500 })
  }

  return json({ success: true })
}

export async function DELETE(request: Request, context: RouteContext) {
  const auth = await requireAdminPermission('breaking_news', 'delete')
  if (auth.response) return auth.response

  const { id } = await context.params
  const purge = new URL(request.url).searchParams.get('purge') === 'true'
  const { data: existing, error: existingError } = await auth.supabase
    .from('breaking_news')
    .select('id, title, slug, level, status, editorial_status, expires_at, published_at, review_notes, deleted_at')
    .eq('id', id)
    .single()

  if (existingError) {
    return json({ error: existingError.message }, { status: 500 })
  }

  if (purge) {
    const { error } = await auth.supabase
      .from('breaking_news')
      .delete()
      .eq('id', id)
      .not('deleted_at', 'is', null)

    if (error) {
      return json({ error: error.message }, { status: 500 })
    }

    const { error: auditError } = await insertBreakingNewsAuditLog(
      auth.supabase,
      buildBreakingNewsAuditLogEntry({
        action: 'purged',
        user: auth.user,
        existing: existing as BreakingNewsWorkflowRow,
        payload: {
          deleted_at: existing.deleted_at,
        },
      }),
    )

    if (auditError) {
      return json({ error: auditError.message }, { status: 500 })
    }

    return json({ success: true })
  }

  const deletedAt = new Date().toISOString()
  const { data, error } = await auth.supabase
    .from('breaking_news')
    .update({
      deleted_at: deletedAt,
      deleted_by: auth.user.id,
    })
    .eq('id', id)
    .is('deleted_at', null)
    .select('id, title, slug, level, status, editorial_status, expires_at, published_at, review_notes, deleted_at')
    .single()

  if (error) {
    return json({ error: error.message }, { status: 500 })
  }

  const { error: auditError } = await insertBreakingNewsAuditLog(
    auth.supabase,
    buildBreakingNewsAuditLogEntry({
      action: 'trashed',
      user: auth.user,
      existing: existing as BreakingNewsWorkflowRow,
      next: data,
      payload: {
        deleted_at: deletedAt,
      },
    }),
  )

  if (auditError) {
    return json({ error: auditError.message }, { status: 500 })
  }

  return json({ success: true })
}
