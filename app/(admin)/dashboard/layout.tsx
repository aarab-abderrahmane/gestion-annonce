import { requireDashboardAccess } from '@/lib/admin-access';

export default async function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await requireDashboardAccess('/login');

  return children;
}
