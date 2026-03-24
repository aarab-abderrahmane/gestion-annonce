import EventForm from '@/components/admin/forms/EventForm';
import ErrorToastTrigger from '@/components/ui/ErrorToastTrigger';
import { requireAdminPageAccess } from '@/lib/admin-access';
import { collectErrorMessages } from '@/lib/errors';
import { createClient } from '@/lib/supabase/server';

export default async function CreateEventPage() {
  const access = await requireAdminPageAccess('events', 'create');
  const supabase = await createClient();
  const { data: categories, error } = await supabase.from('event_categories').select('id, name, slug').order('name');
  const pageErrors = collectErrorMessages([error]);

  return (
    <>
      <ErrorToastTrigger messages={pageErrors} />
      <div className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[#9a7b4f]">Events</p>
          <h2 className="mt-2 text-3xl font-black text-[#123c3a]">Create event</h2>
        </div>
        <EventForm
          mode="create"
          categories={categories ?? []}
          canPublish={access.permissions.events.publish}
          initialValues={{
            title: '',
            slug: '',
            description: '',
            location: '',
            starts_at: '',
            ends_at: '',
            total_attendees: 0,
            status: 'draft',
            category_ids: [],
            people: [{ name: '', role: '', type: 'participant' }],
            cover_image: '',
            photos: [],
          }}
        />
      </div>
    </>
  );
}
