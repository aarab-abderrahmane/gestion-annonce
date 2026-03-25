import { cachedJson, json, requireAdminPermission } from '@/app/api/_utils'
import { getSupabaseRouteClient } from '@/app/api/_utils'

type RouteContext = {
  params: Promise<{ id: string }>
}

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

export async function GET(_: Request, context: RouteContext) {
  const { id } = await context.params
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
    .eq('id', id)
    .eq('status', 'published')
    .is('deleted_at', null)
    .maybeSingle()

  if (error) {
    return json({ error: error.message }, { status: 500 })
  }

  if (!data) {
    return json({ error: 'Announcement not found' }, { status: 404 })
  }

  return cachedJson(data)
}

export async function PUT(request: Request, context: RouteContext) {
  const auth = await requireAdminPermission('announcements', 'update')
  if (auth.response) return auth.response

  const { id } = await context.params
  const body = (await request.json()) as Record<string, unknown>
  const payload = buildAnnouncementPayload(body)

  const { data, error } = await auth.supabase
    .from('announcements')
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
  const auth = await requireAdminPermission('announcements', 'delete')
  if (auth.response) return auth.response

  const { id } = await context.params
  const body = (await request.json().catch(() => null)) as { action?: string } | null

  if (body?.action !== 'restore') {
    return json({ error: 'Invalid action' }, { status: 400 })
  }

  const { error } = await auth.supabase
    .from('announcements')
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
  const auth = await requireAdminPermission('announcements', 'delete')
  if (auth.response) return auth.response

  const { id } = await context.params
  const purge = new URL(request.url).searchParams.get('purge') === 'true'

  if (purge) {
    const { error } = await auth.supabase
      .from('announcements')
      .delete()
      .eq('id', id)
      .not('deleted_at', 'is', null)

    if (error) {
      return json({ error: error.message }, { status: 500 })
    }

    return json({ success: true })
  }

  const { error } = await auth.supabase
    .from('announcements')
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
