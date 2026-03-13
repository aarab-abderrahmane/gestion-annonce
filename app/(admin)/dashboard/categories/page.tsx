import CategoriesManager from '@/components/admin/CategoriesManager';
import { createClient } from '@/lib/supabase/server';

export default async function CategoriesPage() {
  const supabase = await createClient();
  const [{ data: announcementCategories, error: announcementError }, { data: eventCategories, error: eventError }] = await Promise.all([
    supabase.from('announcement_categories').select('id, name, slug').order('name'),
    supabase.from('event_categories').select('id, name, slug').order('name'),
  ]);

  if (announcementError) console.error(announcementError);
  if (eventError) console.error(eventError);

  return (
    <CategoriesManager
      announcementCategories={announcementCategories ?? []}
      eventCategories={eventCategories ?? []}
    />
  );
}
