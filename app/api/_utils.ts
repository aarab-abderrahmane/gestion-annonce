import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { AdminPermissionAction, AdminResource } from '@/lib/admin-permissions'

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

export async function requireFullAdminUser() {
  return requireAdminUser()
}

export async function requireDashboardUser() {
  const auth = await requireAuthenticatedUser()
  if (auth.response) return auth

  const [adminResult, dashboardResult] = await Promise.all([
    auth.supabase.rpc('is_admin'),
    auth.supabase.rpc('has_dashboard_access'),
  ])

  if (
    (adminResult.error || !adminResult.data) &&
    (dashboardResult.error || !dashboardResult.data)
  ) {
    return {
      ...auth,
      response: json({ error: 'Forbidden' }, { status: 403 }),
    }
  }

  return auth
}

export async function requireAdminPermission(
  resource: AdminResource,
  action: AdminPermissionAction = 'view',
) {
  const auth = await requireAuthenticatedUser()
  if (auth.response) return auth

  const { data: isAdmin, error: adminError } = await auth.supabase.rpc('is_admin')

  if (!adminError && isAdmin) {
    return auth
  }

  const { data: allowed, error } = await auth.supabase.rpc('has_admin_permission', {
    resource_name: resource,
    action_name: action,
  })

  if (error || !allowed) {
    return {
      ...auth,
      response: json({ error: 'Forbidden' }, { status: 403 }),
    }
  }

  return auth
}

export async function requireAnyAdminPermission(
  checks: Array<{ resource: AdminResource; action: AdminPermissionAction }>,
) {
  const auth = await requireAuthenticatedUser()
  if (auth.response) return auth

  const { data: isAdmin, error: adminError } = await auth.supabase.rpc('is_admin')

  if (!adminError && isAdmin) {
    return auth
  }

  const results = await Promise.all(
    checks.map(({ resource, action }) =>
      auth.supabase.rpc('has_admin_permission', {
        resource_name: resource,
        action_name: action,
      }),
    ),
  )

  const allowed = results.some((result) => !result.error && result.data)

  if (!allowed) {
    return {
      ...auth,
      response: json({ error: 'Forbidden' }, { status: 403 }),
    }
  }

  return auth
}
