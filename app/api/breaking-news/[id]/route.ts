import { cachedJson, json, requireAdminUser } from '@/app/api/_utils'
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
  const auth = await requireAdminUser()
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

export async function DELETE(_: Request, context: RouteContext) {
  const auth = await requireAdminUser()
  if (auth.response) return auth.response

  const { id } = await context.params
  const { error } = await auth.supabase.from('breaking_news').delete().eq('id', id)

  if (error) {
    return json({ error: error.message }, { status: 500 })
  }

  return json({ success: true })
}
