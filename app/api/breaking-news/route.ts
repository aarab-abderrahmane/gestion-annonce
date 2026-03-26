import { cachedJson, json, requireAdminPermission } from '@/app/api/_utils'
import { getSupabaseRouteClient } from '@/app/api/_utils'
import {
  buildBreakingNewsAuditLogEntry,
  buildBreakingNewsPayload,
  canPublishBreakingNews,
  enforceBreakingNewsWorkflowPermission,
  insertBreakingNewsAuditLog,
  prepareBreakingNewsWorkflowUpdate,
} from '@/lib/breaking-news-audit'

export async function GET() {
  const supabase = await getSupabaseRouteClient()
  const { data, error } = await supabase
    .from('breaking_news')
    .select('id, title, slug, level, status, editorial_status, published_at, created_at, expires_at')
    .eq('status', 'published')
    .is('deleted_at', null)
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (error) {
    return json({ error: error.message }, { status: 500 })
  }

  return cachedJson(data ?? [])
}

export async function POST(request: Request) {
  const auth = await requireAdminPermission('breaking_news', 'create')
  if (auth.response) return auth.response

  const body = (await request.json()) as Record<string, unknown>
  const payload = buildBreakingNewsPayload(body)
  const canPublish = await canPublishBreakingNews(auth.supabase)
  const workflowError = enforceBreakingNewsWorkflowPermission(payload, canPublish)

  if (!payload.title || !payload.slug || !payload.expires_at) {
    return json(
      { error: 'title, slug and expires_at are required' },
      { status: 400 }
    )
  }

  if (workflowError) {
    return json({ error: workflowError }, { status: 403 })
  }

  const workflow = prepareBreakingNewsWorkflowUpdate({
    payload,
    actorUserId: auth.user.id,
    canPublish,
  })

  const { data, error } = await auth.supabase
    .from('breaking_news')
    .insert({ ...workflow.payload, deleted_at: null, deleted_by: null })
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

  return json(data, { status: 201 })
}
