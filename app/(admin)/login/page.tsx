import { redirect } from 'next/navigation';
import LoginForm from '@/components/admin/LoginForm';
import { createClient } from '@/lib/supabase/server';

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-[#f5f1e8] px-4 py-10 text-[#1f2937]">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[40px] bg-[#123c3a] p-8 text-white shadow-xl md:p-12">
          <p className="mb-3 text-xs uppercase tracking-[0.4em] text-[#d0e6dc]">ISTA Ait Melloul</p>
          <h1 className="mb-4 text-5xl font-black leading-tight">Gestion Annonces Admin</h1>
          <p className="max-w-xl text-lg leading-8 text-[#d0e6dc]">
            Connectez-vous pour gérer les annonces, les breaking news et le contenu public de l'établissement.
          </p>
        </div>
        <div className="rounded-[40px] border border-[#d9cdbb] bg-white p-8 shadow-sm md:p-10">
          <div className="mb-8">
            <p className="text-xs uppercase tracking-[0.3em] text-[#9a7b4f]">School Admin</p>
            <h2 className="mt-3 text-3xl font-black text-[#123c3a]">ISTA Ait Melloul</h2>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
