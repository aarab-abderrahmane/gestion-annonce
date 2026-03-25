import { cachedJson, json, requireAdminPermission } from '@/app/api/_utils'
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
    .is('deleted_at', null)
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
  const auth = await requireAdminPermission('events', 'update')
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

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireAdminPermission('events', 'delete')
  if (auth.response) return auth.response

  const { id } = await context.params
  const body = (await request.json().catch(() => null)) as { action?: string } | null

  if (body?.action !== 'restore') {
    return json({ error: 'Invalid action' }, { status: 400 })
  }

  const { error } = await auth.supabase
    .from('events')
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
  const auth = await requireAdminPermission('events', 'delete')
  if (auth.response) return auth.response

  const { id } = await context.params
  const purge = new URL(request.url).searchParams.get('purge') === 'true'

  if (purge) {
    const { error } = await auth.supabase
      .from('events')
      .delete()
      .eq('id', id)
      .not('deleted_at', 'is', null)

    if (error) {
      return json({ error: error.message }, { status: 500 })
    }

    return json({ success: true })
  }

  const { error } = await auth.supabase
    .from('events')
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
