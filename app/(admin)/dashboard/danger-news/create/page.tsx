import DangerNewsForm from '@/components/admin/DangerNewsForm';
import { requireAdminPageAccess } from '@/lib/admin-access';

export default async function CreateDangerNewsPage() {
  const access = await requireAdminPageAccess('danger_news', 'create');

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-[#9a7b4f]">Danger Tape</p>
        <h2 className="mt-2 text-3xl font-black text-[#123c3a]">Create tape item</h2>
      </div>
      <DangerNewsForm
        mode="create"
        canPublish={access.permissions.danger_news.publish}
        initialValues={{
          title: '',
          status: 'draft',
          expires_at: '',
        }}
      />
    </div>
  );
}
