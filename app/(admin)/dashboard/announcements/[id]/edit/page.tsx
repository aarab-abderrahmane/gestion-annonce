import { notFound } from 'next/navigation';
import AnnouncementForm from '@/components/admin/forms/AnnouncementForm';
import { hydrateAnnouncementFiles } from '@/lib/announcement-files';
import { createClient } from '@/lib/supabase/server';

type AnnouncementCategoryLink = { category_id: string };

export default async function EditAnnouncementPage({ params }: { params: Promise<{ id: string }> }) {
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

  if (announcementError) console.error(announcementError);
  if (divisionsError) console.error(divisionsError);
  if (groupsError) console.error(groupsError);
  if (categoriesError) console.error(categoriesError);

  if (!announcement) notFound();

  const [announcementWithFiles] = await hydrateAnnouncementFiles(supabase, [announcement], { includeId: true });

  return (
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
        initialValues={{
          title: announcement.title ?? '',
          slug: announcement.slug ?? '',
          description: announcement.description ?? '',
          division_id: announcement.division_id ?? '',
          group_id: announcement.group_id ?? '',
          category_ids: (announcement.announcement_category_links ?? []).map((link: AnnouncementCategoryLink) => link.category_id),
          expires_at: announcement.expires_at ? new Date(announcement.expires_at).toISOString().slice(0, 10) : '',
          status: (announcement.status as 'draft' | 'published') ?? 'draft',
          files: announcementWithFiles.announcement_files ?? [],
        }}
      />
    </div>
  );
}
