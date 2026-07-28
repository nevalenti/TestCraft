import { Link } from '@tanstack/react-router';

import { ResourceActions } from '@/components/ui/ResourceActions';
import { cn } from '@/lib/cn';

interface ResourceListItemProps {
  to?: string;
  onEdit: () => void;
  onDelete?: () => void;
  label: string;
  cardBg?: string;
  accentText?: string;
  typeIcon?: React.ReactNode;
  testId?: string;
  children: React.ReactNode;
}

const accentToColorVar: Record<string, string> = {
  'text-primary': '--color-primary',
  'text-secondary': '--color-secondary',
  'text-accent': '--color-accent',
  'text-warning': '--color-warning',
  'text-success': '--color-success',
  'text-error': '--color-error',
  'text-info': '--color-info',
};

export const ResourceListItem = ({
  to,
  onEdit,
  onDelete,
  label,
  cardBg = 'bg-base-100',
  accentText = 'text-primary',
  typeIcon,
  testId,
  children,
}: ResourceListItemProps) => {
  const colorVar = accentToColorVar[accentText] ?? '--color-primary';

  return (
    <div
      data-testid={testId}
      style={{ '--card-glow': `var(${colorVar})` } as React.CSSProperties}
      className={cn(
        'group relative flex items-center gap-3 rounded-xl border border-border bg-base-100 px-4 py-2',
        'transition-[background-color,box-shadow] duration-200 ease-out',
        'hover:bg-base-200/50 hover:shadow-[0_0_0_1px_oklch(from_var(--card-glow)_l_c_h/0.4),0_8px_20px_-8px_oklch(from_var(--card-glow)_l_c_h/0.35)]',
      )}
    >
      {to && (
        <Link
          to={to}
          className="absolute inset-0 rounded-xl"
          aria-label={`Open ${label}`}
        />
      )}
      {typeIcon && (
        <span
          className={cn(
            'flex size-7 shrink-0 items-center justify-center rounded-lg border',
            cardBg,
            accentText,
          )}
        >
          {typeIcon}
        </span>
      )}
      <div className="flex min-w-0 flex-1 items-center justify-between gap-4">
        {children}
      </div>
      <div className="relative z-10 flex shrink-0 items-center gap-1 opacity-100 transition-all duration-150 focus-within:opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
        <ResourceActions
          onEdit={onEdit}
          onDelete={onDelete}
          label={label}
          size="xs"
        />
      </div>
    </div>
  );
};
