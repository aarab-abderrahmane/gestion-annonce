import { revalidatePath } from 'next/cache'
import { json, requireAdminPermission } from '@/app/api/_utils'
import { HOME_CAROUSEL_ADMIN_ROW_SELECT } from '@/lib/home-carousel'
import { getFirstZodError, homeCarouselSlideSchema } from '@/lib/validations'

type RouteContext = {
  params: Promise<{ id: string }>
}

function parseSlidePayload(body: Record<string, unknown>) {
  const validation = homeCarouselSlideSchema.safeParse({
    title: typeof body.title === 'string' ? body.title.trim() : body.title,
    subtitle: typeof body.subtitle === 'string' ? body.subtitle.trim() : body.subtitle,
    image_url: typeof body.image_url === 'string' ? body.image_url.trim() : body.image_url,
    cta_label: typeof body.cta_label === 'string' ? body.cta_label.trim() : body.cta_label,
    target: body.target,
    sort_order: body.sort_order,
    status: body.status,
  })

  if (!validation.success) {
    return {
      error: getFirstZodError(validation.error),
    }
  }

  const imageUrl = validation.data.image_url?.trim() ?? ''

  if (!imageUrl) {
    return {
      error: 'المرجو إدخال رابط صورة أو رفع صورة للشريحة.',
    }
  }

  return {
    payload: {
      ...validation.data,
      image_url: imageUrl,
    },
  }
}

function revalidateCarouselPaths() {
  revalidatePath('/dashboard/home-carousel')
  revalidatePath('/')
}

export async function PUT(request: Request, context: RouteContext) {
  const auth = await requireAdminPermission('home_carousel', 'update')
  if (auth.response) return auth.response

  const { id } = await context.params
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
  const parsed = parseSlidePayload((body ?? {}) as Record<string, unknown>)

  if (parsed.error) {
    return json({ error: parsed.error }, { status: 400 })
  }

  const { data, error } = await auth.supabase
    .from('home_carousel_slides')
    .update(parsed.payload)
    .eq('id', id)
    .select(HOME_CAROUSEL_ADMIN_ROW_SELECT)
    .single()

  if (error) {
    return json({ error: error.message }, { status: 500 })
  }

  revalidateCarouselPaths()
  return json({ slide: data })
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireAdminPermission('home_carousel', 'delete')
  if (auth.response) return auth.response

  const { id } = await context.params
  const body = (await request.json().catch(() => null)) as { action?: string } | null

  if (body?.action !== 'restore') {
    return json({ error: 'Invalid action' }, { status: 400 })
  }

  const { data, error } = await auth.supabase
    .from('home_carousel_slides')
    .update({
      deleted_at: null,
      deleted_by: null,
    })
    .eq('id', id)
    .select(HOME_CAROUSEL_ADMIN_ROW_SELECT)
    .single()

  if (error) {
    return json({ error: error.message }, { status: 500 })
  }

  revalidateCarouselPaths()
  return json({ slide: data })
}

export async function DELETE(request: Request, context: RouteContext) {
  const auth = await requireAdminPermission('home_carousel', 'delete')
  if (auth.response) return auth.response

  const { id } = await context.params
  const purge = new URL(request.url).searchParams.get('purge') === 'true'

  if (purge) {
    const { error } = await auth.supabase
      .from('home_carousel_slides')
      .delete()
      .eq('id', id)
      .not('deleted_at', 'is', null)

    if (error) {
      return json({ error: error.message }, { status: 500 })
    }

    revalidateCarouselPaths()
    return json({ success: true })
  }

  const { data, error } = await auth.supabase
    .from('home_carousel_slides')
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: auth.user.id,
    })
    .eq('id', id)
    .is('deleted_at', null)
    .select(HOME_CAROUSEL_ADMIN_ROW_SELECT)
    .single()

  if (error) {
    return json({ error: error.message }, { status: 500 })
  }

  revalidateCarouselPaths()
  return json({ slide: data })
}
