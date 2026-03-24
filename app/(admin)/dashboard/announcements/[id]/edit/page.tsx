import { notFound, redirect } from 'next/navigation';
import AnnouncementForm from '@/components/admin/forms/AnnouncementForm';
import ErrorToastTrigger from '@/components/ui/ErrorToastTrigger';
import { hydrateAnnouncementFiles } from '@/lib/announcement-files';
import { requireAdminPageAccess } from '@/lib/admin-access';
import { collectErrorMessages } from '@/lib/errors';
import { createClient } from '@/lib/supabase/server';

type AnnouncementCategoryLink = { category_id: string };
type EditableAnnouncementRow = {
  id: string;
  title: string | null;
  slug: string | null;
  description: string | null;
  division_id: string | null;
  group_id: string | null;
  expires_at: string | null;
  status: string | null;
  announcement_category_links?: AnnouncementCategoryLink[] | null;
  announcement_files?: Array<{
    id?: string;
    announcement_id: string;
    file_url: string | null;
    file_name: string | null;
    file_type: 'pdf' | 'image' | null;
  }>;
};

export default async function EditAnnouncementPage({ params }: { params: Promise<{ id: string }> }) {
  const access = await requireAdminPageAccess('announcements', 'update');
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: announcement, error: announcementError }, { data: divisions, error: divisionsError }, { data: groups, error: groupsError }, { data: categories, error: categoriesError }] = await Promise.all([
    supabase
      .from('announcements')
      .select(`
        id,
        title,
        slug,
        description,
        division_id,
        group_id,
        expires_at,
        status,
        announcement_category_links(category_id)
      `)
      .eq('id', id)
      .maybeSingle(),
    supabase.from('divisions').select('id, name, slug').order('name'),
    supabase.from('groups').select('id, name, slug, division_id').order('name'),
    supabase.from('announcement_categories').select('id, name, slug').order('name'),
  ]);

  const initialErrors = collectErrorMessages([
    announcementError,
    divisionsError,
    groupsError,
    categoriesError,
  ]);

  if (!announcement) {
    if (announcementError) {
      return (
        <>
          <ErrorToastTrigger messages={initialErrors} />
          <div className="rounded-[28px] border border-[#d9cdbb] bg-[#fffdf8] p-6 text-sm text-[#8a1f13]">
            تعذر تحميل الإعلان حالياً.
          </div>
        </>
      );
    }

    notFound();
  }

  if (announcement.status === 'published' && !access.permissions.announcements.publish) {
    redirect('/dashboard/announcements');
  }

  const announcementFileErrors: string[] = [];
  const [announcementWithFiles] = await hydrateAnnouncementFiles(
    supabase as never,
    [announcement as EditableAnnouncementRow],
    {
      includeId: true,
      onError: (message) => announcementFileErrors.push(message),
    },
  );
  const pageErrors = collectErrorMessages([...initialErrors, ...announcementFileErrors]);

  return (
    <>
      <ErrorToastTrigger messages={pageErrors} />
      <div className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[#9a7b4f]">Announcements</p>
          <h2 className="mt-2 text-3xl font-black text-[#123c3a]">Edit announcement</h2>
        </div>
        <AnnouncementForm
          mode="edit"
          id={announcement.id}
          divisions={divisions ?? []}
          groups={groups ?? []}
          categories={categories ?? []}
          canPublish={access.permissions.announcements.publish}
          initialValues={{
            title: announcement.title ?? '',
            slug: announcement.slug ?? '',
            description: announcement.description ?? '',
            division_id: announcement.division_id ?? '',
            group_id: announcement.group_id ?? '',
            category_ids: (announcement.announcement_category_links ?? []).map((link: AnnouncementCategoryLink) => link.category_id),
            expires_at: announcement.expires_at ? new Date(announcement.expires_at).toISOString().slice(0, 10) : '',
            status: (announcement.status as 'draft' | 'published') ?? 'draft',
            files: (announcementWithFiles.announcement_files ?? [])
              .filter((file) => file.file_url)
              .map((file) => ({
                id: file.id,
                file_url: file.file_url as string,
                file_name: file.file_name,
                file_type: (file.file_type as 'pdf' | 'image') ?? 'pdf',
              })),
          }}
        />
      </div>
    </>
  );
}
