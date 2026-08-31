import { ArrowRightIcon } from '@heroicons/react/24/solid';
import { Link } from '@tanstack/react-router';

import { cn } from '@/lib/cn';

type StatCardProps = {
  label: string;
  value: number;
  icon: React.ReactNode;
  accentText: string;
  cardBg: string;
  to?: string;
  description?: React.ReactNode;
  testId?: string;
};

const segmentBase =
  'group flex flex-1 items-center gap-3.5 p-4 transition-colors duration-200 ease-out';

export const StatCard = ({
  label,
  value,
  icon,
  accentText,
  cardBg,
  to,
  description,
  testId,
}: StatCardProps) => {
  const inner = (
    <>
      <span
        className={cn(
          'flex size-10 shrink-0 items-center justify-center rounded-xl border',
          cardBg,
          accentText,
        )}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-bold tracking-widest text-base-content/55 uppercase">
            {label}
          </p>
          {to && (
            <ArrowRightIcon className="size-4 shrink-0 text-base-content/30 transition-all group-hover:translate-x-0.5 group-hover:text-base-content/60" />
          )}
        </div>
        <p
          data-testid={testId}
          className="font-display text-2xl leading-tight font-extrabold tracking-tight text-base-content tabular-nums"
        >
          {value}
        </p>
        {description && (
          <div className="mt-1 text-xs text-base-content/55">{description}</div>
        )}
      </div>
    </>
  );

  if (to) {
    return (
      <Link to={to} className={cn(segmentBase, 'hover:bg-base-200/60')}>
        {inner}
      </Link>
    );
  }

  return <div className={segmentBase}>{inner}</div>;
};
