import { cachedJson, json, requireAuthenticatedUser } from '@/app/api/_utils'
import { getSupabaseRouteClient } from '@/app/api/_utils'

type RouteContext = {
  params: Promise<{ id: string }>
}

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

export async function GET(_: Request, context: RouteContext) {
  const { id } = await context.params
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
    .eq('id', id)
    .eq('status', 'published')
    .maybeSingle()

  if (error) {
    return json({ error: error.message }, { status: 500 })
  }

  if (!data) {
    return json({ error: 'Event not found' }, { status: 404 })
  }

  return cachedJson(data)
}

export async function PUT(request: Request, context: RouteContext) {
  const auth = await requireAuthenticatedUser()
  if (auth.response) return auth.response

  const { id } = await context.params
  const body = (await request.json()) as Record<string, unknown>
  const payload = buildEventPayload(body)

  const { data, error } = await auth.supabase
    .from('events')
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
  const auth = await requireAuthenticatedUser()
  if (auth.response) return auth.response

  const { id } = await context.params
  const { error } = await auth.supabase.from('events').delete().eq('id', id)

  if (error) {
    return json({ error: error.message }, { status: 500 })
  }

  return json({ success: true })
}
