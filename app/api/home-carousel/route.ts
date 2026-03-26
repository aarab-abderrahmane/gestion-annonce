import { revalidatePath } from 'next/cache'
import { json, requireAdminPermission } from '@/app/api/_utils'
import { HOME_CAROUSEL_ADMIN_ROW_SELECT } from '@/lib/home-carousel'
import { getFirstZodError, homeCarouselSlideSchema } from '@/lib/validations'

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

export async function POST(request: Request) {
  const auth = await requireAdminPermission('home_carousel', 'create')
  if (auth.response) return auth.response

  const body = (await request.json().catch(() => null)) as
    | { slides?: Array<Record<string, unknown>> }
    | Record<string, unknown>
    | null

  if (Array.isArray(body?.slides)) {
    const parsedSlides = body.slides.map(parseSlidePayload)
    const firstError = parsedSlides.find((result) => result.error)

    if (firstError?.error) {
      return json({ error: firstError.error }, { status: 400 })
    }

    const payload = parsedSlides
      .map((result) => result.payload)
      .filter((value): value is NonNullable<(typeof parsedSlides)[number]['payload']> => Boolean(value))
      .map((slide) => ({
        ...slide,
        deleted_at: null,
        deleted_by: null,
      }))

    const { data, error } = await auth.supabase
      .from('home_carousel_slides')
      .insert(payload)
      .select(HOME_CAROUSEL_ADMIN_ROW_SELECT)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) {
      return json({ error: error.message }, { status: 500 })
    }

    revalidateCarouselPaths()
    return json({ slides: data ?? [] }, { status: 201 })
  }

  const parsed = parseSlidePayload((body ?? {}) as Record<string, unknown>)

  if (parsed.error) {
    return json({ error: parsed.error }, { status: 400 })
  }

  const { data, error } = await auth.supabase
    .from('home_carousel_slides')
    .insert({
      ...parsed.payload,
      deleted_at: null,
      deleted_by: null,
    })
    .select(HOME_CAROUSEL_ADMIN_ROW_SELECT)
    .single()

  if (error) {
    return json({ error: error.message }, { status: 500 })
  }

  revalidateCarouselPaths()
  return json({ slide: data }, { status: 201 })
}
