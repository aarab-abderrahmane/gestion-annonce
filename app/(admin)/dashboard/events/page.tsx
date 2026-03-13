import Link from 'next/link';
import EventsTable from '@/components/admin/EventsTable';
import { createClient } from '@/lib/supabase/server';

export default async function EventsAdminPage() {
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
        cover_image,
        event_photos(photo_url),
        event_category_links(
          event_categories(id, name, slug)
        )
      `)
      .order('starts_at', { ascending: false }),
    supabase.from('event_categories').select('id, name, slug').order('name'),
  ]);

  if (eventsError) console.error(eventsError);
  if (categoriesError) console.error(categoriesError);

  const rows = (events ?? []).map((item: any) => ({
    id: item.id,
    title: item.title,
    location: item.location,
    startsAt: item.starts_at,
    status: item.status,
    coverImage: item.cover_image,
    photos: item.event_photos ?? [],
    categories: (item.event_category_links ?? []).map((link: any) => ({
      id: link.event_categories?.id ?? link.event_categories?.[0]?.id ?? '',
      name: link.event_categories?.name ?? link.event_categories?.[0]?.name ?? '',
      slug: link.event_categories?.slug ?? link.event_categories?.[0]?.slug ?? '',
    })).filter((category: any) => category.id),
  }));

  return (
    <section className="rounded-[32px] border border-[#d9cdbb] bg-[#fffdf8] shadow-sm">
      <div className="flex items-center justify-between border-b border-[#ece4d7] px-6 py-5">
        <div>
          <h2 className="text-2xl font-black text-[#123c3a]">Events</h2>
          <p className="mt-1 text-sm text-[#6d7f82]">Manage event categories, people, photos, and publishing state.</p>
        </div>
        <Link href="/dashboard/events/create" className="rounded-2xl bg-[#123c3a] px-4 py-3 text-sm font-semibold text-white">Ajouter</Link>
      </div>
      <div className="p-6">
        <EventsTable
          rows={rows}
          categories={(categories ?? []).map((category) => ({ label: category.name, value: category.slug }))}
        />
      </div>
    </section>
  );
}
