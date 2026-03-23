import { notFound } from 'next/navigation';
import BreakingNewsForm from '@/components/admin/BreakingNewsForm';
import ErrorToastTrigger from '@/components/ui/ErrorToastTrigger';
import { collectErrorMessages } from '@/lib/errors';
import { createClient } from '@/lib/supabase/server';

export default async function EditBreakingNewsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('breaking_news')
    .select('id, title, slug, level, status, expires_at')
    .eq('id', id)
    .maybeSingle();

  const pageErrors = collectErrorMessages([error]);

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
          initialValues={{
            title: data.title,
            slug: data.slug,
            level: data.level as 'dangerous' | 'urgent' | 'warning',
            status: data.status as 'draft' | 'published',
            expires_at: new Date(data.expires_at).toISOString().slice(0, 16),
          }}
        />
      </div>
    </>
  );
}
