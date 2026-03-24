import {
  isAdminResource,
  type DashboardAccountStatus,
  type DashboardPermissionRow,
} from '@/lib/admin-permissions';

export const DASHBOARD_ACCOUNT_SELECT = `
  id,
  user_id,
  full_name,
  email,
  status,
  created_at,
  updated_at,
  dashboard_account_permissions(
    resource,
    can_view,
    can_create,
    can_update,
    can_delete,
    can_publish
  )
`;

export type ManagedDashboardAccount = {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  status: DashboardAccountStatus;
  created_at: string;
  updated_at: string;
  permissions: DashboardPermissionRow[];
};

type RawDashboardAccount = {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  status: DashboardAccountStatus;
  created_at: string;
  updated_at: string;
  dashboard_account_permissions?: Array<
    | DashboardPermissionRow
    | {
        resource: string;
        can_view: boolean;
        can_create: boolean;
        can_update: boolean;
        can_delete: boolean;
        can_publish: boolean;
      }
    | null
  > | null;
};

export function normalizeManagedDashboardAccount(
  record: RawDashboardAccount,
): ManagedDashboardAccount {
  const permissions = (record.dashboard_account_permissions ?? []).flatMap((permission) => {
    if (!permission || !isAdminResource(permission.resource)) {
      return [];
    }

    return [
      {
        resource: permission.resource,
        can_view: Boolean(permission.can_view),
        can_create: Boolean(permission.can_create),
        can_update: Boolean(permission.can_update),
        can_delete: Boolean(permission.can_delete),
        can_publish: Boolean(permission.can_publish),
      },
    ];
  });

  return {
    id: record.id,
    user_id: record.user_id,
    full_name: record.full_name ?? '',
    email: record.email ?? '',
    status: record.status,
    created_at: record.created_at,
    updated_at: record.updated_at,
    permissions,
  };
}

export function sortManagedDashboardAccounts(accounts: ManagedDashboardAccount[]) {
  return [...accounts].sort(
    (left, right) =>
      new Date(right.created_at).getTime() - new Date(left.created_at).getTime(),
  );
}
