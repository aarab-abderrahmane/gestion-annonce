import { cachedJson, json, requireAdminPermission } from '@/app/api/_utils'
import { getSupabaseRouteClient } from '@/app/api/_utils'

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

export async function GET() {
  const supabase = await getSupabaseRouteClient()
  const { data, error } = await supabase
    .from('breaking_news')
    .select('id, title, slug, level, status, created_at, expires_at')
    .eq('status', 'published')
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

  if (!payload.title || !payload.slug || !payload.expires_at) {
    return json(
      { error: 'title, slug and expires_at are required' },
      { status: 400 }
    )
  }

  const { data, error } = await auth.supabase
    .from('breaking_news')
    .insert(payload)
    .select()
    .single()

  if (error) {
    return json({ error: error.message }, { status: 500 })
  }

  return json(data, { status: 201 })
}
