import type { User } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

type AuthResult = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  user: User | null;
};

export async function getUser(): Promise<AuthResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user };
}

export async function requireAuth(redirectTo = '/login'): Promise<{ supabase: AuthResult['supabase']; user: User }> {
  const auth = await getUser();

  if (!auth.user) {
    redirect(redirectTo);
  }

  return {
    supabase: auth.supabase,
    user: auth.user,
  };
}
