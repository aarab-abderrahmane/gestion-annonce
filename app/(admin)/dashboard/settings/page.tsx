import SettingsForm from '@/components/admin/SettingsForm';
import { requireFullAdminAccess } from '@/lib/admin-access';
import { createClient } from '@/lib/supabase/server';

export default async function SettingsAdminPage() {
  await requireFullAdminAccess();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <SettingsForm email={user?.email ?? ''} />;
}
