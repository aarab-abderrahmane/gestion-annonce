import { cachedJson, json, requireAdminPermission } from '@/app/api/_utils'
import { getSupabaseRouteClient } from '@/app/api/_utils'

function buildDangerNewsPayload(body: Record<string, unknown>) {
  return {
    title: typeof body.title === 'string' ? body.title.trim() : undefined,
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
    .from('danger_news')
    .select('id, title, status, created_at, expires_at')
    .eq('status', 'published')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) {
    return json({ error: error.message }, { status: 500 })
  }

  return cachedJson(data ?? [])
}

export async function POST(request: Request) {
  const auth = await requireAdminPermission('danger_news', 'create')
  if (auth.response) return auth.response

  const body = (await request.json()) as Record<string, unknown>
  const payload = buildDangerNewsPayload(body)

  if (!payload.title || !payload.expires_at) {
    return json(
      { error: 'title and expires_at are required' },
      { status: 400 }
    )
  }

  const { data, error } = await auth.supabase
    .from('danger_news')
    .insert({ ...payload, deleted_at: null, deleted_by: null })
    .select()
    .single()

  if (error) {
    return json({ error: error.message }, { status: 500 })
  }

  return json(data, { status: 201 })
}
