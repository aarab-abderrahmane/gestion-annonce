import Link from 'next/link';
import AnnouncementsTable from '@/components/admin/AnnouncementsTable';
import { hydrateAnnouncementFiles } from '@/lib/announcement-files';
import { createClient } from '@/lib/supabase/server';

type AnnouncementCategory = { id?: string | null; name?: string | null; slug?: string | null };
type AnnouncementCategoryLink = {
  announcement_categories?: AnnouncementCategory | AnnouncementCategory[] | null;
};
type AnnouncementListRow = {
  id: string;
  title: string;
  status: string;
  published_at: string;
  divisions?: { name?: string | null } | Array<{ name?: string | null }> | null;
  announcement_category_links?: AnnouncementCategoryLink[] | null;
};

function getCategoryRecord(record?: AnnouncementCategory | AnnouncementCategory[] | null) {
  if (Array.isArray(record)) return record[0];
  return record;
}

function getDivisionName(record?: AnnouncementListRow['divisions']) {
  if (Array.isArray(record)) return record[0]?.name ?? '';
  return record?.name ?? '';
}

export default async function AnnouncementsAdminPage() {
  const supabase = await createClient();

  const [{ data: announcements, error: announcementsError }, { data: divisions, error: divisionsError }, { data: categories, error: categoriesError }] = await Promise.all([
    supabase
      .from('announcements')
      .select(`
        id,
        title,
        status,
        published_at,
        divisions(name),
        announcement_category_links(
          announcement_categories(id, name, slug)
        )
      `)
      .order('published_at', { ascending: false }),
    supabase.from('divisions').select('id, name, slug').order('name'),
    supabase.from('announcement_categories').select('id, name, slug').order('name'),
  ]);

  if (announcementsError) console.error(announcementsError);
  if (divisionsError) console.error(divisionsError);
  if (categoriesError) console.error(categoriesError);

  const announcementsWithFiles = await hydrateAnnouncementFiles(
    supabase as never,
    (announcements ?? []) as AnnouncementListRow[],
  );

  const rows = announcementsWithFiles.map((item) => ({
    id: item.id,
    title: item.title,
    divisionName: getDivisionName(item.divisions),
    status: item.status,
    publishedAt: item.published_at,
    files: item.announcement_files ?? [],
    categories: (item.announcement_category_links ?? [])
      .map((link) => {
        const category = getCategoryRecord(link.announcement_categories);

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
      <div className="flex items-center justify-between border-b border-[#ece4d7] px-6 py-5">
        <div>
          <h2 className="text-2xl font-black text-[#123c3a]">Announcements</h2>
          <p className="mt-1 text-sm text-[#6d7f82]">Manage announcements, filters, and linked files from Supabase.</p>
        </div>
        <Link href="/dashboard/announcements/create" className="rounded-2xl bg-[#123c3a] px-4 py-3 text-sm font-semibold text-white">Ajouter</Link>
      </div>
      <div className="p-6">
        <AnnouncementsTable
          rows={rows}
          divisions={(divisions ?? []).map((division) => ({ label: division.name, value: division.name }))}
          categories={(categories ?? []).map((category) => ({ label: category.name, value: category.slug }))}
        />
      </div>
    </section>
  );
}
