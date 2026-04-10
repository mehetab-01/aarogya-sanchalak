import { Bed } from 'lucide-react';
import clsx from 'clsx';

function getOccupancyBarColor(pct) {
  if (pct > 80) return 'bg-[var(--color-critical)]';
  if (pct > 60) return 'bg-[var(--color-serious)]';
  return 'bg-[var(--color-stable)]';
}

function getOccupancyTextColor(pct) {
  if (pct > 80) return 'text-[var(--color-critical)]';
  if (pct > 60) return 'text-[var(--color-serious)]';
  return 'text-[var(--color-stable)]';
}

export default function BedCard({ type, total, occupied }) {
  const pct = total > 0 ? Math.round((occupied / total) * 100) : 0;
  const available = total - occupied;

  return (
    <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[10px] p-4 shadow-card">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Bed size={15} className="text-[var(--color-text-muted)]" />
          <p className="text-[var(--font-sm)] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
            {type}
          </p>
        </div>
        <span className={clsx('text-[11px] font-semibold', getOccupancyTextColor(pct))}>
          {pct}%
        </span>
      </div>

      <p className="font-data text-[var(--font-2xl)] font-normal text-[var(--color-text-primary)] leading-none mb-1">
        {occupied}
        <span className="text-[var(--font-lg)] text-[var(--color-text-muted)]">/{total}</span>
      </p>
      <p className="text-[var(--font-xs)] text-[var(--color-text-muted)] mb-3">
        {available} available
      </p>

      {/* Progress bar */}
      <div className="h-1.5 bg-[var(--color-bg-secondary)] rounded-full overflow-hidden">
        <div
          className={clsx('h-full rounded-full transition-all duration-300', getOccupancyBarColor(pct))}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
