import BreakingNewsForm from '@/components/admin/BreakingNewsForm';
import { requireAdminPageAccess } from '@/lib/admin-access';

export default async function CreateBreakingNewsPage({
  searchParams,
}: {
  searchParams: Promise<{ level?: string }>;
}) {
  const access = await requireAdminPageAccess('breaking_news', 'create');
  const params = await searchParams;
  const level = params.level === 'dangerous' || params.level === 'warning' ? params.level : 'urgent';

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-[#9a7b4f]">Breaking News</p>
        <h2 className="mt-2 text-3xl font-black text-[#123c3a]">Create breaking news</h2>
      </div>
      <BreakingNewsForm
        mode="create"
        canPublish={access.permissions.breaking_news.publish}
        initialValues={{
          title: '',
          slug: '',
          level,
          status: 'draft',
          expires_at: '',
        }}
      />
    </div>
  );
}
