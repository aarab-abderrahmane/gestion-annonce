import BreakingNewsForm from '@/components/admin/BreakingNewsForm';

export default function CreateBreakingNewsPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-[#9a7b4f]">Breaking News</p>
        <h2 className="mt-2 text-3xl font-black text-[#123c3a]">Create breaking news</h2>
      </div>
      <BreakingNewsForm
        mode="create"
        initialValues={{
          title: '',
          slug: '',
          level: 'urgent',
          status: 'draft',
          expires_at: '',
        }}
      />
    </div>
  );
}
