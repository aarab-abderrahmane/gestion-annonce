import { redirect } from 'next/navigation';
import AdminHeader from '@/components/admin/AdminHeader';
import Sidebar from '@/components/admin/Sidebar';
import { createClient } from '@/lib/supabase/server';

export default async function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div
      className="min-h-screen"
      style={{ background: 'var(--md-surface)', color: 'var(--md-on-surface)', fontFamily: 'var(--md-font-brand)' }}
    >
      <div className="flex max-w-[1600px] mx-auto">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
          <AdminHeader email={user.email ?? ''} />
          <main className="flex-1 p-4 md:p-6 space-y-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
