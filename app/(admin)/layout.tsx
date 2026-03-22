import AdminHeader from '@/components/admin/AdminHeader';
import Sidebar from '@/components/admin/Sidebar';
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
    <div
      className="min-h-screen"
      style={{ background: 'var(--md-surface)', color: 'var(--md-on-surface)', fontFamily: 'var(--md-font-brand)' }}
    >
      <div className="mx-auto flex max-w-[1600px]">
        <Sidebar />
        <div className="flex min-h-screen flex-1 flex-col overflow-hidden">
          <AdminHeader email={user.email ?? ''} />
          <main className="flex-1 space-y-6 p-4 md:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
