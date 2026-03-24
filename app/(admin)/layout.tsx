import AdminShell from '@/components/admin/AdminShell';
import { getAdminAccess } from '@/lib/admin-access';

export default async function AdminGroupLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const access = await getAdminAccess();

  if (!access?.hasDashboardAccess) {
    return children;
  }

  return (
    <AdminShell
      email={access.email}
      displayName={access.displayName}
      isFullAdmin={access.isFullAdmin}
      navigationItems={access.navigationItems}
    >
      {children}
    </AdminShell>
  );
}
