import CategoriesManager from '@/components/admin/CategoriesManager';
import ErrorToastTrigger from '@/components/ui/ErrorToastTrigger';
import { collectErrorMessages } from '@/lib/errors';
import { createClient } from '@/lib/supabase/server';

export default async function CategoriesPage() {
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
      />
    </>
  );
}
