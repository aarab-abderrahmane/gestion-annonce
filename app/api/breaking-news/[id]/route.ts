import { cachedJson, json, requireAdminPermission } from '@/app/api/_utils'
import { getSupabaseRouteClient } from '@/app/api/_utils'

type RouteContext = {
  params: Promise<{ id: string }>
}

function buildBreakingNewsPayload(body: Record<string, unknown>) {
  return {
    title: typeof body.title === 'string' ? body.title.trim() : undefined,
    slug: typeof body.slug === 'string' ? body.slug.trim() : undefined,
    level:
      body.level === 'dangerous' || body.level === 'warning'
        ? body.level
        : 'urgent',
    status: body.status === 'published' ? 'published' : 'draft',
    expires_at:
      typeof body.expires_at === 'string' && body.expires_at
        ? body.expires_at
        : undefined,
  }
}

export async function GET(_: Request, context: RouteContext) {
  const { id } = await context.params
  const supabase = await getSupabaseRouteClient()
  const { data, error } = await supabase
    .from('breaking_news')
    .select('id, title, slug, level, status, created_at, expires_at')
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

  const { data, error } = await auth.supabase
    .from('breaking_news')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return json({ error: error.message }, { status: 500 })
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

  const { error } = await auth.supabase
    .from('breaking_news')
    .update({
      deleted_at: null,
      deleted_by: null,
    })
    .eq('id', id)

  if (error) {
    return json({ error: error.message }, { status: 500 })
  }

  return json({ success: true })
}

export async function DELETE(request: Request, context: RouteContext) {
  const auth = await requireAdminPermission('breaking_news', 'delete')
  if (auth.response) return auth.response

  const { id } = await context.params
  const purge = new URL(request.url).searchParams.get('purge') === 'true'

  if (purge) {
    const { error } = await auth.supabase
      .from('breaking_news')
      .delete()
      .eq('id', id)
      .not('deleted_at', 'is', null)

    if (error) {
      return json({ error: error.message }, { status: 500 })
    }

    return json({ success: true })
  }

  const { error } = await auth.supabase
    .from('breaking_news')
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: auth.user.id,
    })
    .eq('id', id)
    .is('deleted_at', null)

  if (error) {
    return json({ error: error.message }, { status: 500 })
  }

  return json({ success: true })
}
