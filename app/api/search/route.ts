import { cachedJson, json } from '@/app/api/_utils'
import { getSupabaseRouteClient } from '@/app/api/_utils'

type SearchType = 'all' | 'announcement' | 'event' | 'breaking-news'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')?.trim() ?? ''
  const type = (searchParams.get('type') as SearchType | null) ?? 'all'
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  if (!query) {
    return cachedJson([])
  }

  const supabase = await getSupabaseRouteClient()
  const { data, error } = await supabase.rpc('search_public_content', {
    search_query: query,
    filter_type: type === 'all' ? null : type,
    date_from: from || null,
    date_to: to || null,
  })

  if (error) {
    return json({ error: error.message }, { status: 500 })
  }

  return cachedJson(data ?? [])
}
