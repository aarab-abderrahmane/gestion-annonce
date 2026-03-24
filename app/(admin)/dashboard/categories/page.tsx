import CategoriesManager from '@/components/admin/CategoriesManager';
import ErrorToastTrigger from '@/components/ui/ErrorToastTrigger';
import { requireAdminPageAccess } from '@/lib/admin-access';
import { collectErrorMessages } from '@/lib/errors';
import { createClient } from '@/lib/supabase/server';

export default async function CategoriesPage() {
  const access = await requireAdminPageAccess('categories');
  const supabase = await createClient();
  const [{ data: announcementCategories, error: announcementError }, { data: eventCategories, error: eventError }] = await Promise.all([
    supabase.from('announcement_categories').select('id, name, slug').order('name'),
    supabase.from('event_categories').select('id, name, slug').order('name'),
  ]);

  const pageErrors = collectErrorMessages([announcementError, eventError]);

  return (
    <>
      <ErrorToastTrigger messages={pageErrors} />
      <CategoriesManager
        announcementCategories={announcementCategories ?? []}
        eventCategories={eventCategories ?? []}
        permissions={access.permissions.categories}
      />
    </>
  );
}
