import { cachedJson, json, requireAdminPermission } from '@/app/api/_utils'
import { getSupabaseRouteClient } from '@/app/api/_utils'

function buildAnnouncementPayload(body: Record<string, unknown>) {
  return {
    title: typeof body.title === 'string' ? body.title.trim() : undefined,
    slug: typeof body.slug === 'string' ? body.slug.trim() : undefined,
    description:
      typeof body.description === 'string' ? body.description.trim() : null,
    division_id:
      typeof body.division_id === 'string' ? body.division_id : undefined,
    group_id: typeof body.group_id === 'string' && body.group_id ? body.group_id : null,
    status: body.status === 'published' ? 'published' : 'draft',
    published_at:
      typeof body.published_at === 'string' && body.published_at
        ? body.published_at
        : null,
    expires_at:
      typeof body.expires_at === 'string' && body.expires_at
        ? body.expires_at
        : null,
  }
}

export async function GET() {
  const supabase = await getSupabaseRouteClient()
  const { data, error } = await supabase
    .from('announcements')
    .select(`
      id, title, slug, description, division_id, group_id, status, published_at, expires_at,
      divisions(id, name, slug),
      groups(id, name, slug, division_id),
      announcement_files(id, file_url, file_name, file_type),
      announcement_category_links(
        category_id,
        announcement_categories(id, name, slug)
      )
    `)
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  if (error) {
    return json({ error: error.message }, { status: 500 })
  }

  return cachedJson(data ?? [])
}

export async function POST(request: Request) {
  const auth = await requireAdminPermission('announcements', 'create')
  if (auth.response) return auth.response

  const body = (await request.json()) as Record<string, unknown>
  const payload = buildAnnouncementPayload(body)

  if (!payload.title || !payload.slug || !payload.division_id) {
    return json(
      { error: 'title, slug and division_id are required' },
      { status: 400 }
    )
  }

  const { data, error } = await auth.supabase
    .from('announcements')
    .insert(payload)
    .select()
    .single()

  if (error) {
    return json({ error: error.message }, { status: 500 })
  }

  return json(data, { status: 201 })
}
