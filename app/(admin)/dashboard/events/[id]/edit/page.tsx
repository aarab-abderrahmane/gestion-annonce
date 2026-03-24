import { notFound, redirect } from 'next/navigation';
import EventForm from '@/components/admin/forms/EventForm';
import ErrorToastTrigger from '@/components/ui/ErrorToastTrigger';
import { requireAdminPageAccess } from '@/lib/admin-access';
import { collectErrorMessages } from '@/lib/errors';
import { createClient } from '@/lib/supabase/server';

type EventCategoryLink = { category_id: string };
type EventPerson = {
  name?: string | null;
  role?: string | null;
  type?: 'participant' | 'organizer' | null;
};

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const access = await requireAdminPageAccess('events', 'update');
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: event, error: eventError }, { data: categories, error: categoriesError }] = await Promise.all([
    supabase
      .from('events')
      .select(`
        id,
        title,
        slug,
        description,
        location,
        starts_at,
        ends_at,
        total_attendees,
        status,
        cover_image,
        event_people(name, role, type),
        event_photos(id, photo_url),
        event_category_links(category_id)
      `)
      .eq('id', id)
      .maybeSingle(),
    supabase.from('event_categories').select('id, name, slug').order('name'),
  ]);

  const pageErrors = collectErrorMessages([eventError, categoriesError]);

  if (!event) {
    if (eventError) {
      return (
        <>
          <ErrorToastTrigger messages={pageErrors} />
          <div className="rounded-[28px] border border-[#d9cdbb] bg-[#fffdf8] p-6 text-sm text-[#8a1f13]">
            تعذر تحميل الفعالية حالياً.
          </div>
        </>
      );
    }

    notFound();
  }

  if (event.status === 'published' && !access.permissions.events.publish) {
    redirect('/dashboard/events');
  }

  return (
    <>
      <ErrorToastTrigger messages={pageErrors} />
      <div className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[#9a7b4f]">Events</p>
          <h2 className="mt-2 text-3xl font-black text-[#123c3a]">Edit event</h2>
        </div>
        <EventForm
          mode="edit"
          id={event.id}
          categories={categories ?? []}
          canPublish={access.permissions.events.publish}
          initialValues={{
            title: event.title ?? '',
            slug: event.slug ?? '',
            description: event.description ?? '',
            location: event.location ?? '',
            starts_at: event.starts_at ? new Date(event.starts_at).toISOString().slice(0, 16) : '',
            ends_at: event.ends_at ? new Date(event.ends_at).toISOString().slice(0, 16) : '',
            total_attendees: event.total_attendees ?? 0,
            status: (event.status as 'draft' | 'published') ?? 'draft',
            category_ids: (event.event_category_links ?? []).map((link: EventCategoryLink) => link.category_id),
            people: (event.event_people ?? []).map((person: EventPerson) => ({
              name: person.name ?? '',
              role: person.role ?? '',
              type: (person.type as 'participant' | 'organizer') ?? 'participant',
            })),
            cover_image: event.cover_image ?? '',
            photos: event.event_photos ?? [],
          }}
        />
      </div>
    </>
  );
}
