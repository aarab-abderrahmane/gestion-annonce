import ErrorToastTrigger from '@/components/ui/ErrorToastTrigger';
import HomeCarouselManager, { type HomeCarouselAdminRow } from '@/components/admin/HomeCarouselManager';
import { requireAdminPageAccess } from '@/lib/admin-access';
import { collectErrorMessages } from '@/lib/errors';
import { HOME_CAROUSEL_ADMIN_ROW_SELECT } from '@/lib/home-carousel';
import { createClient } from '@/lib/supabase/server';

export default async function HomeCarouselAdminPage() {
  const access = await requireAdminPageAccess('home_carousel');
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('home_carousel_slides')
    .select(HOME_CAROUSEL_ADMIN_ROW_SELECT)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  const pageErrors = collectErrorMessages([error]);

  return (
    <>
      <ErrorToastTrigger messages={pageErrors} />
      <HomeCarouselManager
        initialRows={(data ?? []) as HomeCarouselAdminRow[]}
        permissions={access.permissions.home_carousel}
      />
    </>
  );
}
