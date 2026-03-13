import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

function createCookieAdapter(cookieStore?: Awaited<ReturnType<typeof cookies>>) {
  return {
    getAll() {
      return cookieStore?.getAll() ?? []
    },
    setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
      if (!cookieStore) return
      try {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2])
        )
      } catch {}
    },
  }
}

export async function createClient() {
  try {
    const cookieStore = await cookies()
    return createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: createCookieAdapter(cookieStore),
    })
  } catch {
    return createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: createCookieAdapter(),
    })
  }
}
