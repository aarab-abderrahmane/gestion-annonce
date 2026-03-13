import Link from 'next/link';
import AnnouncementsTable from '@/components/admin/AnnouncementsTable';
import { createClient } from '@/lib/supabase/server';

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
        announcement_files(file_url),
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

  const rows = (announcements ?? []).map((item: any) => ({
    id: item.id,
    title: item.title,
    divisionName: item.divisions?.name ?? '',
    status: item.status,
    publishedAt: item.published_at,
    files: item.announcement_files ?? [],
    categories: (item.announcement_category_links ?? []).map((link: any) => ({
      id: link.announcement_categories?.id ?? link.announcement_categories?.[0]?.id ?? '',
      name: link.announcement_categories?.name ?? link.announcement_categories?.[0]?.name ?? '',
      slug: link.announcement_categories?.slug ?? link.announcement_categories?.[0]?.slug ?? '',
    })).filter((category: any) => category.id),
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
