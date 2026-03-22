import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const PUBLIC_CACHE_CONTROL = 'public, s-maxage=300'

export function json(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, init)
}

export function cachedJson(data: unknown, init?: ResponseInit) {
  const headers = new Headers(init?.headers)
  headers.set('Cache-Control', PUBLIC_CACHE_CONTROL)

  return NextResponse.json(data, {
    ...init,
    headers,
  })
}

export async function getSupabaseRouteClient() {
  return createClient()
}

export async function requireAuthenticatedUser() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return {
      supabase,
      user: null,
      response: json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }

  return { supabase, user, response: null }
}

export async function requireAdminUser() {
  const auth = await requireAuthenticatedUser()
  if (auth.response) return auth

  const { data: isAdmin, error } = await auth.supabase.rpc('is_admin')

  if (error || !isAdmin) {
    return {
      ...auth,
      response: json({ error: 'Forbidden' }, { status: 403 }),
    }
  }

  return auth
}
