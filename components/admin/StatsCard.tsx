import { ReactNode } from 'react';

export default function StatsCard({
  label,
  value,
  accent,
  icon,
}: {
  label: string;
  value: number;
  accent: string;
  icon: ReactNode;
}) {
  return (
    <div
      className="md-card-elevated p-5 flex flex-col gap-4"
      style={{ background: 'var(--md-surface-container-low)' }}
    >
      {/* Icon container */}
      <div
        className="flex h-12 w-12 items-center justify-center rounded-[var(--md-shape-l)]"
        style={{ background: accent }}
      >
        {icon}
      </div>

      {/* Value */}
      <p
        className="md-display-small"
        style={{ color: 'var(--md-on-surface)', fontWeight: 700 }}
      >
        {value}
      </p>

      {/* Label */}
      <p className="md-body-medium" style={{ color: 'var(--md-on-surface-variant)' }}>
        {label}
      </p>
    </div>
  );
}
