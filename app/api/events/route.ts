import { cachedJson, json, requireAdminPermission } from '@/app/api/_utils'
import { getSupabaseRouteClient } from '@/app/api/_utils'

function buildEventPayload(body: Record<string, unknown>) {
  return {
    title: typeof body.title === 'string' ? body.title.trim() : undefined,
    slug: typeof body.slug === 'string' ? body.slug.trim() : undefined,
    description:
      typeof body.description === 'string' ? body.description.trim() : null,
    cover_image:
      typeof body.cover_image === 'string' && body.cover_image
        ? body.cover_image
        : null,
    location:
      typeof body.location === 'string' ? body.location.trim() : undefined,
    starts_at:
      typeof body.starts_at === 'string' && body.starts_at
        ? body.starts_at
        : undefined,
    ends_at:
      typeof body.ends_at === 'string' && body.ends_at ? body.ends_at : undefined,
    total_attendees:
      typeof body.total_attendees === 'number'
        ? body.total_attendees
        : Number(body.total_attendees ?? 0),
    status: body.status === 'published' ? 'published' : 'draft',
  }
}

export async function GET() {
  const supabase = await getSupabaseRouteClient()
  const { data, error } = await supabase
    .from('events')
    .select(`
      id, title, slug, description, cover_image, location, starts_at, ends_at, total_attendees, status, created_at,
      event_people(id, name, role, type),
      event_photos(id, photo_url),
      event_category_links(
        category_id,
        event_categories(id, name, slug)
      )
    `)
    .eq('status', 'published')
    .order('starts_at', { ascending: false })

  if (error) {
    return json({ error: error.message }, { status: 500 })
  }

  return cachedJson(data ?? [])
}

export async function POST(request: Request) {
  const auth = await requireAdminPermission('events', 'create')
  if (auth.response) return auth.response

  const body = (await request.json()) as Record<string, unknown>
  const payload = buildEventPayload(body)

  if (
    !payload.title ||
    !payload.slug ||
    !payload.location ||
    !payload.starts_at ||
    !payload.ends_at
  ) {
    return json(
      { error: 'title, slug, location, starts_at and ends_at are required' },
      { status: 400 }
    )
  }

  const { data, error } = await auth.supabase
    .from('events')
    .insert(payload)
    .select()
    .single()

  if (error) {
    return json({ error: error.message }, { status: 500 })
  }

  return json(data, { status: 201 })
}
