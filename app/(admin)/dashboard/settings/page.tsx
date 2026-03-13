import SettingsForm from '@/components/admin/SettingsForm';
import { createClient } from '@/lib/supabase/server';

export default async function SettingsAdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <SettingsForm email={user?.email ?? ''} />;
}
