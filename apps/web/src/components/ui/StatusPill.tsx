import { cn } from '@/lib/cn';

interface StatusPillProps {
  label: string;
  className: string;
  icon?: React.ReactNode;
  uppercase?: boolean;
}

export const StatusPill = ({
  label,
  className,
  icon,
  uppercase,
}: StatusPillProps) => (
  <span
    className={cn(
      'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold',
      uppercase && 'tracking-wide uppercase',
      className,
    )}
  >
    {icon}
    {label}
  </span>
);
