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
    <div className="min-h-screen bg-[#f5f1e8] text-[#1f2937]">
      <div className="mx-auto flex max-w-[1600px]">
        <Sidebar />
        <div className="min-h-screen flex-1 p-6 md:p-8">
          <AdminHeader email={user.email ?? ''} />
          {children}
        </div>
      </div>
    </div>
  );
}
