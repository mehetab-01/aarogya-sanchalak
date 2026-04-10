import clsx from 'clsx';

const roleColors = {
  'Admin':     'bg-[var(--color-brand-light)] text-[var(--color-brand-dark)]',
  'Driver':    'bg-[var(--color-serious-light)] text-[var(--color-serious)]',
  'Doctor':    'bg-[var(--color-critical-light)] text-[var(--color-critical)]',
  'Nurse':     'bg-[var(--color-brand-light)] text-[var(--color-brand-dark)]',
  'Ward Boy':  'bg-[var(--color-stable-light)] text-[var(--color-stable)]',
};

export default function PortalLayout({ title, role, children }) {
  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      {/* Top bar */}
      <header className="bg-[var(--color-bg-card)] border-b border-[var(--color-border)] sticky top-0 z-10">
        <div className="max-w-[1200px] mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[var(--color-brand)]" />
            <span className="text-[var(--font-base)] font-semibold text-[var(--color-text-primary)]">
              Aarogya Sanchalak
            </span>
            <span className="text-[var(--color-border-strong)]">—</span>
            <span className="text-[var(--font-base)] text-[var(--color-text-secondary)]">{title}</span>
          </div>

          <span
            className={clsx(
              'text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full',
              roleColors[role] ?? 'bg-gray-100 text-gray-600'
            )}
          >
            {role}
          </span>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-[1200px] mx-auto px-6 py-6">
        {children}
      </main>
    </div>
  );
}
