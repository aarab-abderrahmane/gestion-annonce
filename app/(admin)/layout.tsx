import AdminShell from '@/components/admin/AdminShell';
import { createClient } from '@/lib/supabase/server';

export default async function AdminGroupLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return children;
  }

  const { data: isAdmin, error } = await supabase.rpc('is_admin');
  if (error || !isAdmin) {
    return children;
  }

  return (
    <AdminShell email={user.email ?? ''}>{children}</AdminShell>
  );
}
