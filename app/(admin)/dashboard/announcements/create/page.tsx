import AnnouncementForm from '@/components/admin/forms/AnnouncementForm';
import ErrorToastTrigger from '@/components/ui/ErrorToastTrigger';
import { requireAdminPageAccess } from '@/lib/admin-access';
import { collectErrorMessages } from '@/lib/errors';
import { createClient } from '@/lib/supabase/server';

export default async function CreateAnnouncementPage() {
  const access = await requireAdminPageAccess('announcements', 'create');
  const supabase = await createClient();
  const [{ data: divisions, error: divisionsError }, { data: groups, error: groupsError }, { data: categories, error: categoriesError }] = await Promise.all([
    supabase.from('divisions').select('id, name, slug').order('name'),
    supabase.from('groups').select('id, name, slug, division_id').order('name'),
    supabase.from('announcement_categories').select('id, name, slug').order('name'),
  ]);

  const pageErrors = collectErrorMessages([divisionsError, groupsError, categoriesError]);

  return (
    <>
      <ErrorToastTrigger messages={pageErrors} />
      <div className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[#9a7b4f]">Announcements</p>
          <h2 className="mt-2 text-3xl font-black text-[#123c3a]">Create announcement</h2>
        </div>
        <AnnouncementForm
          mode="create"
          divisions={divisions ?? []}
          groups={groups ?? []}
          categories={categories ?? []}
          canPublish={access.permissions.announcements.publish}
          initialValues={{
            title: '',
            slug: '',
            description: '',
            division_id: '',
            group_id: '',
            category_ids: [],
            expires_at: '',
            status: 'draft',
            files: [],
          }}
        />
      </div>
    </>
  );
}
