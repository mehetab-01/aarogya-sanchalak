import clsx from 'clsx';

const variantStyles = {
  primary: 'bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-dark)] border-transparent',
  danger:  'bg-[var(--color-critical)] text-white hover:bg-[#7B1515] border-transparent min-h-[48px]',
  ghost:   'bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] border-[var(--color-border)]',
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-[var(--font-sm)]',
  md: 'px-4 py-2.5 text-[var(--font-base)]',
  lg: 'px-6 py-3 text-[var(--font-md)]',
};

export default function AlertButton({
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
  children,
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        'inline-flex items-center justify-center gap-2',
        'rounded-[8px] border font-semibold',
        'transition-colors duration-150',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-brand)]',
        variantStyles[variant],
        sizeStyles[size],
      )}
    >
      {children}
    </button>
  );
}
