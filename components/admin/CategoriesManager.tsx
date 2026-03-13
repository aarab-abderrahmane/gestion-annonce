"use client";

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Plus, Trash2 } from 'lucide-react';

type Category = { id: string; name: string; slug: string };
type Props = { announcementCategories: Category[]; eventCategories: Category[] };

function slugify(value: string) {
  return value
    .trim().toLowerCase()
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, '')
    .replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

function CategorySection({ title, table, rows }: { title: string; table: 'announcement_categories' | 'event_categories'; rows: Category[] }) {
  const supabase = createClient();
  const router = useRouter();
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = name.trim();
    const slug = slugify(trimmed);
    if (!trimmed || !slug) { setError('الاسم مطلوب.'); return; }
    setSubmitting(true); setError('');
    const { error: insertError } = await supabase.from(table).insert({ name: trimmed, slug });
    if (insertError) { setError(insertError.message); setSubmitting(false); return; }
    setName('');
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!window.confirm('حذف هذا الصنف؟')) return;
    setDeletingId(id); setError('');
    const { error: deleteError } = await supabase.from(table).delete().eq('id', id);
    if (deleteError) { setError(deleteError.message); setDeletingId(null); return; }
    router.refresh();
  }

  return (
    <section className="md-card-outlined p-6 space-y-4">
      {/* Header */}
      <div>
        <h2 className="md-title-medium" style={{ color: 'var(--md-on-surface)' }}>{title}</h2>
        <p className="md-body-small mt-1" style={{ color: 'var(--md-on-surface-variant)' }}>
          إضافة أو حذف الأصناف مباشرة.
        </p>
      </div>

      {/* List */}
      <div className="space-y-2">
        {rows.length === 0 ? (
          <div
            className="rounded-[var(--md-shape-l)] border border-dashed px-4 py-6 text-center md-body-small"
            style={{ borderColor: 'var(--md-outline-variant)', color: 'var(--md-on-surface-variant)' }}
          >
            لا توجد أصناف بعد.
          </div>
        ) : rows.map((row) => (
          <div
            key={row.id}
            className="flex items-center justify-between px-4 py-3 rounded-[var(--md-shape-l)]"
            style={{ background: 'var(--md-surface-container-low)' }}
          >
            <div>
              <p className="md-body-medium font-semibold" style={{ color: 'var(--md-on-surface)' }}>{row.name}</p>
              <p className="md-label-small" style={{ color: 'var(--md-outline)' }}>{row.slug}</p>
            </div>
            <button
              type="button"
              onClick={() => void handleDelete(row.id)}
              disabled={deletingId === row.id}
              className="md-icon-btn disabled:opacity-50"
              style={{ color: 'var(--md-error)' }}
              title="حذف"
            >
              {deletingId === row.id ? '...' : <Trash2 size={18} />}
            </button>
          </div>
        ))}
      </div>

      {/* Add form */}
      <form onSubmit={handleAdd} className="flex gap-2 mt-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="أضف صنفاً جديداً"
          className="flex-1 md-body-medium px-4 h-10 rounded-[var(--md-shape-s)] border outline-none transition-colors"
          style={{
            background: 'var(--md-surface-container-lowest)',
            borderColor: 'var(--md-outline)',
            color: 'var(--md-on-surface)',
          }}
          onFocus={(e) => (e.target.style.borderColor = 'var(--md-primary)')}
          onBlur={(e) => (e.target.style.borderColor = 'var(--md-outline)')}
        />
        <button
          type="submit"
          disabled={submitting}
          className="md-btn md-btn-filled md-state disabled:opacity-50"
          style={{ height: 40, padding: '0 16px', fontSize: 14 }}
        >
          <Plus size={16} />
          {submitting ? '...' : 'إضافة'}
        </button>
      </form>

      {error && (
        <p
          className="md-body-small px-4 py-3 rounded-[var(--md-shape-m)]"
          style={{ background: 'var(--md-error-container)', color: 'var(--md-on-error-container)' }}
        >
          {error}
        </p>
      )}
    </section>
  );
}

export default function CategoriesManager({ announcementCategories, eventCategories }: Props) {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <CategorySection title="أصناف الإعلانات" table="announcement_categories" rows={announcementCategories} />
      <CategorySection title="أصناف الفعاليات" table="event_categories" rows={eventCategories} />
    </div>
  );
}
