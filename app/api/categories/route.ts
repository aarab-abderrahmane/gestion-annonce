import { cachedJson, json, requireDashboardUser } from '@/app/api/_utils'

export async function GET() {
  const auth = await requireDashboardUser()
  if (auth.response) return auth.response

  const [
    { data: announcementCategories, error: announcementError },
    { data: eventCategories, error: eventError },
  ] = await Promise.all([
    auth.supabase
      .from('announcement_categories')
      .select('id, name, slug')
      .order('name'),
    auth.supabase.from('event_categories').select('id, name, slug').order('name'),
  ])

  if (announcementError || eventError) {
    return json(
      { error: announcementError?.message ?? eventError?.message ?? 'Unknown error' },
      { status: 500 }
    )
  }

  return cachedJson({
    announcementCategories: announcementCategories ?? [],
    eventCategories: eventCategories ?? [],
  })
}
