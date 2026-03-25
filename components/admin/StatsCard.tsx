import { ReactNode } from 'react';

export default function StatsCard({
  label,
  value,
  accent,
  icon,
  hint,
  trend,
}: {
  label: string;
  value: number;
  accent: string;
  icon: ReactNode;
  hint?: string;
  trend?: string;
}) {
  return (
    <div
      className="md-card-elevated relative overflow-hidden p-5"
      style={{
        background:
          'linear-gradient(180deg, color-mix(in srgb, var(--md-surface-container-low) 92%, white 8%) 0%, var(--md-surface-container-low) 100%)',
      }}
    >
      <div
        className="pointer-events-none absolute inset-x-5 top-0 h-1 rounded-b-full"
        style={{ background: accent }}
      />

      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="md-label-large" style={{ color: 'var(--md-on-surface-variant)' }}>
            {label}
          </p>
          <p
            className="md-display-small leading-none"
            style={{ color: 'var(--md-on-surface)', fontWeight: 700 }}
          >
            {value}
          </p>
          {hint ? (
            <p className="md-body-small" style={{ color: 'var(--md-on-surface-variant)' }}>
              {hint}
            </p>
          ) : null}
        </div>

        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--md-shape-l)]"
          style={{ background: accent }}
        >
          {icon}
        </div>
      </div>

      {trend ? (
        <div
          className="mt-4 inline-flex w-fit items-center rounded-[var(--md-shape-full)] px-3 py-1 md-label-small"
          style={{ background: 'var(--md-surface-container-highest)', color: 'var(--md-on-surface-variant)' }}
        >
          {trend}
        </div>
      ) : null}
    </div>
  );
}
