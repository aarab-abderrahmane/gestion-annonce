import Link from 'next/link';
import EventsTable from '@/components/admin/EventsTable';
import ErrorToastTrigger from '@/components/ui/ErrorToastTrigger';
import { requireAdminPageAccess } from '@/lib/admin-access';
import { collectErrorMessages } from '@/lib/errors';
import { createClient } from '@/lib/supabase/server';

type EventCategory = {
  id?: string | null;
  name?: string | null;
  slug?: string | null;
};

type EventCategoryLink = {
  event_categories?: EventCategory | EventCategory[] | null;
};

type EventListRow = {
  id: string;
  title: string;
  location: string | null;
  starts_at: string;
  status: string;
  deleted_at: string | null;
  cover_image: string | null;
  event_photos?: Array<{ photo_url: string | null }> | null;
  event_category_links?: EventCategoryLink[] | null;
};

function getCategoryRecord(record?: EventCategory | EventCategory[] | null) {
  if (Array.isArray(record)) return record[0];
  return record;
}

export default async function EventsAdminPage() {
  const access = await requireAdminPageAccess('events');
  const supabase = await createClient();

  const [{ data: events, error: eventsError }, { data: categories, error: categoriesError }] = await Promise.all([
    supabase
      .from('events')
      .select(`
        id,
        title,
        location,
        starts_at,
        status,
        deleted_at,
        cover_image,
        event_photos(photo_url),
        event_category_links(
          event_categories(id, name, slug)
        )
      `)
      .order('starts_at', { ascending: false }),
    supabase.from('event_categories').select('id, name, slug').order('name'),
  ]);

  const pageErrors = collectErrorMessages([eventsError, categoriesError]);
  const rows = ((events ?? []) as EventListRow[]).map((item) => ({
    id: item.id,
    title: item.title,
    location: item.location,
    startsAt: item.starts_at,
    status: item.status,
    deletedAt: item.deleted_at,
    coverImage: item.cover_image,
    photos: item.event_photos ?? [],
    categories: (item.event_category_links ?? [])
      .map((link) => {
        const category = getCategoryRecord(link.event_categories);

        return {
          id: category?.id ?? '',
          name: category?.name ?? '',
          slug: category?.slug ?? '',
        };
      })
      .filter((category) => category.id),
  }));

  return (
    <section className="rounded-[32px] border border-[#d9cdbb] bg-[#fffdf8] shadow-sm">
      <ErrorToastTrigger messages={pageErrors} />
      <div className="flex items-center justify-between border-b border-[#ece4d7] px-6 py-5">
        <div>
          <h2 className="text-2xl font-black text-[#123c3a]">Events</h2>
          <p className="mt-1 text-sm text-[#6d7f82]">Manage event categories, people, photos, and publishing state.</p>
        </div>
        {access.permissions.events.create ? (
          <Link href="/dashboard/events/create" className="rounded-2xl bg-[#123c3a] px-4 py-3 text-sm font-semibold text-white">Ajouter</Link>
        ) : null}
      </div>
      <div className="p-6">
        <EventsTable
          rows={rows}
          categories={(categories ?? []).map((category) => ({ label: category.name, value: category.slug }))}
          permissions={access.permissions.events}
        />
      </div>
    </section>
  );
}
