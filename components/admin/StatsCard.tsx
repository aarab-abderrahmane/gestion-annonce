import { ReactNode } from 'react';

export default function StatsCard({ label, value, accent, icon }: { label: string; value: number; accent: string; icon: ReactNode }) {
  return (
    <div className="rounded-[28px] border border-[#d9cdbb] bg-[#fffdf8] p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-semibold text-[#6d7f82]">{label}</span>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: accent, color: '#123c3a' }}>
          {icon}
        </div>
      </div>
      <p className="text-4xl font-black text-[#123c3a]">{value}</p>
    </div>
  );
}
