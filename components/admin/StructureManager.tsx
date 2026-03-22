"use client";

import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, FolderTree, Plus, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { categoryFormSchema, getFirstZodError } from '@/lib/validations';

type Division = { id: string; name: string; slug: string };
type Group = { id: string; name: string; slug: string; division_id: string };

type Props = {
  divisions: Division[];
  groups: Group[];
};

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function SectionShell({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="md-card-outlined p-6 space-y-5">
      <div className="flex items-start gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--md-shape-l)]"
          style={{ background: 'var(--md-secondary-container)', color: 'var(--md-on-secondary-container)' }}
        >
          {icon}
        </div>
        <div>
          <h2 className="md-title-medium" style={{ color: 'var(--md-on-surface)' }}>{title}</h2>
          <p className="md-body-small mt-1" style={{ color: 'var(--md-on-surface-variant)' }}>
            {description}
          </p>
        </div>
      </div>
      {children}
    </section>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div
      className="rounded-[var(--md-shape-l)] border border-dashed px-4 py-6 text-center md-body-small"
      style={{ borderColor: 'var(--md-outline-variant)', color: 'var(--md-on-surface-variant)' }}
    >
      {message}
    </div>
  );
}

function DivisionsSection({
  rows,
  groups,
}: {
  rows: Division[];
  groups: Group[];
}) {
  const supabase = createClient();
  const router = useRouter();
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const groupCountByDivision = useMemo(() => {
    return groups.reduce<Record<string, number>>((accumulator, group) => {
      accumulator[group.division_id] = (accumulator[group.division_id] ?? 0) + 1;
      return accumulator;
    }, {});
  }, [groups]);

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = name.trim();
    const slug = slugify(trimmed);
    const validation = categoryFormSchema.safeParse({ name: trimmed, slug });

    if (!validation.success) {
      setError(getFirstZodError(validation.error));
      return;
    }

    setSubmitting(true);
    setError('');
    const { error: insertError } = await supabase.from('divisions').insert(validation.data);
    if (insertError) {
      setError(insertError.message);
      setSubmitting(false);
      return;
    }

    setName('');
    router.refresh();
  }

  async function handleDelete(id: string) {
    const linkedGroups = groupCountByDivision[id] ?? 0;
    const confirmed = window.confirm(
      linkedGroups > 0
        ? `حذف هذا القسم سيحذف أيضاً ${linkedGroups} مجموعة مرتبطة به. هل تريد المتابعة؟`
        : 'حذف هذا القسم؟'
    );

    if (!confirmed) return;

    setDeletingId(id);
    setError('');
    const { error: deleteError } = await supabase.from('divisions').delete().eq('id', id);
    if (deleteError) {
      setError(deleteError.message);
      setDeletingId(null);
      return;
    }

    router.refresh();
  }

  return (
    <SectionShell
      icon={<Building2 size={20} />}
      title="الأقسام"
      description="إدارة الأقسام الرئيسية التي تُستخدم لتنظيم الإعلانات والمجموعات."
    >
      <div className="space-y-2">
        {rows.length === 0 ? (
          <EmptyState message="لا توجد أقسام بعد." />
        ) : rows.map((row) => (
          <div
            key={row.id}
            className="flex items-center justify-between gap-3 rounded-[var(--md-shape-l)] px-4 py-3"
            style={{ background: 'var(--md-surface-container-low)' }}
          >
            <div className="min-w-0">
              <p className="md-body-medium font-semibold" style={{ color: 'var(--md-on-surface)' }}>{row.name}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="md-label-small" style={{ color: 'var(--md-outline)' }}>{row.slug}</span>
                <span
                  className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                  style={{ background: 'var(--md-secondary-container)', color: 'var(--md-on-secondary-container)' }}
                >
                  {groupCountByDivision[row.id] ?? 0} مجموعات
                </span>
              </div>
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

      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="أضف قسماً جديداً"
          className="flex-1 md-body-medium px-4 h-10 rounded-[var(--md-shape-s)] border outline-none transition-colors"
          style={{
            background: 'var(--md-surface-container-lowest)',
            borderColor: 'var(--md-outline)',
            color: 'var(--md-on-surface)',
          }}
          onFocus={(event) => (event.target.style.borderColor = 'var(--md-primary)')}
          onBlur={(event) => (event.target.style.borderColor = 'var(--md-outline)')}
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

      {error ? (
        <p
          className="md-body-small rounded-[var(--md-shape-m)] px-4 py-3"
          style={{ background: 'var(--md-error-container)', color: 'var(--md-on-error-container)' }}
        >
          {error}
        </p>
      ) : null}
    </SectionShell>
  );
}

function GroupsSection({
  divisions,
  rows,
}: {
  divisions: Division[];
  rows: Group[];
}) {
  const supabase = createClient();
  const router = useRouter();
  const [divisionId, setDivisionId] = useState(divisions[0]?.id ?? '');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const divisionNameById = useMemo(() => {
    return divisions.reduce<Record<string, string>>((accumulator, division) => {
      accumulator[division.id] = division.name;
      return accumulator;
    }, {});
  }, [divisions]);

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = name.trim();
    const slug = slugify(trimmed);
    const validation = categoryFormSchema.safeParse({ name: trimmed, slug });

    if (!divisionId) {
      setError('اختر قسماً أولاً قبل إضافة المجموعة.');
      return;
    }

    if (!validation.success) {
      setError(getFirstZodError(validation.error));
      return;
    }

    setSubmitting(true);
    setError('');
    const { error: insertError } = await supabase.from('groups').insert({
      ...validation.data,
      division_id: divisionId,
    });

    if (insertError) {
      setError(insertError.message);
      setSubmitting(false);
      return;
    }

    setName('');
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!window.confirm('حذف هذه المجموعة؟')) return;

    setDeletingId(id);
    setError('');
    const { error: deleteError } = await supabase.from('groups').delete().eq('id', id);
    if (deleteError) {
      setError(deleteError.message);
      setDeletingId(null);
      return;
    }

    router.refresh();
  }

  return (
    <SectionShell
      icon={<FolderTree size={20} />}
      title="المجموعات"
      description="أضف مجموعات فرعية واربط كل مجموعة بالقسم المناسب لها."
    >
      <div className="space-y-2">
        {rows.length === 0 ? (
          <EmptyState message="لا توجد مجموعات بعد." />
        ) : rows.map((row) => (
          <div
            key={row.id}
            className="flex items-center justify-between gap-3 rounded-[var(--md-shape-l)] px-4 py-3"
            style={{ background: 'var(--md-surface-container-low)' }}
          >
            <div className="min-w-0">
              <p className="md-body-medium font-semibold" style={{ color: 'var(--md-on-surface)' }}>{row.name}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="md-label-small" style={{ color: 'var(--md-outline)' }}>{row.slug}</span>
                <span
                  className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                  style={{ background: 'var(--md-tertiary-container)', color: 'var(--md-on-tertiary-container)' }}
                >
                  {divisionNameById[row.division_id] ?? 'قسم غير معروف'}
                </span>
              </div>
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

      <form onSubmit={handleAdd} className="grid gap-2 md:grid-cols-[220px_1fr_auto]">
        <select
          value={divisionId}
          onChange={(event) => setDivisionId(event.target.value)}
          className="md-body-medium h-10 rounded-[var(--md-shape-s)] border px-4 outline-none transition-colors"
          style={{
            background: 'var(--md-surface-container-lowest)',
            borderColor: 'var(--md-outline)',
            color: 'var(--md-on-surface)',
          }}
          disabled={divisions.length === 0}
        >
          {divisions.length === 0 ? (
            <option value="">أضف قسماً أولاً</option>
          ) : (
            divisions.map((division) => (
              <option key={division.id} value={division.id}>{division.name}</option>
            ))
          )}
        </select>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="أضف مجموعة جديدة"
          className="md-body-medium px-4 h-10 rounded-[var(--md-shape-s)] border outline-none transition-colors"
          style={{
            background: 'var(--md-surface-container-lowest)',
            borderColor: 'var(--md-outline)',
            color: 'var(--md-on-surface)',
          }}
          onFocus={(event) => (event.target.style.borderColor = 'var(--md-primary)')}
          onBlur={(event) => (event.target.style.borderColor = 'var(--md-outline)')}
          disabled={divisions.length === 0}
        />
        <button
          type="submit"
          disabled={submitting || divisions.length === 0}
          className="md-btn md-btn-filled md-state disabled:opacity-50"
          style={{ height: 40, padding: '0 16px', fontSize: 14 }}
        >
          <Plus size={16} />
          {submitting ? '...' : 'إضافة'}
        </button>
      </form>

      {error ? (
        <p
          className="md-body-small rounded-[var(--md-shape-m)] px-4 py-3"
          style={{ background: 'var(--md-error-container)', color: 'var(--md-on-error-container)' }}
        >
          {error}
        </p>
      ) : null}
    </SectionShell>
  );
}

export default function StructureManager({ divisions, groups }: Props) {
  return (
    <div className="space-y-6">
      <section
        className="rounded-[var(--md-shape-xl)] px-6 py-5"
        style={{ background: 'var(--md-surface-container-low)', border: '1px solid var(--md-outline-variant)' }}
      >
        <h2 className="md-title-large" style={{ color: 'var(--md-on-surface)' }}>إدارة الأقسام والمجموعات</h2>
        <p className="md-body-medium mt-2" style={{ color: 'var(--md-on-surface-variant)' }}>
          استخدم هذه الصفحة لإضافة الأقسام والمجموعات التي تظهر في نماذج الإعلانات وربط كل مجموعة بالقسم المناسب.
        </p>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <DivisionsSection rows={divisions} groups={groups} />
        <GroupsSection divisions={divisions} rows={groups} />
      </div>
    </div>
  );
}
