import DangerNewsManager from '@/components/admin/DangerNewsManager';
import ErrorToastTrigger from '@/components/ui/ErrorToastTrigger';
import { collectErrorMessages } from '@/lib/errors';
import { requireAdminPageAccess } from '@/lib/admin-access';
import { createClient } from '@/lib/supabase/server';

export default async function DangerNewsAdminPage() {
  const access = await requireAdminPageAccess('danger_news');
  const supabase = await createClient();

  const [{ data: settingsData, error: settingsError }, itemsResult] = await Promise.all([
    supabase
      .from('danger_news_settings')
      .select('id, is_enabled, badge_label, title, speed_seconds, max_items, separator, icon_name, gradient_from_color, gradient_to_color, accent_color, text_color, created_at, updated_at')
      .limit(1)
      .maybeSingle(),
    supabase
      .from('danger_news')
      .select('id, title, status, created_at, expires_at, deleted_at')
      .order('created_at', { ascending: false }),
  ]);

  const pageErrors = collectErrorMessages([settingsError, itemsResult.error]);

  return (
    <>
      <ErrorToastTrigger messages={pageErrors} />
      <DangerNewsManager
        initialSettings={settingsData}
        items={itemsResult.data ?? []}
        permissions={access.permissions.danger_news}
      />
    </>
  );
}
