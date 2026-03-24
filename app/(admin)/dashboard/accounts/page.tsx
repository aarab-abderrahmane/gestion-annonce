import AdminAccountsManager from '@/components/admin/AdminAccountsManager';
import ErrorToastTrigger from '@/components/ui/ErrorToastTrigger';
import { requireFullAdminAccess } from '@/lib/admin-access';
import {
  DASHBOARD_ACCOUNT_SELECT,
  normalizeManagedDashboardAccount,
  sortManagedDashboardAccounts,
} from '@/lib/dashboard-accounts';
import { collectErrorMessages } from '@/lib/errors';
import { isAdminServiceConfigured } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export default async function AdminAccountsPage() {
  await requireFullAdminAccess();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('dashboard_accounts')
    .select(DASHBOARD_ACCOUNT_SELECT)
    .order('created_at', { ascending: false });

  const pageErrors = collectErrorMessages([error]);
  const accounts = sortManagedDashboardAccounts(
    ((data ?? []) as Parameters<typeof normalizeManagedDashboardAccount>[0][]).map(
      normalizeManagedDashboardAccount,
    ),
  );

  return (
    <>
      <ErrorToastTrigger messages={pageErrors} />
      <AdminAccountsManager
        initialAccounts={accounts}
        serviceRoleConfigured={isAdminServiceConfigured()}
      />
    </>
  );
}
