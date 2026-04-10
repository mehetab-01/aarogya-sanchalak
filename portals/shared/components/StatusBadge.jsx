import clsx from 'clsx';

const styles = {
  CRITICAL: 'bg-[var(--color-critical-light)] text-[var(--color-critical)] border-[var(--color-critical)]',
  SERIOUS:  'bg-[var(--color-serious-light)]  text-[var(--color-serious)]  border-[var(--color-serious)]',
  STABLE:   'bg-[var(--color-stable-light)]   text-[var(--color-stable)]   border-[var(--color-stable)]',
};

export default function StatusBadge({ condition }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5 rounded-full border text-[11px] font-semibold tracking-wide uppercase',
        styles[condition] ?? 'bg-gray-100 text-gray-600 border-gray-300'
      )}
    >
      {condition}
    </span>
  );
}
