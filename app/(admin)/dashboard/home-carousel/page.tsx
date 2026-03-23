import ErrorToastTrigger from '@/components/ui/ErrorToastTrigger';
import HomeCarouselManager, { type HomeCarouselAdminRow } from '@/components/admin/HomeCarouselManager';
import { collectErrorMessages } from '@/lib/errors';
import { createClient } from '@/lib/supabase/server';

export default async function HomeCarouselAdminPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('home_carousel_slides')
    .select('id, title, subtitle, image_url, cta_label, target, sort_order, status, created_at, updated_at')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  const pageErrors = collectErrorMessages([error]);

  return (
    <>
      <ErrorToastTrigger messages={pageErrors} />
      <HomeCarouselManager initialRows={(data ?? []) as HomeCarouselAdminRow[]} />
    </>
  );
}
