import { notFound, redirect } from 'next/navigation';
import BreakingNewsAuditTrail from '@/components/admin/BreakingNewsAuditTrail';
import BreakingNewsForm from '@/components/admin/BreakingNewsForm';
import ErrorToastTrigger from '@/components/ui/ErrorToastTrigger';
import { requireAdminPageAccess } from '@/lib/admin-access';
import { collectErrorMessages } from '@/lib/errors';
import { createClient } from '@/lib/supabase/server';

export default async function EditBreakingNewsPage({ params }: { params: Promise<{ id: string }> }) {
  const access = await requireAdminPageAccess('breaking_news', 'update');
  const { id } = await params;
  const supabase = await createClient();
  const [{ data, error }, { data: auditEntries, error: auditError }] = await Promise.all([
    supabase
      .from('breaking_news')
      .select('id, title, slug, level, status, editorial_status, review_notes, expires_at')
      .eq('id', id)
      .maybeSingle(),
    supabase
      .from('breaking_news_audit_log')
      .select('id, action, actor_name, actor_email, previous_status, next_status, previous_editorial_status, next_editorial_status, notes, created_at')
      .eq('breaking_news_id', id)
      .order('created_at', { ascending: false }),
  ]);

  const pageErrors = collectErrorMessages([error, auditError]);

  if (!data) {
    if (error) {
      return (
        <>
          <ErrorToastTrigger messages={pageErrors} />
          <div className="rounded-[28px] border border-[#d9cdbb] bg-[#fffdf8] p-6 text-sm text-[#8a1f13]">
            تعذر تحميل الخبر العاجل حالياً.
          </div>
        </>
      );
    }

    notFound();
  }

  if (data.status === 'published' && !access.permissions.breaking_news.publish) {
    redirect('/dashboard/breaking-news');
  }

  return (
    <>
      <ErrorToastTrigger messages={pageErrors} />
      <div className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[#9a7b4f]">Breaking News</p>
          <h2 className="mt-2 text-3xl font-black text-[#123c3a]">Edit item</h2>
        </div>
        <BreakingNewsForm
          id={data.id}
          mode="edit"
          canPublish={access.permissions.breaking_news.publish}
          initialValues={{
            title: data.title,
            slug: data.slug,
            level: data.level as 'dangerous' | 'urgent' | 'warning',
            status: data.status as 'draft' | 'published',
            editorial_status:
              (data.editorial_status as
                | 'draft'
                | 'in_review'
                | 'changes_requested'
                | 'approved') ?? 'draft',
            review_notes: data.review_notes ?? '',
            expires_at: new Date(data.expires_at).toISOString().slice(0, 16),
          }}
        />
        <BreakingNewsAuditTrail entries={auditEntries ?? []} />
      </div>
    </>
  );
}
