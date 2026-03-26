"use client";

import Link from 'next/link';
import { useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  BellRing,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  FolderTree,
  Images,
  Newspaper,
  Trash2,
  Users,
} from 'lucide-react';

export type QuickActionIconKey =
  | 'bell'
  | 'alert'
  | 'newspaper'
  | 'calendar'
  | 'images'
  | 'trash'
  | 'folder'
  | 'users';

export type QuickActionItem = {
  href: string;
  label: string;
  description: string;
  icon: QuickActionIconKey;
  accent: string;
  tone: string;
};

const COLLAPSED_COUNT = 6;

const iconMap = {
  bell: BellRing,
  alert: AlertTriangle,
  newspaper: Newspaper,
  calendar: CalendarDays,
  images: Images,
  trash: Trash2,
  folder: FolderTree,
  users: Users,
} satisfies Record<
  QuickActionIconKey,
  React.ComponentType<{ size?: number; style?: React.CSSProperties }>
>;

export default function QuickControlsSection({
  items,
}: {
  items: QuickActionItem[];
}) {
  const [expanded, setExpanded] = useState(false);
  const visibleItems = expanded ? items : items.slice(0, COLLAPSED_COUNT);
  const hasMore = items.length > COLLAPSED_COUNT;

  return (
    <section className="md-card-outlined overflow-hidden">
      <div
        className="flex items-center justify-between px-6 py-5"
        style={{
          borderBottom: '1px solid var(--md-outline-variant)',
          background:
            'linear-gradient(180deg, var(--md-surface-container-low) 0%, var(--md-surface) 100%)',
        }}
      >
        <div className="space-y-1">
          <h2 className="md-title-medium" style={{ color: 'var(--md-on-surface)' }}>
            وحدات التحكم السريع
          </h2>
          <p className="md-body-small" style={{ color: 'var(--md-on-surface-variant)' }}>
            انتقل مباشرة إلى أكثر أقسام لوحة التحكم استخدامًا.
          </p>
        </div>
        <Link
          href="/dashboard/settings"
          className="md-btn md-btn-outlined md-state"
          style={{ height: 36, padding: '0 16px', fontSize: 13 }}
        >
          الإعدادات
        </Link>
      </div>

      <div className="relative">
        <div className="grid gap-4 p-5 md:grid-cols-2">
          {visibleItems.map((item) => {
            const Icon = iconMap[item.icon];

            return (
              <Link
                key={item.href}
                href={item.href}
                className="group rounded-[var(--md-shape-xl)] border p-4 transition-all hover:-translate-y-0.5"
                style={{
                  borderColor: 'var(--md-outline-variant)',
                  background: 'var(--md-surface-container-low)',
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-[var(--md-shape-l)]"
                    style={{ background: item.accent }}
                  >
                    <Icon size={20} style={{ color: item.tone }} />
                  </div>
                  <ArrowUpRight
                    size={18}
                    style={{ color: 'var(--md-on-surface-variant)' }}
                  />
                </div>

                <div className="mt-4 space-y-2">
                  <h3 className="md-title-small" style={{ color: 'var(--md-on-surface)' }}>
                    {item.label}
                  </h3>
                  <p
                    className="md-body-small"
                    style={{ color: 'var(--md-on-surface-variant)' }}
                  >
                    {item.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>

        {!expanded && hasMore ? (
          <div
            className="pointer-events-none absolute bottom-0 left-0 right-0 h-24"
            style={{
              background: 'linear-gradient(to bottom, transparent, var(--md-surface))',
            }}
          />
        ) : null}
      </div>

      {hasMore ? (
        <div
          className="flex justify-center px-5 pb-4"
          style={{ marginTop: expanded ? 0 : '-12px' }}
        >
          <button
            type="button"
            onClick={() => setExpanded((current) => !current)}
            className="md-btn md-btn-text md-state flex items-center gap-2"
            style={{ fontSize: 13, color: 'var(--md-primary)' }}
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            {expanded ? 'عرض أقل' : `عرض الكل (${items.length})`}
          </button>
        </div>
      ) : null}
    </section>
  );
}
