import 'server-only';

import type { User } from '@supabase/supabase-js';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import {
  createEmptyPermissionMap,
  createFullAdminPermissionMap,
  getFirstAccessibleAdminPath,
  getVisibleAdminNavItems,
  mapPermissionRowsToMap,
  type AdminNavItem,
  type AdminPermissionAction,
  type AdminResource,
  type DashboardPermissionRow,
  type ResourcePermissionMap,
} from '@/lib/admin-permissions';
import { createClient } from '@/lib/supabase/server';

type DashboardAccountQueryRow = {
  id: string;
  full_name: string | null;
  email: string;
  status: 'active' | 'disabled';
  dashboard_account_permissions?: DashboardPermissionRow[] | null;
};

export type AdminAccess = {
  user: User;
  email: string;
  displayName: string;
  isFullAdmin: boolean;
  hasDashboardAccess: boolean;
  managedAccountId: string | null;
  permissions: ResourcePermissionMap;
  navigationItems: AdminNavItem[];
  firstAccessiblePath: string | null;
};

export const getAdminAccess = cache(async (): Promise<AdminAccess | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: isAdmin, error: isAdminError } = await supabase.rpc('is_admin');
  const isFullAdmin = !isAdminError && Boolean(isAdmin);

  if (isFullAdmin) {
    const permissions = createFullAdminPermissionMap();

    return {
      user,
      email: user.email ?? '',
      displayName:
        String(user.user_metadata?.full_name ?? '').trim() || user.email || 'Admin',
      isFullAdmin: true,
      hasDashboardAccess: true,
      managedAccountId: null,
      permissions,
      navigationItems: getVisibleAdminNavItems({ isFullAdmin: true, permissions }),
      firstAccessiblePath: '/dashboard',
    };
  }

  const { data } = await supabase
    .from('dashboard_accounts')
    .select(`
      id,
      full_name,
      email,
      status,
      dashboard_account_permissions(
        resource,
        can_view,
        can_create,
        can_update,
        can_delete,
        can_publish
      )
    `)
    .eq('user_id', user.id)
    .maybeSingle();

  const account = data as DashboardAccountQueryRow | null;
  const permissions =
    account?.status === 'active'
      ? mapPermissionRowsToMap(account.dashboard_account_permissions)
      : createEmptyPermissionMap();
  const navigationItems = getVisibleAdminNavItems({
    isFullAdmin: false,
    permissions,
  });
  const firstAccessiblePath = getFirstAccessibleAdminPath({
    isFullAdmin: false,
    permissions,
  });

  return {
    user,
    email: user.email ?? account?.email ?? '',
    displayName:
      account?.full_name?.trim() ||
      String(user.user_metadata?.full_name ?? '').trim() ||
      user.email ||
      'Staff',
    isFullAdmin: false,
    hasDashboardAccess: account?.status === 'active' && navigationItems.length > 0,
    managedAccountId: account?.id ?? null,
    permissions,
    navigationItems,
    firstAccessiblePath,
  };
});

export async function requireDashboardAccess(redirectTo = '/login') {
  const access = await getAdminAccess();

  if (!access?.hasDashboardAccess) {
    redirect(redirectTo);
  }

  return access;
}

export async function requireFullAdminAccess() {
  const access = await requireDashboardAccess();

  if (!access.isFullAdmin) {
    redirect(access.firstAccessiblePath ?? '/dashboard');
  }

  return access;
}

export async function requireAdminPageAccess(
  resource: AdminResource,
  action: AdminPermissionAction = 'view',
) {
  const access = await requireDashboardAccess();

  if (access.isFullAdmin || access.permissions[resource][action]) {
    return access;
  }

  redirect(access.firstAccessiblePath ?? '/dashboard');
}
