import { notFound, redirect } from 'next/navigation';
import DangerNewsForm from '@/components/admin/DangerNewsForm';
import ErrorToastTrigger from '@/components/ui/ErrorToastTrigger';
import { requireAdminPageAccess } from '@/lib/admin-access';
import { collectErrorMessages } from '@/lib/errors';
import { createClient } from '@/lib/supabase/server';

export default async function EditDangerNewsPage({ params }: { params: Promise<{ id: string }> }) {
  const access = await requireAdminPageAccess('danger_news', 'update');
  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('danger_news')
    .select('id, title, status, expires_at')
    .eq('id', id)
    .maybeSingle();

  const pageErrors = collectErrorMessages([error]);

  if (!data) {
    if (error) {
      return (
        <>
          <ErrorToastTrigger messages={pageErrors} />
          <div className="rounded-[28px] border border-[#d9cdbb] bg-[#fffdf8] p-6 text-sm text-[#8a1f13]">
            تعذر تحميل عنصر الشريط حالياً.
          </div>
        </>
      );
    }

    notFound();
  }

  if (data.status === 'published' && !access.permissions.danger_news.publish) {
    redirect('/dashboard/danger-news');
  }

  return (
    <>
      <ErrorToastTrigger messages={pageErrors} />
      <div className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[#9a7b4f]">Danger Tape</p>
          <h2 className="mt-2 text-3xl font-black text-[#123c3a]">Edit tape item</h2>
        </div>
        <DangerNewsForm
          id={data.id}
          mode="edit"
          canPublish={access.permissions.danger_news.publish}
          initialValues={{
            title: data.title,
            status: data.status as 'draft' | 'published',
            expires_at: new Date(data.expires_at).toISOString().slice(0, 16),
          }}
        />
      </div>
    </>
  );
}
